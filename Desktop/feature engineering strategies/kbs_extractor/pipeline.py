"""Pipeline orchestrator — ties profiling, quality, and feature extraction together."""

import json
import re
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats as sp_stats
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler, PowerTransformer,
    OrdinalEncoder, LabelEncoder, OneHotEncoder,
    KBinsDiscretizer,
)
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

from kbs_extractor.graph import KnowledgeGraph
from kbs_extractor.quality_engine import run_quality_assessment
from kbs_extractor.feature_engine import run_feature_extraction
from kbs_extractor.logger import get_logger

log = get_logger("pipeline")

_URL_RE = re.compile(r"https?://\S+", re.IGNORECASE)
_EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
_NUMBER_RE = re.compile(r"\b\d+\.?\d*\b")


class Pipeline:
    def __init__(self, input_path: str, output_path: str, mode: str = "full",
                 target_column: str | None = None, report_path: str | None = None,
                 categorical_columns: list[str] | None = None,
                 task_type: str | None = None):
        self.input_path = input_path
        self.output_path = output_path
        self.mode = mode
        self.target_column = target_column
        self.report_path = report_path
        self.categorical_columns = categorical_columns or []
        self.task_type = task_type
        self.kg = KnowledgeGraph()
        self.quality_result: dict = {}
        self.transform_plans: list[dict] = []
        self.detected_templates: list[dict] = []
        self.metadata: list[dict] = []

    def run(self) -> pd.DataFrame | None:
        log.info("Pipeline starting — mode=%s, input=%s", self.mode, self.input_path)
        df = self._load_data(self.input_path)
        df.columns = df.columns.str.strip()
        log.info("Loaded %d rows, %d columns from %s", len(df), len(df.columns), self.input_path)

        if self.target_column and self.target_column in df.columns:
            log.info("Target column: '%s' — will be excluded from features", self.target_column)
        elif self.target_column:
            log.warning("Target column '%s' not found in data", self.target_column)
            self.target_column = None

        if self.task_type is None and self.target_column:
            nunique = df[self.target_column].nunique()
            self.task_type = "classification" if nunique <= 20 else "regression"
            log.info("Auto-detected task type: %s (target has %d unique values)",
                     self.task_type, nunique)

        for col in df.columns:
            if df[col].dtype == object:
                try:
                    df[col] = pd.to_numeric(df[col])
                    log.info("Auto-cast '%s' from object to numeric", col)
                except (ValueError, TypeError):
                    pass

        if self.categorical_columns:
            log.info("User-specified categorical columns: %s", self.categorical_columns)

        feature_cols = [c for c in df.columns if c != self.target_column]
        df_features = df[feature_cols]

        cat_overrides = [c for c in self.categorical_columns if c in feature_cols]
        self.kg.build_from_dataframe(df_features, categorical_overrides=cat_overrides)

        if self.target_column:
            self._compute_mi_scores(df, feature_cols)

        profiles = self.kg.get_all_profiles()
        correlations = self.kg.get_correlations()

        if self.mode in ("full", "quality"):
            self.quality_result = run_quality_assessment(profiles, correlations)
            self._print_quality_report()
            if self.report_path:
                self._save_report()

        if self.mode == "quality":
            log.info("Quality-only mode complete")
            return None

        dataset_meta = {
            "row_count": len(df_features),
            "col_count": len(df_features.columns),
            "task_type": self.task_type,
        }
        self.transform_plans, self.detected_templates = run_feature_extraction(
            profiles, correlations, dataset_meta=dataset_meta)

        drop_cols = set()
        for issue in self.quality_result.get("issues", []):
            if issue.get("kind") in ("possible_id", "constant", "leakage_correlation",
                                      "leakage_deterministic"):
                drop_cols.add(issue.get("column", ""))
        for plan in self.transform_plans:
            if plan.get("operation") == "drop":
                src = plan.get("source", "")
                if isinstance(src, str):
                    drop_cols.add(src)

        if drop_cols:
            before = len(self.transform_plans)
            self.transform_plans = [
                p for p in self.transform_plans
                if not self._plan_uses_dropped(p, drop_cols)
            ]
            removed = before - len(self.transform_plans)
            if removed:
                log.info("CONSISTENCY: removed %d plans that use flagged columns: %s",
                         removed, drop_cols)

        if self.target_column and self.task_type:
            self.transform_plans = self._guided_interaction_filter(
                df, df_features, self.transform_plans)

        result_df = self._apply_transforms(df_features)

        if self.detected_templates:
            template_df = self._apply_templates(df, df_features)
            for col_name, col_data in template_df.items():
                result_df[col_name] = col_data

        result_df.to_csv(self.output_path, index=False)
        log.info("Features saved to %s (%d rows, %d columns)",
                 self.output_path, len(result_df), len(result_df.columns))

        self._save_metadata()
        return result_df

    @staticmethod
    def _load_data(path: str) -> pd.DataFrame:
        na_vals = ["?", "??", "N/A", "n/a", "NA", ""]
        ext = Path(path).suffix.lower()
        if ext == ".json" or ext == ".jsonl":
            df = pd.read_json(path, lines=(ext == ".jsonl"))
        elif ext in (".xlsx", ".xls"):
            df = pd.read_excel(path, na_values=na_vals)
        else:
            df = pd.read_csv(path, na_values=na_vals)
        return df

    def _compute_mi_scores(self, df: pd.DataFrame, feature_cols: list[str]) -> None:
        from sklearn.feature_selection import mutual_info_classif, mutual_info_regression
        target = df[self.target_column].dropna()
        valid_idx = target.index

        mi_func = mutual_info_classif if self.task_type == "classification" else mutual_info_regression

        numeric_features = []
        for col in feature_cols:
            if pd.api.types.is_numeric_dtype(df[col]):
                numeric_features.append(col)

        if not numeric_features:
            return

        X = df.loc[valid_idx, numeric_features].fillna(0)
        y = target.loc[valid_idx]

        mi_scores = mi_func(X, y, random_state=42)

        for col, score in zip(numeric_features, mi_scores):
            node_id = f"col:{col}"
            if self.kg.g.has_node(node_id):
                self.kg.g.nodes[node_id]["mi_score"] = round(float(score), 4)
                log.info("MI score for '%s': %.4f", col, score)

        target_numeric = pd.to_numeric(df[self.target_column], errors="coerce")
        if target_numeric.notna().sum() > 10:
            for col in feature_cols:
                node_id = f"col:{col}"
                if not self.kg.g.has_node(node_id):
                    continue
                col_numeric = pd.to_numeric(df[col], errors="coerce")
                both_valid = target_numeric.notna() & col_numeric.notna()
                if both_valid.sum() > 10:
                    r = abs(float(target_numeric[both_valid].corr(col_numeric[both_valid])))
                    self.kg.g.nodes[node_id]["target_corr"] = round(r, 4)
                    if r > 0.95:
                        log.warning("LEAKAGE? '%s' has |r|=%.3f with target", col, r)

                mapping = df.groupby(col)[self.target_column].nunique()
                if (mapping == 1).all() and len(mapping) > 1:
                    self.kg.g.nodes[node_id]["determines_target"] = True
                    log.warning("LEAKAGE? '%s' uniquely determines target", col)

    # ------------------------------------------------------------------
    # Guided Feature Engineering (L3)
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # Template Execution
    # ------------------------------------------------------------------

    @staticmethod
    def _plan_uses_dropped(plan: dict, drop_cols: set) -> bool:
        src = plan.get("source", "")
        if isinstance(src, str):
            return src in drop_cols
        if isinstance(src, (list, tuple)):
            return any(s in drop_cols for s in src)
        return False

    def _apply_templates(self, df_full: pd.DataFrame,
                          df_features: pd.DataFrame) -> dict[str, pd.Series]:
        result = {}
        for tmpl in self.detected_templates:
            op = tmpl["operation"]
            cols = tmpl["columns"]
            concepts = tmpl.get("column_concepts", {})
            name = tmpl["pattern_name"]
            confidence = tmpl["confidence"]

            try:
                new_cols = self._exec_template(df_full, df_features, op, cols, concepts)
                for col_name, col_data in new_cols.items():
                    result[col_name] = col_data
                    self.metadata.append({
                        "feature": col_name,
                        "source": str(cols),
                        "operation": f"template:{name}",
                        "rationale": f"{tmpl['rationale']} [confidence={confidence}%]",
                    })
                    log.info("TEMPLATE generated '%s' via %s (confidence=%d%%)",
                             col_name, name, confidence)
            except Exception as e:
                log.error("TEMPLATE %s failed: %s", name, e)
        return result

    def _exec_template(self, df_full, df_feat, op, cols, concepts) -> dict:
        src = df_full if all(c in df_full.columns for c in cols) else df_feat

        if op == "bmi":
            h_col = cols[1] if len(cols) > 1 else cols[0]
            w_col = cols[0]
            h = pd.to_numeric(src[h_col], errors="coerce")
            w = pd.to_numeric(src[w_col], errors="coerce")
            h_m = h.copy()
            if h.dropna().mean() > 3:
                h_m = h / 100.0
                log.info("BMI: height in cm (avg=%.1f), converting to meters", h.dropna().mean())
            bmi = w / (h_m ** 2)
            return {"bmi": bmi.clip(10, 60)}

        if op == "date_diff":
            d1 = pd.to_datetime(src[cols[0]], errors="coerce")
            d2 = pd.to_datetime(src[cols[1]], errors="coerce")
            delta = (d2 - d1).dt.total_seconds()
            return {
                "duration_days": (delta / 86400).round(2),
                "duration_weeks": (delta / 604800).round(2),
            }

        if op == "age_from_birth":
            born = pd.to_datetime(src[cols[0]], errors="coerce")
            today = pd.Timestamp.now()
            age_years = ((today - born).dt.days / 365.25).round(1)
            return {"age_from_birth": age_years}

        if op == "haversine_trip":
            import numpy as _np
            lat1 = _np.radians(pd.to_numeric(src[cols[0]], errors="coerce").fillna(0))
            lon1 = _np.radians(pd.to_numeric(src[cols[1]], errors="coerce").fillna(0))
            lat2 = _np.radians(pd.to_numeric(src[cols[2]], errors="coerce").fillna(0))
            lon2 = _np.radians(pd.to_numeric(src[cols[3]], errors="coerce").fillna(0))
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = _np.sin(dlat/2)**2 + _np.cos(lat1) * _np.cos(lat2) * _np.sin(dlon/2)**2
            return {"trip_distance_km": pd.Series(6371 * 2 * _np.arcsin(_np.sqrt(a)),
                                                   index=src.index)}

        if op == "manhattan_geo":
            lat1 = pd.to_numeric(src[cols[0]], errors="coerce").fillna(0)
            lon1 = pd.to_numeric(src[cols[1]], errors="coerce").fillna(0)
            lat2 = pd.to_numeric(src[cols[2]], errors="coerce").fillna(0)
            lon2 = pd.to_numeric(src[cols[3]], errors="coerce").fillna(0)
            manhattan = (abs(lat2 - lat1) + abs(lon2 - lon1)) * 111.32
            return {"manhattan_distance_km": manhattan}

        if op == "bearing":
            import numpy as _np
            lat1 = _np.radians(pd.to_numeric(src[cols[0]], errors="coerce").fillna(0))
            lon1 = _np.radians(pd.to_numeric(src[cols[1]], errors="coerce").fillna(0))
            lat2 = _np.radians(pd.to_numeric(src[cols[2]], errors="coerce").fillna(0))
            lon2 = _np.radians(pd.to_numeric(src[cols[3]], errors="coerce").fillna(0))
            dlon = lon2 - lon1
            x = _np.sin(dlon) * _np.cos(lat2)
            y = _np.cos(lat1) * _np.sin(lat2) - _np.sin(lat1) * _np.cos(lat2) * _np.cos(dlon)
            bearing = (_np.degrees(_np.arctan2(x, y)) + 360) % 360
            return {"bearing_degrees": pd.Series(bearing, index=src.index)}

        if op == "geo_centroid":
            lat = pd.to_numeric(src[cols[0]], errors="coerce")
            lon = pd.to_numeric(src[cols[1]], errors="coerce")
            clat, clon = lat.mean(), lon.mean()
            dist = ((lat - clat)**2 + (lon - clon)**2).pow(0.5)
            return {"dist_from_centroid": dist}

        if op == "product":
            a = pd.to_numeric(src[cols[0]], errors="coerce").fillna(0)
            b = pd.to_numeric(src[cols[1]], errors="coerce").fillna(0)
            feat_name = f"{cols[0]}_x_{cols[1]}"
            return {feat_name: a * b}

        if op == "difference":
            a = pd.to_numeric(src[cols[0]], errors="coerce").fillna(0)
            b = pd.to_numeric(src[cols[1]], errors="coerce").fillna(0)
            feat_name = f"{cols[0]}_minus_{cols[1]}"
            return {feat_name: a - b}

        if op == "ratio":
            a = pd.to_numeric(src[cols[0]], errors="coerce").fillna(0)
            b = pd.to_numeric(src[cols[1]], errors="coerce").replace(0, np.nan)
            feat_name = f"{cols[0]}_per_{cols[1]}"
            return {feat_name: (a / b).fillna(0)}

        log.warning("Unknown template operation '%s'", op)
        return {}

    def _guided_interaction_filter(self, df_full: pd.DataFrame,
                                    df_features: pd.DataFrame,
                                    plans: list[dict]) -> list[dict]:
        """Test interaction features, keep only those that improve MI with target."""
        from sklearn.feature_selection import mutual_info_classif, mutual_info_regression
        interaction_ops = {"create_product", "create_ratio", "create_difference"}
        interactions = [p for p in plans if p.get("operation") in interaction_ops]
        non_interactions = [p for p in plans if p.get("operation") not in interaction_ops]

        if not interactions or self.target_column not in df_full.columns:
            return plans

        target = pd.to_numeric(df_full[self.target_column], errors="coerce").dropna()
        valid_idx = target.index

        if self.task_type == "classification":
            score_func = mutual_info_classif
        else:
            from sklearn.feature_selection import f_regression
            score_func = f_regression

        scored = []
        for plan in interactions:
            source = plan.get("source", [])
            op = plan["operation"]
            if not isinstance(source, list) or len(source) != 2:
                scored.append((plan, 0.0))
                continue
            a, b = source[0], source[1]
            if a not in df_features.columns or b not in df_features.columns:
                continue
            ca = pd.to_numeric(df_features[a], errors="coerce")
            cb = pd.to_numeric(df_features[b], errors="coerce")
            both_valid = ca.notna() & cb.notna() & ca.index.isin(valid_idx)
            if both_valid.sum() < 10:
                continue
            ca = ca.fillna(0)
            cb = cb.fillna(0)
            if op == "create_product":
                feat = ca * cb
            elif op == "create_ratio":
                feat = ca / cb.replace(0, np.nan)
                feat = feat.fillna(0)
            elif op == "create_difference":
                feat = ca - cb
            else:
                continue

            common_idx = feat.index.intersection(valid_idx)
            feat_series = feat.loc[common_idx].fillna(0)
            feat_valid = feat_series.values.reshape(-1, 1)
            target_valid = target.loc[common_idx].values
            try:
                if self.task_type == "classification":
                    score = score_func(feat_valid, target_valid, random_state=42)[0]
                else:
                    f_scores, p_values = score_func(feat_valid, target_valid)
                    score = float(f_scores[0]) if p_values[0] < 0.05 else 0.0
                scored.append((plan, float(score)))
            except Exception:
                scored.append((plan, 0.0))

        scored.sort(key=lambda x: x[1], reverse=True)
        threshold = 0.01 if self.task_type == "classification" else 1.0
        kept = []
        dropped = []
        for plan, score in scored:
            if score > threshold:
                plan["rationale"] += f" [score={score:.4f}]"
                kept.append(plan)
            else:
                dropped.append(plan)

        if dropped:
            log.info("Guided FE: kept %d interactions, dropped %d (MI<=0.01)",
                     len(kept), len(dropped))
        for plan, mi in scored[:3]:
            log.info("  Top interaction: %s %s MI=%.4f",
                     plan.get("source"), plan.get("operation"), mi)

        return non_interactions + kept

    # ------------------------------------------------------------------
    # ME1-ME7: Transform execution
    # ------------------------------------------------------------------

    def _apply_transforms(self, df: pd.DataFrame) -> pd.DataFrame:
        result = pd.DataFrame(index=df.index)

        for plan in self.transform_plans:
            op = plan["operation"]
            source = plan.get("source")
            params = plan.get("params", {})

            try:
                new_cols = self._execute_transform(df, result, op, source, params)
                for col_name, col_data in new_cols.items():
                    result[col_name] = col_data
                    self.metadata.append({
                        "feature": col_name, "source": str(source),
                        "operation": op, "rationale": plan.get("rationale", ""),
                    })
                    log.info("Generated feature '%s' via %s", col_name, op)
            except Exception as e:
                log.error("Failed to apply %s on %s: %s", op, source, e)

        return result

    def _execute_transform(self, df: pd.DataFrame, result: pd.DataFrame,
                           op: str, source, params: dict) -> dict[str, pd.Series]:
        dispatch = {
            "standard_scale": self._me2_standard_scale,
            "robust_scale": self._me2_robust_scale,
            "log1p": self._me1_log1p,
            "sqrt": self._me1_sqrt,
            "yeo_johnson": self._me1_yeo_johnson,
            "quantile_bin": self._me7_quantile_bin,
            "one_hot": self._me3_one_hot,
            "binary_encode": self._me3_binary_encode,
            "ordinal_encode": self._me3_ordinal_encode,
            "frequency_encode": self._me3_frequency_encode,
            "target_encode": self._me3_target_encode,
            "bool_to_int": self._me3_bool_to_int,
            "extract_datetime_components": self._me5_datetime_components,
            "cyclical_encode": self._me5_cyclical_encode,
            "count_vectorize": self._me6_count_vectorize,
            "tfidf": self._me6_tfidf,
            "extract_text_stats": self._me6_text_stats,
            "extract_patterns": self._me6_extract_patterns,
            "create_ratio": self._me4_ratio,
            "create_difference": self._me4_difference,
            "create_product": self._me4_product,
            "groupby_agg": self._me8_groupby_agg,
            "relative_deviation": self._me1_relative_deviation,
            "drop": self._noop,
        }

        handler = dispatch.get(op)
        if handler is None:
            log.warning("Unknown operation '%s', skipping", op)
            return {}
        return handler(df, source, params)

    # -- ME1: Mathematical Transforms --

    def _me1_log1p(self, df, source, params) -> dict:
        col = df[source].fillna(0)
        return {f"{source}_log1p": np.log1p(col.clip(lower=0))}

    def _me1_sqrt(self, df, source, params) -> dict:
        col = df[source].fillna(0)
        return {f"{source}_sqrt": np.sqrt(col.clip(lower=0))}

    def _me1_yeo_johnson(self, df, source, params) -> dict:
        col = df[[source]].fillna(df[source].median())
        pt = PowerTransformer(method="yeo-johnson")
        transformed = pt.fit_transform(col).ravel()
        return {f"{source}_yeojohnson": pd.Series(transformed, index=df.index)}

    # -- ME2: Scaling & Normalization --

    def _me1_relative_deviation(self, df, source, params) -> dict:
        col = pd.to_numeric(df[source], errors="coerce")
        mean_val = col.mean()
        if mean_val == 0 or pd.isna(mean_val):
            return {}
        return {f"{source}_rel_dev": (col / mean_val).fillna(1.0)}

    # -- ME2: Scaling & Normalization --

    def _me2_standard_scale(self, df, source, params) -> dict:
        col = df[[source]].fillna(df[source].median())
        scaled = StandardScaler().fit_transform(col).ravel()
        return {f"{source}_scaled": pd.Series(scaled, index=df.index)}

    def _me2_robust_scale(self, df, source, params) -> dict:
        col = df[[source]].fillna(df[source].median())
        scaled = RobustScaler().fit_transform(col).ravel()
        return {f"{source}_robust": pd.Series(scaled, index=df.index)}

    # -- ME3: Encoding Strategies --

    def _me3_one_hot(self, df, source, params) -> dict:
        dummies = pd.get_dummies(df[source], prefix=source, dtype=int)
        return {col: dummies[col] for col in dummies.columns}

    def _me3_binary_encode(self, df, source, params) -> dict:
        le = LabelEncoder()
        encoded = le.fit_transform(df[source].fillna("_missing_").astype(str))
        return {f"{source}_binary": pd.Series(encoded, index=df.index)}

    def _me3_ordinal_encode(self, df, source, params) -> dict:
        oe = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
        encoded = oe.fit_transform(df[[source]].fillna("_missing_").astype(str)).ravel()
        return {f"{source}_ordinal": pd.Series(encoded, index=df.index)}

    def _me3_frequency_encode(self, df, source, params) -> dict:
        freq = df[source].value_counts(normalize=True)
        encoded = df[source].map(freq).fillna(0)
        return {f"{source}_freq": encoded}

    def _me3_target_encode(self, df, source, params) -> dict:
        if self.target_column is None or self.target_column not in df.columns:
            return self._me3_frequency_encode(df, source, params)
        target = df[self.target_column]
        if not pd.api.types.is_numeric_dtype(target):
            return self._me3_frequency_encode(df, source, params)
        global_mean = target.mean()
        means = df.groupby(source)[self.target_column].mean()
        encoded = df[source].map(means).fillna(global_mean)
        return {f"{source}_target_enc": encoded}

    def _me3_bool_to_int(self, df, source, params) -> dict:
        return {f"{source}_int": df[source].fillna(0).astype(int)}

    # -- ME4: Feature Interaction --

    def _me4_ratio(self, df, source, params) -> dict:
        a, b = source[0], source[1]
        denominator = df[b].replace(0, np.nan)
        ratio = df[a] / denominator
        return {f"{a}_div_{b}": ratio.fillna(0)}

    def _me4_difference(self, df, source, params) -> dict:
        a, b = source[0], source[1]
        return {f"{a}_minus_{b}": df[a].fillna(0) - df[b].fillna(0)}

    def _me4_product(self, df, source, params) -> dict:
        a, b = source[0], source[1]
        return {f"{a}_times_{b}": df[a].fillna(0) * df[b].fillna(0)}

    # -- ME5: Temporal Decomposition --

    def _me5_datetime_components(self, df, source, params) -> dict:
        dt = pd.to_datetime(df[source], errors="coerce")
        components = params.get("components",
                                ["year", "month", "day", "day_of_week", "quarter",
                                 "is_weekend", "hour", "minute", "minute_of_day",
                                 "is_rush_hour"])
        result = {}
        mapping = {
            "year": dt.dt.year,
            "month": dt.dt.month,
            "day": dt.dt.day,
            "day_of_week": dt.dt.dayofweek,
            "day_of_year": dt.dt.dayofyear,
            "quarter": dt.dt.quarter,
            "hour": dt.dt.hour,
            "minute": dt.dt.minute,
            "is_weekend": (dt.dt.dayofweek >= 5).astype(int),
            "minute_of_day": (dt.dt.hour * 60 + dt.dt.minute),
            "is_rush_hour": (((dt.dt.hour >= 7) & (dt.dt.hour <= 9)) |
                             ((dt.dt.hour >= 17) & (dt.dt.hour <= 19))).astype(int),
        }
        for comp in components:
            if comp in mapping:
                series = mapping[comp]
                result[f"{source}_{comp}"] = series.fillna(0).astype(int)
        return result

    def _me5_cyclical_encode(self, df, source, params) -> dict:
        dt = pd.to_datetime(df[source], errors="coerce")
        cols_periods = params.get("columns", {"month": 12, "day_of_week": 7})
        result = {}
        extractors = {"month": dt.dt.month, "day_of_week": dt.dt.dayofweek,
                       "hour": dt.dt.hour, "day": dt.dt.day}
        for col_name, period in cols_periods.items():
            if col_name in extractors:
                values = extractors[col_name].fillna(0)
                result[f"{source}_{col_name}_sin"] = np.sin(2 * np.pi * values / period)
                result[f"{source}_{col_name}_cos"] = np.cos(2 * np.pi * values / period)
        return result

    # -- ME6: Text Vectorization --

    def _me6_count_vectorize(self, df, source, params) -> dict:
        text = df[source].fillna("").astype(str)
        max_features = params.get("max_features", 200)
        vectorizer = CountVectorizer(max_features=max_features)
        matrix = vectorizer.fit_transform(text)
        feature_names = vectorizer.get_feature_names_out()
        result = {}
        for i, name in enumerate(feature_names):
            result[f"{source}_bow_{name}"] = pd.Series(
                matrix[:, i].toarray().ravel(), index=df.index)
        return result

    def _me6_tfidf(self, df, source, params) -> dict:
        text = df[source].fillna("").astype(str)
        max_features = params.get("max_features", 500)
        ngram_range = tuple(params.get("ngram_range", [1, 1]))
        sublinear_tf = params.get("sublinear_tf", False)
        vectorizer = TfidfVectorizer(
            max_features=max_features, ngram_range=ngram_range, sublinear_tf=sublinear_tf)
        matrix = vectorizer.fit_transform(text)
        feature_names = vectorizer.get_feature_names_out()
        result = {}
        for i, name in enumerate(feature_names):
            result[f"{source}_tfidf_{name}"] = pd.Series(
                matrix[:, i].toarray().ravel(), index=df.index)
        return result

    def _me6_text_stats(self, df, source, params) -> dict:
        text = df[source].fillna("").astype(str)
        words = text.str.split()
        return {
            f"{source}_word_count": words.str.len().fillna(0).astype(int),
            f"{source}_char_count": text.str.len(),
            f"{source}_avg_word_len": words.apply(
                lambda w: np.mean([len(x) for x in w]) if w else 0),
            f"{source}_upper_ratio": text.str.count(r"[A-Z]") / text.str.len().clip(lower=1),
            f"{source}_digit_ratio": text.str.count(r"\d") / text.str.len().clip(lower=1),
        }

    def _me6_extract_patterns(self, df, source, params) -> dict:
        text = df[source].fillna("").astype(str)
        patterns = params.get("patterns", [])
        result = {}
        for p in patterns:
            if p == "url_count":
                result[f"{source}_url_count"] = text.str.count(_URL_RE)
            elif p == "has_url":
                result[f"{source}_has_url"] = text.str.contains(_URL_RE, na=False).astype(int)
            elif p == "email_count":
                result[f"{source}_email_count"] = text.str.count(_EMAIL_RE)
            elif p == "has_email":
                result[f"{source}_has_email"] = text.str.contains(_EMAIL_RE, na=False).astype(int)
            elif p == "number_count":
                result[f"{source}_number_count"] = text.str.count(_NUMBER_RE)
        return result

    # -- ME7: Binning --

    # -- ME8: Aggregation Features --

    def _me8_groupby_agg(self, df, source, params) -> dict:
        cat_col, num_col = source[0], source[1]
        aggs = params.get("aggs", ["mean", "std"])
        result = {}
        cat_series = df[cat_col].astype(str).fillna("_missing_")
        num_series = pd.to_numeric(df[num_col], errors="coerce")
        grouped = num_series.groupby(cat_series)
        for agg in aggs:
            agg_map = grouped.agg(agg)
            feat_name = f"{num_col}_by_{cat_col}_{agg}"
            result[feat_name] = cat_series.map(agg_map).fillna(0)
        return result

    # -- ME7: Binning --

    def _me7_quantile_bin(self, df, source, params) -> dict:
        n_bins = params.get("n_bins", 5)
        col = df[source].fillna(df[source].median())
        try:
            binned = pd.qcut(col, q=n_bins, labels=False, duplicates="drop")
        except ValueError:
            binned = pd.cut(col, bins=n_bins, labels=False)
        return {f"{source}_qbin": binned.fillna(0).astype(int)}

    # -- No-op --

    def _noop(self, df, source, params) -> dict:
        return {}

    # ------------------------------------------------------------------
    # Reporting
    # ------------------------------------------------------------------

    def _print_quality_report(self) -> None:
        issues = self.quality_result.get("issues", [])
        suggestions = self.quality_result.get("suggestions", [])

        if not issues:
            print("\n[Quality Report] No issues detected.")
            return

        print(f"\n{'='*60}")
        print(f" QUALITY REPORT — {len(issues)} issues found")
        print(f"{'='*60}")
        for issue in sorted(issues, key=lambda x: {"high": 0, "medium": 1, "low": 2}.get(x.get("severity", "low"), 3)):
            sev = issue.get("severity", "?").upper()
            print(f"  [{sev:6s}] {issue.get('kind', '?'):25s} | {issue.get('description', '')}")

        print(f"\n{'-'*60}")
        print(f" SUGGESTIONS — {len(suggestions)} recommendations")
        print(f"{'-'*60}")
        for sug in suggestions:
            col = sug.get("column", "?")
            print(f"  [{col}] {sug.get('action', '?')} — {sug.get('rationale', '')}")
        print()

    def _save_report(self) -> None:
        report = {
            "quality": self.quality_result,
            "templates": self.detected_templates,
            "transforms": self.metadata,
        }
        path = Path(self.report_path)
        path.write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")
        log.info("Report saved to %s", path)

    def _save_metadata(self) -> None:
        meta_path = Path(self.output_path).with_suffix(".meta.json")
        meta_path.write_text(json.dumps(self.metadata, indent=2, default=str), encoding="utf-8")
        log.info("Metadata saved to %s", meta_path)

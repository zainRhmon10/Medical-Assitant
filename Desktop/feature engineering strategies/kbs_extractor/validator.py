"""Validation module — compares raw vs extracted features using ML models."""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import cross_val_score, StratifiedKFold, KFold
from sklearn.preprocessing import LabelEncoder
from sklearn.impute import SimpleImputer

from kbs_extractor.logger import get_logger

log = get_logger("validator")


def _prepare_raw(df: pd.DataFrame, target_col: str) -> pd.DataFrame:
    """Prepare raw features: encode categoricals, impute missing."""
    raw = df.drop(columns=[target_col]).copy()
    result = pd.DataFrame(index=raw.index)

    for col in raw.columns:
        if pd.api.types.is_numeric_dtype(raw[col]):
            result[col] = raw[col].fillna(raw[col].median())
        elif pd.api.types.is_bool_dtype(raw[col]):
            result[col] = raw[col].astype(int)
        else:
            le = LabelEncoder()
            filled = raw[col].fillna("__missing__").astype(str)
            result[col] = le.fit_transform(filled)

    return result


def validate(df_original: pd.DataFrame, df_features: pd.DataFrame,
             target_col: str, task_type: str) -> dict:
    """Run validation: raw vs extracted, feature importance, useless features."""

    target = df_original[target_col].copy()
    valid_mask = target.notna()

    if task_type == "classification":
        le_target = LabelEncoder()
        y = le_target.fit_transform(target[valid_mask].astype(str))
    else:
        y = pd.to_numeric(target[valid_mask], errors="coerce").values

    nan_mask = np.isnan(y) if task_type == "regression" else np.zeros(len(y), dtype=bool)
    y = y[~nan_mask]
    valid_idx = valid_mask[valid_mask].index[~nan_mask]

    X_raw = _prepare_raw(df_original, target_col).loc[valid_idx]
    X_ext = df_features.loc[valid_idx].fillna(0)

    if task_type == "classification":
        model_cls = RandomForestClassifier
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        scoring = "accuracy"
    else:
        model_cls = RandomForestRegressor
        cv = KFold(n_splits=5, shuffle=True, random_state=42)
        scoring = "r2"

    log.info("Validating: %d samples, raw=%d features, extracted=%d features",
             len(y), X_raw.shape[1], X_ext.shape[1])

    model_raw = model_cls(n_estimators=100, random_state=42, n_jobs=-1)
    scores_raw = cross_val_score(model_raw, X_raw, y, cv=cv, scoring=scoring)
    mean_raw = float(scores_raw.mean())
    std_raw = float(scores_raw.std())
    log.info("Raw features %s: %.4f (+/- %.4f)", scoring, mean_raw, std_raw)

    model_ext = model_cls(n_estimators=100, random_state=42, n_jobs=-1)
    scores_ext = cross_val_score(model_ext, X_ext, y, cv=cv, scoring=scoring)
    mean_ext = float(scores_ext.mean())
    std_ext = float(scores_ext.std())
    log.info("Extracted features %s: %.4f (+/- %.4f)", scoring, mean_ext, std_ext)

    improvement = mean_ext - mean_raw

    model_imp = model_cls(n_estimators=100, random_state=42, n_jobs=-1)
    model_imp.fit(X_ext, y)
    importances = model_imp.feature_importances_
    feat_names = list(X_ext.columns)
    feat_imp = sorted(zip(feat_names, importances), key=lambda x: x[1], reverse=True)

    top_features = [{"feature": name, "importance": round(float(imp), 4)}
                    for name, imp in feat_imp[:10]]
    useless = [{"feature": name, "importance": round(float(imp), 4)}
               for name, imp in feat_imp if imp < 0.005]

    result = {
        "samples": len(y),
        "task_type": task_type,
        "scoring": scoring,
        "raw": {
            "n_features": X_raw.shape[1],
            "mean_score": round(mean_raw, 4),
            "std_score": round(std_raw, 4),
            "cv_scores": [round(float(s), 4) for s in scores_raw],
        },
        "extracted": {
            "n_features": X_ext.shape[1],
            "mean_score": round(mean_ext, 4),
            "std_score": round(std_ext, 4),
            "cv_scores": [round(float(s), 4) for s in scores_ext],
        },
        "improvement": round(improvement, 4),
        "top_features": top_features,
        "useless_features": useless,
    }

    _print_report(result)
    return result


def _print_report(r: dict) -> None:
    scoring = r["scoring"]
    raw_s = r["raw"]["mean_score"] * 100
    ext_s = r["extracted"]["mean_score"] * 100
    imp = r["improvement"] * 100
    sign = "+" if imp >= 0 else ""

    if scoring == "r2":
        raw_s = r["raw"]["mean_score"]
        ext_s = r["extracted"]["mean_score"]
        imp = r["improvement"]

    w = 54
    print()
    print(f"{'=' * w}")
    print(f"{'VALIDATION REPORT':^{w}}")
    print(f"{'=' * w}")

    print(f"  Samples: {r['samples']}   |   Task: {r['task_type']}   |   Metric: {scoring}")
    print(f"{'-' * w}")

    if scoring == "accuracy":
        print(f"  Raw features ({r['raw']['n_features']:3d} cols)    {scoring}: {raw_s:6.2f}%")
        print(f"  Extracted    ({r['extracted']['n_features']:3d} cols)    {scoring}: {ext_s:6.2f}%")
        print(f"{'-' * w}")
        color_mark = ">>>" if imp > 0 else "---"
        print(f"  {color_mark} Improvement: {sign}{imp:.2f}%")
    else:
        print(f"  Raw features ({r['raw']['n_features']:3d} cols)    {scoring}: {raw_s:.4f}")
        print(f"  Extracted    ({r['extracted']['n_features']:3d} cols)    {scoring}: {ext_s:.4f}")
        print(f"{'-' * w}")
        color_mark = ">>>" if imp > 0 else "---"
        print(f"  {color_mark} Improvement: {sign}{imp:.4f}")

    print(f"{'=' * w}")
    print(f"  Top features by importance:")
    for i, f in enumerate(r["top_features"], 1):
        bar_len = int(f["importance"] * 40)
        bar = "#" * bar_len
        print(f"    {i:2d}. {f['feature']:30s} {f['importance']:.3f}  {bar}")

    if r["useless_features"]:
        print(f"{'-' * w}")
        print(f"  Useless features (importance < 0.005):")
        names = [f["feature"] for f in r["useless_features"]]
        for i in range(0, len(names), 4):
            chunk = ", ".join(names[i:i+4])
            print(f"    {chunk}")

    print(f"{'=' * w}")
    print()

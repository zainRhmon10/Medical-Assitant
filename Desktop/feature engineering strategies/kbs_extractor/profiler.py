"""Data profiling for tabular and text columns."""

import re

import numpy as np
import pandas as pd
from scipy import stats as sp_stats

from kbs_extractor.logger import get_logger

log = get_logger("profiler")

_URL_RE = re.compile(r"https?://\S+", re.IGNORECASE)
_EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
_NUMBER_RE = re.compile(r"\b\d+\.?\d*\b")


def _is_hidden_categorical(series: pd.Series) -> str | None:
    """Detect numeric columns that are actually categorical.
    Returns 'categorical' or 'boolean' if hidden, None if truly numeric."""
    clean = series.dropna()
    if len(clean) == 0:
        return None

    nunique = clean.nunique()
    n_rows = len(clean)

    if nunique == 2:
        vals = set(clean.unique())
        if vals <= {0, 1} or vals <= {0.0, 1.0}:
            log.info("Auto-detected '%s' as hidden binary (values={0,1})", series.name)
            return "boolean"

    all_integers = (clean == clean.astype(int)).all() if clean.dtype != int else True
    threshold = min(10, int(np.sqrt(n_rows)))

    if all_integers and nunique <= threshold and nunique >= 2:
        log.info("Auto-detected '%s' as hidden categorical "
                 "(nunique=%d <= threshold=%d, all integers)", series.name, nunique, threshold)
        return "categorical"

    return None


def _detect_column_type(series: pd.Series) -> str:
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    if pd.api.types.is_numeric_dtype(series):
        hidden = _is_hidden_categorical(series)
        if hidden:
            return hidden
        return "numeric"
    if pd.api.types.is_object_dtype(series) or pd.api.types.is_string_dtype(series):
        try:
            pd.to_datetime(series.dropna().head(50))
            return "datetime"
        except (ValueError, TypeError):
            pass
        avg_words = series.dropna().astype(str).str.split().str.len().mean()
        if avg_words > 5:
            return "text"
        return "categorical"
    return "categorical"


def _outlier_stats(series: pd.Series) -> tuple[int, float]:
    clean = series.dropna()
    if len(clean) < 4:
        return 0, 0.0
    q1, q3 = clean.quantile(0.25), clean.quantile(0.75)
    iqr = q3 - q1
    if iqr == 0:
        return 0, 0.0
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    outliers = ((clean < lower) | (clean > upper)).sum()
    return int(outliers), round(outliers / len(clean) * 100, 2)


def profile_numeric(name: str, series: pd.Series) -> dict:
    clean = series.dropna()
    outlier_count, outlier_pct = _outlier_stats(series)
    return {
        "name": name,
        "dtype": "numeric",
        "null_count": int(series.isna().sum()),
        "null_pct": round(series.isna().mean() * 100, 2),
        "unique_count": int(series.nunique()),
        "unique_ratio": round(series.nunique() / max(len(series), 1), 4),
        "mean": round(float(clean.mean()), 6) if len(clean) else 0.0,
        "std": round(float(clean.std()), 6) if len(clean) > 1 else 0.0,
        "min_val": float(clean.min()) if len(clean) else 0.0,
        "max_val": float(clean.max()) if len(clean) else 0.0,
        "q1": float(clean.quantile(0.25)) if len(clean) else 0.0,
        "median": float(clean.median()) if len(clean) else 0.0,
        "q3": float(clean.quantile(0.75)) if len(clean) else 0.0,
        "skewness": round(float(clean.skew()), 4) if len(clean) > 2 else 0.0,
        "kurtosis": round(float(clean.kurtosis()), 4) if len(clean) > 3 else 0.0,
        "outlier_count": outlier_count,
        "outlier_pct": outlier_pct,
    }


def profile_categorical(name: str, series: pd.Series) -> dict:
    clean = series.dropna()
    vc = clean.value_counts(normalize=True)
    return {
        "name": name,
        "dtype": "categorical",
        "null_count": int(series.isna().sum()),
        "null_pct": round(series.isna().mean() * 100, 2),
        "unique_count": int(series.nunique()),
        "unique_ratio": round(series.nunique() / max(len(series), 1), 4),
        "cardinality": int(series.nunique()),
        "top_freq": round(float(vc.iloc[0]), 4) if len(vc) else 0.0,
        "is_ordinal": False,
    }


def profile_datetime(name: str, series: pd.Series) -> dict:
    clean = series.dropna()
    try:
        parsed = pd.to_datetime(clean)
    except (ValueError, TypeError):
        parsed = pd.Series(dtype="datetime64[ns]")
    return {
        "name": name,
        "dtype": "datetime",
        "null_count": int(series.isna().sum()),
        "null_pct": round(series.isna().mean() * 100, 2),
        "unique_count": int(series.nunique()),
        "unique_ratio": round(series.nunique() / max(len(series), 1), 4),
        "min_date": str(parsed.min()) if len(parsed) else "",
        "max_date": str(parsed.max()) if len(parsed) else "",
        "granularity": _detect_granularity(parsed),
    }


def _detect_granularity(dt_series: pd.Series) -> str:
    if dt_series.empty:
        return "unknown"
    if (dt_series.dt.second != 0).any():
        return "second"
    if (dt_series.dt.minute != 0).any():
        return "minute"
    if (dt_series.dt.hour != 0).any():
        return "hour"
    return "day"


def profile_text(name: str, series: pd.Series) -> dict:
    clean = series.dropna().astype(str)
    if clean.empty:
        return {"name": name, "dtype": "text", "null_count": int(series.isna().sum()),
                "null_pct": 100.0, "vocab_size": 0, "avg_word_count": 0}

    words = clean.str.split()
    word_counts = words.str.len()
    all_words = words.explode().dropna()
    word_lengths = clean.str.len()

    url_flags = clean.str.contains(_URL_RE, na=False)
    email_flags = clean.str.contains(_EMAIL_RE, na=False)
    num_flags = clean.str.contains(_NUMBER_RE, na=False)

    char_counts = clean.str.len()
    upper_counts = clean.str.count(r"[A-Z]")
    digit_counts = clean.str.count(r"\d")
    special_counts = clean.str.count(r"[^a-zA-Z0-9\s]")

    total_chars = char_counts.sum()
    safe_total = max(total_chars, 1)

    return {
        "name": name,
        "dtype": "text",
        "null_count": int(series.isna().sum()),
        "null_pct": round(series.isna().mean() * 100, 2),
        "avg_word_count": round(float(word_counts.mean()), 2),
        "avg_char_count": round(float(char_counts.mean()), 2),
        "avg_word_length": round(float(all_words.str.len().mean()), 2) if len(all_words) else 0.0,
        "vocab_size": int(all_words.nunique()),
        "has_urls": bool(url_flags.any()),
        "has_emails": bool(email_flags.any()),
        "has_numbers": bool(num_flags.any()),
        "uppercase_ratio": round(float(upper_counts.sum() / safe_total), 4),
        "digit_ratio": round(float(digit_counts.sum() / safe_total), 4),
        "special_char_ratio": round(float(special_counts.sum() / safe_total), 4),
    }


def profile_boolean(name: str, series: pd.Series) -> dict:
    return {
        "name": name,
        "dtype": "boolean",
        "null_count": int(series.isna().sum()),
        "null_pct": round(series.isna().mean() * 100, 2),
        "unique_count": int(series.nunique()),
        "unique_ratio": round(series.nunique() / max(len(series), 1), 4),
    }


_PROFILERS = {
    "numeric": profile_numeric,
    "categorical": profile_categorical,
    "datetime": profile_datetime,
    "text": profile_text,
    "boolean": profile_boolean,
}


def profile_dataframe(df: pd.DataFrame,
                      categorical_overrides: list[str] | None = None) -> list[dict]:
    forced_cats = set(categorical_overrides or [])
    profiles = []
    for col in df.columns:
        if col in forced_cats:
            dtype = "categorical"
        else:
            dtype = _detect_column_type(df[col])
        profiler_fn = _PROFILERS[dtype]
        profile = profiler_fn(col, df[col])
        log.info("Profiled column '%s' as %s", col, dtype)
        profiles.append(profile)
    return profiles


def compute_correlations(df: pd.DataFrame, threshold: float = 0.0) -> list[dict]:
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    if len(numeric_cols) < 2:
        return []

    corr_matrix = df[numeric_cols].corr(method="pearson")
    correlations = []
    seen = set()
    for i, col_a in enumerate(numeric_cols):
        for col_b in numeric_cols[i + 1:]:
            r = corr_matrix.loc[col_a, col_b]
            if np.isnan(r):
                continue
            if abs(r) >= threshold:
                pair_key = tuple(sorted([col_a, col_b]))
                if pair_key not in seen:
                    seen.add(pair_key)
                    correlations.append({
                        "col_a": col_a,
                        "col_b": col_b,
                        "pearson": round(float(r), 4),
                        "abs_pearson": round(abs(float(r)), 4),
                    })
    log.info("Computed %d correlation pairs (threshold=%.2f)", len(correlations), threshold)
    return correlations

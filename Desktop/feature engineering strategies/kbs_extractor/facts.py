"""All Fact subclasses for the KBS engines."""

from experta import Fact


class DatasetMeta(Fact):
    """Root fact: dataset-level metadata."""
    # row_count, col_count, task_type ("classification"|"regression"|None)


class ColumnProfile(Fact):
    """Profile of a single tabular column."""
    # name, dtype ("numeric" | "categorical" | "datetime" | "boolean")
    # null_count, null_pct, unique_count, unique_ratio
    # mean, std, min_val, max_val, skewness, kurtosis, q1, median, q3
    # outlier_count, outlier_pct
    # cardinality (for categorical)
    # is_ordinal (bool), top_freq (float)
    # mi_score (mutual information with target, optional)
    # target_corr (abs correlation with target, optional)
    # determines_target (bool, optional)


class TextProfile(Fact):
    """Profile of a text column."""
    # name, avg_word_count, avg_char_count, avg_word_length
    # vocab_size, avg_sentence_length
    # has_urls (bool), has_emails (bool), has_numbers (bool)
    # language, uppercase_ratio, digit_ratio, special_char_ratio


class CorrelationFact(Fact):
    """Pairwise correlation between two numeric columns."""
    # col_a, col_b, pearson, abs_pearson


class QualityIssue(Fact):
    """A detected data quality problem."""
    # column, kind, severity ("low" | "medium" | "high" | "critical"), description


class FixSuggestion(Fact):
    """A suggested fix for a quality issue."""
    # column, action, params (dict), rationale


class TransformPlan(Fact):
    """A planned feature transformation."""
    # source (str or list), operation, params (dict), rationale


class TargetColumn(Fact):
    """Identifies the ML target column."""
    # name, dtype


class KnowledgeTemplate(Fact):
    """A detected domain pattern suggesting a derived feature."""
    # pattern_name, columns (list), operation, formula, rationale

"""KnowledgeEngine for data quality assessment (MQ1-MQ4)."""

from experta import KnowledgeEngine, Rule, DefFacts, Fact, MATCH, P, NOT, AS

from kbs_extractor.facts import (
    ColumnProfile, TextProfile, DatasetMeta,
    QualityIssue, FixSuggestion, CorrelationFact,
)
from kbs_extractor.logger import get_logger

log = get_logger("quality")


class QualityEngine(KnowledgeEngine):
    """Runs MQ1–MQ4 quality assessment rules over column profiles."""

    # ------------------------------------------------------------------
    # MQ1: Missing Value Analysis
    # ------------------------------------------------------------------

    @Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                        null_pct=P(lambda x: 0 < x <= 5)))
    def mq1_low_missing_numeric(self, n):
        log.info("MQ1: column '%s' has low missing (<= 5%%), suggest impute_median", n)
        self.declare(QualityIssue(column=n, kind="missing", severity="low",
                                  description=f"Column '{n}' has low missing values"))
        self.declare(FixSuggestion(column=n, action="impute_median",
                                   params={"strategy": "median"},
                                   rationale="<5% missing in numeric column, median is robust"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                        null_pct=P(lambda x: 5 < x <= 30)))
    def mq1_moderate_missing_numeric(self, n):
        log.info("MQ1: column '%s' has moderate missing (5-30%%)", n)
        self.declare(QualityIssue(column=n, kind="missing", severity="medium",
                                  description=f"Column '{n}' has moderate missing values"))
        self.declare(FixSuggestion(column=n, action="impute_median",
                                   params={"strategy": "median"},
                                   rationale="5-30% missing, impute with median"))
        self.declare(FixSuggestion(column=n, action="create_indicator",
                                   params={},
                                   rationale="Create binary missingness indicator"))

    @Rule(ColumnProfile(name=MATCH.n, null_pct=P(lambda x: x > 30)))
    def mq1_high_missing(self, n):
        log.info("MQ1: column '%s' has high missing (>30%%)", n)
        self.declare(QualityIssue(column=n, kind="missing", severity="high",
                                  description=f"Column '{n}' has >30% missing values"))
        self.declare(FixSuggestion(column=n, action="create_indicator_and_drop",
                                   params={},
                                   rationale=">30% missing, create indicator then drop original"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="categorical",
                        null_pct=P(lambda x: 0 < x <= 30)))
    def mq1_missing_categorical(self, n):
        log.info("MQ1: categorical column '%s' has missing values", n)
        self.declare(QualityIssue(column=n, kind="missing", severity="low",
                                  description=f"Categorical column '{n}' has missing values"))
        self.declare(FixSuggestion(column=n, action="impute_mode",
                                   params={"strategy": "most_frequent"},
                                   rationale="Fill categorical NaN with most frequent value"))

    @Rule(TextProfile(name=MATCH.n, null_pct=P(lambda x: x > 0)))
    def mq1_missing_text(self, n):
        log.info("MQ1: text column '%s' has missing values", n)
        self.declare(QualityIssue(column=n, kind="missing", severity="medium",
                                  description=f"Text column '{n}' has missing values"))
        self.declare(FixSuggestion(column=n, action="fill_empty_string",
                                   params={},
                                   rationale="Fill text NaN with empty string before vectorization"))

    # ------------------------------------------------------------------
    # MQ2: Outlier Detection
    # ------------------------------------------------------------------

    @Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                        outlier_pct=P(lambda x: 0 < x <= 1)))
    def mq2_few_outliers(self, n):
        log.info("MQ2: column '%s' has few outliers (<= 1%%)", n)
        self.declare(QualityIssue(column=n, kind="outlier", severity="low",
                                  description=f"Column '{n}' has <1% outliers"))
        self.declare(FixSuggestion(column=n, action="remove_rows",
                                   params={},
                                   rationale="<1% outliers, safe to drop these rows"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                        outlier_pct=P(lambda x: 1 < x <= 5)))
    def mq2_moderate_outliers(self, n):
        log.info("MQ2: column '%s' has moderate outliers (1-5%%)", n)
        self.declare(QualityIssue(column=n, kind="outlier", severity="medium",
                                  description=f"Column '{n}' has 1-5% outliers"))
        self.declare(FixSuggestion(column=n, action="winsorize",
                                   params={"limits": [0.05, 0.05]},
                                   rationale="1-5% outliers, clip to 5th/95th percentile"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                        outlier_pct=P(lambda x: x > 5)))
    def mq2_many_outliers(self, n):
        log.info("MQ2: column '%s' has many outliers (>5%%)", n)
        self.declare(QualityIssue(column=n, kind="outlier", severity="low",
                                  description=f"Column '{n}' has >5% outliers — may be natural variance"))
        self.declare(FixSuggestion(column=n, action="keep",
                                   params={},
                                   rationale=">5% outliers, likely part of natural distribution"))

    # ------------------------------------------------------------------
    # MQ3: Consistency & Type Checking
    # ------------------------------------------------------------------

    @Rule(ColumnProfile(name=MATCH.n, unique_ratio=P(lambda x: x == 1.0)))
    def mq3_all_unique(self, n):
        log.info("MQ3: column '%s' has all unique values (possible ID column)", n)
        self.declare(QualityIssue(column=n, kind="possible_id", severity="medium",
                                  description=f"Column '{n}' has 100% unique values — likely an ID"))
        self.declare(FixSuggestion(column=n, action="drop_column",
                                   params={},
                                   rationale="ID columns carry no predictive information"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                        std=P(lambda x: x == 0)))
    def mq3_zero_variance_numeric(self, n):
        log.info("MQ3: numeric column '%s' has zero variance", n)
        self.declare(QualityIssue(column=n, kind="constant", severity="high",
                                  description=f"Column '{n}' is constant (std=0)"))
        self.declare(FixSuggestion(column=n, action="drop_column",
                                   params={},
                                   rationale="Constant column adds no information"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="categorical",
                        unique_count=P(lambda x: x == 1)))
    def mq3_single_value_categorical(self, n):
        log.info("MQ3: categorical column '%s' has only one value", n)
        self.declare(QualityIssue(column=n, kind="constant", severity="high",
                                  description=f"Categorical column '{n}' has only one value"))
        self.declare(FixSuggestion(column=n, action="drop_column",
                                   params={},
                                   rationale="Single-value categorical is useless for prediction"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="categorical",
                        top_freq=P(lambda x: x > 0.95)))
    def mq3_dominant_value(self, n):
        log.info("MQ3: column '%s' has a dominant value (>95%% frequency)", n)
        self.declare(QualityIssue(column=n, kind="near_constant", severity="medium",
                                  description=f"Column '{n}' has one value dominating >95%"))
        self.declare(FixSuggestion(column=n, action="flag_review",
                                   params={},
                                   rationale="Near-constant column, review for usefulness"))

    # ------------------------------------------------------------------
    # MQ4: Duplicate & Near-Duplicate Detection
    # ------------------------------------------------------------------

    @Rule(CorrelationFact(col_a=MATCH.a, col_b=MATCH.b,
                          abs_pearson=P(lambda x: x > 0.95)))
    def mq4_near_duplicate_columns(self, a, b):
        log.info("MQ4: columns '%s' and '%s' are near-duplicates (|r|>0.95)", a, b)
        self.declare(QualityIssue(column=f"{a},{b}", kind="near_duplicate_columns",
                                  severity="high",
                                  description=f"Columns '{a}' and '{b}' are nearly identical (|r|>0.95)"))
        self.declare(FixSuggestion(column=f"{a},{b}", action="drop_one",
                                   params={"keep": a, "drop": b},
                                   rationale="Near-duplicate columns, drop one to reduce multicollinearity"))

    # ------------------------------------------------------------------
    # MQ5: Data Leakage Detection
    # ------------------------------------------------------------------

    @Rule(ColumnProfile(name=MATCH.n,
                        target_corr=P(lambda x: x is not None and x > 0.95)))
    def mq5_leakage_correlation(self, n):
        log.info("MQ5: column '%s' has suspiciously high correlation with target (>0.95)", n)
        self.declare(QualityIssue(
            column=n, kind="leakage_correlation", severity="critical",
            description=f"Column '{n}' has |r|>0.95 with target — probable data leakage"))
        self.declare(FixSuggestion(
            column=n, action="drop_column", params={},
            rationale="Suspected data leakage: near-perfect correlation with target"))

    @Rule(ColumnProfile(name=MATCH.n,
                        determines_target=P(lambda x: x is True)))
    def mq5_leakage_deterministic(self, n):
        log.info("MQ5: column '%s' uniquely determines the target", n)
        self.declare(QualityIssue(
            column=n, kind="leakage_deterministic", severity="critical",
            description=f"Column '{n}' uniquely determines the target — data leakage"))
        self.declare(FixSuggestion(
            column=n, action="drop_column", params={},
            rationale="Each value of this feature maps to exactly one target value"))


def run_quality_assessment(profiles: list[dict], correlations: list[dict]) -> dict:
    """Run the quality engine and return issues + suggestions."""
    engine = QualityEngine()
    engine.reset()

    for p in profiles:
        if p["dtype"] == "text":
            engine.declare(TextProfile(**p))
        else:
            engine.declare(ColumnProfile(**p))

    for c in correlations:
        engine.declare(CorrelationFact(**c))

    engine.run()

    issues = []
    suggestions = []
    for fact in engine.facts.values():
        if isinstance(fact, QualityIssue):
            issues.append({k: v for k, v in fact.items() if k != "__factid__"})
        elif isinstance(fact, FixSuggestion):
            suggestions.append({k: v for k, v in fact.items() if k != "__factid__"})

    log.info("Quality assessment complete: %d issues, %d suggestions", len(issues), len(suggestions))
    return {"issues": issues, "suggestions": suggestions}

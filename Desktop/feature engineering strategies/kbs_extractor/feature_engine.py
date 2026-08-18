"""KnowledgeEngine for feature extraction (MD1-MD6 + Meta-Rules + Knowledge Templates)."""

from experta import KnowledgeEngine, Rule, MATCH, P, Fact

from kbs_extractor.facts import (
    ColumnProfile, TextProfile, CorrelationFact, TransformPlan, DatasetMeta,
)
from kbs_extractor.logger import get_logger

log = get_logger("features")

# Internal flags set by meta-rules
class _AllowInteractions(Fact):
    pass

class _AllowPolynomial(Fact):
    pass


class FeatureEngine(KnowledgeEngine):
    """Runs Meta-Rules → MD1–MD6 → Knowledge Templates."""

    # ==================================================================
    # META-RULES: gate other rules based on dataset characteristics
    # ==================================================================

    @Rule(DatasetMeta(row_count=P(lambda r: r >= 100)))
    def meta_allow_interactions(self):
        log.info("META: rows >= 100, interaction features ENABLED")
        self.declare(_AllowInteractions(enabled=True))

    @Rule(DatasetMeta(row_count=P(lambda r: r < 100)))
    def meta_disable_interactions(self):
        log.info("META: rows < 100, interaction features DISABLED (sample too small)")
        self.declare(_AllowInteractions(enabled=False))

    @Rule(DatasetMeta(row_count=P(lambda r: r >= 50)))
    def meta_allow_polynomial(self):
        self.declare(_AllowPolynomial(enabled=True))

    @Rule(DatasetMeta(row_count=P(lambda r: r < 50)))
    def meta_disable_polynomial(self):
        log.info("META: rows < 50, polynomial/binning features DISABLED")
        self.declare(_AllowPolynomial(enabled=False))

    # ==================================================================
    # MD1: Statistical Distribution Analysis
    # ==================================================================

    @Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                        skewness=P(lambda s: abs(s) <= 0.5),
                        kurtosis=P(lambda k: k <= 7),
                        std=P(lambda s: s > 0)))
    @Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                        std=P(lambda s: s > 0)))
    def md1_relative_deviation(self, n):
        self.declare(TransformPlan(
            source=n, operation="relative_deviation",
            params={}, rationale="Value / mean — relative deviation from average"))

    def md1_symmetric(self, n):
        log.info("MD1: '%s' is near-symmetric, apply standard_scale", n)
        self.declare(TransformPlan(
            source=n, operation="standard_scale",
            params={}, rationale="Near-symmetric distribution (|skew|<=0.5)"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                        skewness=P(lambda s: 0.5 < abs(s) <= 2),
                        min_val=P(lambda m: m >= 0),
                        std=P(lambda s: s > 0)))
    def md1_moderate_skew_positive(self, n):
        log.info("MD1: '%s' has moderate skew, apply sqrt + scale", n)
        self.declare(TransformPlan(
            source=n, operation="sqrt",
            params={}, rationale="Moderate skew (0.5<|skew|<=2), min>=0"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                        skewness=P(lambda s: 0.5 < abs(s) <= 2),
                        min_val=P(lambda m: m < 0),
                        std=P(lambda s: s > 0)))
    def md1_moderate_skew_negative_vals(self, n):
        log.info("MD1: '%s' has moderate skew with negatives, apply yeo_johnson", n)
        self.declare(TransformPlan(
            source=n, operation="yeo_johnson",
            params={}, rationale="Moderate skew with negative values"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                        skewness=P(lambda s: abs(s) > 2),
                        min_val=P(lambda m: m >= 0),
                        std=P(lambda s: s > 0)))
    def md1_high_skew_positive(self, n):
        log.info("MD1: '%s' has high skew, apply log1p", n)
        self.declare(TransformPlan(
            source=n, operation="log1p",
            params={}, rationale="High positive skew (|skew|>2), min>=0"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                        skewness=P(lambda s: abs(s) > 2),
                        min_val=P(lambda m: m < 0),
                        std=P(lambda s: s > 0)))
    def md1_high_skew_negative_vals(self, n):
        log.info("MD1: '%s' has high skew with negatives, apply yeo_johnson", n)
        self.declare(TransformPlan(
            source=n, operation="yeo_johnson",
            params={}, rationale="High skew with negative values, yeo-johnson handles negatives"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                        kurtosis=P(lambda k: k > 7),
                        std=P(lambda s: s > 0)))
    def md1_heavy_tails(self, n):
        log.info("MD1: '%s' has heavy tails (kurtosis>7), apply robust_scale", n)
        self.declare(TransformPlan(
            source=n, operation="robust_scale",
            params={}, rationale="Heavy tails (kurtosis>7), RobustScaler resists outliers"))

    @Rule(_AllowPolynomial(enabled=True),
          ColumnProfile(name=MATCH.n, dtype="numeric",
                        kurtosis=P(lambda k: k < -1),
                        std=P(lambda s: s > 0)))
    def md1_flat_distribution(self, n):
        log.info("MD1: '%s' is flat (kurtosis<-1), apply quantile_bin", n)
        self.declare(TransformPlan(
            source=n, operation="quantile_bin",
            params={"n_bins": 5}, rationale="Flat distribution, discretize into quantile bins"))

    # ==================================================================
    # MD2: Correlation & Dependency Analysis (gated by meta-rules)
    # ==================================================================

    @Rule(_AllowInteractions(enabled=True),
          CorrelationFact(col_a=MATCH.a, col_b=MATCH.b,
                          abs_pearson=P(lambda r: 0.7 < r <= 0.95)))
    def md2_strong_correlation(self, a, b):
        log.info("MD2: '%s' and '%s' strongly correlated, create ratio", a, b)
        self.declare(TransformPlan(
            source=[a, b], operation="create_ratio",
            params={}, rationale=f"Strong correlation ({a},{b}), ratio captures relationship"))
        self.declare(TransformPlan(
            source=[a, b], operation="create_difference",
            params={}, rationale=f"Strong correlation ({a},{b}), difference may be informative"))

    @Rule(_AllowInteractions(enabled=True),
          CorrelationFact(col_a=MATCH.a, col_b=MATCH.b,
                          abs_pearson=P(lambda r: 0.3 < r <= 0.7)))
    def md2_moderate_correlation(self, a, b):
        log.info("MD2: '%s' and '%s' moderately correlated, create product", a, b)
        self.declare(TransformPlan(
            source=[a, b], operation="create_product",
            params={}, rationale=f"Moderate correlation ({a},{b}), product captures interaction"))

    # ==================================================================
    # MD3: Information-Theoretic Analysis
    # ==================================================================

    @Rule(ColumnProfile(name=MATCH.n, mi_score=P(lambda mi: mi is not None and mi < 0.01)))
    def md3_zero_information(self, n):
        log.info("MD3: '%s' has near-zero MI with target, suggest drop", n)
        self.declare(TransformPlan(
            source=n, operation="drop",
            params={}, rationale="Near-zero mutual information with target"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="categorical",
                        mi_score=P(lambda mi: mi is not None and mi > 0.3)))
    def md3_high_info_categorical(self, n):
        log.info("MD3: '%s' has high MI, use target_encode", n)
        self.declare(TransformPlan(
            source=n, operation="target_encode",
            params={}, rationale="High MI categorical column, target encoding preserves info"))

    # ==================================================================
    # MD4: Cardinality Analysis
    # ==================================================================

    @Rule(ColumnProfile(name=MATCH.n, dtype="categorical",
                        is_ordinal=P(lambda x: x is True)))
    def md4_ordinal(self, n):
        log.info("MD4: '%s' is ordinal, apply ordinal_encode", n)
        self.declare(TransformPlan(
            source=n, operation="ordinal_encode",
            params={}, rationale="Known ordinal column"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="categorical",
                        is_ordinal=P(lambda x: not x),
                        cardinality=P(lambda c: c == 2)))
    def md4_binary(self, n):
        log.info("MD4: '%s' is binary, apply binary_encode", n)
        self.declare(TransformPlan(
            source=n, operation="binary_encode",
            params={}, rationale="Binary categorical column (2 values)"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="categorical",
                        is_ordinal=P(lambda x: not x),
                        cardinality=P(lambda c: 3 <= c <= 10)))
    def md4_low_cardinality(self, n):
        log.info("MD4: '%s' has low cardinality (3-10), apply one_hot", n)
        self.declare(TransformPlan(
            source=n, operation="one_hot",
            params={}, rationale="Low cardinality categorical (3-10 values)"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="categorical",
                        is_ordinal=P(lambda x: not x),
                        cardinality=P(lambda c: 11 <= c <= 50)))
    def md4_medium_cardinality(self, n):
        log.info("MD4: '%s' has medium cardinality (11-50), apply frequency_encode", n)
        self.declare(TransformPlan(
            source=n, operation="frequency_encode",
            params={}, rationale="Medium cardinality (11-50), frequency encoding is lightweight"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="categorical",
                        is_ordinal=P(lambda x: not x),
                        cardinality=P(lambda c: c > 50)))
    def md4_high_cardinality(self, n):
        log.info("MD4: '%s' has high cardinality (>50), apply target_encode", n)
        self.declare(TransformPlan(
            source=n, operation="target_encode",
            params={}, rationale="High cardinality (>50), target encoding reduces dimensionality"))

    @Rule(ColumnProfile(name=MATCH.n, dtype="boolean"))
    def md4_boolean(self, n):
        log.info("MD4: '%s' is boolean, cast to int", n)
        self.declare(TransformPlan(
            source=n, operation="bool_to_int",
            params={}, rationale="Boolean -> integer (0/1)"))

    # ==================================================================
    # MD5: Temporal Pattern Recognition
    # ==================================================================

    @Rule(ColumnProfile(name=MATCH.n, dtype="datetime"))
    def md5_datetime_decompose(self, n):
        log.info("MD5: '%s' is datetime, extract components", n)
        self.declare(TransformPlan(
            source=n, operation="extract_datetime_components",
            params={"components": ["year", "month", "day", "day_of_week", "quarter",
                                   "is_weekend", "hour", "minute", "minute_of_day",
                                   "is_rush_hour"]},
            rationale="Datetime column -> extract all temporal components"))
        self.declare(TransformPlan(
            source=n, operation="cyclical_encode",
            params={"columns": {"month": 12, "day_of_week": 7, "hour": 24}},
            rationale="Cyclical encoding preserves periodicity"))

    # ==================================================================
    # MD6: Text Structure Analysis
    # ==================================================================

    @Rule(TextProfile(name=MATCH.n, vocab_size=P(lambda v: 0 < v <= 500)))
    def md6_small_vocab(self, n):
        log.info("MD6: '%s' has small vocab (<=500), apply count_vectorize", n)
        self.declare(TransformPlan(
            source=n, operation="count_vectorize",
            params={"max_features": 200}, rationale="Small vocabulary, CountVectorizer sufficient"))

    @Rule(TextProfile(name=MATCH.n, vocab_size=P(lambda v: 500 < v <= 5000)))
    def md6_medium_vocab(self, n):
        log.info("MD6: '%s' has medium vocab (500-5000), apply tfidf", n)
        self.declare(TransformPlan(
            source=n, operation="tfidf",
            params={"max_features": 500, "ngram_range": [1, 2]},
            rationale="Medium vocabulary, TF-IDF with bigrams"))

    @Rule(TextProfile(name=MATCH.n, vocab_size=P(lambda v: v > 5000)))
    def md6_large_vocab(self, n):
        log.info("MD6: '%s' has large vocab (>5000), apply tfidf with sublinear", n)
        self.declare(TransformPlan(
            source=n, operation="tfidf",
            params={"max_features": 1000, "sublinear_tf": True, "ngram_range": [1, 2]},
            rationale="Large vocabulary, TF-IDF with sublinear_tf dampening"))

    @Rule(TextProfile(name=MATCH.n, avg_word_count=P(lambda w: w > 0)))
    def md6_text_stats(self, n):
        log.info("MD6: '%s' extracting text meta-features", n)
        self.declare(TransformPlan(
            source=n, operation="extract_text_stats",
            params={}, rationale="Statistical meta-features from text"))

    @Rule(TextProfile(name=MATCH.n, has_urls=True))
    def md6_url_extraction(self, n):
        self.declare(TransformPlan(
            source=n, operation="extract_patterns",
            params={"patterns": ["url_count", "has_url"]},
            rationale="Text contains URLs, extract count and indicator"))

    @Rule(TextProfile(name=MATCH.n, has_emails=True))
    def md6_email_extraction(self, n):
        self.declare(TransformPlan(
            source=n, operation="extract_patterns",
            params={"patterns": ["email_count", "has_email"]},
            rationale="Text contains emails, extract count and indicator"))

    @Rule(TextProfile(name=MATCH.n, has_numbers=True))
    def md6_number_extraction(self, n):
        self.declare(TransformPlan(
            source=n, operation="extract_patterns",
            params={"patterns": ["number_count"]},
            rationale="Text contains numeric mentions"))

    # ==================================================================
    # MD8: Aggregation Features (groupby) — gated by meta-rules
    # ==================================================================

    @Rule(_AllowInteractions(enabled=True),
          ColumnProfile(name=MATCH.cat, dtype="categorical",
                        cardinality=P(lambda c: 2 <= c <= 50)),
          ColumnProfile(name=MATCH.num, dtype="numeric",
                        std=P(lambda s: s > 0)))
    def md8_aggregation(self, cat, num):
        log.info("MD8: groupby('%s')['%s'].agg → aggregation features", cat, num)
        self.declare(TransformPlan(
            source=[cat, num], operation="groupby_agg",
            params={"aggs": ["mean", "std"]},
            rationale=f"Aggregation: {num} statistics per {cat} group"))

    # ==================================================================
    # MD7: Knowledge Templates — built by SemanticTemplateMatcher
    # ==================================================================
    # Templates are injected as KnowledgeTemplate facts BEFORE engine.run()
    # by the SemanticTemplateMatcher. No hardcoded @Rule patterns here.


# ── Semantic Matching Layer ─────────────────────────────────────

SEMANTIC_ALIASES = {
    "height": {
        "aliases": ["height", "height_cm", "height_m", "body_height", "person_height",
                     "الطول", "طول"],
        "dtype": "numeric",
    },
    "weight": {
        "aliases": ["weight", "weight_kg", "body_weight", "mass", "الوزن", "وزن"],
        "dtype": "numeric",
    },
    "age": {
        "aliases": ["age", "patient_age", "person_age", "العمر", "عمر"],
        "dtype": "numeric",
    },
    "income": {
        "aliases": ["income", "salary", "wage", "earnings", "pay", "compensation",
                     "الدخل", "دخل", "الراتب", "راتب"],
        "dtype": "numeric",
    },
    "price": {
        "aliases": ["price", "unit_price", "item_price", "cost", "السعر", "سعر"],
        "dtype": "numeric",
    },
    "quantity": {
        "aliases": ["quantity", "qty", "amount", "count", "units",
                     "الكمية", "كمية"],
        "dtype": "numeric",
    },
    "revenue": {
        "aliases": ["revenue", "total_revenue", "sales", "الإيرادات"],
        "dtype": "numeric",
    },
    "cost": {
        "aliases": ["cost", "total_cost", "expense", "التكلفة", "تكلفة"],
        "dtype": "numeric",
    },
    "debt": {
        "aliases": ["debt", "loan", "liability", "الدين", "دين", "قرض"],
        "dtype": "numeric",
    },
    "family_size": {
        "aliases": ["family_size", "household_size", "dependents", "عدد_الأفراد"],
        "dtype": "numeric",
    },
    "rooms": {
        "aliases": ["rooms", "num_rooms", "bedrooms", "غرف"],
        "dtype": "numeric",
    },
    "people": {
        "aliases": ["people", "persons", "occupants", "guests", "passengers", "أشخاص"],
        "dtype": "numeric",
    },
    "start_date": {
        "aliases": ["start_date", "start_time", "begin_date", "begin_time",
                     "created_at", "order_date", "hire_date", "تاريخ_البداية"],
        "dtype": "datetime",
    },
    "end_date": {
        "aliases": ["end_date", "end_time", "finish_date", "finish_time",
                     "completed_at", "delivery_date", "تاريخ_النهاية"],
        "dtype": "datetime",
    },
    "birth_date": {
        "aliases": ["birth_date", "birthdate", "dob", "date_of_birth", "تاريخ_الميلاد"],
        "dtype": "datetime",
    },
    "lat_origin": {
        "aliases": ["pickup_lat", "origin_lat", "start_lat", "from_lat", "lat_1"],
        "dtype": "numeric",
    },
    "lon_origin": {
        "aliases": ["pickup_lon", "pickup_lng", "origin_lon", "origin_lng",
                     "start_lon", "from_lon", "lon_1", "lng_1"],
        "dtype": "numeric",
    },
    "lat_dest": {
        "aliases": ["dropoff_lat", "dest_lat", "end_lat", "to_lat", "lat_2"],
        "dtype": "numeric",
    },
    "lon_dest": {
        "aliases": ["dropoff_lon", "dropoff_lng", "dest_lon", "dest_lng",
                     "end_lon", "to_lon", "lon_2", "lng_2"],
        "dtype": "numeric",
    },
    "lat_single": {
        "aliases": ["lat", "latitude", "خط_العرض"],
        "dtype": "numeric",
    },
    "lon_single": {
        "aliases": ["lon", "lng", "longitude", "خط_الطول"],
        "dtype": "numeric",
    },
}


TEMPLATE_DEFINITIONS = [
    # ── Medical ──
    {
        "name": "BMI",
        "requires": ["weight", "height"],
        "operation": "bmi",
        "confidence": 95,
        "rationale": "BMI = weight / height_m^2 — standard medical index",
    },
    # ── Temporal ──
    {
        "name": "duration",
        "requires": ["start_date", "end_date"],
        "operation": "date_diff",
        "confidence": 99,
        "rationale": "Duration between start and end dates",
    },
    {
        "name": "age_from_birth",
        "requires": ["birth_date"],
        "operation": "age_from_birth",
        "confidence": 98,
        "rationale": "Calculate age from birth date",
    },
    # ── Geographic (two-point) ──
    {
        "name": "geo_trip_distance",
        "requires": ["lat_origin", "lon_origin", "lat_dest", "lon_dest"],
        "operation": "haversine_trip",
        "confidence": 95,
        "rationale": "Haversine distance between origin and destination",
    },
    {
        "name": "geo_manhattan_distance",
        "requires": ["lat_origin", "lon_origin", "lat_dest", "lon_dest"],
        "operation": "manhattan_geo",
        "confidence": 90,
        "rationale": "Manhattan (grid) distance — better for city street networks",
    },
    {
        "name": "geo_bearing",
        "requires": ["lat_origin", "lon_origin", "lat_dest", "lon_dest"],
        "operation": "bearing",
        "confidence": 95,
        "rationale": "Haversine distance between origin and destination",
    },
    # ── Geographic (single point — centroid distance) ──
    {
        "name": "geo_centroid",
        "requires": ["lat_single", "lon_single"],
        "operation": "geo_centroid",
        "confidence": 70,
        "rationale": "Distance from centroid (single lat/lon pair)",
    },
    # ── Financial ──
    {
        "name": "revenue",
        "requires": ["price", "quantity"],
        "operation": "product",
        "confidence": 98,
        "rationale": "Revenue = price * quantity",
    },
    {
        "name": "profit",
        "requires": ["revenue", "cost"],
        "operation": "difference",
        "confidence": 95,
        "rationale": "Profit = revenue - cost",
    },
    {
        "name": "debt_to_income",
        "requires": ["debt", "income"],
        "operation": "ratio",
        "confidence": 92,
        "rationale": "Debt-to-income ratio — key financial health indicator",
    },
    {
        "name": "income_per_family",
        "requires": ["income", "family_size"],
        "operation": "ratio",
        "confidence": 88,
        "rationale": "Income per family member — economic wellbeing proxy",
    },
    # ── Occupancy ──
    {
        "name": "rooms_per_person",
        "requires": ["rooms", "people"],
        "operation": "ratio",
        "confidence": 85,
        "rationale": "Rooms per person — occupancy density",
    },
    # ── Weak (optional) ──
    {
        "name": "income_per_age",
        "requires": ["income", "age"],
        "operation": "ratio",
        "confidence": 55,
        "rationale": "Income per year of age — weak economic proxy",
    },
]


def _match_semantic(col_name: str, col_dtype: str) -> str | None:
    """Match a column name to a semantic concept using aliases."""
    lower = col_name.lower().strip()
    for concept, info in SEMANTIC_ALIASES.items():
        if info["dtype"] != "any" and info["dtype"] != col_dtype:
            continue
        for alias in info["aliases"]:
            if lower == alias or lower.replace(" ", "_") == alias:
                return concept
    for concept, info in SEMANTIC_ALIASES.items():
        if info["dtype"] != "any" and info["dtype"] != col_dtype:
            continue
        for alias in info["aliases"]:
            if alias in lower or lower in alias:
                return concept
    return None


class SemanticTemplateMatcher:
    """Matches column profiles against template definitions using semantic aliases."""

    def __init__(self, profiles: list[dict]):
        self.profiles = profiles
        self.col_map: dict[str, str] = {}
        self._build_map()

    def _build_map(self):
        for p in self.profiles:
            concept = _match_semantic(p["name"], p["dtype"])
            if concept:
                self.col_map[concept] = p["name"]
                log.info("SEMANTIC: column '%s' matched concept '%s'", p["name"], concept)

    def detect_templates(self) -> list[dict]:
        detected = []
        for tdef in TEMPLATE_DEFINITIONS:
            required = tdef["requires"]
            resolved = {}
            all_found = True
            for concept in required:
                if concept in self.col_map:
                    resolved[concept] = self.col_map[concept]
                else:
                    all_found = False
                    break
            if all_found:
                actual_cols = [resolved[c] for c in required]
                template = {
                    "pattern_name": tdef["name"],
                    "columns": actual_cols,
                    "column_concepts": dict(resolved),
                    "operation": tdef["operation"],
                    "confidence": tdef["confidence"],
                    "rationale": tdef["rationale"],
                }
                log.info("TEMPLATE [%s] confidence=%d%% columns=%s",
                         tdef["name"], tdef["confidence"], actual_cols)
                detected.append(template)
        return detected


# ── run_feature_extraction ──────────────────────────────────────

def run_feature_extraction(profiles: list[dict], correlations: list[dict],
                           dataset_meta: dict | None = None) -> tuple[list[dict], list[dict]]:
    """Run the feature engine and return (transform_plans, templates)."""
    engine = FeatureEngine()
    engine.reset()

    if dataset_meta:
        engine.declare(DatasetMeta(**dataset_meta))
    else:
        engine.declare(DatasetMeta(row_count=9999, col_count=0, task_type=None))

    for p in profiles:
        if p["dtype"] == "text":
            engine.declare(TextProfile(**p))
        else:
            engine.declare(ColumnProfile(**p))

    for c in correlations:
        engine.declare(CorrelationFact(**c))

    engine.run()

    plans = []
    for fact in engine.facts.values():
        if isinstance(fact, TransformPlan):
            plans.append({k: v for k, v in fact.items() if k != "__factid__"})

    matcher = SemanticTemplateMatcher(profiles)
    templates = matcher.detect_templates()

    log.info("Feature extraction: %d plans, %d templates detected", len(plans), len(templates))
    return plans, templates

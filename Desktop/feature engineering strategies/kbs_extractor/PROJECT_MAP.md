# PROJECT_MAP — KBS Feature Extractor

## [TECH_STACK]

| Component        | Technology       | Version  | Role                              |
|------------------|------------------|----------|-----------------------------------|
| Runtime          | Python           | 3.11.9   | Language                          |
| Rule Engine      | experta          | 1.9.4    | Production rules (Rete algorithm) |
| Knowledge Graph  | networkx         | 3.6.1    | Graph-based data representation   |
| Data Processing  | pandas           | 2.3.3    | Tabular data manipulation         |
| Numerical        | numpy            | 2.3.5    | Array operations & stats          |
| Statistics       | scipy            | 1.16.3   | Statistical tests & distributions |
| ML Transforms    | scikit-learn     | 1.8.0    | Encoders, scalers, transformers   |
| Text Processing  | nltk             | 3.9.4    | Tokenization, stopwords, NLP      |
| Logging          | stdlib logging   | builtin  | QueueHandler (async, non-blocking)|

## [SYSTEM_FLOW]

```
CSV/DataFrame
    │
    ├─► [profiler.py] ──► Column statistics + text analysis
    │                         │
    ▼                         ▼
[graph.py] ◄──── Profile nodes + correlation edges
    │
    │   ┌─────────────────── QUALITY METHODOLOGIES ───────────────────┐
    │   │  MQ1: Missing Value Analysis                                │
    │   │  MQ2: Outlier Detection (IQR + Z-score)                    │
    │   │  MQ3: Consistency & Type Checking                          │
    │   │  MQ4: Duplicate & Near-Duplicate Detection                 │
    │   └─────────────────────────────────────────────────────────────┘
    ├─► [quality_engine.py] ──► QualityIssue + FixSuggestion facts
    │                              │
    │                              ▼
    │                         Suggestions Report (JSON/stdout)
    │
    │   ┌─────────────────── DISCOVERY METHODOLOGIES ─────────────────┐
    │   │  MD1: Statistical Distribution Analysis                     │
    │   │  MD2: Correlation & Dependency Analysis                     │
    │   │  MD3: Information-Theoretic Analysis                        │
    │   │  MD4: Cardinality Analysis                                  │
    │   │  MD5: Temporal Pattern Recognition                          │
    │   │  MD6: Text Structure Analysis                               │
    │   └─────────────────────────────────────────────────────────────┘
    │               │
    │               ▼
    │   ┌─────────────────── ENGINEERING METHODOLOGIES ───────────────┐
    │   │  ME1: Mathematical Transforms (log, power, box-cox)         │
    │   │  ME2: Scaling & Normalization                               │
    │   │  ME3: Encoding Strategies (one-hot, ordinal, target)        │
    │   │  ME4: Feature Interaction Generation                        │
    │   │  ME5: Temporal Decomposition                                │
    │   │  ME6: Text Vectorization (BoW, TF-IDF)                     │
    │   │  ME7: Binning & Discretization                              │
    │   └─────────────────────────────────────────────────────────────┘
    │
    ├─► [feature_engine.py] ──► TransformPlan facts
    │                              │
    │                              ▼
    └─► [pipeline.py] ──► Applies transforms ──► Feature DataFrame + metadata
```

## [METHODOLOGIES]

كل منهجية هي **مجموعة قواعد Experta** تعمل على عقد Knowledge Graph.
المبدأ: المنهجية تُقرر **ماذا نفعل**، ثم `pipeline.py` يُنفذ فعلياً.

```
  ┌──────────────┐      ┌───────────────┐      ┌──────────────┐
  │  Graph Node  │─────►│  @Rule fires  │─────►│  New Fact     │
  │  (Profile)   │      │  (Methodology)│      │  (Plan/Issue) │
  └──────────────┘      └───────────────┘      └──────┬───────┘
                                                      │
                                                      ▼
                                               ┌──────────────┐
                                               │  Graph gets   │
                                               │  new node/edge│
                                               └──────────────┘
```

---

### MQ: منهجيات تقييم الجودة (Quality Assessment)

هذه المنهجيات تعمل داخل `quality_engine.py` وتُنتج `QualityIssue` + `FixSuggestion`.

#### MQ1: تحليل القيم المفقودة (Missing Value Analysis)

```
الدخل ──► ColumnProfile(null_pct, dtype, distribution)
          │
          ▼
     ┌─────────────────────────────────────────────────┐
     │  التفكير:                                       │
     │  1. ما نسبة الفقدان؟ (<5%, 5-30%, >30%)        │
     │  2. هل الفقدان عشوائي (MCAR) أم مرتبط بعمود    │
     │     آخر (MAR) أم مرتبط بالقيمة نفسها (MNAR)؟   │
     │  3. ما نوع العمود؟ (رقمي ← وسيط، فئوي ← mode) │
     └────────────────────┬────────────────────────────┘
                          ▼
الخرج ──► QualityIssue(kind="missing", severity=...)
          FixSuggestion(action="impute_median" | "impute_mode" |
                        "create_indicator" | "drop_column")
```

**البرمجة كقواعد:**
```python
@Rule(ColumnProfile(name=MATCH.n, null_pct=P(lambda x: 0 < x <= 5), dtype="numeric"))
def low_missing_numeric(self, n):
    # فقدان قليل + رقمي → استبدال بالوسيط
    self.declare(FixSuggestion(column=n, action="impute_median"))

@Rule(ColumnProfile(name=MATCH.n, null_pct=P(lambda x: x > 30)))
def high_missing(self, n):
    # فقدان كبير → مؤشر ثنائي + حذف العمود الأصلي
    self.declare(FixSuggestion(column=n, action="create_indicator_and_drop"))
```

---

#### MQ2: كشف القيم الشاذة (Outlier Detection)

```
الدخل ──► ColumnProfile(name, dtype="numeric", mean, std, q1, q3, min, max)
          │
          ▼
     ┌─────────────────────────────────────────────────┐
     │  التفكير:                                       │
     │  1. حساب IQR = Q3 - Q1                         │
     │  2. الحدود: [Q1 - 1.5*IQR, Q3 + 1.5*IQR]      │
     │  3. كم نسبة القيم خارج الحدود؟                 │
     │  4. Z-score: كم قيمة |z| > 3 ؟                 │
     │  5. القرار بناءً على النسبة:                    │
     │     - <1% → حذف الصفوف                         │
     │     - 1-5% → قص (clip/winsorize)                │
     │     - >5% → ربما ليست شاذة، احتفظ بها          │
     └────────────────────┬────────────────────────────┘
                          ▼
الخرج ──► QualityIssue(kind="outlier", severity=..., outlier_pct=...)
          FixSuggestion(action="clip" | "winsorize" | "remove_rows" | "keep")
```

**البرمجة كقواعد:**
```python
@Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                    outlier_pct=P(lambda x: 0 < x <= 1)))
def few_outliers(self, n):
    self.declare(FixSuggestion(column=n, action="remove_rows",
                               rationale="<1% outliers, safe to drop rows"))

@Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                    outlier_pct=P(lambda x: 1 < x <= 5)))
def moderate_outliers(self, n):
    self.declare(FixSuggestion(column=n, action="winsorize",
                               rationale="1-5% outliers, clip to bounds"))
```

---

#### MQ3: فحص الاتساق والأنواع (Consistency & Type Checking)

```
الدخل ──► ColumnProfile(name, dtype, unique_values_sample, pattern_detected)
          │
          ▼
     ┌─────────────────────────────────────────────────┐
     │  التفكير:                                       │
     │  1. هل dtype المُكتشف يطابق المحتوى الفعلي؟   │
     │     (مثلاً: عمود "age" مخزن كـ string)         │
     │  2. هل توجد قيم مختلطة الأنواع في نفس العمود؟  │
     │  3. هل توجد أنماط متضاربة؟                     │
     │     (مثلاً: "2024-01-01" و "Jan 1, 2024")      │
     │  4. هل القيم ضمن نطاق منطقي؟                   │
     │     (مثلاً: عمر سالب، نسبة > 100%)             │
     └────────────────────┬────────────────────────────┘
                          ▼
الخرج ──► QualityIssue(kind="type_mismatch" | "inconsistent_format" |
                        "out_of_range")
          FixSuggestion(action="cast_to_numeric" | "standardize_format" |
                        "flag_invalid_rows")
```

---

#### MQ4: كشف التكرار (Duplicate & Near-Duplicate Detection)

```
الدخل ──► DatasetMeta(row_count), ColumnProfile(all columns)
          │
          ▼
     ┌─────────────────────────────────────────────────┐
     │  التفكير:                                       │
     │  1. هل توجد صفوف مكررة بالكامل؟                │
     │  2. هل يوجد عمود unique_ratio = 1.0 (مرشح ID)؟ │
     │  3. هل يوجد عمود فيه قيمة واحدة فقط (ثابت)؟   │
     │     → عمود ثابت لا يضيف معلومة = حذفه          │
     │  4. هل عمودان متطابقان تماماً (محتوى مكرر)؟    │
     └────────────────────┬────────────────────────────┘
                          ▼
الخرج ──► QualityIssue(kind="duplicate_rows" | "constant_column" |
                        "duplicate_columns")
          FixSuggestion(action="drop_duplicates" | "drop_constant" |
                        "drop_duplicate_col")
```

---

### MD: منهجيات اكتشاف الميزات (Feature Discovery)

هذه المنهجيات تعمل **بعد** تقييم الجودة. تفحص البيانات لتقرر **أي تحويلات مناسبة**.
تعمل داخل `feature_engine.py` وتُنتج `TransformPlan`.

#### MD1: تحليل التوزيع الإحصائي (Statistical Distribution Analysis)

```
الدخل ──► ColumnProfile(dtype="numeric", mean, std, skewness, kurtosis,
                         min, max, distribution_shape)
          │
          ▼
     ┌─────────────────────────────────────────────────────────┐
     │  التفكير:                                               │
     │                                                         │
     │  ┌─ skewness ────────────────────────────────────────┐  │
     │  │  |skew| < 0.5  → توزيع متماثل ≈ طبيعي           │  │
     │  │                  → StandardScaler كافٍ            │  │
     │  │  0.5 < |skew| < 2 → التواء معتدل                 │  │
     │  │                     → sqrt_transform ثم scale     │  │
     │  │  |skew| > 2  → التواء شديد                        │  │
     │  │               → log1p_transform ثم scale          │  │
     │  └───────────────────────────────────────────────────┘  │
     │                                                         │
     │  ┌─ kurtosis ────────────────────────────────────────┐  │
     │  │  kurtosis > 7 → ذيول ثقيلة                       │  │
     │  │               → RobustScaler بدل Standard         │  │
     │  │  kurtosis < 1 → توزيع مسطح                       │  │
     │  │               → قد يستفيد من binning              │  │
     │  └───────────────────────────────────────────────────┘  │
     │                                                         │
     │  ┌─ range ───────────────────────────────────────────┐  │
     │  │  min >= 0 AND skewed → log1p آمن                  │  │
     │  │  min < 0 AND skewed  → box-cox غير ممكن          │  │
     │  │                      → yeo-johnson بدلاً منه      │  │
     │  └───────────────────────────────────────────────────┘  │
     └────────────────────────┬────────────────────────────────┘
                              ▼
الخرج ──► TransformPlan(source=col, operation="log1p" | "sqrt" | "boxcox" |
                         "yeo_johnson" | "robust_scale" | "standard_scale",
                         rationale="skewness=3.2, applying log1p")
```

**البرمجة كقواعد:**
```python
@Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                    skewness=P(lambda s: abs(s) > 2),
                    min_val=P(lambda m: m >= 0)))
def high_skew_positive(self, n):
    self.declare(TransformPlan(source=n, operation="log1p",
                               rationale="High positive skew, min>=0"))

@Rule(ColumnProfile(name=MATCH.n, dtype="numeric",
                    kurtosis=P(lambda k: k > 7)))
def heavy_tails(self, n):
    self.declare(TransformPlan(source=n, operation="robust_scale",
                               rationale="Heavy tails, kurtosis>7"))
```

---

#### MD2: تحليل الارتباط والتبعية (Correlation & Dependency Analysis)

```
الدخل ──► Graph edges: column ──correlates(weight=r)──► column
          ColumnProfile(name_a, name_b, dtype="numeric")
          │
          ▼
     ┌─────────────────────────────────────────────────────────┐
     │  التفكير:                                               │
     │                                                         │
     │  ┌─ Pearson correlation r ───────────────────────────┐  │
     │  │  |r| > 0.95 → تكرار شبه تام                      │  │
     │  │             → حذف أحدهما (الأقل أهمية)            │  │
     │  │  0.7 < |r| < 0.95 → ارتباط قوي                   │  │
     │  │                    → إنشاء ratio = A/B            │  │
     │  │                    → أو difference = A - B         │  │
     │  │  0.3 < |r| < 0.7 → ارتباط معتدل                  │  │
     │  │                   → إنشاء product = A * B          │  │
     │  │  |r| < 0.3 → مستقلان تقريباً                      │  │
     │  │            → لا تفاعل مطلوب                        │  │
     │  └───────────────────────────────────────────────────┘  │
     │                                                         │
     │  ┌─ Multicollinearity check ─────────────────────────┐  │
     │  │  VIF > 10 لعمود → يجب حذفه أو دمجه مع المرتبطين │  │
     │  │  الأولوية: حذف العمود ذو أقل ارتباط بالـ target   │  │
     │  └───────────────────────────────────────────────────┘  │
     └────────────────────────┬────────────────────────────────┘
                              ▼
الخرج ──► TransformPlan(operation="create_ratio" | "create_difference" |
                         "create_product" | "drop_redundant",
                         source=[col_a, col_b], rationale="r=0.82")
```

**البرمجة كقواعد:**
```python
@Rule(ColumnProfile(name=MATCH.a, dtype="numeric"),
      ColumnProfile(name=MATCH.b, dtype="numeric"),
      TEST(lambda a, b: a < b),  # تجنب التكرار
      CorrelationFact(col_a=MATCH.a, col_b=MATCH.b,
                      pearson=P(lambda r: 0.7 < abs(r) < 0.95)))
def strong_correlation(self, a, b):
    self.declare(TransformPlan(source=[a, b], operation="create_ratio",
                               rationale=f"Strong correlation between {a} and {b}"))
```

---

#### MD3: التحليل المعلوماتي (Information-Theoretic Analysis)

```
الدخل ──► ColumnProfile(name, dtype), TargetColumn(name, dtype)
          │
          ▼
     ┌─────────────────────────────────────────────────────────┐
     │  التفكير:                                               │
     │                                                         │
     │  1. حساب Mutual Information بين كل عمود والـ target    │
     │     MI(X, Y) = ΣΣ p(x,y) * log(p(x,y) / p(x)*p(y))   │
     │                                                         │
     │  2. حساب Entropy لكل عمود فئوي:                        │
     │     H(X) = -Σ p(x) * log(p(x))                         │
     │                                                         │
     │  ┌─ MI score ────────────────────────────────────────┐  │
     │  │  MI ≈ 0 → العمود لا يحمل معلومة عن الـ target    │  │
     │  │        → مرشح للحذف                               │  │
     │  │  MI عالي → عمود مهم                               │  │
     │  │         → أولوية في الهندسة                        │  │
     │  └───────────────────────────────────────────────────┘  │
     │                                                         │
     │  ┌─ Entropy ─────────────────────────────────────────┐  │
     │  │  H ≈ 0 → عمود ثابت تقريباً → حذف                │  │
     │  │  H عالية جداً (≈ log(n)) → كل قيمة فريدة → حذف   │  │
     │  │  H متوسطة → عمود يحمل معلومة → احتفظ             │  │
     │  └───────────────────────────────────────────────────┘  │
     └────────────────────────┬────────────────────────────────┘
                              ▼
الخرج ──► TransformPlan(operation="keep_high_mi" | "drop_zero_mi" |
                         "prioritize_engineering",
                         mi_score=..., entropy=...)
```

**البرمجة كقواعد:**
```python
@Rule(ColumnProfile(name=MATCH.n, mi_score=P(lambda mi: mi < 0.01)))
def zero_information(self, n):
    self.declare(TransformPlan(source=n, operation="drop",
                               rationale="Near-zero mutual information with target"))

@Rule(ColumnProfile(name=MATCH.n, mi_score=P(lambda mi: mi > 0.5),
                    dtype="categorical"))
def high_info_categorical(self, n):
    self.declare(TransformPlan(source=n, operation="target_encode",
                               rationale="High MI categorical, target encoding preserves info"))
```

---

#### MD4: تحليل الكاردنالية (Cardinality Analysis)

```
الدخل ──► ColumnProfile(name, dtype="categorical", cardinality, unique_ratio,
                         top_freq, is_ordinal)
          │
          ▼
     ┌─────────────────────────────────────────────────────────┐
     │  التفكير (شجرة قرار):                                   │
     │                                                         │
     │  dtype == "categorical"?                                │
     │  ├── YES                                                │
     │  │   ├── is_ordinal == True?                            │
     │  │   │   └── YES → OrdinalEncoder (ترتيب معروف)        │
     │  │   │                                                  │
     │  │   ├── cardinality <= 2?                              │
     │  │   │   └── YES → BinaryEncoder (0/1)                 │
     │  │   │                                                  │
     │  │   ├── cardinality 3-10?                              │
     │  │   │   └── YES → OneHotEncoder                       │
     │  │   │                                                  │
     │  │   ├── cardinality 11-50?                             │
     │  │   │   └── YES → FrequencyEncoder أو TargetEncoder   │
     │  │   │                                                  │
     │  │   └── cardinality > 50?                              │
     │  │       └── YES → TargetEncoder أو HashingEncoder     │
     │  │                                                      │
     │  └── NO (numeric stored as string?)                     │
     │      └── cast_to_numeric أولاً                          │
     └────────────────────────┬────────────────────────────────┘
                              ▼
الخرج ──► TransformPlan(operation="one_hot" | "ordinal" | "binary" |
                         "target_encode" | "frequency_encode" | "hash",
                         cardinality=..., rationale="...")
```

---

#### MD5: التعرف على الأنماط الزمنية (Temporal Pattern Recognition)

```
الدخل ──► ColumnProfile(name, dtype="datetime", min_date, max_date, granularity)
          │
          ▼
     ┌─────────────────────────────────────────────────────────┐
     │  التفكير:                                               │
     │                                                         │
     │  1. ما دقة الزمن؟ (سنة / شهر / يوم / ساعة / دقيقة)   │
     │     → يحدد أي مكونات نستخرج                            │
     │                                                         │
     │  2. هل يوجد عمود زمني آخر؟                             │
     │     → YES: حساب الفرق بينهما (duration)                │
     │                                                         │
     │  3. استخراج المكونات:                                   │
     │     ┌─────────────────────────────────────────────┐     │
     │     │ year, month, day, day_of_week, day_of_year  │     │
     │     │ quarter, is_weekend, is_month_start         │     │
     │     │ hour, minute (إذا الدقة ≤ ساعة)            │     │
     │     └─────────────────────────────────────────────┘     │
     │                                                         │
     │  4. ترميز دوري (Cyclical Encoding):                    │
     │     month → sin(2π*m/12), cos(2π*m/12)                  │
     │     day_of_week → sin(2π*d/7), cos(2π*d/7)             │
     │     → يحافظ على العلاقة: ديسمبر قريب من يناير          │
     └────────────────────────┬────────────────────────────────┘
                              ▼
الخرج ──► TransformPlan(operation="extract_datetime_components" |
                         "compute_duration" | "cyclical_encode",
                         components=[...], rationale="...")
```

---

#### MD6: تحليل بنية النصوص (Text Structure Analysis)

```
الدخل ──► TextProfile(name, avg_word_count, vocab_size, avg_sentence_length,
                       has_urls, has_emails, has_numbers, has_special_patterns,
                       language, encoding)
          │
          ▼
     ┌─────────────────────────────────────────────────────────┐
     │  التفكير:                                               │
     │                                                         │
     │  1. هل النص قصير (< 20 كلمة) أم طويل؟                 │
     │     قصير → مرشح للترميز المباشر (BoW/TF-IDF)          │
     │     طويل → يحتاج تقسيم أو تلخيص أولاً                 │
     │                                                         │
     │  2. هل يحتوي أنماط منظمة (structured patterns)؟        │
     │     URLs → extract_url_count, has_url flag              │
     │     Emails → extract_email_domain                       │
     │     Numbers → extract_numeric_mentions                  │
     │     Dates → extract_date_mentions                       │
     │                                                         │
     │  3. ما حجم المفردات؟                                   │
     │     vocab_size < 500 → CountVectorizer كافٍ            │
     │     500-5000 → TF-IDF مع n-grams                       │
     │     > 5000 → TF-IDF مع max_features + sublinear_tf     │
     │                                                         │
     │  4. خصائص إحصائية للنص نفسه (meta-features):           │
     │     word_count, char_count, avg_word_length             │
     │     sentence_count, uppercase_ratio, digit_ratio        │
     │     special_char_ratio, stopword_ratio                  │
     └────────────────────────┬────────────────────────────────┘
                              ▼
الخرج ──► TransformPlan(operation="tfidf" | "count_vectorize" |
                         "extract_text_stats" | "extract_patterns",
                         vocab_size=..., max_features=..., rationale="...")
```

---

### ME: منهجيات هندسة الميزات (Feature Engineering)

هذه المنهجيات تُنفّذ القرارات. تأخذ `TransformPlan` كدخل وتُنتج الأعمدة الجديدة فعلياً.
تعمل داخل `pipeline.py` عند استدعاء `apply_transforms()`.

#### ME1: التحويلات الرياضية (Mathematical Transforms)

```
الدخل ──► TransformPlan(operation ∈ {"log1p","sqrt","boxcox","yeo_johnson"})
          + العمود الأصلي من DataFrame
          │
          ▼
     ┌────────────────────────────────────────────────────┐
     │  التنفيذ:                                          │
     │  "log1p"       → np.log1p(col)                     │
     │  "sqrt"        → np.sqrt(col)  # يتطلب col >= 0   │
     │  "boxcox"      → scipy.stats.boxcox(col)           │
     │  "yeo_johnson" → PowerTransformer(method="yj")     │
     └─────────────────────┬──────────────────────────────┘
                           ▼
الخرج ──► عمود جديد: "{col_name}_log" | "{col_name}_sqrt" | ...
```

#### ME2: التطبيع والتوحيد (Scaling & Normalization)

```
الدخل ──► TransformPlan(operation ∈ {"standard_scale","minmax","robust_scale"})
          │
          ▼
     ┌────────────────────────────────────────────────────┐
     │  التنفيذ:                                          │
     │  "standard_scale" → StandardScaler()                │
     │                     (z = (x-μ)/σ)                   │
     │  "minmax"         → MinMaxScaler()                  │
     │                     (x' = (x-min)/(max-min))        │
     │  "robust_scale"   → RobustScaler()                  │
     │                     (x' = (x-median)/IQR)           │
     └─────────────────────┬──────────────────────────────┘
                           ▼
الخرج ──► عمود موحّد: "{col_name}_scaled"
```

#### ME3: استراتيجيات الترميز (Encoding Strategies)

```
الدخل ──► TransformPlan(operation ∈ {"one_hot","ordinal","binary",
                                     "target_encode","frequency_encode"})
          │
          ▼
     ┌────────────────────────────────────────────────────┐
     │  التنفيذ:                                          │
     │  "one_hot"          → pd.get_dummies() أو          │
     │                       OneHotEncoder(sparse=False)   │
     │  "ordinal"          → OrdinalEncoder(categories=..) │
     │  "binary"           → LabelEncoder() (0/1)         │
     │  "target_encode"    → TargetEncoder()               │
     │  "frequency_encode" → col.map(col.value_counts()/n) │
     └─────────────────────┬──────────────────────────────┘
                           ▼
الخرج ──► أعمدة مرمزة: "{col_name}_encoded" أو أعمدة متعددة (one-hot)
```

#### ME4: توليد ميزات التفاعل (Feature Interaction Generation)

```
الدخل ──► TransformPlan(operation ∈ {"create_ratio","create_difference",
                                     "create_product","group_stats"},
                         source=[col_a, col_b])
          │
          ▼
     ┌────────────────────────────────────────────────────┐
     │  التنفيذ:                                          │
     │  "create_ratio"      → col_a / col_b               │
     │  "create_difference"  → col_a - col_b               │
     │  "create_product"    → col_a * col_b               │
     │  "group_stats"       → groupby(cat_col).agg(       │
     │                         {num_col: [mean,std,min,max]│
     │                        )                            │
     └─────────────────────┬──────────────────────────────┘
                           ▼
الخرج ──► عمود جديد: "{a}_div_{b}" | "{a}_minus_{b}" | "{a}_times_{b}"
          أو أعمدة grouped: "{cat}_{num}_mean", "{cat}_{num}_std"
```

#### ME5: تفكيك الأعمدة الزمنية (Temporal Decomposition)

```
الدخل ──► TransformPlan(operation="extract_datetime_components",
                         components=["year","month","day_of_week",...])
          │
          ▼
     ┌────────────────────────────────────────────────────┐
     │  التنفيذ:                                          │
     │  dt.year, dt.month, dt.day, dt.dayofweek           │
     │  dt.quarter, dt.hour, dt.minute                    │
     │  is_weekend = dayofweek >= 5                        │
     │                                                    │
     │  Cyclical (إذا مطلوب):                             │
     │  sin_month = sin(2π * month / 12)                   │
     │  cos_month = cos(2π * month / 12)                   │
     └─────────────────────┬──────────────────────────────┘
                           ▼
الخرج ──► أعمدة: "{col}_year", "{col}_month", "{col}_day_of_week",
          "{col}_is_weekend", "{col}_sin_month", "{col}_cos_month"
```

#### ME6: تحويل النصوص لأرقام (Text Vectorization)

```
الدخل ──► TransformPlan(operation ∈ {"count_vectorize","tfidf",
                                     "extract_text_stats","extract_patterns"})
          │
          ▼
     ┌────────────────────────────────────────────────────┐
     │  التنفيذ:                                          │
     │  "count_vectorize"                                  │
     │    → CountVectorizer(max_features=N)                │
     │    → sparse matrix → أعمدة: word_0, word_1, ...    │
     │                                                    │
     │  "tfidf"                                            │
     │    → TfidfVectorizer(max_features=N,                │
     │        sublinear_tf=True, ngram_range=(1,2))        │
     │    → أعمدة: tfidf_0, tfidf_1, ...                  │
     │                                                    │
     │  "extract_text_stats"                               │
     │    → word_count, char_count, avg_word_len           │
     │      sentence_count, uppercase_ratio                │
     │                                                    │
     │  "extract_patterns"                                 │
     │    → url_count, email_count, number_count           │
     │      has_url (binary), has_email (binary)           │
     └─────────────────────┬──────────────────────────────┘
                           ▼
الخرج ──► أعمدة نصية رقمية جاهزة للنموذج
```

#### ME7: التقطيع والتصنيف (Binning & Discretization)

```
الدخل ──► TransformPlan(operation ∈ {"equal_width_bin","quantile_bin",
                                     "kmeans_bin"}, n_bins=...)
          │
          ▼
     ┌────────────────────────────────────────────────────┐
     │  التنفيذ:                                          │
     │  "equal_width_bin"                                  │
     │    → pd.cut(col, bins=n)                            │
     │                                                    │
     │  "quantile_bin"                                     │
     │    → pd.qcut(col, q=n)                              │
     │                                                    │
     │  "kmeans_bin"                                       │
     │    → KBinsDiscretizer(strategy="kmeans", n_bins=n)  │
     └─────────────────────┬──────────────────────────────┘
                           ▼
الخرج ──► عمود: "{col_name}_binned" (categorical/ordinal)
```

---

### مخطط تدفق المنهجيات الكامل

```
                         CSV / DataFrame
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
             ┌───────────┐       ┌───────────┐
             │  Tabular  │       │   Text    │
             │  Profiler │       │  Profiler │
             └─────┬─────┘       └─────┬─────┘
                   │                   │
                   └────────┬──────────┘
                            ▼
                   ┌─────────────────┐
                   │ Knowledge Graph │ ◄── عقد: profiles + حواف: correlations
                   └────────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         ┌─────────┐  ┌─────────┐  ┌──────────┐
         │   MQ1   │  │   MQ2   │  │  MQ3/4   │
         │ Missing │  │ Outlier │  │ Consist. │
         └────┬────┘  └────┬────┘  └────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           ▼
                  ┌─────────────────┐
                  │ Quality Report  │ ──► اقتراحات إصلاح للمستخدم
                  └────────┬────────┘
                           │
         ┌────────┬────────┼────────┬────────┬────────┐
         ▼        ▼        ▼        ▼        ▼        ▼
      ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
      │ MD1  ││ MD2  ││ MD3  ││ MD4  ││ MD5  ││ MD6  │
      │Stats ││Corr. ││Info  ││Card. ││Temp. ││Text  │
      └──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘
         │       │       │       │       │       │
         └───────┴───────┴───┬───┴───────┴───────┘
                             ▼
                    ┌─────────────────┐
                    │ TransformPlans  │ (قائمة التحويلات المقررة)
                    └────────┬────────┘
                             │
       ┌──────┬──────┬───────┼───────┬──────┬──────┐
       ▼      ▼      ▼      ▼       ▼      ▼      ▼
    ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐
    │ ME1 ││ ME2 ││ ME3 ││ ME4 ││ ME5 ││ ME6 ││ ME7 │
    │Math ││Scale││Encod││Inter││Temp ││Text ││ Bin │
    └──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘
       │      │      │      │      │      │      │
       └──────┴──────┴──────┼──────┴──────┴──────┘
                            ▼
                   ┌─────────────────┐
                   │ Feature Matrix  │ ──► DataFrame جاهز لبناء نموذج ML
                   │   + Metadata    │ ──► سجل: أي منهجية أنتجت أي عمود
                   └─────────────────┘
```

## [ARCHITECTURE]

```
kbs_extractor/
├── __init__.py            # Public API
├── __main__.py            # CLI entry: python -m kbs_extractor
├── cli.py                 # argparse interface
├── graph.py               # Knowledge Graph (NetworkX DiGraph)
├── facts.py               # All Fact subclasses
├── profiler.py            # Data profiling (tabular + text)
├── quality_engine.py      # KnowledgeEngine: data quality rules
├── feature_engine.py      # KnowledgeEngine: feature extraction rules
├── pipeline.py            # Orchestrator
└── logger.py              # Async logging (QueueHandler)
```

### Module Dependency Graph

```
cli.py ──► pipeline.py ──► quality_engine.py ──► facts.py
                │          feature_engine.py ──► facts.py
                │                │
                ├──► profiler.py ──► graph.py
                │                     │
                └─────────────────────┘
                          │
                     logger.py (used by all)
```

### Knowledge Graph Node Types

- `dataset`      : root node, dataset metadata
- `column`       : numeric/categorical column profile
- `text_column`  : text column profile with NLP stats
- `issue`        : detected quality problem
- `feature_plan` : planned transformation

### Knowledge Graph Edge Types

- `has_column`   : dataset → column
- `correlates`   : column → column (weighted)
- `has_issue`    : column → issue
- `planned_as`   : column → feature_plan

## [MILESTONES]

| #  | Milestone                  | Verifiable Goal                                         | Status    |
|----|----------------------------|---------------------------------------------------------|-----------|
| M1 | Project skeleton           | `pip install -e .` + `python -m kbs_extractor --help`   | DONE      |
| M2 | Profiler + Knowledge Graph | CSV → NetworkX graph with correct column profile nodes  | DONE      |
| M3 | Quality Engine             | Dataset with known issues → report lists all issues     | DONE      |
| M4 | Feature Engine (numeric)   | Numeric columns → appropriate transforms selected       | DONE      |
| M5 | Feature Engine (cat+text)  | Categorical + text columns → correct encoding/features  | DONE      |
| M6 | Pipeline integration       | End-to-end: CSV in → feature DataFrame + report out     | DONE      |
| M7 | CLI polish + verification  | All modes work, error handling, metadata output          | DONE      |

## [SMART FEATURES — v1.1]

| Feature | Status | Location |
|---------|--------|----------|
| Auto-detect hidden categoricals | DONE | profiler.py `_is_hidden_categorical()` |
| Data Leakage detection (MQ5) | DONE | quality_engine.py (correlation + deterministic) |
| Meta-Rules (gate interactions) | DONE | feature_engine.py `_AllowInteractions` / `_AllowPolynomial` |
| Guided Feature Engineering | DONE | pipeline.py `_guided_interaction_filter()` |
| Knowledge Templates | DONE | feature_engine.py MD7 (BMI, duration, geo, revenue, income/age) |
| Pygame GUI | DONE | gui.py (3 screens: setup, running, results) |

## [ORPHANS & PENDING]

- [ ] Auto-apply quality fixes (v1 = suggestions only, user applies manually)
- [ ] Self-evaluation with cross-validated feature importance (L2 — future)
- [ ] Graph visualization export (e.g., GraphML) — PENDING decision

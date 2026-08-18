# ASEF — إطار هندسة الميزات المعمم
## Automated Smart Expert Framework

> المشروع لا يُعدّل البيانات — يقترح الإصلاحات + يستخرج الميزات + يُقيّم النتائج.

---

## المرحلة 0: السؤال الأول (قبل أي كود)

```
"لو إنسان خبير يتخذ هذا القرار — ماذا سينظر إليه؟"

┌─────────────────────────────────────────────────┐
│  1. ماذا نتنبأ؟         (target)               │
│  2. متى نتنبأ؟        (ما المتاح لحظة التنبؤ) │
│  3. ما المقياس؟         (accuracy / RMSE / F1) │
│  4. ما القرار بعد التنبؤ؟ (إجراء عملي)        │
└─────────────────────────────────────────────────┘

⚠ أي ميزة لا تكون متاحة لحظة التنبؤ = تسريب بيانات
```

### ما يفعله نظامنا:
- [x] تحديد target واستبعاده
- [x] كشف تسريب (correlation > 0.95 / determines_target)
- [ ] **مفقود: سؤال "هل هذا متاح وقت التنبؤ؟"** ← يحتاج وعي بترتيب الأحداث

### القرار:
نظامنا لا يعرف ترتيب الأحداث الزمني — وهذا مقبول. يكفي أن يكشف التسريب الإحصائي (correlation + deterministic).

---

## المرحلة 1: تصنيف الأعمدة بالدور

```
كل عمود يقع في دور واحد:

  يُحذف                             │ ID, unique_ratio ≈ 1.0
  TARGET                            │ العمود المستهدف — يُستبعد
  مقياس      │  أرقام مستمرة (سعر، عمر، مسافة)
  بُعد       │         فئات (مدينة، نوع، حالة)
  زمن        │                      تاريخ / وقت
  مكان       │                         إحداثيات
  نص         │                         نصوص حرة
```

### ما يفعله نظامنا:
- [x] كشف ID تلقائي (unique_ratio = 1.0)
- [x] كشف الفئويات المخفية (nunique ≤ min(10, √n) + أعداد صحيحة)
- [x] كشف binary (0,1) تلقائي
- [x] كشف datetime
- [x] كشف text (avg_words > 5)
- [x] Semantic matching للإحداثيات (lat/lon aliases)
- [x] استبعاد target

### الحالة: ✅ مكتمل.

---

## المرحلة 2: الأسئلة الثلاثة لكل عمود

> كل عمود يُسأل 3 أسئلة — هذه الأسئلة تُولّد كل الميزات الممكنة.

### س1: ما القيمة نفسها؟ (تحويلات مباشرة)

#### المقاييس (Numeric):
| الشرط | العملية | الحالة |
|-------|---------|--------|
| \|skew\| > 2, min ≥ 0 | log1p | ✅ |
| 0.5 < \|skew\| ≤ 2, min ≥ 0 | sqrt | ✅ |
| \|skew\| ≤ 0.5 | standard_scale | ✅ |
| skew + min < 0 | yeo_johnson | ✅ |
| kurtosis > 7 | robust_scale | ✅ |
| kurtosis < -1 | quantile_bin | ✅ |

#### الأبعاد (Categorical):
| الشرط | العملية | الحالة |
|-------|---------|--------|
| cardinality = 2 | binary (0/1) | ✅ |
| cardinality 3-10 | one_hot | ✅ |
| cardinality 11-50 | frequency_encode | ✅ |
| cardinality > 50 | target_encode | ✅ |
| ordinal | ordinal_encode | ✅ |
| boolean | bool_to_int | ✅ |

#### الزمن (Temporal):
| المكون | الحالة |
|--------|--------|
| year, month, day | ✅ |
| day_of_week, quarter | ✅ |
| is_weekend | ✅ |
| hour, minute | ✅ |
| minute_of_day (hour×60+min) | ✅ |
| is_rush_hour (7-9am, 5-7pm) | ✅ |
| sin/cos cyclical encoding | ✅ (month, day_of_week, hour) |
| sin/cos لـ hour | ✅ |

#### المكان (Spatial):
| العملية | الحالة |
|---------|--------|
| haversine (نقطتين) | ✅ |
| centroid distance (نقطة واحدة) | ✅ |
| manhattan_distance | ✅ |
| bearing (اتجاه) | ✅ |

#### النص (Text):
| العملية | الحالة |
|---------|--------|
| word_count, char_count | ✅ |
| TF-IDF / BoW | ✅ |
| has_url, has_email, has_number | ✅ |
| uppercase_ratio, digit_ratio | ✅ |

### س2: ما مقارنتها بغيرها؟ (تفاعلات)

| العملية | الحالة |
|---------|--------|
| A × B (product) | ✅ (مع Guided FE) |
| A / B (ratio) | ✅ |
| A - B (difference) | ✅ |
| A / mean(A) (انحراف نسبي) | ✅ |

الحالة: Guided FE يختبر التفاعلات ويسقط الضعيف ✅
**مشكلة:** حساب MI يعطي 0 دائماً في regression ← يحتاج إصلاح بـ F-score.

### س3: ما سياقها في المجموعة؟ (Aggregation) ← الأقوى

| العملية | الحالة |
|---------|--------|
| groupby(cat)[num].mean() | ✅ |
| groupby(cat)[num].std() | ✅ |
| groupby(cat)[num].min/max() | ❌ (مستقبلي) |
| groupby(cat)[num].count() | ❌ (مستقبلي) |
| groupby(cat)[num].rank() | ❌ (مستقبلي) |
| value - group_mean | ❌ (مستقبلي) |
| groupby([cat1,cat2])[num].mean() | ❌ (مستقبلي) |

> ✅ **الفجوة الأساسية سُدّت.** mean + std يعملان. باقي التجميعات مستقبلية.

---

## المرحلة 3: الجودة — اقتراح بدون تعديل

> النظام يقترح الإصلاحات ولا يطبقها. المستخدم يقرر.

### MQ1: القيم المفقودة
| الشرط | الاقتراح | الحالة |
|-------|---------|--------|
| null < 5% + numeric | impute_median | ✅ |
| null 5-30% + numeric | impute_median + create_indicator | ✅ |
| null > 30% | create_indicator_and_drop | ✅ |
| null + categorical | impute_mode | ✅ |
| null + text | fill_empty_string | ✅ |

### MQ2: القيم الشاذة
| الشرط | الاقتراح | الحالة |
|-------|---------|--------|
| outlier < 1% | remove_rows | ✅ |
| outlier 1-5% | winsorize | ✅ |
| outlier > 5% | keep (طبيعي) | ✅ |

### MQ3: الاتساق
| الكشف | الحالة |
|-------|--------|
| unique_ratio = 1.0 → possible ID | ✅ |
| std = 0 → constant column | ✅ |
| unique_count = 1 → single value | ✅ |
| top_freq > 95% → near constant | ✅ |

### MQ4: التكرار
| الكشف | الحالة |
|-------|--------|
| \|correlation\| > 0.95 بين عمودين | ✅ |

### MQ5: تسريب البيانات
| الكشف | الحالة |
|-------|--------|
| \|correlation with target\| > 0.95 | ✅ |
| feature uniquely determines target | ✅ |

### الحالة: ✅ مكتمل. النظام يقترح فقط ولا يعدّل.

---

## المرحلة 4: Knowledge Templates (الأنماط المجالية)

### Semantic Matching Layer:
- 15 مفهوم دلالي × 5-8 aliases لكل واحد ≈ 100 اسم مدعوم ✅
- confidence score لكل template ✅
- unit detection (BMI: cm vs m) ✅

### Templates المنفذة:
| Template | Confidence | الحالة |
|----------|-----------|--------|
| BMI (weight/height²) | 95% | ✅ |
| Duration (end - start) → days + weeks | 99% | ✅ |
| Age from birth_date | 98% | ✅ |
| Geo trip distance (haversine, 4 أعمدة) | 95% | ✅ |
| Geo centroid distance (2 أعمدة) | 70% | ✅ |
| Revenue (price × quantity) | 98% | ✅ |
| Profit (revenue - cost) | 95% | ✅ |
| Debt/Income ratio | 92% | ✅ |
| Income/Family size | 88% | ✅ |
| Rooms/Person | 85% | ✅ |
| Income/Age (ضعيف) | 55% | ✅ |

### الحالة: ✅ مكتمل.

---

## المرحلة 5: الذكاء (Meta-Rules + Guided FE)

### Meta-Rules:
| القاعدة | الحالة |
|---------|--------|
| rows < 100 → disable interactions | ✅ |
| rows < 50 → disable binning | ✅ |
| rows ≥ 100 → enable interactions | ✅ |

### Guided Feature Engineering:
| العملية | الحالة |
|---------|--------|
| توليد كل التفاعلات الممكنة | ✅ |
| حساب MI/F-score لكل تفاعل | ✅ (MI فقط) |
| الاحتفاظ بالأفضل فقط (MI > 0.01) | ✅ |
| إصلاح MI للـ regression (F-score) | ✅ |

---

## المرحلة 6: التحقق (Validation)

| القدرة | الحالة |
|--------|--------|
| مقارنة raw vs extracted بـ 5-fold CV | ✅ |
| Feature importance (RandomForest) | ✅ |
| كشف الميزات عديمة القيمة | ✅ |
| حفظ تقرير JSON | ✅ |
| **حلقة تكرار (iterate and validate)** | **❌ جولة واحدة فقط** |

---

## ملخص الفجوات — مرتب بالأولوية

### أولوية قصوى — ✅ مُنفّذة:

| # | الفجوة | الحالة |
|---|--------|--------|
| 1 | إضافة hour, minute, minute_of_day, is_rush_hour | ✅ مُنفّذ |
| 2 | إضافة Aggregation Features (groupby.agg) | ✅ مُنفّذ (mean, std) |
| 3 | إصلاح Guided FE للـ regression (F-score) | ✅ مُنفّذ |
| 4 | عدم بناء ميزات من أعمدة صُنّفت للحذف | ✅ مُنفّذ |

### أولوية متوسطة — ✅ مُنفّذة:

| # | الفجوة | الحالة |
|---|--------|--------|
| 5 | manhattan_distance + bearing | ✅ مُنفّذ | 
| 6 | sin/cos لـ hour | ✅ مُنفّذ |
| 7 | is_rush_hour كقاعدة زمنية | ✅ مُنفّذ |
| 8 | A / mean(A) كميزة نسبية (relative_deviation) | ✅ مُنفّذ |

### أولوية منخفضة (مستقبلي):

| # | الفجوة | الحالة |
|---|--------|--------|
| 9 | Feature selection نهائي (حذف importance < 0.005 تلقائياً) | ❌ مستقبلي |
| 10 | حلقة تكرار متعددة الجولات | ❌ مستقبلي |
| 11 | تقاطعات فئوية (cat1 + cat2) | ❌ مستقبلي |
| 12 | Self-evaluation مع cross-validated importance | ❌ مستقبلي |
| 13 | groupby min/max/count/rank | ❌ مستقبلي |
| 14 | value - group_mean | ❌ مستقبلي |

---

## التقييم المُحدّث

### نتائج الاختبار على NYC Taxi (50K صف):

```
                    قبل ASEF          بعد ASEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
R²                  -0.0525           +0.0200
الحالة              أسوأ من المتوسط    أفضل من المتوسط ✅
أهم ميزة            trip_distance_km   trip_distance_km
                    (وحيدة)            + manhattan + bearing
ميزات زمنية         year,month,day     + hour, minute, minute_of_day
                                       + is_rush_hour + cyclical hour
Aggregation         لا يوجد           8 ميزات groupby
اتساق منطقي        يبني من id!        حذف 13 خطة متناقضة ✅
```

### التقييم:

```
قبل ASEF:                           6.5 / 10
بعد ASEF (الأولوية القصوى 1-4):     8.0 / 10 ✅
بعد ASEF (المتوسطة 5-8):            8.5 / 10 ✅
بعد تنفيذ المنخفضة (9-14):          9.0+ / 10 (مستقبلي)
```

import React from "react";
import { useTranslation } from "react-i18next";
import {
  BadgeCheck,
  Baby,
  CalendarDays,
  ClipboardList,
  FileHeart,
  Hash,
  Stethoscope,
  UserRound,
} from "lucide-react";

const FinalReportDocument = ({ finalizedReport, session, patient }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.toLowerCase().startsWith("ar");
  const tr = (key, ar, en, values = {}) =>
    t(key, {
      ...values,
      defaultValue: isRTL ? ar : en,
    });

  const report = finalizedReport?.report_json || {};
  const patientInfo = report?.patient_info || {};
  const soap = report?.soap || {};
  const suggestions = Array.isArray(
    finalizedReport?.suggestions_json?.suggestions,
  )
    ? finalizedReport.suggestions_json.suggestions
    : [];

  const sessionId =
    finalizedReport?.clinical_session_id ||
    report?.clinical_session_id ||
    session?.id ||
    "-";
  const patientRecord = patient || session?.patient || {};

  const patientName = [patientRecord?.first_name, patientRecord?.last_name]
    .filter(Boolean)
    .join(" ");

  const mrn = patientRecord?.mrn || patientInfo?.mrn || "-";

  const formatDate = (value, withTime = true) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(isRTL ? "ar" : "en", {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(withTime
        ? {
            hour: "2-digit",
            minute: "2-digit",
          }
        : {}),
    }).format(date);
  };

  const getClinicalStateLabel = () => {
    const status = String(
      patientInfo?.effective_obstetric_status ||
        patientInfo?.observed_obstetric_status ||
        "",
    ).toLowerCase();

    if (status === "pregnant") {
      return tr("reports.finalDocument.states.pregnant", "حامل", "Pregnant");
    }

    if (status === "postpartum") {
      return tr(
        "reports.finalDocument.states.postpartum",
        "ما بعد الولادة",
        "Postpartum",
      );
    }

    if (status === "not_pregnant") {
      return tr(
        "reports.finalDocument.states.notPregnant",
        "غير حامل",
        "Not pregnant",
      );
    }

    return tr(
      "reports.finalDocument.states.unknown",
      "غير محدد",
      "Not specified",
    );
  };

  const getSeverityLabel = (severity) => {
    const value = String(severity || "").toLowerCase();

    const labels = {
      critical: ["حرجة", "Critical"],
      high: ["أولوية عالية", "High priority"],
      medium: ["أولوية متوسطة", "Medium priority"],
      low: ["أولوية منخفضة", "Low priority"],
      info: ["معلوماتية", "Informational"],
    };

    const label = labels[value] || ["توصية", "Recommendation"];

    return isRTL ? label[0] : label[1];
  };

  const getSeverityClasses = (severity) => {
    switch (String(severity || "").toLowerCase()) {
      case "critical":
        return "border-red-200 bg-red-50 text-red-700";

      case "high":
        return "border-orange-200 bg-orange-50 text-orange-700";

      case "medium":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "low":
        return "border-sky-200 bg-sky-50 text-sky-700";

      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  const soapSections = [
    {
      key: "subjective",
      letter: "S",
      title: tr(
        "reports.finalDocument.soap.subjective",
        "الشكوى والتاريخ",
        "Subjective",
      ),
      subtitle: tr(
        "reports.finalDocument.soap.subjectiveHint",
        "الأعراض والقصة السريرية كما تم توثيقها في المعاينة",
        "Symptoms and clinical history documented during the visit",
      ),
    },
    {
      key: "objective",
      letter: "O",
      title: tr(
        "reports.finalDocument.soap.objective",
        "الفحص والقياسات",
        "Objective",
      ),
      subtitle: tr(
        "reports.finalDocument.soap.objectiveHint",
        "العلامات الحيوية والنتائج الموضوعية المسجلة",
        "Recorded vital signs and objective findings",
      ),
    },
    {
      key: "assessment",
      letter: "A",
      title: tr(
        "reports.finalDocument.soap.assessment",
        "التقييم والتشخيص",
        "Assessment",
      ),
      subtitle: tr(
        "reports.finalDocument.soap.assessmentHint",
        "التقييم السريري والتشخيصات الموثقة",
        "Documented clinical assessment and diagnoses",
      ),
    },
    {
      key: "plan",
      letter: "P",
      title: tr("reports.finalDocument.soap.plan", "الخطة والعلاج", "Plan"),
      subtitle: tr(
        "reports.finalDocument.soap.planHint",
        "الخطة العلاجية والمتابعة والإجراءات المقترحة",
        "Treatment, follow-up and planned actions",
      ),
    },
  ];

  return (
    <article
      className="final-report-document mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/*  Report Header  */}

      <header className="border-b border-slate-200 bg-slate-950 px-6 py-7 text-white sm:px-9 sm:py-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <FileHeart className="h-7 w-7" />
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-200 ring-1 ring-white/10">
                  {tr(
                    "reports.finalDocument.officialRecord",
                    "سجل طبي نهائي",
                    "FINAL MEDICAL RECORD",
                  )}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
                  <BadgeCheck className="h-3.5 w-3.5" />

                  {tr("reports.finalDocument.finalized", "معتمد", "Finalized")}
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {tr(
                  "reports.finalDocument.title",
                  "التقرير الطبي النهائي",
                  "Final Clinical Report",
                )}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                {tr(
                  "reports.finalDocument.subtitle",
                  "النسخة النهائية المعتمدة من تقرير المعاينة والتوصيات السريرية.",
                  "The approved final snapshot of the clinical visit report and recommendations.",
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              {tr(
                "reports.finalDocument.snapshotId",
                "رقم النسخة النهائية",
                "Final snapshot ID",
              )}
            </p>

            <p className="mt-1 font-mono text-lg font-bold" dir="ltr">
              #{finalizedReport?.id ?? "-"}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-8 px-5 py-6 sm:px-9 sm:py-9">
        {/* Patient / Visit Information  */}

        <section className="avoid-print-break overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <UserRound className="h-4 w-4 text-slate-500" />

            <h2 className="text-sm font-bold text-slate-800">
              {tr(
                "reports.finalDocument.patientInfo",
                "بيانات المريضة والمعاينة",
                "Patient & Visit Information",
              )}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCell
              label={tr(
                "reports.finalDocument.patientName",
                "اسم المريضة",
                "Patient name",
              )}
              value={
                patientName ||
                tr(
                  "reports.finalDocument.unknownPatient",
                  "غير متوفر",
                  "Not available",
                )
              }
            />

            <InfoCell
              label={tr("reports.finalDocument.mrn", "الرقم الطبي MRN", "MRN")}
              value={mrn}
              dir="ltr"
            />

            <InfoCell
              label={tr(
                "reports.finalDocument.birthDate",
                "تاريخ الميلاد",
                "Date of birth",
              )}
              value={formatDate(patientRecord?.birth_date, false)}
            />

            <InfoCell
              label={tr(
                "reports.finalDocument.visitDate",
                "تاريخ المعاينة",
                "Visit date",
              )}
              value={formatDate(
                patientInfo?.visit_at ||
                  session?.visit_at ||
                  report?.created_at,
              )}
            />

            <InfoCell
              label={tr(
                "reports.finalDocument.sessionId",
                "رقم المعاينة",
                "Session ID",
              )}
              value={`#${sessionId}`}
              dir="ltr"
            />

            <InfoCell
              label={tr(
                "reports.finalDocument.clinicalState",
                "الحالة السريرية",
                "Clinical state",
              )}
              value={getClinicalStateLabel()}
            />

            {patientInfo?.gestational_age_weeks && (
              <InfoCell
                label={tr(
                  "reports.finalDocument.gestationalAge",
                  "عمر الحمل",
                  "Gestational age",
                )}
                value={tr(
                  "reports.finalDocument.weeks",
                  `${patientInfo.gestational_age_weeks} أسبوع`,
                  `${patientInfo.gestational_age_weeks} weeks`,
                )}
              />
            )}

            <InfoCell
              label={tr(
                "reports.finalDocument.finalizedAt",
                "تاريخ الاعتماد",
                "Finalized at",
              )}
              value={formatDate(finalizedReport?.finalized_at)}
            />
          </div>
        </section>

        {/* SOAP */}

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {tr(
                  "reports.finalDocument.soapTitle",
                  "التقرير السريري SOAP",
                  "SOAP Clinical Report",
                )}
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                {tr(
                  "reports.finalDocument.soapSubtitle",
                  "المحتوى الطبي النهائي بعد مراجعة الطبيب.",
                  "Final clinical content after physician review.",
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {soapSections.map((section) => {
              const items = Array.isArray(soap?.[section.key]?.items)
                ? soap[section.key].items
                : [];

              return (
                <section
                  key={section.key}
                  className="avoid-print-break overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="flex items-start gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                      {section.letter}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800">
                        {section.title}
                      </h3>

                      <p className="mt-0.5 text-xs leading-5 text-slate-400">
                        {section.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    {items.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        {tr(
                          "reports.finalDocument.noItems",
                          "لا توجد معلومات موثقة في هذا القسم.",
                          "No documented information in this section.",
                        )}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {items.map((item, index) => (
                          <div
                            key={item?.item_id || `${section.key}-${index}`}
                            className="flex items-start gap-3"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

                            <p className="text-[15px] leading-8 text-slate-700">
                              {item?.text || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        {/*  KBS Suggestions  */}

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {tr(
                  "reports.finalDocument.suggestionsTitle",
                  "التوصيات السريرية",
                  "Clinical Recommendations",
                )}
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                {tr(
                  "reports.finalDocument.suggestionsSubtitle",
                  "التوصيات المحفوظة ضمن النسخة النهائية من نظام EXPERTA_MED.",
                  "Recommendations stored in the final EXPERTA_MED snapshot.",
                )}
              </p>
            </div>
          </div>

          {suggestions.length === 0 ? (
            <div className="avoid-print-break rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-500">
              {tr(
                "reports.finalDocument.noSuggestions",
                "لا توجد توصيات سريرية محفوظة لهذا التقرير.",
                "No clinical recommendations are stored for this report.",
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <article
                  key={suggestion?.id || index}
                  className="avoid-print-break rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold leading-7 text-slate-900">
                        {suggestion?.title_ar ||
                          tr(
                            "reports.finalDocument.recommendation",
                            `توصية ${index + 1}`,
                            `Recommendation ${index + 1}`,
                          )}
                      </h3>

                      {suggestion?.detail_ar && (
                        <p className="mt-2 text-sm leading-8 text-slate-600">
                          {suggestion.detail_ar}
                        </p>
                      )}
                    </div>

                    <span
                      className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${getSeverityClasses(
                        suggestion?.severity,
                      )}`}
                    >
                      {getSeverityLabel(suggestion?.severity)}
                    </span>
                  </div>

                  {Array.isArray(suggestion?.missing_tests) &&
                    suggestion.missing_tests.length > 0 && (
                      <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                        <p className="text-xs font-semibold text-amber-800">
                          {tr(
                            "reports.finalDocument.missingTests",
                            "فحوصات أو بيانات مطلوبة",
                            "Required tests or data",
                          )}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {suggestion.missing_tests.map((test) => (
                            <span
                              key={test}
                              className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200"
                              dir="ltr"
                            >
                              {test}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/*  Footer  */}

        <footer className="avoid-print-break border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {tr(
                    "reports.finalDocument.immutableTitle",
                    "نسخة نهائية معتمدة",
                    "Approved final snapshot",
                  )}
                </p>

                <p className="mt-1 text-xs leading-6 text-slate-500">
                  {tr(
                    "reports.finalDocument.immutableDescription",
                    "تم إنشاء هذا المستند من النسخة النهائية المحفوظة للتقرير بعد اعتماد الطبيب.",
                    "This document is rendered from the finalized report snapshot stored after physician approval.",
                  )}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
              <Hash className="h-3.5 w-3.5" />

              <span dir="ltr">
                {finalizedReport?.id ?? "-"} / {sessionId}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
};

const InfoCell = ({ label, value, dir }) => {
  return (
    <div className="bg-white px-5 py-4">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>

      <p
        className="mt-1.5 text-sm font-semibold leading-6 text-slate-800"
        dir={dir}
      >
        {value || "-"}
      </p>
    </div>
  );
};

export default FinalReportDocument;

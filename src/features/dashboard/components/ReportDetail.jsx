import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Download,
  Copy,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";

const ReportDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { reportId } = useParams();
  const isRTL = i18n.language === "ar";

  const formatDate = (date) => {
    const locale = isRTL ? "ar-SA" : "en-US";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const report = {
    id: reportId || "SESS-2026-00140",
    patientName: isRTL ? "خالد محمود" : "Khaled Mahmoud",
    date: new Date(2026, 5, 12),
    duration: "8:30",
    doctorName: isRTL ? "د. أحمد" : "Dr. Ahmed",
    status: "approved",
    symptoms: isRTL
      ? [
          "أعاني من ألم في أسفل الظهر منذ شهر",
          "الألم يشع إلى الرجل اليسرى",
        ]
      : [
          "Suffering from lower back pain for a month",
          "Pain radiates to the left leg",
        ],
    diagnosis: isRTL
      ? "فحص العمود الفقري يشير إلى انزلاق غضروفي بسيط"
      : "Spine examination indicates a mild disc herniation",
    treatmentPlan: isRTL
      ? "نقترح العلاج الطبيعي وتمارين تقوية الظهر"
      : "We recommend physiotherapy and back strengthening exercises",
    soap: isRTL
      ? {
          subjective: "أعاني من ألم في أسفل الظهر منذ شهر؛ الألم يشع إلى الرجل اليسرى",
          objective: "لا توجد بيانات",
          assessment: "فحص العمود الفقري يشير إلى انزلاق غضروفي بسيط",
          plan: "نقترح العلاج الطبيعي وتمارين تقوية الظهر",
        }
      : {
          subjective: "Suffering from lower back pain for a month; pain radiates to the left leg",
          objective: "No data available",
          assessment: "Spine examination indicates a mild disc herniation",
          plan: "We recommend physiotherapy and back strengthening exercises",
        },
  };

  const handleCopy = () => {
    const text = `
${t("dashboard.reports.medicalReport")} - ${t("auth.sidebar.title")}
${t("dashboard.reports.patientName")}: ${report.patientName}
${t("dashboard.reports.sessionNumber")}: ${report.id}
${t("dashboard.reports.date")}: ${formatDate(report.date)}

${t("dashboard.reports.symptoms")}:
${report.symptoms.map((s) => `- ${s}`).join("\n")}

${t("dashboard.reports.diagnosis")}: ${report.diagnosis}

${t("dashboard.reports.treatmentPlan")}: ${report.treatmentPlan}
    `.trim();

    navigator.clipboard.writeText(text);
    alert(
      isRTL ? t("dashboard.reports.copySuccess") : "Report copied successfully!"
    );
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className={isRTL ? "text-right" : "text-left"}>
          <button
            onClick={() => navigate("/dashboard/reports")}
            className={`text-sm text-slate-500 hover:text-primary transition-colors flex items-center gap-2 mb-3 ${
              isRTL ? "flex-row" : "flex-row"
            }`}
          >
            <ArrowRight className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />
            {t("dashboard.reports.backToReports", "العودة للتقارير")}
          </button>

          <h1 className="text-2xl font-bold text-slate-800">
            {t("dashboard.reports.reportTitle", "التقرير الطبي")}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{report.patientName}</p>
          <p className="text-xs text-slate-400 mt-1">
            {t("dashboard.reports.approvedOn", "معتمد بتاريخ")}{" "}
            {formatDate(report.date)} – {report.doctorName}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">
              {t("dashboard.reports.approved", "معتمدة")}
            </span>
          </div>

          <button className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-primary/30 hover:text-primary transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t("dashboard.reports.downloadPDF", "تحميل PDF")}
          </button>

          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-primary/30 hover:text-primary transition-colors flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {t("dashboard.reports.copyText", "نسخ النص")}
          </button>
        </div>
      </div>

      {/* محتوى التقرير */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white mb-4 shadow-md shadow-primary/20">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {t("dashboard.reports.medicalReport", "التقرير الطبي")}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t("dashboard.reports.reportSubtitle", "مساعد الطبيب – نظام التوثيق الذكي")}
          </p>
        </div>

        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className={isRTL ? "text-right" : "text-left"}>
              <p className="text-xs text-slate-400 mb-1">
                {t("dashboard.reports.patientName", "اسم المريض")}
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {report.patientName}
              </p>
            </div>
            <div className={isRTL ? "text-right" : "text-left"}>
              <p className="text-xs text-slate-400 mb-1">
                {t("dashboard.reports.sessionNumber", "رقم الجلسة")}
              </p>
              <p className="text-sm font-mono text-slate-800">{report.id}</p>
            </div>
            <div className={isRTL ? "text-right" : "text-left"}>
              <p className="text-xs text-slate-400 mb-1">
                {t("dashboard.reports.date", "التاريخ")}
              </p>
              <p className="text-sm text-slate-800">{formatDate(report.date)}</p>
            </div>
            <div className={isRTL ? "text-right" : "text-left"}>
              <p className="text-xs text-slate-400 mb-1">
                {t("dashboard.reports.duration", "المدة")}
              </p>
              <p className="text-sm text-slate-800">{report.duration}</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* الأعراض */}
          <div>
            <div className={`flex items-center gap-2 mb-4 ${isRTL ? "flex-row" : "flex-row"}`}>
              <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                {t("dashboard.reports.symptomsLabel", "أعراض")}
              </span>
              <h3 className="text-lg font-bold text-slate-800">
                {t("dashboard.reports.symptoms", "أعراض")}
              </h3>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <ul className="space-y-2">
                {report.symptoms.map((symptom, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-2 text-sm text-slate-700 ${
                      isRTL ? "flex-row" : "flex-row"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span className={isRTL ? "text-right" : "text-left"}>{symptom}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* التشخيص */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-sm font-semibold">
                {t("dashboard.reports.diagnosisLabel", "تشخيص")}
              </span>
              <h3 className="text-lg font-bold text-slate-800">
                {t("dashboard.reports.diagnosis", "تشخيص")}
              </h3>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <ul className="space-y-2">
                <li
                  className={`flex items-start gap-2 text-sm text-slate-700 ${
                    isRTL ? "flex-row" : "flex-row"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className={isRTL ? "text-right" : "text-left"}>{report.diagnosis}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* خطة العلاج */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-semibold">
                {t("dashboard.reports.treatmentLabel", "خطة علاج")}
              </span>
              <h3 className="text-lg font-bold text-slate-800">
                {t("dashboard.reports.treatmentPlan", "خطة علاج")}
              </h3>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <ul className="space-y-2">
                <li
                  className={`flex items-start gap-2 text-sm text-slate-700 ${
                    isRTL ? "flex-row" : "flex-row"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className={isRTL ? "text-right" : "text-left"}>{report.treatmentPlan}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ملخص SOAP */}
          <div>
            <h3 className={`text-lg font-bold text-slate-800 mb-4 ${isRTL ? "text-right" : "text-left"}`}>
              {t("dashboard.reports.soapSummary", "ملخص SOAP")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/30 transition-colors">
                <p className={`text-xs font-semibold text-primary mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                  {t("dashboard.reports.soap.subjective", "SUBJECTIVE (S)")}
                </p>
                <p className={`text-sm text-slate-700 ${isRTL ? "text-right" : "text-left"}`}>{report.soap.subjective}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/30 transition-colors">
                <p className={`text-xs font-semibold text-primary mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                  {t("dashboard.reports.soap.objective", "OBJECTIVE (O)")}
                </p>
                <p className={`text-sm text-slate-700 ${isRTL ? "text-right" : "text-left"}`}>{report.soap.objective}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/30 transition-colors">
                <p className={`text-xs font-semibold text-primary mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                  {t("dashboard.reports.soap.assessment", "ASSESSMENT (A)")}
                </p>
                <p className={`text-sm text-slate-700 ${isRTL ? "text-right" : "text-left"}`}>{report.soap.assessment}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/30 transition-colors">
                <p className={`text-xs font-semibold text-primary mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                  {t("dashboard.reports.soap.plan", "PLAN (P)")}
                </p>
                <p className={`text-sm text-slate-700 ${isRTL ? "text-right" : "text-left"}`}>{report.soap.plan}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/30 text-center">
          <p className="text-xs text-slate-400 mb-2">
            {t(
              "dashboard.reports.reportDisclaimer",
              "هذا التقرير تم إنشاؤه بواسطة نظام مساعد الطبيب بالذكاء الاصطناعي وتمت مراجعته والاعتماد من قبل الطبيب."
            )}
          </p>
          <p className="text-sm font-semibold text-slate-600">
            {t("dashboard.reports.doctorSignature", "توقيع الطبيب")}:{" "}
            {report.doctorName} – {formatDate(report.date)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
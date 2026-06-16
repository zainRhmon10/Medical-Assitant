// features/dashboard/components/ReportDetail.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Download,
  Copy,
  CheckCircle2,
  Stethoscope,
  FileText,
} from "lucide-react";

const ReportDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { reportId } = useParams();
  const isRTL = i18n.language === "ar";

  const report = {
    id: reportId || "SESS-2026-00140",
    patientName: "خالد محمود",
    date: "١٢ يونيو ٢٠٢٦",
    duration: "8:30",
    doctorName: "د. أحمد",
    status: "approved",
    symptoms: [
      "أعاني من ألم في أسفل الظهر منذ شهر",
      "الألم يشع إلى الرجل اليسرى",
    ],
    diagnosis: "فحص العمود الفقري يشير إلى انزلاق غضروفي بسيط",
    treatmentPlan: "نقترح العلاج الطبيعي وتمارين تقوية الظهر",
    soap: {
      subjective: "أعاني من ألم في أسفل الظهر منذ شهر؛ الألم يشع إلى الرجل اليسرى",
      objective: "لا توجد بيانات",
      assessment: "فحص العمود الفقري يشير إلى انزلاق غضروفي بسيط",
      plan: "نقترح العلاج الطبيعي وتمارين تقوية الظهر",
    },
  };

  const handleCopy = () => {
    const text = `
التقرير الطبي - مساعد الطبيب
المريض: ${report.patientName}
رقم الجلسة: ${report.id}
التاريخ: ${report.date}

الأعراض:
${report.symptoms.map((s) => `- ${s}`).join("\n")}

التشخيص: ${report.diagnosis}

خطة العلاج: ${report.treatmentPlan}
    `.trim();

    navigator.clipboard.writeText(text);
    alert(isRTL ? "تم نسخ التقرير!" : "Report copied!");
  };

  return (
    <div className="space-y-6">
      {/* Header - أعلى الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className={isRTL ? "text-right" : "text-left"}>
          {/* زر العودة */}
          <button
            onClick={() => navigate("/dashboard/reports")}
            className={`text-sm text-slate-500 hover:text-[#0b7a9e] transition-colors flex items-center gap-1 mb-3 ${
              isRTL ? "flex-row" : "flex-row-reverse"
            }`}
          >
            <ArrowRight className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />
            {t("dashboard.reports.backToSessions", "العودة للجلسات")}
          </button>

          <h1 className="text-2xl font-bold text-slate-800">
            {t("dashboard.reports.reportTitle", "التقرير الطبي")}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{report.patientName}</p>
          <p className="text-xs text-slate-400 mt-1">
            {t("dashboard.reports.approvedOn", "معتمد بتاريخ")}{" "}
            {report.date} – {report.doctorName}
          </p>
        </div>

        {/* الأزرار */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">
              {t("dashboard.reports.approved", "معتمدة")}
            </span>
          </div>

          <button className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-[#0b7a9e]/30 hover:text-[#0b7a9e] transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t("dashboard.reports.downloadPDF", "تحميل PDF")}
          </button>

          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-[#0b7a9e]/30 hover:text-[#0b7a9e] transition-colors flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {t("dashboard.reports.copyText", "نسخ النص")}
          </button>
        </div>
      </div>

      {/* محتوى التقرير - البطاقة الرئيسية */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* رأس التقرير */}
        <div className="p-8 border-b border-slate-100 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b7a9e] text-white mb-4 shadow-md shadow-[#0b7a9e]/20">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {t("dashboard.reports.reportTitle", "التقرير الطبي")}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t("dashboard.reports.reportSubtitle", "مساعد الطبيب – نظام التوثيق الذكي")}
          </p>
        </div>

        {/* معلومات الجلسة */}
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
              <p className="text-sm text-slate-800">{report.date}</p>
            </div>
            <div className={isRTL ? "text-right" : "text-left"}>
              <p className="text-xs text-slate-400 mb-1">
                {t("dashboard.reports.duration", "المدة")}
              </p>
              <p className="text-sm text-slate-800">{report.duration}</p>
            </div>
          </div>
        </div>

        {/* محتوى التقرير */}
        <div className="p-6 md:p-8 space-y-8">
          {/* الأعراض */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1.5 rounded-lg bg-[#0b7a9e]/10 text-[#0b7a9e] text-sm font-semibold">
                {t("dashboard.reports.symptoms", "أعراض")}
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
                      isRTL ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0b7a9e] mt-1.5 shrink-0" />
                    <span>{symptom}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* التشخيص */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-sm font-semibold">
                {t("dashboard.reports.diagnosis", "تشخيص")}
              </span>
              <h3 className="text-lg font-bold text-slate-800">
                {t("dashboard.reports.diagnosis", "تشخيص")}
              </h3>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <ul className="space-y-2">
                <li
                  className={`flex items-start gap-2 text-sm text-slate-700 ${
                    isRTL ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0b7a9e] mt-1.5 shrink-0" />
                  <span>{report.diagnosis}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* خطة العلاج */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-semibold">
                {t("dashboard.reports.treatmentPlan", "خطة علاج")}
              </span>
              <h3 className="text-lg font-bold text-slate-800">
                {t("dashboard.reports.treatmentPlan", "خطة علاج")}
              </h3>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <ul className="space-y-2">
                <li
                  className={`flex items-start gap-2 text-sm text-slate-700 ${
                    isRTL ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0b7a9e] mt-1.5 shrink-0" />
                  <span>{report.treatmentPlan}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ملخص SOAP */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {t("dashboard.reports.soapSummary", "ملخص SOAP")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subjective */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#0b7a9e]/30 transition-colors">
                <p className="text-xs font-semibold text-[#0b7a9e] mb-2">
                  SUBJECTIVE (S)
                </p>
                <p className="text-sm text-slate-700">{report.soap.subjective}</p>
              </div>

              {/* Objective */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#0b7a9e]/30 transition-colors">
                <p className="text-xs font-semibold text-[#0b7a9e] mb-2">
                  OBJECTIVE (O)
                </p>
                <p className="text-sm text-slate-700">{report.soap.objective}</p>
              </div>

              {/* Assessment */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#0b7a9e]/30 transition-colors">
                <p className="text-xs font-semibold text-[#0b7a9e] mb-2">
                  ASSESSMENT (A)
                </p>
                <p className="text-sm text-slate-700">{report.soap.assessment}</p>
              </div>

              {/* Plan */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#0b7a9e]/30 transition-colors">
                <p className="text-xs font-semibold text-[#0b7a9e] mb-2">
                  PLAN (P)
                </p>
                <p className="text-sm text-slate-700">{report.soap.plan}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer التقرير */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/30 text-center">
          <p className="text-xs text-slate-400 mb-2">
            {t(
              "dashboard.reports.reportDisclaimer",
              "هذا التقرير تم إنشاؤه بواسطة نظام مساعد الطبيب بالذكاء الاصطناعي وتمت مراجعته والاعتماد من قبل الطبيب."
            )}
          </p>
          <p className="text-sm font-semibold text-slate-600">
            {t("dashboard.reports.doctorSignature", "توقيع الطبيب")}:{" "}
            {report.doctorName} – {report.date}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
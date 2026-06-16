import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, FileText, Download, Eye } from "lucide-react";

const ReportsTab = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  // ✅ دالة لترجمة التاريخ حسب اللغة
  const formatDate = (date) => {
    const locale = isRTL ? 'ar-SA' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const reports = [
    { 
      id: "SESS-2026-00140", 
      patientName: isRTL ? "خالد محمود" : "Khaled Mahmoud", 
      date: new Date(2026, 5, 12), // يونيو 12, 2026
      status: "approved",
      statusText: t("dashboard.reports.approved", "معتمدة")
    },
    { 
      id: "SESS-2026-00139", 
      patientName: isRTL ? "فاطمة حسن" : "Fatima Hassan", 
      date: new Date(2026, 5, 12),
      status: "approved",
      statusText: t("dashboard.reports.approved", "معتمدة")
    },
    { 
      id: "SESS-2026-00138", 
      patientName: isRTL ? "عبدالله سالم" : "Abdullah Salem", 
      date: new Date(2026, 5, 11),
      status: "approved",
      statusText: t("dashboard.reports.approved", "معتمدة")
    },
  ];

  return (
    <div className="space-y-6">
      <div className={isRTL ? "text-right" : "text-left"}>
        <h1 className="text-2xl font-bold text-slate-800">
          {t("dashboard.reports.title", "التقارير المعتمدة")}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t("dashboard.reports.subtitle", "جميع التقارير الطبية المعتمدة")}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {reports.map((report) => (
            <div 
              key={report.id}
              className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
              onClick={() => navigate(`/dashboard/reports/${report.id}`)}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-[#0b7a9e]/10 text-[#0b7a9e] flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 mb-1">
                    {report.patientName}
                  </h3>
                  {/* ✅ استخدام formatDate لعرض التاريخ */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{report.id}</span>
                    <span>•</span>
                    <span>{formatDate(report.date)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">
                    {report.statusText}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="p-2 rounded-lg text-slate-400 hover:text-[#0b7a9e] hover:bg-[#0b7a9e]/5 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/reports/${report.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    className="p-2 rounded-lg text-slate-400 hover:text-[#0b7a9e] hover:bg-[#0b7a9e]/5 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
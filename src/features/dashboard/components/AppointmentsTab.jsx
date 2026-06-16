import React from "react";
import { useTranslation } from "react-i18next";
import { Search, ChevronDown, Plus, Eye, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const AppointmentsTab = () => {
  const { t, i18n } = useTranslation();
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

  // ✅ دالة لترجمة الأرقام
  const formatNumber = (num) => {
    const locale = isRTL ? 'ar-SA' : 'en-US';
    return new Intl.NumberFormat(locale).format(num);
  };

  const appointments = [
    { 
      id: "SESS-2026-00142", 
      patient: isRTL ? "محمد العلي" : "Mohammed Al-Ali", 
      patientId: "PAT-2026-089",
      date: new Date(2026, 5, 13),
      duration: "10:34", 
      status: "pending",
      statusText: t("dashboard.sessions.pendingReview")
    },
    { 
      id: "SESS-2026-00141", 
      patient: isRTL ? "سارة أحمد" : "Sarah Ahmed", 
      patientId: "PAT-2026-076",
      date: new Date(2026, 5, 13),
      duration: "07:00", 
      status: "processing",
      statusText: t("dashboard.sessions.inTreatment") 
    },
    { 
      id: "SESS-2026-00140", 
      patient: isRTL ? "خالد محمود" : "Khaled Mahmoud", 
      patientId: "PAT-2026-065",
      date: new Date(2026, 5, 12),
      duration: "08:30", 
      status: "approved",
      statusText: t("dashboard.sessions.approved")
    },
    { 
      id: "SESS-2026-00139", 
      patient: isRTL ? "فاطمة حسن" : "Fatima Hassan", 
      patientId: "PAT-2026-054",
      date: new Date(2026, 5, 12),
      duration: "06:20", 
      status: "approved",
      statusText: t("dashboard.sessions.approved") 
    },
    { 
      id: "SESS-2026-00138", 
      patient: isRTL ? "عبدالله سالم" : "Abdullah Salem", 
      patientId: "PAT-2026-043",
      date: new Date(2026, 5, 11),
      duration: "04:50", 
      status: "pending",
      statusText: t("dashboard.sessions.pendingReview") 
    },
  ];

  const getStatusStyle = (status) => {
    switch(status) {
      case "approved":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "pending":
        return "bg-purple-50 text-purple-600 border border-purple-100";
      case "processing":
        return "bg-amber-50 text-amber-600 border border-amber-100";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-100";
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "approved":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "pending":
        return <AlertCircle className="h-3.5 w-3.5" />;
      case "processing":
        return <Clock className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={isRTL ? "text-right" : "text-left"}>
        <h1 className="text-2xl font-bold text-slate-800">
          {t("dashboard.sessions.title", "الجلسات")}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t("dashboard.sessions.subtitle", "إدارة ومراقبة جميع جلساتك الطبية")}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        {/* اليمين: حقل البحث + فلتر الحالات */}
        <div className="flex gap-3 w-full sm:w-auto order-1 sm:order-1">
          <div className="relative flex-1 sm:flex-none sm:min-w-[280px]">
            <input
              type="text"
              placeholder={t("dashboard.sessions.searchPatient", "البحث باسم المريض...")}
              className={`w-full px-4 py-2.5 ${isRTL ? 'pr-10' : 'pl-10'} rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0b7a9e] focus:ring-2 focus:ring-[#0b7a9e]/20`}
            />
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400`} />
          </div>

          <div className="relative flex-1 sm:flex-none">
            <select className={`w-full appearance-none px-4 py-2.5 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-[#0b7a9e] focus:ring-2 focus:ring-[#0b7a9e]/20 cursor-pointer`}>
              <option>{t("dashboard.sessions.allCases", "جميع الحالات")}</option>
              <option>{t("dashboard.sessions.pending", "بانتظار المراجعة")}</option>
              <option>{t("dashboard.sessions.processing", "قيد المعالجة")}</option>
              <option>{t("dashboard.sessions.approved", "معتمدة")}</option>
            </select>
            <ChevronDown className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none`} />
          </div>
        </div>

        {/* اليسار: زر جلسة جديدة */}
        <button className="px-4 py-2.5 bg-[#0b7a9e] hover:bg-[#096684] text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-[#0b7a9e]/25 order-2 sm:order-2">
          <Plus className="h-4 w-4" />
          {t("dashboard.sessions.newSession", "جلسة جديدة")}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-xs font-semibold text-slate-600`}>
                  {t("dashboard.sessions.sessionNumber", "رقم الجلسة")}
                </th>
                <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-xs font-semibold text-slate-600`}>
                  {t("dashboard.sessions.patient", "المريض")}
                </th>
                <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-xs font-semibold text-slate-600`}>
                  {t("dashboard.sessions.date", "التاريخ")}
                </th>
                <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-xs font-semibold text-slate-600`}>
                  {t("dashboard.sessions.duration", "المدة")}
                </th>
                <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-xs font-semibold text-slate-600`}>
                  {t("dashboard.sessions.status", "الحالة")}
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600">
                  {t("dashboard.sessions.actions", "الإجراءات")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                    {appointment.id}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{appointment.patient}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{appointment.patientId}</div>
                    </div>
                  </td>
                  {/* ✅ استخدام formatDate لعرض التاريخ */}
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(appointment.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {appointment.duration}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusStyle(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                      <span>{appointment.statusText}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg text-slate-400 hover:text-[#0b7a9e] hover:bg-[#0b7a9e]/5 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsTab;
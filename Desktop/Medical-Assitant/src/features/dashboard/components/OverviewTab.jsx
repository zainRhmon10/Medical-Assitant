import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, Calendar, Mic, FolderOpen, Eye } from "lucide-react";

const OverviewTab = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate(); 
  const isRTL = i18n.language === "ar";

  const formatNumber = (num) => {
    const locale = isRTL ? 'ar-SA' : 'en-US';
    return new Intl.NumberFormat(locale).format(num);
  };

  const formatDate = (date) => {
    const locale = isRTL ? 'ar-SA' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const stats = [
    { 
      title: t("dashboard.stats.todaySessions", isRTL ? "جلسات اليوم" : "Today's Sessions"), 
      value: formatNumber(5), 
      subtitle: t("dashboard.stats.newSessions", isRTL ? "جديدة" : "New"),
      icon: Calendar, 
      bgColor: "bg-primary/10",
      textColor: "text-primary"
    },
    { 
      title: t("dashboard.stats.inProgress", isRTL ? "قيد المعالجة" : "In Progress"), 
      value: formatNumber(2), 
      subtitle: t("dashboard.stats.session", isRTL ? "جلسة" : "Session"),
      icon: Clock, 
      bgColor: "bg-amber-50",
      textColor: "text-amber-500"
    },
    { 
      title: t("dashboard.stats.approvedToday", isRTL ? "معتمدة اليوم" : "Approved Today"), 
      value: formatNumber(3), 
      subtitle: t("dashboard.stats.sessions", isRTL ? "جلسات" : "Sessions"),
      icon: CheckCircle2, 
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-500"
    },
    { 
      title: t("dashboard.stats.warnings", isRTL ? "تحذيرات" : "Warnings"), 
      value: formatNumber(1), 
      subtitle: t("dashboard.stats.alert", isRTL ? "تنبيه" : "Alert"),
      icon: AlertTriangle, 
      bgColor: "bg-red-50",
      textColor: "text-red-500"
    },
  ];

  const recentSessions = [
    { id: 1, name: isRTL ? "محمد العلي" : "Mohammed Al-Ali", date: new Date(2026, 5, 13), status: "pending", statusText: t("dashboard.sessions.pendingReview", "بانتظار المراجعة") },
    { id: 2, name: isRTL ? "سارة أحمد" : "Sarah Ahmed", date: new Date(2026, 5, 13), status: "processing", statusText: t("dashboard.sessions.inTreatment", "قيد المعالجة") },
    { id: 3, name: isRTL ? "خالد محمود" : "Khaled Mahmoud", date: new Date(2026, 5, 12), status: "approved", statusText: t("dashboard.sessions.approved", "معتمدة") },
    { id: 4, name: isRTL ? "فاطمة حسن" : "Fatima Hassan", date: new Date(2026, 5, 12), status: "approved", statusText: t("dashboard.sessions.approved", "معتمدة") },
    { id: 5, name: isRTL ? "عبدالله سالم" : "Abdullah Salem", date: new Date(2026, 5, 11), status: "pending", statusText: t("dashboard.sessions.pendingReview", "بانتظار المراجعة") },
    { id: 6, name: isRTL ? "محمد العلي" : "Mohammed Al-Ali", date: new Date(2026, 5, 13), status: "pending", statusText: t("dashboard.sessions.pendingReview", "بانتظار المراجعة") },
    { id: 7, name: isRTL ? "سارة أحمد" : "Sarah Ahmed", date: new Date(2026, 5, 13), status: "processing", statusText: t("dashboard.sessions.inTreatment", "قيد المعالجة") },
    { id: 8, name: isRTL ? "خالد محمود" : "Khaled Mahmoud", date: new Date(2026, 5, 12), status: "approved", statusText: t("dashboard.sessions.approved", "معتمدة") },
    { id: 9, name: isRTL ? "فاطمة حسن" : "Fatima Hassan", date: new Date(2026, 5, 12), status: "approved", statusText: t("dashboard.sessions.approved", "معتمدة") },
    { id: 10, name: isRTL ? "عبدالله سالم" : "Abdullah Salem", date: new Date(2026, 5, 11), status: "pending", statusText: t("dashboard.sessions.pendingReview", "بانتظار المراجعة") },
  ];

  const displayedSessions = recentSessions.slice(0, 5);

  const daysLabels = isRTL 
    ? ["سب", "أحد", "إثن", "ثل", "أرب", "خم", "جم"]
    : ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

  const chartData = [
    { day: daysLabels[0], value: 5 },
    { day: daysLabels[1], value: 9 },
    { day: daysLabels[2], value: 12 },
    { day: daysLabels[3], value: 8 },
    { day: daysLabels[4], value: 15 },
    { day: daysLabels[5], value: 11 },
    { day: daysLabels[6], value: 3 },
  ];

  const maxValue = Math.max(...chartData.map(item => item.value)) || 1;

  const getStatusStyle = (status) => {
    switch(status) {
      case "approved":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "pending":
        return "bg-purple-50 text-purple-600 border border-purple-100";
      case "processing":
        return "bg-amber-50 text-amber-600 border border-amber-100";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "approved":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "pending":
        return <Eye className="h-3.5 w-3.5" />;
      case "processing":
        return <Clock className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* شبكة البطاقات الإحصائية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div 
            key={idx}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow"
          >
            <div className={`h-12 w-12 rounded-full ${stat.bgColor} ${stat.textColor} flex items-center justify-center mb-3`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">{stat.title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-800">{stat.value}</span>
              <span className="text-xs text-slate-400">{stat.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* المحتوى الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* الجلسات الحديثة */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">
              {t("dashboard.recentSessions.title", isRTL ? "الجلسات الحديثة" : "Recent Sessions")}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {t("dashboard.recentSessions.subtitle", isRTL ? "آخر الجلسات" : "Latest Sessions")}
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {displayedSessions.map((session) => (
              <div 
                key={session.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{session.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(session.date)}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusStyle(session.status)}`}>
                  {getStatusIcon(session.status)}
                  <span>{session.statusText}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100">
            <button 
              onClick={() => navigate("/dashboard/appointments")}
              className={`text-sm font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-1 ${isRTL ? 'justify-start' : 'justify-end'} cursor-pointer`}
            >
              {t("dashboard.recentSessions.viewAll", isRTL ? "عرض الكل" : "View All")}
              <Eye className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* الرسم البياني والإجراءات السريعة */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 text-center">
              {t("dashboard.charts.weeklyActivity", isRTL ? "نشاط الأسبوع" : "Weekly Activity")}
            </h3>
            <div className="flex items-end justify-between h-48 gap-2">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-primary rounded-t-md transition-all hover:bg-primary-dark cursor-pointer"
                    style={{ 
                      height: `${Math.max((item.value / maxValue) * 100, 5)}%`,
                      minHeight: '8px'
                    }}
                    title={`${formatNumber(item.value)} ${isRTL ? 'جلسات' : 'sessions'}`}
                  />
                  <span className="text-xs text-slate-400">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4 text-center">
              {t("dashboard.quickActions.title", isRTL ? "إجراءات سريعة" : "Quick Actions")}
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate("/dashboard/new-session")}
                className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Mic className="h-5 w-5" />
                {t("dashboard.quickActions.newSession", isRTL ? "بدء جلسة جديدة" : "Start New Session")}
              </button>
              <button 
                onClick={() => navigate("/dashboard/appointments")}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FolderOpen className="h-5 w-5" />
                {t("dashboard.quickActions.viewSessions", isRTL ? "عرض الجلسات" : "View Sessions")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
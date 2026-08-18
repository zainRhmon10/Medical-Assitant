import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Mic,
  FolderOpen,
  Eye,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { getDoctorDashboard } from "../services/dashboardApi";

const OverviewTab = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language?.startsWith("ar");

  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const formatNumber = (num) => {
    const locale = isRTL ? "ar-SA" : "en-US";

    return new Intl.NumberFormat(locale).format(Number(num || 0));
  };

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    const locale = isRTL ? "ar-SA" : "en-US";

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const response = await getDoctorDashboard();
      const payload = response?.data?.dashboard;

      if (!payload) {
        throw new Error("Invalid dashboard response");
      }

      setDashboard(payload);
    } catch (error) {
      console.error(
        "GET DASHBOARD ERROR:",
        error.response?.data || error.message,
      );

      setLoadError(
        error.response?.data?.message ||
          t(
            "dashboard.overview.loadError",
            isRTL
              ? "تعذر تحميل بيانات لوحة التحكم."
              : "Couldn't load dashboard data.",
          ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [isRTL, t]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summary = dashboard?.summary || {};

  const stats = [
    {
      title: t(
        "dashboard.stats.todaySessions",
        isRTL ? "جلسات اليوم" : "Today's Sessions",
      ),
      value: formatNumber(summary.today_sessions),
      subtitle: t("dashboard.stats.newSessions", isRTL ? "جديدة" : "New"),
      icon: Calendar,
      bgColor: "bg-primary/10",
      textColor: "text-primary",
    },
    {
      title: t(
        "dashboard.stats.inProgress",
        isRTL ? "قيد المعالجة" : "In Progress",
      ),
      value: formatNumber(summary.in_progress),
      subtitle: t("dashboard.stats.session", isRTL ? "جلسة" : "Session"),
      icon: Clock,
      bgColor: "bg-amber-50",
      textColor: "text-amber-500",
    },
    {
      title: t(
        "dashboard.stats.approvedToday",
        isRTL ? "معتمدة اليوم" : "Approved Today",
      ),
      value: formatNumber(summary.approved_today),
      subtitle: t("dashboard.stats.sessions", isRTL ? "جلسات" : "Sessions"),
      icon: CheckCircle2,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-500",
    },
    {
      title: t("dashboard.stats.warnings", isRTL ? "تحذيرات" : "Warnings"),
      value: formatNumber(summary.warnings),
      subtitle: t("dashboard.stats.alert", isRTL ? "تنبيه" : "Alert"),
      icon: AlertTriangle,
      bgColor: "bg-red-50",
      textColor: "text-red-500",
    },
  ];
  const recentSessions = Array.isArray(dashboard?.recent_sessions)
    ? dashboard.recent_sessions
    : [];

  const chartData = useMemo(() => {
    if (!Array.isArray(dashboard?.weekly_activity)) {
      return [];
    }

    return dashboard.weekly_activity.map((item) => ({
      date: item.date,
      day: item.day,
      sessions: Number(item.sessions || 0),
      approved: Number(item.approved || 0),
    }));
  }, [dashboard]);

  const maxValue = Math.max(...chartData.map((item) => item.sessions), 1);

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return t(
          "dashboard.overview.statuses.approved",
          isRTL ? "معتمدة" : "Approved",
        );

      case "pending_review":
        return t(
          "dashboard.overview.statuses.pendingReview",
          isRTL ? "بانتظار المراجعة" : "Pending Review",
        );

      case "in_progress":
        return t(
          "dashboard.overview.statuses.inProgress",
          isRTL ? "قيد المعالجة" : "In Progress",
        );

      case "warning":
        return t(
          "dashboard.overview.statuses.warning",
          isRTL ? "تحذير" : "Warning",
        );

      default:
        return status || "—";
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";

      case "pending_review":
        return "bg-purple-50 text-purple-600 border border-purple-100";

      case "in_progress":
        return "bg-amber-50 text-amber-600 border border-amber-100";

      case "warning":
        return "bg-red-50 text-red-600 border border-red-100";

      default:
        return "bg-slate-50 text-slate-600 border border-slate-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-3.5 w-3.5" />;

      case "pending_review":
        return <Eye className="h-3.5 w-3.5" />;

      case "in_progress":
        return <Clock className="h-3.5 w-3.5" />;

      case "warning":
        return <AlertTriangle className="h-3.5 w-3.5" />;

      default:
        return null;
    }
  };

  const openSession = (session) => {
    if (!session?.id) {
      return;
    }

    if (session.status === "approved") {
      navigate(`/dashboard/reports/${session.id}/final`);
      return;
    }

    if (
      session.status === "pending_review" &&
      session.processing_status === "complete"
    ) {
      navigate(`/dashboard/reports/${session.id}`);
      return;
    }

    navigate("/dashboard/appointments");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />

          <p className="text-sm">
            {t(
              "dashboard.overview.loading",
              isRTL ? "جارٍ تحميل لوحة التحكم..." : "Loading dashboard...",
            )}
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-500" />

          <h3 className="font-bold text-slate-800">
            {t(
              "dashboard.overview.errorTitle",
              isRTL ? "تعذر تحميل لوحة التحكم" : "Couldn't Load Dashboard",
            )}
          </h3>

          <p className="mt-2 text-sm text-slate-500">{loadError}</p>

          <button
            type="button"
            onClick={loadDashboard}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            <RefreshCw className="h-4 w-4" />

            {t(
              "dashboard.overview.retry",
              isRTL ? "إعادة المحاولة" : "Try Again",
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* شبكة البطاقات الإحصائية */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${stat.bgColor} ${stat.textColor}`}
            >
              <stat.icon className="h-6 w-6" />
            </div>

            <h3 className="mb-1 text-sm font-medium text-slate-600">
              {stat.title}
            </h3>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-800">
                {stat.value}
              </span>

              <span className="text-xs text-slate-400">{stat.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* المحتوى الرئيسي */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* الجلسات الحديثة */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800">
              {t(
                "dashboard.recentSessions.title",
                isRTL ? "الجلسات الحديثة" : "Recent Sessions",
              )}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {t(
                "dashboard.recentSessions.subtitle",
                isRTL ? "آخر الجلسات" : "Latest Sessions",
              )}
            </p>
          </div>

          {recentSessions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {t(
                "dashboard.overview.noRecentSessions",
                isRTL ? "لا توجد جلسات حديثة." : "No recent sessions.",
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSessions.map((session) => (
                <button
                  type="button"
                  key={session.id}
                  onClick={() => openSession(session)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-start transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-slate-800">
                      {session.patient?.name || "—"}
                    </h4>

                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>{formatDate(session.visit_at)}</span>

                      {session.patient?.mrn && (
                        <>
                          <span>•</span>
                          <span>{session.patient.mrn}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusStyle(
                      session.status,
                    )}`}
                  >
                    {getStatusIcon(session.status)}
                    <span>{getStatusText(session.status)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 p-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/appointments")}
              className={`flex cursor-pointer items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-dark ${
                isRTL ? "justify-start" : "justify-end"
              }`}
            >
              {t(
                "dashboard.recentSessions.viewAll",
                isRTL ? "عرض الكل" : "View All",
              )}

              <Eye className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* الرسم البياني والإجراءات السريعة */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-center text-base font-bold text-slate-800">
              {t(
                "dashboard.charts.weeklyActivity",
                isRTL ? "نشاط الأسبوع" : "Weekly Activity",
              )}
            </h3>

            <div className="flex h-48 items-end justify-between gap-2">
              {chartData.map((item) => (
                <div
                  key={item.date}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div
                    className="w-full cursor-pointer rounded-t-md bg-primary transition-all hover:bg-primary-dark"
                    style={{
                      height: `${Math.max(
                        (item.sessions / maxValue) * 100,
                        5,
                      )}%`,
                      minHeight: "8px",
                    }}
                    title={`${formatNumber(item.sessions)} ${
                      isRTL ? "جلسات" : "sessions"
                    } / ${formatNumber(item.approved)} ${
                      isRTL ? "معتمدة" : "approved"
                    }`}
                  />

                  <span className="text-xs text-slate-400">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-center text-base font-bold text-slate-800">
              {t(
                "dashboard.quickActions.title",
                isRTL ? "إجراءات سريعة" : "Quick Actions",
              )}
            </h3>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard/new-session")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-dark"
              >
                <Mic className="h-5 w-5" />

                {t(
                  "dashboard.quickActions.newSession",
                  isRTL ? "بدء جلسة جديدة" : "Start New Session",
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/dashboard/appointments")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <FolderOpen className="h-5 w-5" />

                {t(
                  "dashboard.quickActions.viewSessions",
                  isRTL ? "عرض الجلسات" : "View Sessions",
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;

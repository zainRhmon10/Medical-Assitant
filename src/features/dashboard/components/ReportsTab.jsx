import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getAllFinalizedReports } from "../../reports/services/reportApi";

const ReportsTab = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language?.startsWith("ar");

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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

  const getPatientName = (patient) => {
    if (!patient) {
      return t(
        "reports.unknownPatient",
        isRTL ? "مريض غير معروف" : "Unknown Patient",
      );
    }

    const fullName =
      `${patient.first_name || ""} ${patient.last_name || ""}`.trim();

    return (
      fullName ||
      t("reports.unknownPatient", isRTL ? "مريض غير معروف" : "Unknown Patient")
    );
  };

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const response = await getAllFinalizedReports();
      const rows = response?.data?.finalized_reports;

      if (!Array.isArray(rows)) {
        throw new Error("Invalid finalized reports response");
      }

      setReports(rows);
    } catch (error) {
      console.error(
        "GET ALL FINALIZED REPORTS ERROR:",
        error.response?.data || error.message,
      );

      setLoadError(
        error.response?.data?.message ||
          t(
            "dashboard.reports.loadError",
            isRTL
              ? "تعذر تحميل التقارير المعتمدة."
              : "Couldn't load finalized reports.",
          ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [isRTL, t]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const openFinalReport = (report) => {
    const sessionId = Number(report?.clinical_session_id);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return;
    }

    navigate(`/dashboard/reports/${sessionId}/final`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className={isRTL ? "text-right" : "text-left"}>
          <h1 className="text-2xl font-bold text-slate-800">
            {t("dashboard.reports.title", "التقارير المعتمدة")}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {t("dashboard.reports.subtitle", "جميع التقارير الطبية المعتمدة")}
          </p>
        </div>

        <button
          type="button"
          onClick={loadReports}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          <span>
            {t("dashboard.reports.refresh", isRTL ? "تحديث" : "Refresh")}
          </span>
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />

            <p className="text-sm">
              {t(
                "dashboard.reports.loading",
                isRTL
                  ? "جارٍ تحميل التقارير المعتمدة..."
                  : "Loading finalized reports...",
              )}
            </p>
          </div>
        ) : loadError ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle className="h-6 w-6" />
            </div>

            <h3 className="font-bold text-slate-800">
              {t(
                "dashboard.reports.loadErrorTitle",
                isRTL ? "تعذر تحميل التقارير" : "Couldn't Load Reports",
              )}
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-500">{loadError}</p>

            <button
              type="button"
              onClick={loadReports}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              <RefreshCw className="h-4 w-4" />

              {t(
                "dashboard.reports.retry",
                isRTL ? "إعادة المحاولة" : "Try Again",
              )}
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FileText className="h-6 w-6" />
            </div>

            <h3 className="font-bold text-slate-800">
              {t(
                "dashboard.reports.empty",
                isRTL ? "لا توجد تقارير معتمدة" : "No Finalized Reports",
              )}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {t(
                "dashboard.reports.emptyHint",
                isRTL
                  ? "ستظهر هنا التقارير بعد اعتمادها بشكل نهائي."
                  : "Reports will appear here after they are finalized.",
              )}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((report) => (
              <button
                type="button"
                key={report.id}
                onClick={() => openFinalReport(report)}
                className="group flex w-full items-center justify-between gap-4 p-5 text-start transition-colors hover:bg-slate-50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 truncate text-sm font-bold text-slate-800">
                      {getPatientName(report.patient)}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>
                        {t(
                          "dashboard.reports.sessionNumber",
                          isRTL ? "رقم الجلسة" : "Session Number",
                        )}{" "}
                        #{report.clinical_session_id}
                      </span>

                      <span>•</span>

                      <span>{formatDate(report.finalized_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />

                    <span className="text-xs font-medium">
                      {t("dashboard.reports.approved", "معتمدة")}
                    </span>
                  </div>

                  <div className="rounded-lg p-2 text-slate-400 transition-colors group-hover:bg-primary/5 group-hover:text-primary">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;

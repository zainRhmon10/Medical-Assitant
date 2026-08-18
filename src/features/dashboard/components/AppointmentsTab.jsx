import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Loader2,
  FileAudio,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  getClinicalSessions,
  retryClinicalSession,
} from "../../create_session/services/sessionApi";

import { getApiErrorMessage } from "../../auth/services/authApi";
const AppointmentsTab = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language?.startsWith("ar");

  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [retryingSessionId, setRetryingSessionId] = useState(null);

  // GET /api/doctor/sessions
  const loadSessions = useCallback(
    async ({ page = currentPage, showLoading = true } = {}) => {
      if (showLoading) {
        setIsLoading(true);
      }
      setError("");

      try {
        const response = await getClinicalSessions({
          status: statusFilter,
          page,
          perPage: 20,
        });

        const paginator = response?.data;
        const rows = Array.isArray(paginator?.data) ? paginator.data : [];
        setSessions(rows);
        setCurrentPage(Number(paginator?.current_page || page));
        setLastPage(Number(paginator?.last_page || 1));
        setTotal(Number(paginator?.total || rows.length));
      } catch (err) {
        console.error(
          "LOAD CLINICAL SESSIONS ERROR:",
          err.response?.data || err.message,
        );

        setSessions([]);
        setError(
          getApiErrorMessage(
            err,

            t("dashboard.sessions.loadError"),
          ),
        );
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },

    [currentPage, statusFilter, t],
  );

  useEffect(() => {
    loadSessions({
      page: 1,
    });
  }, [statusFilter]);

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "-";
    }
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return new Intl.DateTimeFormat(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getPatientName = (session) => {
    const patient = session?.patient;

    if (!patient) {
      return "-";
    }

    return [patient.first_name, patient.last_name].filter(Boolean).join(" ");
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "queued":
        return t("dashboard.sessions.statuses.queued");

      case "running":
        return t("dashboard.sessions.statuses.running");

      case "complete":
        return t("dashboard.sessions.statuses.complete");

      case "failed":
        return t("dashboard.sessions.statuses.failed");

      default:
        return status || t("dashboard.sessions.statuses.unknown");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "complete":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";

      case "queued":
        return "bg-blue-50 text-blue-600 border border-blue-100";

      case "running":
        return "bg-amber-50 text-amber-600 border border-amber-100";

      case "failed":
        return "bg-red-50 text-red-600 border border-red-100";

      default:
        return "bg-slate-50 text-slate-600 border border-slate-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-3.5 w-3.5" />;

      case "queued":
        return <Clock3 className="h-3.5 w-3.5" />;

      case "running":
        return <Loader2 className="h-3.5 w-3.5 animate-spin" />;

      case "failed":
        return <AlertCircle className="h-3.5 w-3.5" />;

      default:
        return null;
    }
  };

  const handlePageChange = async (page) => {
    if (page < 1 || page > lastPage || page === currentPage) {
      return;
    }

    await loadSessions({
      page,
    });
  };

  const handleRetrySession = async (session) => {
    if (!session?.id || retryingSessionId) {
      return;
    }

    setRetryingSessionId(session.id);

    setError("");

    try {
      await retryClinicalSession(session.id);
      await loadSessions({
        page: currentPage,

        showLoading: false,
      });
    } catch (err) {
      console.error(
        "RETRY CLINICAL SESSION ERROR:",
        err.response?.data || err.message,
      );

      setError(
        getApiErrorMessage(
          err,

          t("dashboard.sessions.retryError"),
        ),
      );
    } finally {
      setRetryingSessionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/*  Header */}

      <div className={isRTL ? "text-right" : "text-left"}>
        <h1 className="text-2xl font-bold text-slate-800">
          {t("dashboard.sessions.title")}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {t("dashboard.sessions.subtitle")}
        </p>
      </div>

      {/*  Toolbar  */}

      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="
              min-w-[190px]
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              text-sm
              text-slate-700
              outline-none
              transition
              focus:border-primary
              focus:ring-2
              focus:ring-primary/20
            "
          >
            <option value="">{t("dashboard.sessions.allStatuses")}</option>

            <option value="queued">
              {t("dashboard.sessions.statuses.queued")}
            </option>

            <option value="running">
              {t("dashboard.sessions.statuses.running")}
            </option>

            <option value="complete">
              {t("dashboard.sessions.statuses.complete")}
            </option>

            <option value="failed">
              {t("dashboard.sessions.statuses.failed")}
            </option>
          </select>

          {/* Refresh */}

          <button
            type="button"
            onClick={() =>
              loadSessions({
                page: currentPage,
              })
            }
            disabled={isLoading}
            className="
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              text-sm
              font-medium
              text-slate-600
              transition
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />

            {t("dashboard.sessions.refresh")}
          </button>
        </div>

        {/* New Session */}

        <button
          type="button"
          onClick={() => navigate("/dashboard/new-session")}
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-primary
            px-4
            py-2.5
            text-sm
            font-medium
            text-white
            shadow-sm
            transition
            hover:opacity-90
          "
        >
          <Plus className="h-4 w-4" />

          {t("dashboard.sessions.newSession")}
        </button>
      </div>

      {/*  Total  */}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {t("dashboard.sessions.total", {
            count: total,
          })}
        </p>
      </div>

      {/*  Error */}

      {error && (
        <div
          className="
            flex
            items-start
            gap-2
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-red-600
          "
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <p className="text-sm">{error}</p>
        </div>
      )}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-100
          bg-white
          shadow-sm
        "
      >
        {isLoading ? (
          /* Loading */

          <div
            className="
              flex
              min-h-[320px]
              flex-col
              items-center
              justify-center
              gap-3
            "
          >
            <Loader2 className="h-7 w-7 animate-spin text-primary" />

            <p className="text-sm text-slate-500">
              {t("dashboard.sessions.loading")}
            </p>
          </div>
        ) : sessions.length === 0 ? (
          /* Empty */

          <div
            className="
              flex
              min-h-[320px]
              flex-col
              items-center
              justify-center
              gap-3
              px-6
              text-center
            "
          >
            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                bg-slate-50
              "
            >
              <FileAudio className="h-6 w-6 text-slate-400" />
            </div>

            <p className="font-semibold text-slate-700">
              {t("dashboard.sessions.empty")}
            </p>

            <p className="max-w-md text-sm text-slate-400">
              {t("dashboard.sessions.emptyHint")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="
                    border-b
                    border-slate-100
                    bg-slate-50/50
                  "
                >
                  <th
                    className="
                      px-6
                      py-4
                      text-start
                      text-xs
                      font-semibold
                      text-slate-600
                    "
                  >
                    {t("dashboard.sessions.sessionNumber")}
                  </th>

                  <th
                    className="
                      px-6
                      py-4
                      text-start
                      text-xs
                      font-semibold
                      text-slate-600
                    "
                  >
                    {t("dashboard.sessions.patient")}
                  </th>

                  <th
                    className="
                      px-6
                      py-4
                      text-start
                      text-xs
                      font-semibold
                      text-slate-600
                    "
                  >
                    {t("dashboard.sessions.date")}
                  </th>

                  <th
                    className="
                      px-6
                      py-4
                      text-start
                      text-xs
                      font-semibold
                      text-slate-600
                    "
                  >
                    {t("dashboard.sessions.audio")}
                  </th>

                  <th
                    className="
                      px-6
                      py-4
                      text-start
                      text-xs
                      font-semibold
                      text-slate-600
                    "
                  >
                    {t("dashboard.sessions.stage")}
                  </th>

                  <th
                    className="
                      px-6
                      py-4
                      text-start
                      text-xs
                      font-semibold
                      text-slate-600
                    "
                  >
                    {t("dashboard.sessions.status")}
                  </th>

                  <th
                    className="
                      px-6
                      py-4
                      text-center
                      text-xs
                      font-semibold
                      text-slate-600
                    "
                  >
                    {t("dashboard.sessions.actions")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sessions.map((session) => {
                  const patient = session.patient;

                  const isRetrying = retryingSessionId === session.id;

                  return (
                    <tr
                      key={session.id}
                      className="
                          transition-colors
                          hover:bg-slate-50/50
                        "
                    >
                      {/* Session ID */}

                      <td className="px-6 py-4">
                        <span
                          className="
                              font-mono
                              text-sm
                              font-semibold
                              text-slate-700
                            "
                          dir="ltr"
                        >
                          #{session.id}
                        </span>
                      </td>

                      {/* Patient */}

                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {getPatientName(session)}
                          </p>

                          <p
                            className="
                                mt-0.5
                                text-xs
                                text-slate-400
                              "
                            dir="ltr"
                          >
                            {patient?.mrn || `#${session.patient_id}`}
                          </p>
                        </div>
                      </td>

                      {/* Visit Date */}

                      <td className="px-6 py-4">
                        <p className="whitespace-nowrap text-sm text-slate-600">
                          {formatDateTime(session.visit_at)}
                        </p>
                      </td>

                      {/* Audio */}

                      <td className="px-6 py-4">
                        <div
                          className="
                              flex
                              max-w-[200px]
                              items-center
                              gap-2
                            "
                        >
                          <FileAudio className="h-4 w-4 shrink-0 text-slate-400" />

                          <span
                            className="
                                truncate
                                text-sm
                                text-slate-600
                              "
                            title={session.original_filename || ""}
                          >
                            {session.original_filename || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Stage */}

                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {session.stage || "-"}
                        </span>
                      </td>

                      {/* Status */}

                      <td className="px-6 py-4">
                        <div
                          className={`
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              px-3
                              py-1.5
                              text-xs
                              font-medium

                              ${getStatusStyle(session.status)}
                            `}
                        >
                          {getStatusIcon(session.status)}

                          <span>{getStatusLabel(session.status)}</span>
                        </div>

                        {/* AI Error */}

                        {session.status === "failed" && session.ai_error && (
                          <p
                            className="
                                mt-1.5
                                max-w-[190px]
                                truncate
                                text-xs
                                text-red-400
                              "
                            title={session.ai_error}
                          >
                            {session.ai_error}
                          </p>
                        )}
                      </td>

                      {/* Actions */}

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          {session.status === "failed" ? (
                            <button
                              type="button"
                              onClick={() => handleRetrySession(session)}
                              disabled={isRetrying}
                              title={t("dashboard.sessions.retry")}
                              className="
                                  flex
                                  items-center
                                  gap-1.5
                                  rounded-lg
                                  border
                                  border-slate-200
                                  px-3
                                  py-2
                                  text-xs
                                  font-medium
                                  text-slate-600
                                  transition
                                  hover:border-primary/30
                                  hover:bg-primary/5
                                  hover:text-primary
                                  disabled:cursor-not-allowed
                                  disabled:opacity-50
                                "
                            >
                              {isRetrying ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5" />
                              )}

                              {isRetrying
                                ? t("dashboard.sessions.retrying")
                                : t("dashboard.sessions.retry")}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}

        {!isLoading && sessions.length > 0 && (
          <div
            className="
              flex
              flex-col
              gap-3
              border-t
              border-slate-100
              px-6
              py-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <p className="text-xs text-slate-500">
              {t("dashboard.sessions.page", {
                current: currentPage,

                last: lastPage,
              })}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-slate-200
                  text-slate-500
                  transition
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                {isRTL ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>

              <div
                className="
                  flex
                  h-9
                  min-w-9
                  items-center
                  justify-center
                  rounded-lg
                  bg-primary
                  px-3
                  text-xs
                  font-semibold
                  text-white
                "
              >
                {currentPage}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= lastPage}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-slate-200
                  text-slate-500
                  transition
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                {isRTL ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsTab;

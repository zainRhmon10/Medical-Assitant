import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Baby,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileAudio,
  FileText,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
  Tag,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import { getPatientTimeline } from "../services/patientApi";

import { getApiErrorMessage } from "../../auth/services/authApi";

const extractTimelinePayload = (payload) => {
  if (payload?.timeline && !Array.isArray(payload.timeline)) {
    return payload.timeline;
  }
  if (payload?.data?.timeline && !Array.isArray(payload.data.timeline)) {
    return payload.data.timeline;
  }

  return {
    visits: 0,
    obstetric_state: null,
    state_history: [],
    timeline: [],
  };
};

const extractTimelineEntries = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  const candidates = [
    payload?.timeline?.timeline,
    payload?.data?.timeline?.timeline,
    payload?.timeline?.items,
    payload?.timeline?.events,
    payload?.data?.timeline?.items,
    payload?.data?.timeline?.events,

    payload?.history,
    payload?.events,
    payload?.items,
  ];

  const found = candidates.find(Array.isArray);

  return found || [];
};

const PatientTimeline = ({ patientId }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language?.toLowerCase().startsWith("ar");
  const [timeline, setTimeline] = useState([]);
  const [timelineMeta, setTimelineMeta] = useState({
    visits: 0,
    obstetric_state: null,
    state_history: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const loadTimeline = useCallback(async () => {
    if (!patientId) {
      return;
    }
    setIsLoading(true);
    setApiError("");

    try {
      const response = await getPatientTimeline(patientId);
      const payload = response?.data;
      console.log("PATIENT TIMELINE RESPONSE:", payload);
      const entries = extractTimelineEntries(payload);
      const meta = extractTimelinePayload(payload);
      setTimeline(entries);
      setTimelineMeta({
        visits: meta?.visits ?? entries.length,

        obstetric_state: meta?.obstetric_state || null,

        state_history: Array.isArray(meta?.state_history)
          ? meta.state_history
          : [],
      });
    } catch (error) {
      console.error(
        "GET PATIENT TIMELINE ERROR:",
        error.response?.data || error.message,
      );

      setTimeline([]);
      setTimelineMeta({
        visits: 0,
        obstetric_state: null,
        state_history: [],
      });

      setApiError(
        getApiErrorMessage(
          error,

          t("dashboard.patients.details.timeline.errors.loadFailed"),
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [patientId, t]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  /*
   * Format Date
   */

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(isRTL ? "ar" : "en", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  /*
   * Duration
   */
  const formatDuration = (value) => {
    const seconds = Number(value);
    if (Number.isNaN(seconds)) {
      return "-";
    }
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.round(seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${remaining}`;
  };

  /*
   * Confidence
   */
  const formatConfidence = (value) => {
    const confidence = Number(value);

    if (Number.isNaN(confidence)) {
      return "-";
    }

    return `${(confidence * 100).toFixed(1)}%`;
  };

  /*
   * Session Status
   */

  const getStatusData = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "complete":
        return {
          label: t("dashboard.patients.details.timeline.status.complete"),

          className: "border-emerald-200 bg-emerald-50 text-emerald-700",

          icon: CheckCircle2,
        };

      case "failed":
        return {
          label: t("dashboard.patients.details.timeline.status.failed"),

          className: "border-red-200 bg-red-50 text-red-600",

          icon: AlertTriangle,
        };

      case "running":
        return {
          label: t("dashboard.patients.details.timeline.status.running"),

          className: "border-blue-200 bg-blue-50 text-blue-600",

          icon: Loader2,
        };

      case "queued":
        return {
          label: t("dashboard.patients.details.timeline.status.queued"),

          className: "border-slate-200 bg-slate-50 text-slate-600",

          icon: Clock3,
        };

      default:
        return {
          label: status || "-",

          className: "border-slate-200 bg-slate-50 text-slate-600",

          icon: Activity,
        };
    }
  };

  const getObstetricStatus = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "pregnant":
        return t("dashboard.patients.details.timeline.obstetric.pregnant");

      case "postpartum":
        return t("dashboard.patients.details.timeline.obstetric.postpartum");

      case "not_pregnant":
      case "not-pregnant":
        return t("dashboard.patients.details.timeline.obstetric.notPregnant");

      default:
        return status || "-";
    }
  };

  const getStateSource = (source) => {
    switch (String(source || "").toLowerCase()) {
      case "inferred":
        return t("dashboard.patients.details.timeline.obstetric.inferred");

      case "manual":
        return t("dashboard.patients.details.timeline.obstetric.manual");

      default:
        return source || "-";
    }
  };

  const getLabelName = (label) => {
    const normalized = String(label || "");
    return t(`dashboard.patients.details.timeline.labels.${normalized}`, {
      defaultValue: normalized.replaceAll("_", " "),
    });
  };

  const obstetricState = timelineMeta?.obstetric_state;

  const visitsCount = useMemo(() => {
    return timelineMeta?.visits ?? timeline.length;
  }, [timelineMeta, timeline]);

  if (isLoading) {
    return (
      <div
        className="
          rounded-2xl
          border
          border-slate-100
          bg-white
          p-6
          shadow-sm
        "
      >
        <div className="mb-6 flex items-center gap-3">
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-primary/10
              text-primary
            "
          >
            <Activity className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {t("dashboard.patients.details.timeline.title")}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {t("dashboard.patients.details.timeline.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex min-h-[180px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />

            <p className="text-xs text-slate-400">
              {t("dashboard.patients.details.timeline.loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div
        className="
          rounded-2xl
          border
          border-slate-100
          bg-white
          p-6
          shadow-sm
        "
      >
        <div className="mb-5 flex items-center gap-3">
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-primary/10
              text-primary
            "
          >
            <Activity className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {t("dashboard.patients.details.timeline.title")}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {t("dashboard.patients.details.timeline.subtitle")}
            </p>
          </div>
        </div>

        <div
          className="
            rounded-xl
            border
            border-red-100
            bg-red-50
            p-5
            text-center
          "
        >
          <p className="text-sm text-red-600">{apiError}</p>

          <button
            type="button"
            onClick={loadTimeline}
            className="
              mt-4
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-white
              px-4
              py-2
              text-xs
              font-semibold
              text-red-600
              shadow-sm
            "
          >
            <RefreshCw className="h-4 w-4" />

            {t("dashboard.patients.details.timeline.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div
        className="
          rounded-2xl
          border
          border-slate-100
          bg-white
          p-6
          shadow-sm
        "
      >
        <div className="mb-6 flex items-center gap-3">
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-primary/10
              text-primary
            "
          >
            <Activity className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {t("dashboard.patients.details.timeline.title")}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {t("dashboard.patients.details.timeline.subtitle")}
            </p>
          </div>
        </div>

        <div
          className="
            flex
            min-h-[180px]
            flex-col
            items-center
            justify-center
            rounded-xl
            border
            border-dashed
            border-slate-200
            bg-slate-50/50
            p-6
            text-center
          "
        >
          <Stethoscope className="mb-3 h-6 w-6 text-slate-300" />

          <p className="text-sm font-semibold text-slate-600">
            {t("dashboard.patients.details.timeline.empty")}
          </p>

          <p className="mt-1 max-w-md text-xs leading-6 text-slate-400">
            {t("dashboard.patients.details.timeline.emptyHint")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {obstetricState && (
        <div
          className="
            rounded-2xl
            border
            border-primary/10
            bg-primary/5
            p-5
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              md:flex-row
              md:items-center
              md:justify-between
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white
                  text-primary
                  shadow-sm
                "
              >
                <Baby className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  {t(
                    "dashboard.patients.details.timeline.obstetric.currentState",
                  )}
                </p>

                <p className="mt-1 font-bold text-slate-800">
                  {getObstetricStatus(obstetricState?.status)}
                </p>
              </div>
            </div>

            <div
              className="
                grid
                grid-cols-1
                gap-3
                text-xs
                sm:grid-cols-2
              "
            >
              <div>
                <p className="text-slate-400">
                  {t("dashboard.patients.details.timeline.obstetric.source")}
                </p>

                <p className="mt-1 font-semibold text-slate-600">
                  {getStateSource(obstetricState?.source)}
                </p>
              </div>

              <div>
                <p className="text-slate-400">
                  {t(
                    "dashboard.patients.details.timeline.obstetric.effectiveAt",
                  )}
                </p>

                <p className="mt-1 font-semibold text-slate-600">
                  {formatDate(obstetricState?.effective_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="
          rounded-2xl
          border
          border-slate-100
          bg-white
          p-6
          shadow-sm
        "
      >
        {/* Header */}

        <div
          className="
            mb-7
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-primary/10
                text-primary
              "
            >
              <Activity className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-800">
                {t("dashboard.patients.details.timeline.title")}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {t("dashboard.patients.details.timeline.visitCount", {
                  count: visitsCount,
                })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadTimeline}
            title={t("dashboard.patients.details.timeline.refresh")}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              border
              border-slate-200
              text-slate-400
              transition
              hover:border-primary/20
              hover:text-primary
            "
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/*Visit Timeline  */}

        <div className="relative">
          <div
            className={`
              absolute
              bottom-6
              top-6
              w-px
              bg-slate-200

              ${isRTL ? "right-[17px]" : "left-[17px]"}
            `}
          />

          <div className="space-y-7">
            {timeline.map((entry, index) => {
              const sessionId =
                entry?.clinical_session_id ?? entry?.session_id ?? null;

              const statusData = getStatusData(entry?.status);

              const StatusIcon = statusData.icon;

              const topLabels = Array.isArray(entry?.top_labels)
                ? entry.top_labels
                : [];

              return (
                <div key={sessionId || index} className="relative flex gap-4">
                  {/* Timeline Point */}

                  <div
                    className="
                        relative
                        z-10
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        border-4
                        border-white
                        bg-primary
                        text-white
                        shadow-sm
                      "
                  >
                    <Stethoscope className="h-3.5 w-3.5" />
                  </div>

                  {/* Visit Card */}

                  <div
                    className="
                        min-w-0
                        flex-1
                        overflow-hidden
                        rounded-2xl
                        border
                        border-slate-100
                        bg-white
                        shadow-sm
                      "
                  >
                    {/* Visit Header */}

                    <div
                      className="
                          flex
                          flex-col
                          gap-3
                          border-b
                          border-slate-100
                          bg-slate-50/40
                          px-5
                          py-4
                          sm:flex-row
                          sm:items-center
                          sm:justify-between
                        "
                    >
                      <div>
                        <h3 className="font-bold text-slate-800">
                          {t(
                            "dashboard.patients.details.timeline.clinicalVisit",
                          )}

                          {sessionId ? ` #${sessionId}` : ""}
                        </h3>

                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                          <CalendarDays className="h-3.5 w-3.5" />

                          {formatDate(entry?.visit_at || entry?.created_at)}
                        </div>
                      </div>

                      <span
                        className={`
                            inline-flex
                            w-fit
                            items-center
                            gap-1.5
                            rounded-full
                            border
                            px-3
                            py-1.5
                            text-xs
                            font-semibold

                            ${statusData.className}
                          `}
                      >
                        <StatusIcon
                          className={`
                              h-3.5
                              w-3.5

                              ${
                                entry?.status === "running"
                                  ? "animate-spin"
                                  : ""
                              }
                            `}
                        />

                        {statusData.label}
                      </span>
                    </div>

                    {/* Audio */}

                    <div className="px-5 pt-5">
                      <div
                        className="
                            flex
                            flex-wrap
                            items-center
                            gap-x-5
                            gap-y-2
                            rounded-xl
                            border
                            border-slate-100
                            bg-slate-50/50
                            px-4
                            py-3
                          "
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileAudio className="h-4 w-4 shrink-0 text-primary" />

                          <span
                            className="
                                truncate
                                text-sm
                                font-medium
                                text-slate-700
                              "
                          >
                            {entry?.filename || "-"}
                          </span>
                        </div>

                        <div
                          className="
                              flex
                              items-center
                              gap-1.5
                              text-xs
                              text-slate-400
                            "
                          dir="ltr"
                        >
                          <Clock3 className="h-3.5 w-3.5" />

                          {formatDuration(entry?.duration_sec)}
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}

                    <div
                      className="
                          grid
                          grid-cols-2
                          gap-3
                          p-5
                          md:grid-cols-4
                        "
                    >
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] text-slate-400">
                          {t("dashboard.patients.details.timeline.stats.items")}
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-800">
                          {entry?.total_segments ?? 0}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] text-slate-400">
                          {t(
                            "dashboard.patients.details.timeline.stats.confidence",
                          )}
                        </p>

                        <p className="mt-1 text-lg font-bold text-primary">
                          {formatConfidence(entry?.avg_confidence)}
                        </p>
                      </div>

                      <div
                        className="
                            rounded-xl
                            border
                            border-amber-100
                            bg-amber-50/60
                            p-3
                          "
                      >
                        <div className="flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-3.5 w-3.5" />

                          <p className="text-[11px]">
                            {t(
                              "dashboard.patients.details.timeline.stats.review",
                            )}
                          </p>
                        </div>

                        <p className="mt-1 text-lg font-bold text-amber-600">
                          {entry?.low_confidence_count ?? 0}
                        </p>
                      </div>

                      <div
                        className="
                            rounded-xl
                            border
                            border-red-100
                            bg-red-50/50
                            p-3
                          "
                      >
                        <div className="flex items-center gap-1 text-red-500">
                          <ShieldAlert className="h-3.5 w-3.5" />

                          <p className="text-[11px]">
                            {t(
                              "dashboard.patients.details.timeline.stats.urgent",
                            )}
                          </p>
                        </div>

                        <p className="mt-1 text-lg font-bold text-red-600">
                          {entry?.urgent_count ?? 0}
                        </p>
                      </div>
                    </div>

                    {/* Top Labels */}

                    {topLabels.length > 0 && (
                      <div className="border-t border-slate-100 px-5 py-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Tag className="h-4 w-4 text-slate-400" />

                          <p className="text-xs font-semibold text-slate-600">
                            {t("dashboard.patients.details.timeline.topLabels")}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {topLabels.map((labelItem, labelIndex) => {
                            const [label, count] = labelItem;

                            return (
                              <span
                                key={`${label}-${labelIndex}`}
                                className="
                                      rounded-full
                                      border
                                      border-slate-100
                                      bg-slate-50
                                      px-3
                                      py-1.5
                                      text-xs
                                      text-slate-600
                                    "
                              >
                                {getLabelName(label)}

                                {" × "}

                                {count}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Footer */}

                    {sessionId && entry?.status === "complete" && (
                      <div
                        className="
                            flex
                            justify-end
                            border-t
                            border-slate-100
                            bg-slate-50/30
                            px-5
                            py-4
                          "
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/dashboard/reports/${sessionId}`)
                          }
                          className="
                              inline-flex
                              items-center
                              gap-2
                              rounded-xl
                              bg-primary
                              px-4
                              py-2.5
                              text-xs
                              font-semibold
                              text-white
                              transition
                              hover:opacity-90
                            "
                        >
                          <FileText className="h-4 w-4" />

                          {t("dashboard.patients.details.timeline.openReport")}

                          {isRTL ? (
                            <ArrowLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientTimeline;

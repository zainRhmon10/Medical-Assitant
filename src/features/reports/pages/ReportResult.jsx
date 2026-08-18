import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  User,
  FileAudio,
  CalendarDays,
  ClipboardCheck,
  Baby,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Languages,
  Clock3,
} from "lucide-react";

import SoapReport from "../components/SoapReport";
import FullSessionAudio from "../components/FullSessionAudio";
import ReviewQueue from "../components/ReviewQueue";
import Suggestions from "../components/Suggestions";
import FinalizeSection from "../components/FinalizeSection";
import { getClinicalReport } from "../services/reportApi";
import { getClinicalSession } from "../../create_session/services/sessionApi";
import { getApiErrorMessage } from "../../auth/services/authApi";

const ReportResult = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { reportId } = useParams();
  const isRTL = i18n.language?.toLowerCase().startsWith("ar");
  const [report, setReport] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [suggestionsRefreshKey, setSuggestionsRefreshKey] = useState(0);

  const [finalizedReport, setFinalizedReport] = useState(null);

  const reviewQueueRef = useRef(null);

  /*
   * Load Report
   */

  const loadReport = useCallback(
    async (showLoading = true) => {
      if (!reportId) {
        setError(t("reports.errors.invalidSession"));

        if (showLoading) {
          setIsLoading(false);
        }
        return;
      }

      if (showLoading) {
        setIsLoading(true);
      }
      setError("");

      try {
        const [reportResult, sessionResult] = await Promise.allSettled([
          getClinicalReport(reportId),

          getClinicalSession(reportId),
        ]);

        if (reportResult.status === "rejected") {
          throw reportResult.reason;
        }

        const reportResponse = reportResult.value;

        const reportData =
          reportResponse?.data?.report ||
          reportResponse?.data?.data?.report ||
          null;

        if (!reportData) {
          throw new Error("Invalid report response.");
        }

        setReport(reportData);

        if (sessionResult.status === "fulfilled") {
          const sessionResponse = sessionResult.value;

          const sessionData =
            sessionResponse?.data?.session ||
            sessionResponse?.data?.data?.session ||
            null;

          setSession(sessionData);
        }
      } catch (err) {
        console.error(
          "LOAD CLINICAL REPORT ERROR:",
          err.response?.data || err.message,
        );
        if (showLoading) {
          setError(
            getApiErrorMessage(
              err,

              t("reports.errors.loadFailed"),
            ),
          );
        }
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },

    [reportId, t],
  );

  useEffect(() => {
    loadReport(true);
  }, [loadReport]);

  const handleCorrectionSaved = useCallback(async () => {
    await loadReport(false);

    setSuggestionsRefreshKey((previous) => previous + 1);
  }, [loadReport]);

  const patientName = useMemo(() => {
    const patient = session?.patient;

    if (!patient) {
      return t("reports.unknownPatient");
    }
    const name = [patient.first_name, patient.last_name]
      .filter(Boolean)
      .join(" ");

    return name || t("reports.unknownPatient");
  }, [session, t]);
  const patientMrn = session?.patient?.mrn || report?.patient_info?.mrn || null;
  const patientInfo = report?.patient_info || {};
  const summary = report?.summary || {};
  const audio = report?.audio || {};
  const clinicalSessionId = report?.clinical_session_id || reportId;
  const isFinalized = Boolean(finalizedReport);

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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDuration = (seconds) => {
    const value = Number(seconds);

    if (Number.isNaN(value)) {
      return "-";
    }

    const minutes = Math.floor(value / 60);

    const remainingSeconds = Math.round(value % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
  };

  /*
   * Confidence
   */

  const formatConfidence = (value) => {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return "-";
    }

    return `${(number * 100).toFixed(1)}%`;
  };

  /*
   * Pregnancy State
   */

  const getPregnancyStatus = () => {
    if (patientInfo.postpartum) {
      return t("reports.patientState.postpartum");
    }

    if (patientInfo.pregnant) {
      return t("reports.patientState.pregnant");
    }

    if (patientInfo.pregnant === false) {
      return t("reports.patientState.notPregnant");
    }

    return "-";
  };

  /*
   * Trimester
   */

  const getTrimesterLabel = () => {
    const trimester = Number(patientInfo.trimester);

    switch (trimester) {
      case 1:
        return t("reports.patientState.firstTrimester");

      case 2:
        return t("reports.patientState.secondTrimester");

      case 3:
        return t("reports.patientState.thirdTrimester");

      default:
        return "-";
    }
  };

  /*
   * Scroll To Review Queue
   */
  const scrollToReviewQueue = () => {
    reviewQueueRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /*
   * Loading
   */

  if (isLoading) {
    return (
      <div
        className="
          flex
          min-h-[500px]
          flex-col
          items-center
          justify-center
          gap-4
        "
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />

        <div className="text-center">
          <p className="font-semibold text-slate-700">{t("reports.loading")}</p>

          <p className="mt-1 text-sm text-slate-400">
            {t("reports.loadingHint")}
          </p>
        </div>
      </div>
    );
  }

  /*
   * Error
   */

  if (error) {
    return (
      <div
        className="
          flex
          min-h-[500px]
          flex-col
          items-center
          justify-center
          gap-4
          text-center
        "
      >
        <div
          className="
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-full
            bg-red-50
          "
        >
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>

        <div>
          <h2 className="font-bold text-slate-800">
            {t("reports.errors.title")}
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-red-500">
            {error}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard/appointments")}
          className="
            rounded-xl
            bg-primary
            px-5
            py-2.5
            text-sm
            font-semibold
            text-white
          "
        >
          {t("reports.backToSessions")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/*  Header */}

      <div
        className="
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-start
          lg:justify-between
        "
      >
        <div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/appointments")}
            className="
              mb-3
              flex
              items-center
              gap-2
              text-sm
              text-slate-500
              transition
              hover:text-primary
            "
          >
            {isRTL ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}

            {t("reports.backToSessions")}
          </button>

          <h1 className="text-2xl font-bold text-slate-800">
            {t("reports.title")}
          </h1>

          <p className="mt-1 text-sm text-slate-500">{t("reports.subtitle")}</p>
        </div>

        <div
          className="
            inline-flex
            w-fit
            items-center
            gap-2
            rounded-full
            border
            border-amber-200
            bg-amber-50
            px-4
            py-2
            text-sm
            font-medium
            text-amber-700
          "
        >
          <ClipboardCheck className="h-4 w-4" />

          {isFinalized
            ? t("reports.finalize.finalizedBadge")
            : t("reports.draft")}
        </div>
      </div>

      {/* Patient / Session Information  */}

      <div
        className="
          grid
          grid-cols-1
          gap-4
          rounded-2xl
          border
          border-slate-100
          bg-white
          p-5
          shadow-sm
          md:grid-cols-2
          xl:grid-cols-4
        "
      >
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <User className="h-3.5 w-3.5" />

            {t("reports.patient")}
          </div>

          <p className="mt-1.5 font-semibold text-slate-800">{patientName}</p>

          {patientMrn && (
            <p className="mt-0.5 text-xs text-slate-400" dir="ltr">
              {patientMrn}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs text-slate-400">{t("reports.sessionId")}</p>

          <p
            className="mt-1.5 font-mono font-semibold text-slate-800"
            dir="ltr"
          >
            #{clinicalSessionId}
          </p>

          {patientInfo?.visit_index && (
            <p className="mt-0.5 text-xs text-slate-400">
              {t("reports.visitNumber", {
                number: patientInfo.visit_index,
              })}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <FileAudio className="h-3.5 w-3.5" />

            {t("reports.audio")}
          </div>

          <p
            className="
              mt-1.5
              truncate
              font-semibold
              text-slate-800
            "
            title={audio.filename || ""}
          >
            {audio.filename || "-"}
          </p>

          <p className="mt-0.5 text-xs text-slate-400" dir="ltr">
            {formatDuration(audio.duration_sec)}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" />

            {t("reports.visitDate")}
          </div>

          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            {formatDate(patientInfo?.visit_at || report?.created_at)}
          </p>
        </div>
      </div>

      {/*  Pregnancy State  */}

      <div
        className="
          grid
          grid-cols-2
          gap-3
          rounded-2xl
          border
          border-slate-100
          bg-white
          p-5
          shadow-sm
          md:grid-cols-4
        "
      >
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Baby className="h-3.5 w-3.5" />

            {t("reports.patientState.status")}
          </div>

          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            {getPregnancyStatus()}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            {t("reports.patientState.gestationalAge")}
          </p>

          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            {patientInfo?.gestational_age_weeks
              ? t("reports.patientState.weeks", {
                  count: patientInfo.gestational_age_weeks,
                })
              : "-"}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            {t("reports.patientState.trimester")}
          </p>

          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            {getTrimesterLabel()}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Languages className="h-3.5 w-3.5" />

            {t("reports.detectedLanguage")}
          </div>

          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            {audio?.detected_language === "ar"
              ? t("reports.languages.arabic")
              : audio?.detected_language || "-"}
          </p>
        </div>
      </div>

      {/*  Summary */}

      <div
        className="
          grid
          grid-cols-2
          gap-3
          md:grid-cols-4
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-slate-100
            bg-white
            p-5
            shadow-sm
          "
        >
          <div className="flex items-center gap-2 text-slate-400">
            <Activity className="h-4 w-4" />

            <p className="text-xs">{t("reports.summary.total")}</p>
          </div>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {summary?.total_segments ?? 0}
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-100
            bg-white
            p-5
            shadow-sm
          "
        >
          <p className="text-xs text-slate-400">
            {t("reports.summary.confidence")}
          </p>

          <p className="mt-2 text-2xl font-bold text-primary">
            {formatConfidence(summary?.avg_confidence)}
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-amber-100
            bg-amber-50/40
            p-5
          "
        >
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" />

            <p className="text-xs">{t("reports.summary.review")}</p>
          </div>

          <p className="mt-2 text-2xl font-bold text-amber-600">
            {summary?.low_confidence_count ?? 0}
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-red-100
            bg-red-50/30
            p-5
          "
        >
          <div className="flex items-center gap-2 text-red-500">
            <ShieldAlert className="h-4 w-4" />

            <p className="text-xs">{t("reports.summary.urgent")}</p>
          </div>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {summary?.urgent_count ?? 0}
          </p>
        </div>
      </div>

      {/* Report Intro */}

      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
          rounded-xl
          border
          border-primary/10
          bg-primary/5
          px-5
          py-4
        "
      >
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {t("reports.soapReport")}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {t("reports.soapDescription")}
          </p>
        </div>

        <div
          className="
            flex
            items-center
            gap-1.5
            rounded-full
            bg-white
            px-3
            py-1.5
            text-xs
            text-slate-500
            shadow-sm
          "
        >
          <Clock3 className="h-3.5 w-3.5" />

          {formatDuration(audio.duration_sec)}
        </div>
      </div>

      {/* Full Session Audio */}

      <FullSessionAudio sessionId={clinicalSessionId} />

      {/*  SOAP */}

      <SoapReport report={report} />

      {/*  Review Notice  */}

      {Number(summary?.low_confidence_count || 0) > 0 && (
        <div
          className="
            flex
            flex-col
            gap-4
            rounded-xl
            border
            border-amber-200
            bg-amber-50
            px-5
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <div>
              <p className="text-sm font-semibold text-amber-700">
                {t("reports.reviewNotice.title", {
                  count: summary.low_confidence_count,
                })}
              </p>

              <p className="mt-1 text-xs leading-6 text-amber-600">
                {t("reports.reviewNotice.description")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={scrollToReviewQueue}
            className="
              shrink-0
              rounded-xl
              bg-amber-600
              px-4
              py-2.5
              text-xs
              font-semibold
              text-white
              transition
              hover:bg-amber-700
            "
          >
            {t("reports.reviewNotice.openQueue")}
          </button>
        </div>
      )}

      {/*  Review Queue*/}

      <div
        ref={reviewQueueRef}
        className={`scroll-mt-6 ${isFinalized ? "pointer-events-none opacity-70" : ""}`}
        aria-disabled={isFinalized}
      >
        <ReviewQueue
          sessionId={clinicalSessionId}
          onCorrectionSaved={handleCorrectionSaved}
        />
      </div>

      {/*  KBS Suggestions */}

      <div
        className={isFinalized ? "pointer-events-none opacity-70" : ""}
        aria-disabled={isFinalized}
      >
        <Suggestions
          sessionId={clinicalSessionId}
          refreshKey={suggestionsRefreshKey}
        />
      </div>

      {/* Finalization  */}

      <FinalizeSection
        sessionId={clinicalSessionId}
        onFinalizedChange={setFinalizedReport}
      />

      {/*  Draft Notice  */}

      {!isFinalized && (
        <div
          className="
            rounded-xl
            border
            border-slate-100
            bg-slate-50
            px-5
            py-4
          "
        >
          <p className="text-sm leading-7 text-slate-500">
            {t("reports.draftNotice")}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportResult;

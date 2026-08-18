import React from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock3,
  BrainCircuit,
  FileAudio,
} from "lucide-react";

const StepProcessing = ({
  session,
  isCreating,
  isRetrying,
  error,

  onRetryCreate,
  onRetrySession,
  onRetryPoll,
}) => {
  const { t } = useTranslation();
  const status = String(session?.status || "").toLowerCase();
  const isQueued = status === "queued";
  const isRunning = status === "running";
  const isComplete = status === "complete";
  const isFailed = status === "failed";

  const getStatusLabel = () => {
    if (isCreating) {
      return t("createSession.processing.creating");
    }
    switch (status) {
      case "queued":
        return t("createSession.processing.status.queued");

      case "running":
        return t("createSession.processing.status.running");

      case "complete":
        return t("createSession.processing.status.complete");

      case "failed":
        return t("createSession.processing.status.failed");

      default:
        return t("createSession.processing.status.waiting");
    }
  };

  const renderStatusIcon = () => {
    if (isCreating || isQueued || isRunning || isRetrying) {
      return <Loader2 className="h-9 w-9 animate-spin text-primary" />;
    }
    if (isComplete) {
      return <CheckCircle2 className="h-10 w-10 text-emerald-500" />;
    }
    if (isFailed || error) {
      return <AlertCircle className="h-10 w-10 text-red-500" />;
    }

    return <Clock3 className="h-9 w-9 text-slate-400" />;
  };

  /*
   * Retry Button
   */

  const renderRetryButton = () => {
    if (isRetrying || isCreating) {
      return null;
    }

    if (session?.id && isFailed) {
      return (
        <button
          type="button"
          onClick={onRetrySession}
          className="
              mt-5
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-primary
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:opacity-90
            "
        >
          <RefreshCw className="h-4 w-4" />

          {t("createSession.processing.retryProcessing")}
        </button>
      );
    }

    if (session?.id && error) {
      return (
        <button
          type="button"
          onClick={onRetryPoll}
          className="
              mt-5
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-primary
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:opacity-90
            "
        >
          <RefreshCw className="h-4 w-4" />

          {t("createSession.processing.retryCheck")}
        </button>
      );
    }

    if (!session?.id && error) {
      return (
        <button
          type="button"
          onClick={onRetryCreate}
          className="
              mt-5
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-primary
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:opacity-90
            "
        >
          <RefreshCw className="h-4 w-4" />

          {t("createSession.processing.retryUpload")}
        </button>
      );
    }

    return null;
  };

  return (
    <div className="my-10 space-y-5">
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
        <div className="flex flex-col items-center px-6 py-10 text-center">
          {/* Icon */}

          <div
            className="
              mb-5
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-full
              bg-slate-50
            "
          >
            {renderStatusIcon()}
          </div>

          {/* Title */}

          <h2 className="text-lg font-bold text-slate-800">
            {isComplete
              ? t("createSession.processing.completeTitle")
              : isFailed
                ? t("createSession.processing.failedTitle")
                : t("createSession.processing.title")}
          </h2>

          {/* Status */}

          <p
            className={`
              mt-2
              text-sm
              font-medium

              ${
                isComplete
                  ? "text-emerald-600"
                  : isFailed
                    ? "text-red-600"
                    : "text-primary"
              }
            `}
          >
            {getStatusLabel()}
          </p>

          {/* Stage */}

          {session?.stage && !isComplete && !isFailed && (
            <div
              className="
                mt-4
                flex
                items-center
                gap-2
                rounded-full
                bg-primary/5
                px-4
                py-2
                text-xs
                text-primary
              "
            >
              <BrainCircuit className="h-4 w-4" />

              <span>
                {t("createSession.processing.currentStage")}{" "}
                <strong>{session.stage}</strong>
              </span>
            </div>
          )}

          {/* Description */}

          <p className="mt-5 max-w-md text-sm leading-7 text-slate-500">
            {isComplete
              ? t("createSession.processing.completeDescription")
              : isFailed
                ? t("createSession.processing.failedDescription")
                : t("createSession.processing.description")}
          </p>

          {/* Error */}

          {error && (
            <div
              className="
                mt-5
                w-full
                max-w-lg
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-4
                py-3
              "
            >
              <div className="flex items-start gap-2 text-start text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <p className="text-sm leading-6">{error}</p>
              </div>
            </div>
          )}

          {renderRetryButton()}
        </div>

        {/*Session Information */}

        {session?.id && (
          <div
            className="
              border-t
              border-slate-100
              bg-slate-50/50
              px-6
              py-5
            "
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Session ID */}

              <div>
                <p className="text-xs text-slate-400">
                  {t("createSession.processing.sessionId")}
                </p>

                <p
                  className="mt-1 font-mono text-sm font-semibold text-slate-700"
                  dir="ltr"
                >
                  #{session.id}
                </p>
              </div>

              {/* Status */}

              <div>
                <p className="text-xs text-slate-400">
                  {t("createSession.processing.sessionStatus")}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {getStatusLabel()}
                </p>
              </div>

              {/* Filename */}

              <div>
                <p className="text-xs text-slate-400">
                  {t("createSession.processing.file")}
                </p>

                <div className="mt-1 flex items-center gap-1.5">
                  <FileAudio className="h-4 w-4 text-slate-400" />

                  <p
                    className="
                      max-w-[180px]
                      truncate
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                    title={session.original_filename || ""}
                  >
                    {session.original_filename || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Important Notice  */}

      {!isComplete && !isFailed && !error && (
        <p className="text-center text-xs leading-6 text-slate-400">
          {t("createSession.processing.keepOpen")}
        </p>
      )}
    </div>
  );
};

export default StepProcessing;

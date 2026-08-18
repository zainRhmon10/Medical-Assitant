import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2, RefreshCw, Volume2 } from "lucide-react";

import { getFullSessionAudio } from "../services/reportApi";

import { getApiErrorMessage } from "../../auth/services/authApi";

const getBlobErrorMessage = async (error, fallback) => {
  const data = error?.response?.data;

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);

      if (parsed?.message) {
        return parsed.message;
      }
    } catch {
      // إذا لم يكن JSON نستخدم الخطأ العام.
    }
  }

  return getApiErrorMessage(error, fallback);
};

const FullSessionAudio = ({ sessionId, className = "" }) => {
  const { t } = useTranslation();

  const [audioState, setAudioState] = useState({
    url: null,
    isLoading: false,
    error: "",
  });

  useEffect(() => {
    const currentUrl = audioState.url;

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [audioState.url]);

  useEffect(() => {
    setAudioState((previous) => {
      if (previous.url) {
        URL.revokeObjectURL(previous.url);
      }

      return {
        url: null,
        isLoading: false,
        error: "",
      };
    });
  }, [sessionId]);

  const handleLoadAudio = async () => {
    if (!sessionId || audioState.isLoading) {
      return;
    }
    if (audioState.url) {
      return;
    }

    setAudioState({
      url: null,
      isLoading: true,
      error: "",
    });

    try {
      const response = await getFullSessionAudio(sessionId);
      const contentType = response?.headers?.["content-type"] || "audio/mpeg";
      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], {
              type: contentType,
            });

      const audioUrl = URL.createObjectURL(blob);

      setAudioState({
        url: audioUrl,
        isLoading: false,
        error: "",
      });
    } catch (err) {
      console.error("LOAD FULL SESSION AUDIO ERROR:", err);

      const message = await getBlobErrorMessage(
        err,
        t("reports.fullAudio.loadFailed"),
      );

      setAudioState({
        url: null,
        isLoading: false,
        error: message,
      });
    }
  };

  if (!sessionId) {
    return null;
  }

  return (
    <section
      className={`no-print overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Volume2 className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {t("reports.fullAudio.title")}
            </h3>

            <p className="mt-1 text-xs leading-6 text-slate-500">
              {t("reports.fullAudio.description")}
            </p>
          </div>
        </div>

        {!audioState.url && (
          <button
            type="button"
            onClick={handleLoadAudio}
            disabled={audioState.isLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {audioState.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}

            {audioState.isLoading
              ? t("reports.fullAudio.loading")
              : t("reports.fullAudio.load")}
          </button>
        )}
      </div>

      {audioState.url && (
        <div className="p-5">
          <audio
            controls
            preload="metadata"
            src={audioState.url}
            className="w-full"
          />
        </div>
      )}

      {audioState.error && (
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <p className="text-xs leading-6">{audioState.error}</p>
          </div>

          <button
            type="button"
            onClick={handleLoadAudio}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/20 hover:text-primary"
          >
            <RefreshCw className="h-4 w-4" />

            {t("reports.fullAudio.retry")}
          </button>
        </div>
      )}
    </section>
  );
};

export default FullSessionAudio;

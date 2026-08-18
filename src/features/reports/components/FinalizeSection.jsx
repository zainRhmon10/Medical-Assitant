import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  X,
  FileText,
} from "lucide-react";

import {
  finalizeClinicalReport,
  getFinalizedReport,
} from "../services/reportApi";

import { getApiErrorMessage } from "../../auth/services/authApi";
const extractFinalizedReport = (payload) => {
  return payload?.finalized_report || payload?.data?.finalized_report || null;
};

const FinalizeSection = ({ sessionId, onFinalizedChange }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language?.toLowerCase().startsWith("ar");
  const [finalizedReport, setFinalizedReport] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const notifyParent = useCallback(
    (value) => {
      if (typeof onFinalizedChange === "function") {
        onFinalizedChange(value);
      }
    },
    [onFinalizedChange],
  );

  const loadFinalizedReport = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    setIsChecking(true);
    setError("");

    try {
      const response = await getFinalizedReport(sessionId);

      const final = extractFinalizedReport(response?.data);

      setFinalizedReport(final);
      notifyParent(final);
    } catch (err) {
      if (err?.response?.status === 404) {
        setFinalizedReport(null);
        notifyParent(null);
        return;
      }

      console.error(
        "LOAD FINALIZED REPORT ERROR:",
        err.response?.data || err.message,
      );

      setError(
        getApiErrorMessage(err, t("reports.finalize.errors.statusFailed")),
      );
    } finally {
      setIsChecking(false);
    }
  }, [sessionId, notifyParent, t]);

  useEffect(() => {
    loadFinalizedReport();
  }, [loadFinalizedReport]);

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

  const handleFinalize = async () => {
    if (!sessionId || isFinalizing) {
      return;
    }

    setIsFinalizing(true);
    setError("");

    try {
      const response = await finalizeClinicalReport(sessionId);
      let final = extractFinalizedReport(response?.data);

      if (!final) {
        const finalizedResponse = await getFinalizedReport(sessionId);
        final = extractFinalizedReport(finalizedResponse?.data);
      }

      setFinalizedReport(final);
      notifyParent(final);
      setShowConfirm(false);

      navigate(`/dashboard/reports/${sessionId}/final`, {
        replace: true,
      });
    } catch (err) {
      console.error(
        "FINALIZE REPORT ERROR:",
        err.response?.data || err.message,
      );

      if (err?.response?.status === 409) {
        try {
          const finalizedResponse = await getFinalizedReport(sessionId);
          const final = extractFinalizedReport(finalizedResponse?.data);

          if (final) {
            setFinalizedReport(final);
            notifyParent(final);
            setShowConfirm(false);

            navigate(`/dashboard/reports/${sessionId}/final`, {
              replace: true,
            });

            return;
          }
        } catch {
          // إذا لم توجد Snapshot فعلًا نعرض رسالة الـ409 الأصلية.
        }
      }

      setError(
        getApiErrorMessage(err, t("reports.finalize.errors.finalizeFailed")),
      );
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isChecking) {
    return (
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />

          {t("reports.finalize.checking")}
        </div>
      </section>
    );
  }

  if (finalizedReport) {
    return (
      <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 bg-emerald-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <BadgeCheck className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-bold text-emerald-900">
                {t("reports.finalize.finalizedTitle")}
              </h2>

              <p className="mt-1 text-sm leading-6 text-emerald-700">
                {t("reports.finalize.finalizedDescription")}
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />

            {t("reports.finalize.finalizedBadge")}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-400">
              {t("reports.finalize.finalizedAt")}
            </p>

            <p className="mt-1.5 text-sm font-semibold text-slate-700">
              {formatDate(finalizedReport?.finalized_at)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              {t("reports.finalize.snapshotId")}
            </p>

            <p
              className="mt-1.5 font-mono text-sm font-semibold text-slate-700"
              dir="ltr"
            >
              #{finalizedReport?.id ?? "-"}
            </p>
          </div>
        </div>

        <div className="border-t border-emerald-100 bg-emerald-50/40 px-6 py-4">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/reports/${sessionId}/final`)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            <FileText className="h-4 w-4" />

            {t("reports.finalize.openFinalReport", {
              defaultValue: isRTL ? "عرض التقرير النهائي" : "Open Final Report",
            })}
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-sm">
        <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">
                {t("reports.finalize.title")}
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-500">
                {t("reports.finalize.description")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setShowConfirm(true);
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <LockKeyhole className="h-4 w-4" />

            {t("reports.finalize.button")}
          </button>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <div className="flex items-start gap-2 text-xs leading-6 text-slate-500">
            <AlertCircle className="mt-1 h-4 w-4 shrink-0 text-amber-500" />

            <p>{t("reports.finalize.immutableHint")}</p>
          </div>
        </div>

        {error && (
          <div className="border-t border-red-100 bg-red-50 px-6 py-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </section>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="font-bold text-slate-800">
                  {t("reports.finalize.confirmTitle")}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {t("reports.finalize.confirmSubtitle")}
                </p>
              </div>

              <button
                type="button"
                disabled={isFinalizing}
                onClick={() => setShowConfirm(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    {t("reports.finalize.confirmWarningTitle")}
                  </p>

                  <p className="mt-1 text-sm leading-7 text-amber-700">
                    {t("reports.finalize.confirmWarningDescription")}
                  </p>
                </div>
              </div>

              <p className="text-sm leading-7 text-slate-600">
                {t("reports.finalize.confirmQuestion")}
              </p>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <button
                type="button"
                disabled={isFinalizing}
                onClick={() => setShowConfirm(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
              >
                {t("reports.finalize.cancel")}
              </button>

              <button
                type="button"
                disabled={isFinalizing}
                onClick={handleFinalize}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFinalizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LockKeyhole className="h-4 w-4" />
                )}

                {isFinalizing
                  ? t("reports.finalize.finalizing")
                  : t("reports.finalize.confirmButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FinalizeSection;

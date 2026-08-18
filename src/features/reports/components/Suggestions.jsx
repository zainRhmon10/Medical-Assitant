import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileSearch,
  Loader2,
  RefreshCw,
  Save,
  ShieldAlert,
  Stethoscope,
  X,
} from "lucide-react";

import {
  getSuggestions,
  submitSuggestionFeedback,
} from "../services/reportApi";

import { getApiErrorMessage } from "../../auth/services/authApi";

const FEEDBACK_ACTIONS = ["accepted", "rejected", "deferred", "acted"];

const extractSuggestionsPayload = (payload) => {
  const outer = payload?.suggestions || payload?.data?.suggestions || null;

  if (outer && Array.isArray(outer?.suggestions)) {
    return {
      total: outer?.total ?? outer.suggestions.length,
      clinicalSessionId: outer?.clinical_session_id ?? null,
      suggestions: outer.suggestions,
    };
  }

  if (Array.isArray(payload?.suggestions)) {
    return {
      total: payload.suggestions.length,
      clinicalSessionId: payload?.clinical_session_id ?? null,
      suggestions: payload.suggestions,
    };
  }

  if (Array.isArray(payload)) {
    return {
      total: payload.length,
      clinicalSessionId: null,
      suggestions: payload,
    };
  }

  return {
    total: 0,
    clinicalSessionId: null,
    suggestions: [],
  };
};

const valueToText = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => valueToText(item))
      .filter(Boolean)
      .join(" • ");
  }

  if (typeof value === "object") {
    const preferred =
      value?.title_ar ||
      value?.title ||
      value?.name_ar ||
      value?.name ||
      value?.text ||
      value?.detail_ar ||
      value?.detail ||
      value?.label ||
      value?.code ||
      null;

    if (preferred) {
      const extra = [value?.value, value?.unit].filter(Boolean).join(" ");

      return extra ? `${preferred}: ${extra}` : String(preferred);
    }

    return Object.entries(value)
      .filter(([, itemValue]) => itemValue !== null && itemValue !== undefined)
      .map(([key, itemValue]) => `${key}: ${valueToText(itemValue)}`)
      .join(" • ");
  }

  return String(value);
};

const normalizeList = (value) => {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => valueToText(item)).filter(Boolean);
  }

  const text = valueToText(value);

  return text ? [text] : [];
};

const Suggestions = ({ sessionId, refreshKey = 0 }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.toLowerCase().startsWith("ar");
  const [suggestions, setSuggestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackBySuggestion, setFeedbackBySuggestion] = useState({});
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackReason, setFeedbackReason] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  /*
   * Load Suggestions
   */

  const loadSuggestions = useCallback(async () => {
    if (!sessionId) {
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const response = await getSuggestions(sessionId);
      const extracted = extractSuggestionsPayload(response?.data);

      setSuggestions(extracted.suggestions);
      setTotal(extracted.total);
    } catch (err) {
      console.error(
        "LOAD KBS SUGGESTIONS ERROR:",
        err.response?.data || err.message,
      );

      setSuggestions([]);
      setTotal(0);

      setError(
        getApiErrorMessage(err, t("reports.suggestions.errors.loadFailed")),
      );
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, t]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions, refreshKey]);

  /*
   * Severity
   */

  const getSeverityData = (severity) => {
    const normalized = String(severity || "info").toLowerCase();

    switch (normalized) {
      case "critical":
        return {
          label: t("reports.suggestions.severity.critical"),
          className: "border-red-200 bg-red-50 text-red-700",
          cardClassName: "border-red-200",
          icon: ShieldAlert,
        };

      case "high":
        return {
          label: t("reports.suggestions.severity.high"),
          className: "border-orange-200 bg-orange-50 text-orange-700",
          cardClassName: "border-orange-200",
          icon: AlertTriangle,
        };

      case "medium":
        return {
          label: t("reports.suggestions.severity.medium"),
          className: "border-amber-200 bg-amber-50 text-amber-700",
          cardClassName: "border-amber-200",
          icon: AlertTriangle,
        };

      case "low":
        return {
          label: t("reports.suggestions.severity.low"),
          className: "border-blue-200 bg-blue-50 text-blue-700",
          cardClassName: "border-blue-100",
          icon: Stethoscope,
        };

      default:
        return {
          label: t("reports.suggestions.severity.info"),
          className: "border-slate-200 bg-slate-50 text-slate-600",
          cardClassName: "border-slate-100",
          icon: Stethoscope,
        };
    }
  };

  /*
   * Feedback Style
   */

  const getFeedbackData = (action) => {
    switch (action) {
      case "accepted":
        return {
          label: t("reports.suggestions.feedback.actions.accepted"),
          className: "border-emerald-200 bg-emerald-50 text-emerald-700",
          buttonClassName:
            "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
          icon: Check,
        };

      case "rejected":
        return {
          label: t("reports.suggestions.feedback.actions.rejected"),
          className: "border-red-200 bg-red-50 text-red-700",
          buttonClassName: "border-red-200 text-red-700 hover:bg-red-50",
          icon: X,
        };

      case "deferred":
        return {
          label: t("reports.suggestions.feedback.actions.deferred"),
          className: "border-amber-200 bg-amber-50 text-amber-700",
          buttonClassName: "border-amber-200 text-amber-700 hover:bg-amber-50",
          icon: Clock3,
        };

      case "acted":
        return {
          label: t("reports.suggestions.feedback.actions.acted"),
          className: "border-blue-200 bg-blue-50 text-blue-700",
          buttonClassName: "border-blue-200 text-blue-700 hover:bg-blue-50",
          icon: ClipboardCheck,
        };

      default:
        return {
          label: action || "-",
          className: "border-slate-200 bg-slate-50 text-slate-600",
          buttonClassName: "border-slate-200 text-slate-600 hover:bg-slate-50",
          icon: CheckCircle2,
        };
    }
  };

  /*
   * Feedback Modal
   */

  const openFeedbackModal = (suggestion, action) => {
    setFeedbackModal({
      suggestion,
      action,
    });

    setFeedbackReason("");
    setFeedbackError("");
    setSuccessMessage("");
  };

  const closeFeedbackModal = () => {
    if (isSubmittingFeedback) {
      return;
    }

    setFeedbackModal(null);
    setFeedbackReason("");
    setFeedbackError("");
  };

  /*
   * Submit Feedback
   */

  const handleSubmitFeedback = async () => {
    const suggestionId = feedbackModal?.suggestion?.id;
    const action = feedbackModal?.action;

    if (!suggestionId || !FEEDBACK_ACTIONS.includes(action)) {
      return;
    }

    setFeedbackError("");
    setSuccessMessage("");
    setIsSubmittingFeedback(true);

    try {
      const payload = {
        action,
      };

      const reason = feedbackReason.trim();

      if (reason) {
        payload.reason = reason;
      }

      const response = await submitSuggestionFeedback(
        sessionId,
        suggestionId,
        payload,
      );

      const feedback = response?.data?.feedback || {
        suggestion_id: suggestionId,
        action,
        reason: reason || null,
      };

      setFeedbackBySuggestion((previous) => ({
        ...previous,
        [String(suggestionId)]: feedback,
      }));

      setSuccessMessage(t("reports.suggestions.feedback.saved"));

      setFeedbackModal(null);
      setFeedbackReason("");
    } catch (err) {
      console.error(
        "SUBMIT SUGGESTION FEEDBACK ERROR:",
        err.response?.data || err.message,
      );

      setFeedbackError(
        getApiErrorMessage(
          err,
          t("reports.suggestions.feedback.errors.saveFailed"),
        ),
      );
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  /*
   * Severity Counts
   */

  const severityCounts = useMemo(() => {
    return suggestions.reduce((accumulator, suggestion) => {
      const severity = String(suggestion?.severity || "info").toLowerCase();

      accumulator[severity] = (accumulator[severity] || 0) + 1;

      return accumulator;
    }, {});
  }, [suggestions]);

  /*
   * Loading
   */

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />

          <p className="text-sm text-slate-500">
            {t("reports.suggestions.loading")}
          </p>
        </div>
      </section>
    );
  }

  /*
   * Error
   */

  if (error) {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="h-7 w-7 text-red-500" />

          <div>
            <p className="font-semibold text-slate-700">
              {t("reports.suggestions.errors.title")}
            </p>

            <p className="mt-1 text-sm text-red-500">{error}</p>
          </div>

          <button
            type="button"
            onClick={loadSuggestions}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary/20 hover:text-primary"
          >
            <RefreshCw className="h-4 w-4" />

            {t("reports.suggestions.retry")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Header  */}

        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Stethoscope className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">
                {t("reports.suggestions.title")}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {t("reports.suggestions.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              {t("reports.suggestions.count", {
                count: total,
              })}
            </span>

            <button
              type="button"
              onClick={loadSuggestions}
              title={t("reports.suggestions.refresh")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-primary/20 hover:text-primary"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/*  Severity Summary  */}

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-slate-100 px-6 py-4">
            {Object.entries(severityCounts).map(([severity, count]) => {
              const severityData = getSeverityData(severity);

              return (
                <span
                  key={severity}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityData.className}`}
                >
                  {severityData.label}: {count}
                </span>
              );
            })}
          </div>
        )}

        {/* Success Message */}

        {successMessage && (
          <div className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />

            {successMessage}
          </div>
        )}

        {/*  Empty*/}

        {suggestions.length === 0 ? (
          <div className="flex min-h-[190px] flex-col items-center justify-center p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />

            <h3 className="mt-3 font-bold text-slate-700">
              {t("reports.suggestions.emptyTitle")}
            </h3>

            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              {t("reports.suggestions.emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="space-y-5 p-5">
            {suggestions.map((suggestion, index) => {
              const severityData = getSeverityData(suggestion?.severity);
              const SeverityIcon = severityData.icon;

              const missingTests = normalizeList(suggestion?.missing_tests);
              const evidence = normalizeList(suggestion?.evidence);
              const inferenceChain = normalizeList(suggestion?.inference_chain);
              const references = normalizeList(suggestion?.references);

              const localFeedback =
                feedbackBySuggestion[String(suggestion?.id)] || null;

              const localFeedbackData = localFeedback
                ? getFeedbackData(localFeedback.action)
                : null;

              return (
                <article
                  key={
                    suggestion?.id ||
                    `${suggestion?.rule_id || "rule"}-${index}`
                  }
                  className={`overflow-hidden rounded-2xl border bg-white ${severityData.cardClassName}`}
                >
                  {/*  Suggestion Header  */}

                  <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/40 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        <SeverityIcon className="h-4 w-4 text-slate-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">
                          {t("reports.suggestions.recommendation", {
                            number: index + 1,
                          })}
                        </p>

                        <h3 className="mt-1 text-base font-bold leading-7 text-slate-800">
                          {suggestion?.title_ar ||
                            suggestion?.title ||
                            suggestion?.rule_id ||
                            t("reports.suggestions.untitled")}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${severityData.className}`}
                      >
                        <SeverityIcon className="h-3.5 w-3.5" />

                        {severityData.label}
                      </span>

                      {localFeedbackData && (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${localFeedbackData.className}`}
                        >
                          {(() => {
                            const FeedbackIcon = localFeedbackData.icon;
                            return <FeedbackIcon className="h-3.5 w-3.5" />;
                          })()}

                          {localFeedbackData.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Content  */}

                  <div className="p-5">
                    <p
                      className="whitespace-pre-wrap text-sm leading-8 text-slate-700"
                      dir={
                        suggestion?.detail_ar ? "rtl" : isRTL ? "rtl" : "ltr"
                      }
                    >
                      {suggestion?.detail_ar ||
                        suggestion?.detail ||
                        t("reports.suggestions.noDetails")}
                    </p>

                    {/*  Missing Tests  */}

                    {missingTests.length > 0 && (
                      <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                        <div className="flex items-center gap-2">
                          <FileSearch className="h-4 w-4 text-amber-600" />

                          <p className="text-xs font-semibold text-amber-700">
                            {t("reports.suggestions.missingTests")}
                          </p>
                        </div>

                        <ul className="mt-3 space-y-2">
                          {missingTests.map((test, testIndex) => (
                            <li
                              key={`${suggestion?.id}-test-${testIndex}`}
                              className="flex items-start gap-2 text-xs leading-6 text-amber-700"
                            >
                              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />

                              <span>{test}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/*  Rule Metadata */}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {suggestion?.scope && (
                        <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">
                          {t("reports.suggestions.scope")}: {suggestion.scope}
                        </span>
                      )}

                      {suggestion?.rule_id && (
                        <span
                          className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 font-mono text-[11px] text-slate-500"
                          dir="ltr"
                        >
                          {suggestion.rule_id}
                          {suggestion?.rule_version
                            ? ` · v${suggestion.rule_version}`
                            : ""}
                        </span>
                      )}
                    </div>

                    {/*  Evidence / References  */}

                    {(suggestion?.condition ||
                      evidence.length > 0 ||
                      inferenceChain.length > 0 ||
                      references.length > 0) && (
                      <details className="mt-4 rounded-xl border border-slate-100 bg-slate-50/40">
                        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-600">
                          <BookOpen className="h-4 w-4 text-primary" />

                          {t("reports.suggestions.evidenceAndReferences")}

                          <ChevronDown className="ms-auto h-4 w-4 text-slate-400" />
                        </summary>

                        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
                          {suggestion?.condition && (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                {t("reports.suggestions.condition")}
                              </p>

                              <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-slate-600">
                                {valueToText(suggestion.condition)}
                              </p>
                            </div>
                          )}

                          {evidence.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                {t("reports.suggestions.evidence")}
                              </p>

                              <ul className="mt-2 space-y-1.5">
                                {evidence.map((item, itemIndex) => (
                                  <li
                                    key={`${suggestion?.id}-evidence-${itemIndex}`}
                                    className="text-xs leading-6 text-slate-600"
                                  >
                                    • {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {inferenceChain.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                {t("reports.suggestions.inferenceChain")}
                              </p>

                              <ol className="mt-2 space-y-1.5">
                                {inferenceChain.map((item, itemIndex) => (
                                  <li
                                    key={`${suggestion?.id}-inference-${itemIndex}`}
                                    className="text-xs leading-6 text-slate-600"
                                  >
                                    {itemIndex + 1}. {item}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {references.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                {t("reports.suggestions.references")}
                              </p>

                              <ul className="mt-2 space-y-1.5">
                                {references.map((reference, referenceIndex) => (
                                  <li
                                    key={`${suggestion?.id}-reference-${referenceIndex}`}
                                    className="text-xs leading-6 text-slate-600"
                                  >
                                    • {reference}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    {/*  Feedback  */}

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-slate-700">
                          {t("reports.suggestions.feedback.title")}
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-slate-400">
                          {t("reports.suggestions.feedback.subtitle")}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {FEEDBACK_ACTIONS.map((action) => {
                          const actionData = getFeedbackData(action);
                          const ActionIcon = actionData.icon;

                          return (
                            <button
                              key={action}
                              type="button"
                              onClick={() =>
                                openFeedbackModal(suggestion, action)
                              }
                              className={`inline-flex items-center gap-1.5 rounded-xl border bg-white px-3.5 py-2 text-xs font-semibold transition ${actionData.buttonClassName}`}
                            >
                              <ActionIcon className="h-3.5 w-3.5" />

                              {actionData.label}
                            </button>
                          );
                        })}
                      </div>

                      {localFeedback?.reason && (
                        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5">
                          <p className="text-[11px] text-slate-400">
                            {t("reports.suggestions.feedback.recordedReason")}
                          </p>

                          <p className="mt-1 text-xs leading-6 text-slate-600">
                            {localFeedback.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Feedback Modal  */}

      {feedbackModal &&
        (() => {
          const actionData = getFeedbackData(feedbackModal.action);
          const ActionIcon = actionData.icon;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                  <div>
                    <h2 className="font-bold text-slate-800">
                      {t("reports.suggestions.feedback.modalTitle")}
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {feedbackModal.suggestion?.title_ar ||
                        feedbackModal.suggestion?.title ||
                        feedbackModal.suggestion?.rule_id ||
                        "-"}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmittingFeedback}
                    onClick={closeFeedbackModal}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-5 p-6">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${actionData.className}`}
                  >
                    <ActionIcon className="h-3.5 w-3.5" />

                    {actionData.label}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {t("reports.suggestions.feedback.reason")}
                    </label>

                    <textarea
                      value={feedbackReason}
                      onChange={(event) =>
                        setFeedbackReason(event.target.value)
                      }
                      maxLength={2000}
                      rows={5}
                      placeholder={t(
                        "reports.suggestions.feedback.reasonPlaceholder",
                      )}
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />

                    <div className="mt-1 flex justify-between gap-3 text-[11px] text-slate-400">
                      <span>
                        {t("reports.suggestions.feedback.reasonOptional")}
                      </span>
                      <span dir="ltr">{feedbackReason.length}/2000</span>
                    </div>
                  </div>

                  {feedbackError && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {feedbackError}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                  <button
                    type="button"
                    disabled={isSubmittingFeedback}
                    onClick={closeFeedbackModal}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
                  >
                    {t("reports.suggestions.feedback.cancel")}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittingFeedback}
                    onClick={handleSubmitFeedback}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmittingFeedback ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}

                    {t("reports.suggestions.feedback.save")}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
};

export default Suggestions;

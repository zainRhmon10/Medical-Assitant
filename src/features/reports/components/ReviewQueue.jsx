import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Edit3,
  Gauge,
  Layers3,
  Loader2,
  RefreshCw,
  Save,
  Tag,
  X,
} from "lucide-react";

import { correctReportItem, getReviewQueue } from "../services/reportApi";

import { getApiErrorMessage } from "../../auth/services/authApi";

const ACTIVE_LABELS = [
  "symptom",
  "diagnosis",
  "medication",
  "history",
  "allergy",
  "lab",
  "vital",
  "plan",
  "procedure",
  "info",
  "treatment",
  "follow_up",
  "nutrition",
  "pregnancy_risk",
  "cardiology",
  "neurology",
  "gynecology",
  "infection",
  "postpartum",
  "emergency",
];
const SOAP_SECTIONS = ["subjective", "objective", "assessment", "plan"];
const SPEAKERS = ["doctor", "patient", "unknown"];

const extractReviewQueue = (payload) => {
  if (Array.isArray(payload?.review_queue)) {
    return payload.review_queue;
  }

  if (Array.isArray(payload?.data?.review_queue)) {
    return payload.data.review_queue;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

const ReviewQueue = ({ sessionId, onCorrectionSaved }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.toLowerCase().startsWith("ar");
  const [reviewItems, setReviewItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingItem, setEditingItem] = useState(null);

  const [correctionForm, setCorrectionForm] = useState({
    text: "",
    label: "",
    soap_section: "",
    speaker: "",
  });

  const [correctionError, setCorrectionError] = useState("");
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);

  const loadReviewQueue = useCallback(async () => {
    if (!sessionId) {
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const response = await getReviewQueue(sessionId);
      const items = extractReviewQueue(response?.data);

      setReviewItems(items);
    } catch (err) {
      console.error(
        "LOAD REVIEW QUEUE ERROR:",
        err.response?.data || err.message,
      );
      setReviewItems([]);

      setError(
        getApiErrorMessage(err, t("reports.reviewQueue.errors.loadFailed")),
      );
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, t]);

  useEffect(() => {
    loadReviewQueue();
  }, [loadReviewQueue]);

  const formatConfidence = (value) => {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return "-";
    }

    if (number >= 0 && number <= 1) {
      return `${(number * 100).toFixed(1)}%`;
    }

    return `${number.toFixed(1)}%`;
  };

  const formatPriority = (value) => {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return "-";
    }

    if (number >= 0 && number <= 1) {
      return `${(number * 100).toFixed(1)}%`;
    }

    return number.toFixed(2);
  };

  const getLabel = (item) => {
    if (isRTL && item?.label_ar) {
      return item.label_ar;
    }

    return item?.label || "-";
  };

  const getLabelName = (label) => {
    return t(`reports.reviewQueue.labels.${label}`, {
      defaultValue: label?.replaceAll("_", " ") || "-",
    });
  };

  const getSoapSection = (section) => {
    if (!section) {
      return "-";
    }

    return t(`reports.soap.${section}.title`, {
      defaultValue: section,
    });
  };

  const formatTimestamp = (value) => {
    const seconds = Number(value);

    if (Number.isNaN(seconds)) {
      return "-";
    }
    const minutes = Math.floor(seconds / 60);
    const remaining = (seconds % 60).toFixed(1).padStart(4, "0");

    return `${minutes}:${remaining}`;
  };

  const openCorrection = (item) => {
    setEditingItem(item);
    setCorrectionForm({
      text: item?.text ?? item?.text_rephrased ?? "",
      label: item?.label || "",
      soap_section: item?.soap_section || "",
      speaker: item?.speaker ?? "",
    });

    setCorrectionError("");
  };

  const closeCorrection = () => {
    if (isSavingCorrection) {
      return;
    }

    setEditingItem(null);

    setCorrectionError("");
  };

  const saveCorrection = async () => {
    if (!editingItem?.item_id) {
      return;
    }
    setCorrectionError("");
    setSuccessMessage("");
    const changes = {};
    const originalText = (
      editingItem?.text ??
      editingItem?.text_rephrased ??
      ""
    ).trim();

    const newText = correctionForm.text.trim();

    if (newText !== originalText) {
      if (!newText) {
        setCorrectionError(
          t("reports.reviewQueue.correction.errors.textRequired"),
        );

        return;
      }

      changes.text = newText;
    }

    const originalLabel = editingItem?.label || "";
    if (correctionForm.label !== originalLabel) {
      changes.label = correctionForm.label;
    }
    const originalSection = editingItem?.soap_section || "";

    if (correctionForm.soap_section !== originalSection) {
      changes.soap_section = correctionForm.soap_section;
    }

    const originalSpeaker = editingItem?.speaker ?? "";

    if (correctionForm.speaker !== originalSpeaker) {
      changes.speaker =
        correctionForm.speaker === "" ? null : correctionForm.speaker;
    }

    if (Object.keys(changes).length === 0) {
      setCorrectionError(t("reports.reviewQueue.correction.errors.noChanges"));
      return;
    }
    setIsSavingCorrection(true);

    try {
      await correctReportItem(sessionId, editingItem.item_id, changes);
      setEditingItem(null);
      setSuccessMessage(t("reports.reviewQueue.correction.saved"));

      await loadReviewQueue();

      if (typeof onCorrectionSaved === "function") {
        await onCorrectionSaved();
      }
    } catch (err) {
      console.error(
        "CORRECT REPORT ITEM ERROR:",
        err.response?.data || err.message,
      );

      setCorrectionError(
        getApiErrorMessage(
          err,

          t("reports.reviewQueue.correction.errors.saveFailed"),
        ),
      );
    } finally {
      setIsSavingCorrection(false);
    }
  };

  if (isLoading) {
    return (
      <section
        className="
          rounded-2xl
          border
          border-slate-100
          bg-white
          p-6
          shadow-sm
        "
      >
        <div
          className="
            flex
            min-h-[180px]
            flex-col
            items-center
            justify-center
            gap-3
          "
        >
          <Loader2 className="h-7 w-7 animate-spin text-primary" />

          <p className="text-sm text-slate-500">
            {t("reports.reviewQueue.loading")}
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className="
          rounded-2xl
          border
          border-red-100
          bg-white
          p-6
          shadow-sm
        "
      >
        <div
          className="
            flex
            min-h-[180px]
            flex-col
            items-center
            justify-center
            gap-4
            text-center
          "
        >
          <AlertCircle className="h-7 w-7 text-red-500" />

          <p className="text-sm text-red-500">{error}</p>

          <button
            type="button"
            onClick={loadReviewQueue}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-slate-200
              px-4
              py-2
              text-sm
            "
          >
            <RefreshCw className="h-4 w-4" />

            {t("reports.reviewQueue.retry")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Queue  */}

      <section
        className="
          overflow-hidden
          rounded-2xl
          border
          border-amber-100
          bg-white
          shadow-sm
        "
      >
        {/* Header */}

        <div
          className="
            flex
            flex-col
            gap-4
            border-b
            border-amber-100
            bg-amber-50/50
            px-6
            py-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="flex items-start gap-3">
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-amber-100
                text-amber-600
              "
            >
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">
                {t("reports.reviewQueue.title")}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {t("reports.reviewQueue.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="
                rounded-full
                border
                border-amber-200
                bg-white
                px-3
                py-1.5
                text-xs
                font-semibold
                text-amber-700
              "
            >
              {t("reports.reviewQueue.count", {
                count: reviewItems.length,
              })}
            </span>

            <button
              type="button"
              onClick={loadReviewQueue}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                border
                border-amber-200
                bg-white
                text-amber-600
              "
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Success */}

        {successMessage && (
          <div
            className="
              mx-5
              mt-5
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-emerald-200
              bg-emerald-50
              px-4
              py-3
              text-sm
              text-emerald-700
            "
          >
            <CheckCircle2 className="h-4 w-4" />

            {successMessage}
          </div>
        )}

        {/* Empty */}

        {reviewItems.length === 0 ? (
          <div
            className="
              flex
              min-h-[170px]
              flex-col
              items-center
              justify-center
              p-6
              text-center
            "
          >
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />

            <h3 className="mt-3 font-bold text-slate-700">
              {t("reports.reviewQueue.emptyTitle")}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {t("reports.reviewQueue.emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="space-y-5 p-5">
            {reviewItems.map((item, index) => {
              const confidence = item?.combined_confidence ?? item?.confidence;

              return (
                <article
                  key={item.item_id || index}
                  className="
                      overflow-hidden
                      rounded-xl
                      border
                      border-amber-100
                      bg-amber-50/20
                    "
                >
                  {/* Item Header */}

                  <div
                    className="
                        flex
                        flex-col
                        gap-3
                        border-b
                        border-amber-100
                        bg-white
                        px-4
                        py-3
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                      "
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-full
                            bg-amber-100
                            text-xs
                            font-bold
                            text-amber-700
                          "
                      >
                        {index + 1}
                      </span>

                      <p className="text-sm font-semibold text-slate-700">
                        {t("reports.reviewQueue.reviewItem", {
                          number: index + 1,
                        })}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item?.soap_section && (
                        <span
                          className="
                              inline-flex
                              items-center
                              gap-1
                              rounded-full
                              bg-slate-50
                              px-2.5
                              py-1
                              text-xs
                              text-slate-500
                            "
                        >
                          <Layers3 className="h-3 w-3" />

                          {getSoapSection(item.soap_section)}
                        </span>
                      )}

                      <span
                        className="
                            inline-flex
                            items-center
                            gap-1
                            rounded-full
                            bg-slate-50
                            px-2.5
                            py-1
                            text-xs
                            text-slate-500
                          "
                      >
                        <Tag className="h-3 w-3" />

                        {getLabel(item)}
                      </span>
                    </div>
                  </div>

                  {/* Item Content */}

                  <div className="p-4">
                    <p className="text-sm leading-8 text-slate-700">
                      {item?.text_rephrased || item?.text || "-"}
                    </p>

                    {/* Metrics */}

                    <div
                      className="
                          mt-4
                          grid
                          grid-cols-1
                          gap-3
                          sm:grid-cols-3
                        "
                    >
                      <div className="rounded-lg border border-slate-100 bg-white px-3 py-2.5">
                        <p className="text-[11px] text-slate-400">
                          {t("reports.reviewQueue.confidence")}
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {formatConfidence(confidence)}
                        </p>
                      </div>

                      <div className="rounded-lg border border-amber-100 bg-white px-3 py-2.5">
                        <div className="flex items-center gap-1 text-amber-600">
                          <Gauge className="h-3.5 w-3.5" />

                          <p className="text-[11px]">
                            {t("reports.reviewQueue.priority")}
                          </p>
                        </div>

                        <p className="mt-1 text-sm font-bold text-amber-700">
                          {formatPriority(item?.review_priority)}
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-100 bg-white px-3 py-2.5">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock3 className="h-3.5 w-3.5" />

                          <p className="text-[11px]">
                            {t("reports.reviewQueue.audioPosition")}
                          </p>
                        </div>

                        <p
                          className="mt-1 text-sm font-semibold text-slate-700"
                          dir="ltr"
                        >
                          {formatTimestamp(item?.start_sec)}

                          {" – "}

                          {formatTimestamp(item?.end_sec)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}

                    <div
                      className="
                          mt-4
                          flex
                          flex-wrap
                          gap-2
                        "
                    >
                      {/* Correction */}

                      <button
                        type="button"
                        onClick={() => openCorrection(item)}
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
                        <Edit3 className="h-4 w-4" />

                        {t("reports.reviewQueue.correction.edit")}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/*  Correction Modal  */}

      {editingItem && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-900/40
            p-4
            backdrop-blur-sm
          "
        >
          <div
            className="
              max-h-[90vh]
              w-full
              max-w-2xl
              overflow-y-auto
              rounded-2xl
              bg-white
              shadow-2xl
            "
          >
            {/* Modal Header */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-100
                px-6
                py-4
              "
            >
              <div>
                <h2 className="font-bold text-slate-800">
                  {t("reports.reviewQueue.correction.title")}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {t("reports.reviewQueue.correction.subtitle")}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCorrection}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  hover:bg-slate-100
                "
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}

            <div className="space-y-5 p-6">
              {/* Text */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t("reports.reviewQueue.correction.text")}
                </label>

                <textarea
                  value={correctionForm.text}
                  onChange={(event) =>
                    setCorrectionForm((previous) => ({
                      ...previous,
                      text: event.target.value,
                    }))
                  }
                  rows={5}
                  className="
                    w-full
                    resize-y
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    py-3
                    text-sm
                    leading-7
                    text-slate-700
                    outline-none
                    transition
                    focus:border-primary
                    focus:ring-2
                    focus:ring-primary/10
                  "
                />
              </div>

              {/* Selects */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Label */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t("reports.reviewQueue.correction.label")}
                  </label>

                  <select
                    value={correctionForm.label}
                    onChange={(event) =>
                      setCorrectionForm((previous) => ({
                        ...previous,
                        label: event.target.value,
                      }))
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                      text-sm
                      outline-none
                      focus:border-primary
                    "
                  >
                    {ACTIVE_LABELS.map((label) => (
                      <option key={label} value={label}>
                        {getLabelName(label)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SOAP Section */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t("reports.reviewQueue.correction.soapSection")}
                  </label>

                  <select
                    value={correctionForm.soap_section}
                    onChange={(event) =>
                      setCorrectionForm((previous) => ({
                        ...previous,

                        soap_section: event.target.value,
                      }))
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                      text-sm
                      outline-none
                      focus:border-primary
                    "
                  >
                    {SOAP_SECTIONS.map((section) => (
                      <option key={section} value={section}>
                        {getSoapSection(section)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speaker */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t("reports.reviewQueue.correction.speaker")}
                  </label>

                  <select
                    value={correctionForm.speaker}
                    onChange={(event) =>
                      setCorrectionForm((previous) => ({
                        ...previous,

                        speaker: event.target.value,
                      }))
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                      text-sm
                      outline-none
                      focus:border-primary
                    "
                  >
                    <option value="">
                      {t("reports.reviewQueue.correction.speakers.none")}
                    </option>

                    {SPEAKERS.map((speaker) => (
                      <option key={speaker} value={speaker}>
                        {t(
                          `reports.reviewQueue.correction.speakers.${speaker}`,
                        )}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Correction Error */}

              {correctionError && (
                <div
                  className="
                    rounded-xl
                    border
                    border-red-100
                    bg-red-50
                    px-4
                    py-3
                    text-sm
                    text-red-600
                  "
                >
                  {correctionError}
                </div>
              )}
            </div>

            {/* Modal Footer */}

            <div
              className="
                flex
                justify-end
                gap-3
                border-t
                border-slate-100
                bg-slate-50/50
                px-6
                py-4
              "
            >
              <button
                type="button"
                disabled={isSavingCorrection}
                onClick={closeCorrection}
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-600
                "
              >
                {t("reports.reviewQueue.correction.cancel")}
              </button>

              <button
                type="button"
                disabled={isSavingCorrection}
                onClick={saveCorrection}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-primary
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {isSavingCorrection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {t("reports.reviewQueue.correction.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReviewQueue;

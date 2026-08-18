import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Baby, Loader2, CheckCircle2 } from "lucide-react";
import { updatePatientObstetricState } from "../services/patientApi";
import { getApiErrorMessage } from "../../auth/services/authApi";

const ObstetricStateModal = ({ isOpen, patientId, onClose, onUpdated }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("ar");
  const [stateType, setStateType] = useState("");
  const [gestationalWeeks, setGestationalWeeks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [apiError, setApiError] = useState("");

  const resetModal = () => {
    setStateType("");
    setGestationalWeeks("");
    setApiError("");
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    resetModal();
    onClose();
  };

  const handleStateChange = (value) => {
    setStateType(value);
    setApiError("");
    if (value !== "pregnant") {
      setGestationalWeeks("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError("");
    if (!stateType) {
      setApiError(t("dashboard.patients.obstetric.errors.stateRequired"));

      return;
    }

    let gaWeeks = null;

    if (stateType === "pregnant" && gestationalWeeks !== "") {
      const parsedWeeks = Number(gestationalWeeks);

      if (
        !Number.isInteger(parsedWeeks) ||
        parsedWeeks < 1 ||
        parsedWeeks > 44
      ) {
        setApiError(t("dashboard.patients.obstetric.errors.invalidWeeks"));
        return;
      }

      gaWeeks = parsedWeeks;
    }

    let stateData;
    if (stateType === "pregnant") {
      stateData = {
        pregnant: true,

        postpartum: false,

        ga_weeks: gaWeeks,
      };
    }

    if (stateType === "postpartum") {
      stateData = {
        pregnant: null,

        postpartum: true,

        ga_weeks: null,
      };
    }

    if (stateType === "not_pregnant") {
      stateData = {
        pregnant: false,

        postpartum: false,

        ga_weeks: null,
      };
    }

    try {
      setIsSubmitting(true);
      const response = await updatePatientObstetricState(patientId, stateData);

      if (onUpdated) {
        onUpdated({
          stateData,

          response: response?.data,
        });
      }

      resetModal();

      onClose();
    } catch (error) {
      console.error(
        "UPDATE OBSTETRIC STATE ERROR:",
        error.response?.data || error.message,
      );

      setApiError(
        getApiErrorMessage(
          error,

          t("dashboard.patients.obstetric.errors.updateFailed"),
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
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
        backdrop-blur-[2px]
      "
    >
      <div
        className="
          w-full
          max-w-lg
          overflow-hidden
          rounded-2xl
          border
          border-slate-100
          bg-white
          shadow-2xl
        "
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/*Header  */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-100
            px-6
            py-5
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
              <Baby className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800">
                {t("dashboard.patients.obstetric.title")}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {t("dashboard.patients.obstetric.subtitle")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form  */}

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            {/*  Error */}

            {apiError && (
              <div
                className="
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-3
                "
              >
                <p className="text-sm text-red-600">{apiError}</p>
              </div>
            )}

            {/*  State */}

            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700">
                {t("dashboard.patients.obstetric.stateLabel")}
              </label>

              <div className="space-y-3">
                {/* Pregnant */}

                <button
                  type="button"
                  onClick={() => handleStateChange("pregnant")}
                  className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-xl
                    border
                    px-4
                    py-4
                    text-start
                    transition

                    ${
                      stateType === "pregnant"
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 bg-white hover:border-primary/30"
                    }
                  `}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {t("dashboard.patients.obstetric.pregnant")}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {t("dashboard.patients.obstetric.pregnantHint")}
                    </p>
                  </div>

                  {stateType === "pregnant" && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  )}
                </button>

                {/* Postpartum */}

                <button
                  type="button"
                  onClick={() => handleStateChange("postpartum")}
                  className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-xl
                    border
                    px-4
                    py-4
                    text-start
                    transition

                    ${
                      stateType === "postpartum"
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 bg-white hover:border-primary/30"
                    }
                  `}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {t("dashboard.patients.obstetric.postpartum")}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {t("dashboard.patients.obstetric.postpartumHint")}
                    </p>
                  </div>

                  {stateType === "postpartum" && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  )}
                </button>

                {/* Not Pregnant */}

                <button
                  type="button"
                  onClick={() => handleStateChange("not_pregnant")}
                  className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-xl
                    border
                    px-4
                    py-4
                    text-start
                    transition

                    ${
                      stateType === "not_pregnant"
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 bg-white hover:border-primary/30"
                    }
                  `}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {t("dashboard.patients.obstetric.notPregnant")}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {t("dashboard.patients.obstetric.notPregnantHint")}
                    </p>
                  </div>

                  {stateType === "not_pregnant" && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  )}
                </button>
              </div>
            </div>

            {/* Gestational Weeks  */}

            {stateType === "pregnant" && (
              <div>
                <label
                  htmlFor="gestationalWeeks"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  {t("dashboard.patients.obstetric.gestationalWeeks")}
                </label>

                <input
                  id="gestationalWeeks"
                  type="number"
                  min="1"
                  max="44"
                  step="1"
                  value={gestationalWeeks}
                  onChange={(event) => setGestationalWeeks(event.target.value)}
                  placeholder={t(
                    "dashboard.patients.obstetric.gestationalWeeksPlaceholder",
                  )}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    text-slate-800
                    outline-none
                    transition
                    focus:border-primary
                    focus:ring-2
                    focus:ring-primary/10
                  "
                />

                <p className="mt-2 text-xs text-slate-400">
                  {t("dashboard.patients.obstetric.gestationalWeeksHint")}
                </p>
              </div>
            )}
          </div>

          {/* Footer  */}

          <div
            className="
              flex
              items-center
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
              onClick={handleClose}
              disabled={isSubmitting}
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                px-5
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
              {t("dashboard.patients.obstetric.cancel")}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !stateType}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-primary
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:opacity-90
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}

              <span>
                {isSubmitting
                  ? t("dashboard.patients.obstetric.saving")
                  : t("dashboard.patients.obstetric.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ObstetricStateModal;

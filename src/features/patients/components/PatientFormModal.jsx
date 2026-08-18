import { useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import {
  X,
  User,
  Hash,
  CalendarDays,
  Phone,
  FileText,
  Loader2,
} from "lucide-react";

import FormField from "../../../component/ui/Field";
import { createPatient, updatePatient } from "../services/patientApi";
import { getApiErrorMessage } from "../../auth/services/authApi";

const PatientFormModal = ({
  isOpen,
  onClose,
  onCreated,
  onUpdated,

  patient = null,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [apiError, setApiError] = useState("");

  const isEditMode = Boolean(patient?.id);
  const maxBirthDate = useMemo(() => {
    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);

    return yesterday.toISOString().split("T")[0];
  }, []);

  const validationSchema = useMemo(
    () =>
      Yup.object({
        firstName: Yup.string()
          .trim()
          .max(75, t("dashboard.patients.form.errors.firstNameMax"))
          .required(t("dashboard.patients.form.errors.firstNameRequired")),

        lastName: Yup.string()
          .trim()
          .max(75, t("dashboard.patients.form.errors.lastNameMax"))
          .required(t("dashboard.patients.form.errors.lastNameRequired")),

        mrn: Yup.string()
          .trim()
          .max(64, t("dashboard.patients.form.errors.mrnMax")),

        birthDate: Yup.string()
          .nullable()
          .test(
            "birth-date-before-today",
            t("dashboard.patients.form.errors.birthDateInvalid"),
            (value) => {
              if (!value) {
                return true;
              }

              const selected = new Date(`${value}T00:00:00`);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return selected < today;
            },
          ),

        phone: Yup.string()
          .trim()
          .max(30, t("dashboard.patients.form.errors.phoneMax")),

        notes: Yup.string()
          .trim()
          .max(5000, t("dashboard.patients.form.errors.notesMax")),
      }),

    [t],
  );

  const formik = useFormik({
    initialValues: {
      firstName: patient?.first_name || "",
      lastName: patient?.last_name || "",
      mrn: patient?.mrn || "",
      birthDate: patient?.birth_date
        ? String(patient.birth_date).slice(0, 10)
        : "",
      phone: patient?.phone || "",
      notes: patient?.notes || "",
    },

    enableReinitialize: true,
    validationSchema,

    onSubmit: async (values, helpers) => {
      setApiError("");

      const patientData = {
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        mrn: values.mrn.trim() || null,
        birth_date: values.birthDate || null,
        phone: values.phone.trim() || null,

        notes: values.notes.trim() || null,
      };

      try {
        const response = isEditMode
          ? await updatePatient(patient.id, patientData)
          : await createPatient(patientData);

        const savedPatient = response?.data?.patient || {
          ...patient,
          ...patientData,
        };

        helpers.resetForm();

        setApiError("");
        if (isEditMode) {
          if (onUpdated) {
            onUpdated(savedPatient);
          }
        } else {
          if (onCreated) {
            onCreated(savedPatient);
          }
        }

        onClose();
      } catch (error) {
        console.error(
          isEditMode ? "UPDATE PATIENT ERROR:" : "CREATE PATIENT ERROR:",
          error.response?.data || error.message,
        );

        setApiError(
          getApiErrorMessage(
            error,

            isEditMode
              ? t("dashboard.patients.form.errors.updateFailed")
              : t("dashboard.patients.form.errors.createFailed"),
          ),
        );
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    if (formik.isSubmitting) {
      return;
    }
    setApiError("");
    formik.resetForm();
    onClose();
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
          max-w-2xl
          overflow-hidden
          rounded-2xl
          border
          border-slate-100
          bg-white
          shadow-2xl
        "
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/*  Header */}

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEditMode
                ? t("dashboard.patients.form.editTitle")
                : t("dashboard.patients.form.addTitle")}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {isEditMode
                ? t("dashboard.patients.form.editSubtitle")
                : t("dashboard.patients.form.addSubtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={formik.isSubmitting}
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

        {/*  Form  */}

        <form onSubmit={formik.handleSubmit}>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            {/* API Error  */}

            {apiError && (
              <div
                role="alert"
                className="
                  mb-5
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-3
                  text-sm
                  text-red-600
                "
              >
                {apiError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* First Name  */}

              <FormField
                label={t("dashboard.patients.form.firstName")}
                name="firstName"
                formik={formik}
                placeholder={t("dashboard.patients.form.firstNamePlaceholder")}
                icon={User}
                isRtl={isRtl}
              />

              {/*  Last Name */}

              <FormField
                label={t("dashboard.patients.form.lastName")}
                name="lastName"
                formik={formik}
                placeholder={t("dashboard.patients.form.lastNamePlaceholder")}
                icon={User}
                isRtl={isRtl}
              />

              {/*  MRN  */}

              <FormField
                label={t("dashboard.patients.form.mrn")}
                name="mrn"
                formik={formik}
                dir="ltr"
                placeholder={t("dashboard.patients.form.mrnPlaceholder")}
                icon={Hash}
                isRtl={isRtl}
              />

              {/* Birth Date  */}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  {t("dashboard.patients.form.birthDate")}
                </label>

                <div className="relative">
                  <input
                    type="date"
                    name="birthDate"
                    value={formik.values.birthDate}
                    max={maxBirthDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`
                      w-full
                      rounded-xl
                      border
                      bg-white
                      px-4
                      py-3
                      text-sm
                      text-slate-800
                      transition
                      focus:outline-none
                      focus:ring-2
                      focus:ring-teal-500/20

                      ${
                        formik.touched.birthDate && formik.errors.birthDate
                          ? "border-red-500"
                          : "border-slate-200 focus:border-primary"
                      }
                    `}
                  />

                  <CalendarDays
                    className="
                      pointer-events-none
                      absolute
                      end-3
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-slate-400
                    "
                  />
                </div>

                {formik.touched.birthDate && formik.errors.birthDate && (
                  <p className="text-xs text-red-500">
                    {formik.errors.birthDate}
                  </p>
                )}
              </div>

              {/* Phone  */}

              <FormField
                label={t("dashboard.patients.form.phone")}
                name="phone"
                formik={formik}
                dir="ltr"
                placeholder={t("dashboard.patients.form.phonePlaceholder")}
                icon={Phone}
                isRtl={isRtl}
              />
            </div>

            {/*  Notes */}

            <div className="mt-5 space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                {t("dashboard.patients.form.notes")}
              </label>

              <div className="relative">
                <textarea
                  name="notes"
                  rows={4}
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder={t("dashboard.patients.form.notesPlaceholder")}
                  className={`
                    w-full
                    resize-none
                    rounded-xl
                    border
                    bg-white
                    px-4
                    py-3
                    pe-10
                    text-sm
                    text-slate-800
                    transition
                    focus:outline-none
                    focus:ring-2
                    focus:ring-teal-500/20

                    ${
                      formik.touched.notes && formik.errors.notes
                        ? "border-red-500"
                        : "border-slate-200 focus:border-primary"
                    }
                  `}
                />

                <FileText
                  className="
                    pointer-events-none
                    absolute
                    end-3
                    top-4
                    h-4
                    w-4
                    text-slate-400
                  "
                />
              </div>

              {formik.touched.notes && formik.errors.notes && (
                <p className="text-xs text-red-500">{formik.errors.notes}</p>
              )}
            </div>
          </div>

          {/* Footer  */}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={formik.isSubmitting}
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
              {t("dashboard.patients.form.cancel")}
            </button>

            <button
              type="submit"
              disabled={formik.isSubmitting}
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
                disabled:opacity-60
              "
            >
              {formik.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  <span>
                    {isEditMode
                      ? t("dashboard.patients.form.updating")
                      : t("dashboard.patients.form.creating")}
                  </span>
                </>
              ) : (
                <span>
                  {isEditMode
                    ? t("dashboard.patients.form.saveChanges")
                    : t("dashboard.patients.form.create")}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientFormModal;

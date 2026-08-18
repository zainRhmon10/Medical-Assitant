import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  User,
  Hash,
  CalendarDays,
  Phone,
  FileText,
  Activity,
  Loader2,
  RefreshCw,
  Baby,
  CheckCircle2,
} from "lucide-react";
import { getPatient } from "../services/patientApi";
import { getApiErrorMessage } from "../../auth/services/authApi";
import PatientTimeline from "../components/PatientTimeline";

import ObstetricStateModal from "../components/ObstetricStateModal";
const PatientDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { patientId } = useParams();
  const isRTL = i18n.language?.startsWith("ar");
  const [patient, setPatient] = useState(null);
  const [clinicalSessionsCount, setClinicalSessionsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [isObstetricStateOpen, setIsObstetricStateOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const loadPatient = useCallback(async () => {
    if (!patientId) {
      setApiError(t("dashboard.patients.details.errors.invalidPatient"));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setApiError("");

    try {
      const response = await getPatient(patientId);
      const payload = response?.data;

      const patientData =
        payload?.patient || payload?.data?.patient || payload?.data || payload;

      if (!patientData || typeof patientData !== "object" || !patientData.id) {
        setPatient(null);
        setApiError(t("dashboard.patients.details.errors.invalidResponse"));
        return;
      }

      setPatient(patientData);

      setClinicalSessionsCount(
        Number(
          patientData?.clinical_sessions_count ??
            payload?.clinical_sessions_count ??
            0,
        ),
      );
    } catch (error) {
      console.error(
        "GET PATIENT ERROR:",
        error.response?.data || error.message,
      );

      setPatient(null);

      setApiError(
        getApiErrorMessage(
          error,

          t("dashboard.patients.details.errors.loadFailed"),
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [patientId, t]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    return () => {
      clearTimeout(timeout);
    };
  }, [successMessage]);

  const handleObstetricStateUpdated = () => {
    setSuccessMessage(t("dashboard.patients.obstetric.updatedSuccess"));

    loadPatient();
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) {
      return "-";
    }
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) {
      return "-";
    }
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birth.getDate())
    ) {
      age -= 1;
    }

    return t("dashboard.patients.ageValue", {
      age,
    });
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return new Intl.DateTimeFormat(isRTL ? "ar" : "en", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  /*
   * Loading
   */

  if (isLoading) {
    return (
      <div
        className="
          flex
          min-h-[420px]
          items-center
          justify-center
        "
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />

          <p className="text-sm text-slate-500">
            {t("dashboard.patients.details.loading")}
          </p>
        </div>
      </div>
    );
  }

  /*
   * Error
   */

  if (apiError || !patient) {
    return (
      <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        <button
          type="button"
          onClick={() => navigate("/dashboard/patients")}
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            text-slate-500
            transition
            hover:text-primary
          "
        >
          <ArrowRight className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />

          {t("dashboard.patients.details.back")}
        </button>

        <div
          className="
            rounded-2xl
            border
            border-red-100
            bg-white
            p-8
            text-center
            shadow-sm
          "
        >
          <p className="text-sm font-medium text-red-600">
            {apiError || t("dashboard.patients.details.errors.loadFailed")}
          </p>

          <button
            type="button"
            onClick={loadPatient}
            className="
              mt-5
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-primary
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
            "
          >
            <RefreshCw className="h-4 w-4" />

            {t("dashboard.patients.details.retry")}
          </button>
        </div>
      </div>
    );
  }

  const fullName = [patient.first_name, patient.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/*  Back  */}

        <button
          type="button"
          onClick={() => navigate("/dashboard/patients")}
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            text-slate-500
            transition
            hover:text-primary
          "
        >
          <ArrowRight className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />

          {t("dashboard.patients.details.back")}
        </button>

        {/*  Success  */}

        {successMessage && (
          <div
            className="
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
            <CheckCircle2 className="h-4 w-4 shrink-0" />

            <span>{successMessage}</span>
          </div>
        )}

        {/*  Patient */}

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
          {/* Header */}

          <div
            className="
              flex
              flex-col
              gap-5
              border-b
              border-slate-100
              p-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div className="flex items-center gap-4">
              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-primary/10
                  text-primary
                "
              >
                <User className="h-7 w-7" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  {t("dashboard.patients.details.patient")}
                </p>

                <h1 className="mt-1 text-xl font-bold text-slate-800">
                  {fullName || "-"}
                </h1>

                <p className="mt-1 text-xs font-mono text-slate-400" dir="ltr">
                  {patient.mrn || `#${patient.id}`}
                </p>
              </div>
            </div>

            <div
              className="
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
              "
            >
              {/*  Obstetric State  */}
              <button
                type="button"
                onClick={() => setIsObstetricStateOpen(true)}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-primary/20
                  bg-white
                  px-4
                  py-3
                  text-xs
                  font-semibold
                  text-primary
                  transition
                  hover:bg-primary/5
                "
              >
                <Baby className="h-4 w-4" />

                <span>{t("dashboard.patients.obstetric.button")}</span>
              </button>

              {/* Sessions Count  */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-primary/10
                  bg-primary/5
                  px-4
                  py-3
                "
              >
                <Activity className="h-5 w-5 text-primary" />

                <div>
                  <p className="text-xs text-slate-500">
                    {t("dashboard.patients.details.sessions")}
                  </p>

                  <p className="text-lg font-bold text-primary">
                    {clinicalSessionsCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information  */}

          <div className="p-6">
            <h2 className="mb-5 text-sm font-bold text-slate-800">
              {t("dashboard.patients.details.basicInformation")}
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {/* MRN */}

              <div
                className="
                  rounded-xl
                  border
                  border-slate-100
                  bg-slate-50/60
                  p-4
                "
              >
                <div className="mb-2 flex items-center gap-2 text-slate-400">
                  <Hash className="h-4 w-4" />

                  <p className="text-xs">
                    {t("dashboard.patients.details.mrn")}
                  </p>
                </div>

                <p className="text-sm font-semibold text-slate-800" dir="ltr">
                  {patient.mrn || "-"}
                </p>
              </div>

              {/* Birth Date */}

              <div
                className="
                  rounded-xl
                  border
                  border-slate-100
                  bg-slate-50/60
                  p-4
                "
              >
                <div className="mb-2 flex items-center gap-2 text-slate-400">
                  <CalendarDays className="h-4 w-4" />

                  <p className="text-xs">
                    {t("dashboard.patients.details.birthDate")}
                  </p>
                </div>

                <p className="text-sm font-semibold text-slate-800">
                  {formatDate(patient.birth_date)}
                </p>

                {patient.birth_date && (
                  <p className="mt-1 text-xs text-slate-400">
                    {calculateAge(patient.birth_date)}
                  </p>
                )}
              </div>

              {/* Phone */}

              <div
                className="
                  rounded-xl
                  border
                  border-slate-100
                  bg-slate-50/60
                  p-4
                "
              >
                <div className="mb-2 flex items-center gap-2 text-slate-400">
                  <Phone className="h-4 w-4" />

                  <p className="text-xs">
                    {t("dashboard.patients.details.phone")}
                  </p>
                </div>

                <p className="text-sm font-semibold text-slate-800" dir="ltr">
                  {patient.phone || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Notes  */}

          <div className="border-t border-slate-100 p-6">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />

              <h2 className="text-sm font-bold text-slate-800">
                {t("dashboard.patients.details.notes")}
              </h2>
            </div>

            <div
              className="
                min-h-[90px]
                rounded-xl
                border
                border-slate-100
                bg-slate-50/60
                p-4
              "
            >
              <p
                className="
                  whitespace-pre-wrap
                  text-sm
                  leading-7
                  text-slate-600
                "
              >
                {patient.notes || t("dashboard.patients.details.noNotes")}
              </p>
            </div>
          </div>
        </div>

        {/*  Patient Timeline  */}

        <PatientTimeline patientId={patient.id} />
      </div>

      {/*  Obstetric State Modal  */}

      <ObstetricStateModal
        isOpen={isObstetricStateOpen}
        patientId={patient.id}
        onClose={() => setIsObstetricStateOpen(false)}
        onUpdated={handleObstetricStateUpdated}
      />
    </>
  );
};

export default PatientDetailsPage;

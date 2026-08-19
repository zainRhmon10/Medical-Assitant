import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  createStep1Schema,
  createStep2Schema,
  STEP_FIELDS,
} from "../components/sessionSchema";
import SessionStepper from "../components/Stepper";
import StepInfo from "../components/SetupSess";
import StepDiagnosis from "../components/StepDiagnosis";
import StepProcessing from "../components/StepProcessing";
import {
  createClinicalSession,
  generateIdempotencyKey,
  getClinicalSession,
  retryClinicalSession,
} from "../services/sessionApi";

import { getApiErrorMessage } from "../../auth/services/authApi";

const extractSession = (response) => {
  const payload = response?.data;

  return (
    payload?.session ||
    payload?.data?.session ||
    payload?.data ||
    payload ||
    null
  );
};

const NewSessionPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [clinicalSession, setClinicalSession] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isRetryingSession, setIsRetryingSession] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const idempotencyKeyRef = useRef(null);
  const createVisitAtRef = useRef(null);

  const previousPatientIdRef = useRef("");
  const previousAudioRef = useRef(null);

  const pollingTimerRef = useRef(null);

  const step1Schema = useMemo(() => createStep1Schema(t), [t]);
  const step2Schema = useMemo(() => createStep2Schema(t), [t]);

  const formik = useFormik({
    initialValues: {
      patientId: "",
      patientName: "",
      diagnosisAudio: null,
      diagnosisText: "",
      recordingDuration: 0,
    },

    validationSchema:
      step === 1 ? step1Schema : step === 2 ? step2Schema : undefined,
  });

  const resetCreateRequestIdentity = useCallback(() => {
    idempotencyKeyRef.current = null;
    createVisitAtRef.current = null;
  }, []);

  useEffect(() => {
    const patientChanged =
      previousPatientIdRef.current !== formik.values.patientId;
    const audioChanged =
      previousAudioRef.current !== formik.values.diagnosisAudio;

    if (patientChanged || audioChanged) {
      resetCreateRequestIdentity();

      previousPatientIdRef.current = formik.values.patientId;
      previousAudioRef.current = formik.values.diagnosisAudio;
    }
  }, [
    formik.values.patientId,
    formik.values.diagnosisAudio,
    resetCreateRequestIdentity,
  ]);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);

      pollingTimerRef.current = null;
    }
  }, []);

  const pollClinicalSession = useCallback(
    async (sessionId) => {
      if (!sessionId) {
        return;
      }
      stopPolling();
      try {
        const response = await getClinicalSession(sessionId);
        const session = extractSession(response);
        if (!session || !session.id) {
          throw new Error("Invalid clinical session response.");
        }
        setClinicalSession(session);
        setSessionError("");
        const status = String(session.status || "").toLowerCase();

        if (status === "complete") {
          stopPolling();
          navigate(`/dashboard/reports/${session.id}`, {
            replace: true,
          });

          return;
        }

        if (status === "failed") {
          stopPolling();

          return;
        }

        pollingTimerRef.current = setTimeout(() => {
          pollClinicalSession(sessionId);
        }, 3000);
      } catch (error) {
        console.error(
          "POLL CLINICAL SESSION ERROR:",
          error.response?.data || error.message,
        );

        stopPolling();

        setSessionError(
          getApiErrorMessage(
            error,

            t("createSession.processing.errors.pollFailed"),
          ),
        );
      }
    },
    [navigate, stopPolling, t],
  );

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const goNext = async () => {
    const errors = await formik.validateForm();
    const currentFields = STEP_FIELDS[step] || [];
    const hasErrors = currentFields.some((field) => errors[field]);

    if (hasErrors) {
      const touched = {};
      currentFields.forEach((field) => {
        touched[field] = true;
      });

      formik.setTouched({
        ...formik.touched,
        ...touched,
      });

      return;
    }

    if (step === 1) {
      setStep(2);
    }
  };

  const createSession = async () => {
    if (!formik.values.patientId) {
      setStep(1);

      return;
    }

    if (!formik.values.diagnosisAudio) {
      formik.setFieldTouched("diagnosisAudio", true, false);

      return;
    }
    setStep(3);
    setSessionError("");
    setIsCreatingSession(true);
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = generateIdempotencyKey();
      createVisitAtRef.current = new Date().toISOString();
    }

    try {
      const response = await createClinicalSession({
        patientId: formik.values.patientId,
        audio: formik.values.diagnosisAudio,
        visitAt: createVisitAtRef.current,
        idempotencyKey: idempotencyKeyRef.current,
      });

      const session = extractSession(response);

      if (!session || !session.id) {
        throw new Error("Invalid clinical session response.");
      }

      setClinicalSession(session);
      setSessionError("");

      const status = String(session.status || "").toLowerCase();
      if (status === "complete") {
        navigate(`/dashboard/reports/${session.id}`, {
          replace: true,
        });

        return;
      }

      if (status !== "failed") {
        await pollClinicalSession(session.id);
      }
    } catch (error) {
      console.error(
        "CREATE CLINICAL SESSION ERROR:",
        error.response?.data || error.message,
      );
      setSessionError(
        getApiErrorMessage(
          error,

          t("createSession.processing.errors.createFailed"),
        ),
      );
    } finally {
      setIsCreatingSession(false);
    }
  };

  const retryCreateSession = async () => {
    await createSession();
  };

  const retryFailedSession = async () => {
    if (!clinicalSession?.id) {
      return;
    }
    setIsRetryingSession(true);
    setSessionError("");
    try {
      const response = await retryClinicalSession(
        clinicalSession.id,

        formik.values.diagnosisAudio,
      );

      const session = extractSession(response);

      if (session && typeof session === "object") {
        setClinicalSession((previous) => ({
          ...previous,
          ...session,
        }));
      }

      await pollClinicalSession(clinicalSession.id);
    } catch (error) {
      console.error(
        "RETRY CLINICAL SESSION ERROR:",
        error.response?.data || error.message,
      );

      setSessionError(
        getApiErrorMessage(
          error,

          t("createSession.processing.errors.retryFailed"),
        ),
      );
    } finally {
      setIsRetryingSession(false);
    }
  };

  const retryPoll = async () => {
    if (!clinicalSession?.id) {
      return;
    }
    setSessionError("");

    await pollClinicalSession(clinicalSession.id);
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800">
            {t("createSession.title")}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {t("createSession.subtitle")}
          </p>
        </div>

        <SessionStepper step={step} />

        <div className="space-y-5">
          {step === 1 && <StepInfo formik={formik} onNext={goNext} />}

          {step === 2 && (
            <StepDiagnosis
              formik={formik}
              onNext={createSession}
              onBack={goBack}
            />
          )}

          {step === 3 && (
            <StepProcessing
              session={clinicalSession}
              isCreating={isCreatingSession}
              isRetrying={isRetryingSession}
              error={sessionError}
              onRetryCreate={retryCreateSession}
              onRetrySession={retryFailedSession}
              onRetryPoll={retryPoll}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NewSessionPage;

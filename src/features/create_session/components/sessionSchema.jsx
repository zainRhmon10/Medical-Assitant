import * as Yup from "yup";

export const createStep1Schema = (t) =>
  Yup.object({
    patientId: Yup.number()
      .typeError(t("createSession.validation.patientRequired"))
      .positive(t("createSession.validation.patientInvalid"))
      .integer(t("createSession.validation.patientInvalid"))
      .required(t("createSession.validation.patientRequired")),
    patientName: Yup.string().nullable(),
  });

export const createStep2Schema = (t) =>
  Yup.object({
    diagnosisAudio: Yup.mixed().nullable(),
    diagnosisText: Yup.string().nullable(),
    recordingDuration: Yup.number().min(0).default(0),
  });

export const STEP_FIELDS = {
  1: ["patientId"],

  2: ["diagnosisAudio"],
};

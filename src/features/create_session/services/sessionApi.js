import api from "../../auth/services/authApi";

export const generateIdempotencyKey = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
};

/*
 * List Clinical Sessions
 */
export const getClinicalSessions = async ({
  patientId = null,
  status = "",
  page = 1,
  perPage = 20,
} = {}) => {
  const params = {
    page,
    per_page: perPage,
  };

  if (patientId) {
    params.patient_id = patientId;
  }
  if (status) {
    params.status = status;
  }
  const response = await api.get("/sessions", {
    params,
  });
  return response;
};

/*
 * Create Clinical Session
 */
export const createClinicalSession = async ({
  patientId,
  audio,
  visitAt = null,
  idempotencyKey,
}) => {
  const formData = new FormData();
  formData.append("patient_id", String(patientId));
  formData.append("audio", audio);
  if (visitAt) {
    formData.append("visit_at", visitAt);
  }

  const response = await api.post("/sessions", formData, {
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });

  return response;
};

/*
 * Get / Poll Clinical Session
 */
export const getClinicalSession = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}`);

  return response;
};

/*
 * Retry Failed Clinical Session
 */
export const retryClinicalSession = async (sessionId, audio = null) => {
  if (!audio) {
    const response = await api.post(`/sessions/${sessionId}/retry`);

    return response;
  }
  const formData = new FormData();
  formData.append("audio", audio);
  const response = await api.post(`/sessions/${sessionId}/retry`, formData);

  return response;
};

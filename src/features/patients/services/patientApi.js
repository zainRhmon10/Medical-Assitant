import api from "../../auth/services/authApi";

/*
 * GET patients
 */
export const getPatients = async ({ q = "", page = 1, perPage = 20 } = {}) => {
  const params = {
    page,
    per_page: perPage,
  };

  if (q.trim()) {
    params.q = q.trim();
  }

  const response = await api.get("/patients", {
    params,
  });

  return response;
};

/*
 * Create Patient
 */
export const createPatient = async (patientData) => {
  const response = await api.post("/patients", patientData);

  return response;
};

/*
 * Get One Patient
 */
export const getPatient = async (patientId) => {
  const response = await api.get(`/patients/${patientId}`);

  return response;
};

/*
 * Update Patient
 */
export const updatePatient = async (patientId, patientData) => {
  const response = await api.patch(`/patients/${patientId}`, patientData);

  return response;
};

/*
 * Patient Timeline
 */
export const getPatientTimeline = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/timeline`);

  return response;
};

/*
 * Set / Correct Obstetric State
 */
export const updatePatientObstetricState = async (patientId, stateData) => {
  const response = await api.post(`/patients/${patientId}/state`, stateData);

  return response;
};

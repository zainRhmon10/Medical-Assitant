import api from "../../auth/services/authApi";

/*
 * Get SOAP Report
 */
export const getClinicalReport = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/report`);

  return response;
};

/*
 * Get Review Queue
 */
export const getReviewQueue = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/review-queue`);

  return response;
};

/*
 * Get Full Session Audio
 */
export const getFullSessionAudio = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/audio`, {
    responseType: "blob",
  });

  return response;
};

/*
 * Correct Report Item
 */

export const correctReportItem = async (sessionId, itemId, changes) => {
  const response = await api.patch(
    `/sessions/${sessionId}/items/${itemId}`,
    changes,
  );

  return response;
};

/*
 * Get KBS Suggestions
 */
export const getSuggestions = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/suggestions`);

  return response;
};

/*
 * Submit Suggestion Feedback
 */
export const submitSuggestionFeedback = async (
  sessionId,
  suggestionId,
  feedback,
) => {
  const response = await api.post(
    `/sessions/${sessionId}/suggestions/${suggestionId}/feedback`,
    feedback,
  );

  return response;
};

/*
 * Finalize Report
 */

export const finalizeClinicalReport = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/finalize`);

  return response;
};

/*
 * Get Finalized Report
 */
export const getFinalizedReport = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/finalized-report`);

  return response;
};

/*
 * Get All Finalized Reports
 */
export const getAllFinalizedReports = async () => {
  const response = await api.get("/reports/finalized");

  return response;
};

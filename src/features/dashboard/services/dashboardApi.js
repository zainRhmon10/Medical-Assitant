import api from "../../auth/services/authApi";

export const getDoctorDashboard = async ({ timezone } = {}) => {
  const browserTimezone =
    timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const response = await api.get("/dashboard", {
    headers: {
      "X-Timezone": browserTimezone,
    },
  });

  return response;
};

export default getDoctorDashboard;

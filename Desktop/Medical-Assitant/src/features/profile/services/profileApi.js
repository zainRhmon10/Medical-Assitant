import api from "../../auth/services/authApi";

/**
 * Get doctor's profile details.
 * GET /api/doctor/profile
 */
export const getDoctorProfile = async () => {
  return await api.get("/profile");
};

/**
 * Update doctor's profile details.
 * PATCH /api/doctor/profile
 * @param {Object} profileData
 * @param {string} profileData.first_name
 * @param {string} profileData.last_name
 * @param {string} [profileData.phone]
 * @param {string} [profileData.hospital_or_clinic]
 * @param {number[]} [profileData.specialty_ids]
 */
export const updateDoctorProfile = async (profileData) => {
  return await api.patch("/profile", profileData);
};

/**
 * Update doctor's profile image.
 * POST /api/doctor/profile/image
 * @param {File} imageFile - The image binary file
 */
export const updateDoctorProfileImage = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  return await api.post("/profile/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

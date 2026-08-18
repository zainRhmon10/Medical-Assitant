import axios from "axios";

const TOKEN_KEY = "doctorToken";

const api = axios.create({
  baseURL: "https://tibscribe-api.onrender.com/api/doctor",

  headers: {
    Accept: "application/json",
  },
}); 

//Token Helpers

export const saveAuthToken = (token, remember = true) => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
};

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);

  sessionStorage.removeItem(TOKEN_KEY);
};

// Axios Interceptor

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    /*
     * هذه endpoints عامة
     * ولا نرسل معها Bearer Token.
     */
    const publicRoutes = [
      "/login",
      "/register",
      "/confirmation/email",
      "/confirmation/verify",
      "/passwords/email",
      "/passwords/verify",
      "/passwords/reset",
      "/specialties",
    ];

    const isPublicRoute = publicRoutes.some((route) =>
      config.url?.startsWith(route),
    );

    if (token && !isPublicRoute) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

//Login
export const loginDoctor = async (email, password) => {
  const formData = new FormData();

  formData.append("email", email);

  formData.append("password", password);

  const response = await api.post("/login", formData);

  return response;
};

// Logout
export const logoutDoctor = async () => {
  const response = await api.post("/logout");

  return response;
};

// Extract Token
export const extractToken = (response) => {
  return response?.data?.token || response?.data?.data?.token || null;
};

// Error Message
export const getApiErrorMessage = (
  error,
  fallbackMessage = "Something went wrong.",
) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  const errors = error?.response?.data?.errors;
  if (errors) {
    const firstError = Object.values(errors)?.[0];
    if (Array.isArray(firstError)) {
      return firstError[0];
    }

    if (typeof firstError === "string") {
      return firstError;
    }
  }

  return fallbackMessage;
};

//Email verification required?

export const isEmailVerificationRequired = (error) => {
  const status = error?.response?.status;

  const message = error?.response?.data?.message?.toLowerCase() || "";

  return (
    status === 401 &&
    (message.includes("not confirmed") ||
      message.includes("verification code") ||
      message.includes("confirm your email"))
  );
};

// Confirm Email
export const verifyEmail = async (email, otp) => {
  const formData = new FormData();

  formData.append("email", email);
  formData.append("OTP", otp);
  const response = await api.post("/confirmation/verify", formData);

  return response;
};

// Resend OTP

export const resendEmailVerificationOtp = async (email) => {
  const formData = new FormData();

  formData.append("email", email);

  const response = await api.post("/confirmation/email", formData);

  return response;
};

// Get Specialties
export const getSpecialties = async () => {
  const response = await api.get("/specialties");

  return response;
};

// Register Doctor
export const registerDoctor = async (doctorData) => {
  const response = await api.post("/register", doctorData);

  return response;
};

// Send Forgot Password OTP
export const sendResetPasswordOtp = async (email) => {
  const formData = new FormData();

  formData.append("email", email);

  const response = await api.post("/passwords/email", formData);

  return response;
};

// Verify Forgot Password OTP
export const verifyResetPasswordOtp = async (email, otp) => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("OTP", otp);
  const response = await api.post("/passwords/verify", formData);

  return response;
};

// ==========================================
// Reset Password
// ==========================================

export const resetDoctorPassword = async (
  token,
  password,
  passwordConfirmation,
  logoutOtherDevices = false,
) => {
  const formData = new FormData();

  formData.append("password", password);

  formData.append("password_confirmation", passwordConfirmation);

  formData.append("logout_oth_dev", String(logoutOtherDevices));

  const response = await api.post("/passwords/reset", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
};

export default api;

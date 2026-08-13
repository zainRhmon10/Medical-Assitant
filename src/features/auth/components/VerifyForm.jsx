import { useEffect, useRef, useState } from "react";
import { Mail, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import {
  extractToken,
  getApiErrorMessage,
  resendEmailVerificationOtp,
  saveAuthToken,
  sendResetPasswordOtp,
  verifyEmail,
  verifyResetPasswordOtp,
} from "../services/authApi";

const OTP_VALIDITY_SECONDS = 5 * 60;
const VERIFICATION_EMAIL_KEY = "pendingVerificationEmail";
const VERIFICATION_EXPIRES_KEY = "pendingVerificationExpiresAt";
const VERIFICATION_REMEMBER_KEY = "pendingVerificationRemember";

const VERIFICATION_PURPOSE_KEY = "pendingVerificationPurpose";

const PASSWORD_RESET_TOKEN_KEY = "pendingPasswordResetToken";

const EmailVerification = () => {
  const { t, i18n } = useTranslation();

  const location = useLocation();
  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [apiError, setApiError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const email =
    location.state?.email ||
    sessionStorage.getItem(VERIFICATION_EMAIL_KEY) ||
    "";

  const purpose =
    location.state?.purpose ||
    sessionStorage.getItem(VERIFICATION_PURPOSE_KEY) ||
    "confirmation";

  const getInitialTimer = () => {
    const expiresAt = Number(sessionStorage.getItem(VERIFICATION_EXPIRES_KEY));

    if (!expiresAt) {
      return 0;
    }

    const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
    return Math.max(remaining, 0);
  };

  const [timer, setTimer] = useState(getInitialTimer);

  useEffect(() => {
    const loginEmail = location.state?.email;
    const otpJustSent = location.state?.otpJustSent;

    if (!loginEmail) {
      return;
    }

    sessionStorage.setItem(VERIFICATION_EMAIL_KEY, loginEmail);

    sessionStorage.setItem(
      VERIFICATION_REMEMBER_KEY,
      String(location.state?.remember ?? true),
    );

    sessionStorage.setItem(
      VERIFICATION_PURPOSE_KEY,
      location.state?.purpose || "confirmation",
    );

    if (otpJustSent) {
      const expiresAt = Date.now() + OTP_VALIDITY_SECONDS * 1000;

      sessionStorage.setItem(VERIFICATION_EXPIRES_KEY, String(expiresAt));

      setTimer(OTP_VALIDITY_SECONDS);

      navigate("/verify", {
        replace: true,
        state: {
          email: loginEmail,
          purpose: location.state?.purpose,
          remember: location.state?.remember,
          otpJustSent: false,
        },
      });
    }
  }, [
    location.state?.email,
    location.state?.otpJustSent,
    location.state?.purpose,
    location.state?.remember,
    navigate,
  ]);

  useEffect(() => {
    if (!email) {
      navigate("/login", {
        replace: true,
      });
    }
  }, [email, navigate]);

  useEffect(() => {
    const updateTimer = () => {
      const expiresAt = Number(
        sessionStorage.getItem(VERIFICATION_EXPIRES_KEY),
      );

      if (!expiresAt) {
        setTimer(0);
        return;
      }

      const remaining = Math.ceil((expiresAt - Date.now()) / 1000);

      setTimer(Math.max(remaining, 0));
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  const handleCodeChange = (index, value) => {
    const digit = value.replace(/\D/g, "");

    if (!digit) {
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
      return;
    }

    const newCode = [...code];

    newCode[index] = digit[digit.length - 1];

    setCode(newCode);

    setApiError("");
    setResendMessage("");

    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "Enter") {
      handleVerify();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const pastedValue = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedValue) {
      return;
    }

    const newCode = ["", "", "", "", "", ""];

    pastedValue.split("").forEach((digit, index) => {
      newCode[index] = digit;
    });

    setCode(newCode);

    setApiError("");
    setResendMessage("");

    const nextIndex = Math.min(pastedValue.length, 5);

    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    if (isVerifying) {
      return;
    }

    setApiError("");
    setResendMessage("");

    const otp = code.join("");

    if (otp.length !== 6) {
      setApiError(t("auth.verify.errors.codeIncomplete"));

      return;
    }

    if (timer <= 0) {
      setApiError(t("auth.verify.codeExpired"));

      return;
    }

    if (!email) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    setIsVerifying(true);

    try {
      // تمت الإضافة: اختيار API المناسب حسب نوع عملية التحقق
      let response;

      if (purpose === "password-reset") {
        response = await verifyResetPasswordOtp(email, otp);
      } else {
        response = await verifyEmail(email, otp);
      }
      console.log("VERIFY RESPONSE:", response.data);
      const token = extractToken(response);

      if (!token) {
        throw new Error(t("auth.errors.tokenMissing"));
      }

      // تمت الإضافة: في Forget Password لا نحفظ Token كتسجيل دخول
      if (purpose === "password-reset") {
        sessionStorage.setItem(PASSWORD_RESET_TOKEN_KEY, token);
        sessionStorage.removeItem(VERIFICATION_EMAIL_KEY);
        sessionStorage.removeItem(VERIFICATION_EXPIRES_KEY);
        sessionStorage.removeItem(VERIFICATION_REMEMBER_KEY);
        sessionStorage.removeItem(VERIFICATION_PURPOSE_KEY);
        navigate("/reset-password", {
          replace: true,
        });

        return;
      }

      const storedRemember = sessionStorage.getItem(VERIFICATION_REMEMBER_KEY);
      const remember = location.state?.remember ?? storedRemember === "true";
      saveAuthToken(token, remember);
      sessionStorage.removeItem(VERIFICATION_EMAIL_KEY);
      sessionStorage.removeItem(VERIFICATION_EXPIRES_KEY);
      sessionStorage.removeItem(VERIFICATION_REMEMBER_KEY);
      sessionStorage.removeItem(VERIFICATION_PURPOSE_KEY);

      navigate("/dashboard/overview", {
        replace: true,
      });
    } catch (error) {
      console.error("VERIFY ERROR:", error.response?.data || error.message);

      setApiError(
        getApiErrorMessage(error, t("auth.verify.errors.codeInvalid")),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) {
      return;
    }

    if (isResending || !email) {
      return;
    }

    setApiError("");
    setResendMessage("");

    setIsResending(true);

    try {
      // تمت الإضافة: Resend يستخدم API مختلف في حالة Forget Password
      let response;

      if (purpose === "password-reset") {
        response = await sendResetPasswordOtp(email);
      } else {
        response = await resendEmailVerificationOtp(email);
      }

      console.log("RESEND OTP RESPONSE:", response.data);

      const expiresAt = Date.now() + OTP_VALIDITY_SECONDS * 1000;

      sessionStorage.setItem(VERIFICATION_EXPIRES_KEY, String(expiresAt));

      sessionStorage.setItem(VERIFICATION_EMAIL_KEY, email);

      // تمت الإضافة: إبقاء purpose محفوظاً بعد إرسال OTP جديد
      sessionStorage.setItem(VERIFICATION_PURPOSE_KEY, purpose);
      setTimer(OTP_VALIDITY_SECONDS);
      setCode(["", "", "", "", "", ""]);

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 0);

      setResendMessage(
        response?.data?.message || t("auth.verify.resendSuccess"),
      );
    } catch (error) {
      console.error("RESEND OTP ERROR:", error.response?.data || error.message);

      setApiError(
        getApiErrorMessage(error, t("auth.verify.errors.resendFailed")),
      );
    } finally {
      setIsResending(false);
    }
  };

  const loading = isVerifying || isResending;

  const isRTL = i18n.language === "ar";

  return (
    <div className="w-full max-w-md">
      {/* Title  */}

      <h1 className="text-2xl font-bold text-slate-800">
        {t("auth.verify.title")}
      </h1>

      <p className="mt-2 mb-8 text-sm text-slate-500">
        {t("auth.verify.subtitle")}
      </p>

      {/* Email */}

      <div className="mb-8 flex items-center justify-between rounded-xl bg-sky-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            <Mail className="h-5 w-5" />
          </div>

          <div className="space-y-1 text-sm">
            <p className="text-xs text-slate-400">{t("auth.verify.sentTo")}</p>

            <p className="font-medium text-slate-800" dir="ltr">
              {email}
            </p>
          </div>
        </div>
      </div>

      {/* API Error  */}

      {apiError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {apiError}
        </div>
      )}

      {/*  Resend Success  */}

      {resendMessage && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {resendMessage}
        </div>
      )}

      {/* OTP  */}

      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-slate-700">
          {t("auth.verify.codeLabel")}
        </label>

        <div
          className="flex justify-between gap-2"
          dir="ltr"
          onPaste={handlePaste}
        >
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={loading || timer <= 0}
              autoFocus={index === 0}
              onChange={(event) => handleCodeChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              className="
                  h-14
                  w-12
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-center
                  text-lg
                  font-semibold
                  text-slate-800
                  transition
                  focus:border-primary
                  focus:outline-none
                  focus:ring-2
                  focus:ring-primary/20
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
            />
          ))}
        </div>
      </div>

      {/*  Verify Button */}

      <motion.button
        type="button"
        whileTap={
          loading || timer <= 0
            ? {}
            : {
                scale: 0.98,
              }
        }
        onClick={handleVerify}
        disabled={loading || timer <= 0}
        className="
          flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-primary
          py-3
          text-sm
          font-semibold
          text-white
          transition
          hover:cursor-pointer
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {isVerifying ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />

            <span>{t("auth.verify.verifying")}</span>
          </>
        ) : (
          <>
            <span>{t("auth.verify.verifyButton")}</span>

            <ArrowLeft className={`h-4 w-4 ${!isRTL ? "rotate-180" : ""}`} />
          </>
        )}
      </motion.button>

      {/* Timer / Resend */}

      <div className="mt-6 flex flex-col items-center gap-2 text-center text-sm">
        {timer > 0 ? (
          <>
            <p className="text-slate-500">{t("auth.verify.codeExpiresIn")}</p>

            <span dir="ltr" className="text-base font-semibold text-primary">
              {formatTime(timer)}
            </span>
          </>
        ) : (
          <>
            <p className="text-red-500">{t("auth.verify.codeExpired")}</p>

            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="
                inline-flex
                items-center
                gap-2
                font-medium
                text-primary
                hover:underline
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              <span>
                {isResending
                  ? t("auth.verify.resending")
                  : t("auth.verify.resend")}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;

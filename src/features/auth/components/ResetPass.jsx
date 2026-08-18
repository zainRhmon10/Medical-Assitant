import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import FormField from "../../../component/ui/Field";
import { useFormik } from "formik";
import * as Yup from "yup";
import { getApiErrorMessage, resetDoctorPassword } from "../services/authApi";

const PASSWORD_RESET_TOKEN_KEY = "pendingPasswordResetToken";
const ResetPass = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.dir() === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState("");

  const resetToken = sessionStorage.getItem(PASSWORD_RESET_TOKEN_KEY);

  /*
   * إذا دخل المستخدم /reset-password
   * مباشرة بدون Verify OTP،
   * نعيده إلى Forget Password.
   */
  useEffect(() => {
    if (!resetToken) {
      navigate("/forget-password", {
        replace: true,
      });
    }
  }, [resetToken, navigate]);

  /*
   * min 8
   * uppercase
   * lowercase
   * special character
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        password: Yup.string()

          .min(8, t("auth.register.passwordMin"))
          .matches(
            /[A-Z]/,
            t(
              "auth.resetPass.errors.uppercase",
              "Password must contain at least one uppercase letter",
            ),
          )

          .matches(
            /[a-z]/,
            t(
              "auth.resetPass.errors.lowercase",
              "Password must contain at least one lowercase letter",
            ),
          )

          .matches(
            /[^A-Za-z0-9]/,
            t(
              "auth.resetPass.errors.symbol",
              "Password must contain at least one special character",
            ),
          )

          .required(t("auth.errors.passwordRequired")),

        confirmPassword: Yup.string()

          .oneOf(
            [Yup.ref("password")],

            t("auth.register.errors.confirmPasswordMismatch"),
          )

          .required(t("auth.register.errors.confirmPasswordRequired")),
      }),

    [t],
  );

  /*
   * Formik
   */
  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },

    validationSchema,

    onSubmit: async (values, helpers) => {
      setApiError("");

      if (!resetToken) {
        navigate("/forget-password", {
          replace: true,
        });
        return;
      }

      try {
        const response = await resetDoctorPassword(
          resetToken,
          values.password,
          values.confirmPassword,
        );

        console.log("RESET PASSWORD RESPONSE:", response.data);

        /*
         * Reset انتهى.
         * نحذف Token المؤقت.
         */
        sessionStorage.removeItem(PASSWORD_RESET_TOKEN_KEY);
        sessionStorage.removeItem("pendingVerificationEmail");
        sessionStorage.removeItem("pendingVerificationExpiresAt");
        sessionStorage.removeItem("pendingVerificationPurpose");
        sessionStorage.removeItem("pendingVerificationRemember");

        /*
         * العودة إلى Login.
         * LoginForm عندنا أصلًا
         * يدعم passwordReset.
         */
        navigate("/login", {
          replace: true,
          state: {
            passwordReset: true,
          },
        });
      } catch (error) {
        console.error(
          "RESET PASSWORD ERROR:",
          error.response?.data || error.message,
        );

        setApiError(
          getApiErrorMessage(
            error,
            t(
              "auth.resetPass.errors.resetFailed",
              "Couldn't reset your password. Please try again.",
            ),
          ),
        );
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  return (
    <div className="w-full max-w-md">
      {/* Title  */}

      <h1 className="text-2xl font-bold text-slate-800">
        {t("auth.resetPass.title")}
      </h1>

      <p className="mt-2 mb-8 text-sm text-slate-500">
        {t("auth.resetPass.subtitle")}
      </p>

      {/*  API Error  */}

      {apiError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {apiError}
        </div>
      )}

      {/* Form  */}

      <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
        {/* New Password*/}

        <FormField
          label={t("auth.password")}
          name="password"
          type={showPassword ? "text" : "password"}
          dir="ltr"
          placeholder="••••••••"
          formik={formik}
          isRtl={isRtl}
          extraClasses="pe-10 ps-10"
          icon={Lock}
          startElement={
            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              className="text-slate-400 transition hover:text-slate-600"
              aria-label={
                showPassword ? t("auth.hidePassword") : t("auth.showPassword")
              }
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        {/*  Confirm Password */}

        <FormField
          label={t("auth.register.confirmPassword")}
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          dir="ltr"
          placeholder="••••••••"
          formik={formik}
          isRtl={isRtl}
          extraClasses="pe-10 ps-10"
          icon={Lock}
          startElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((previous) => !previous)}
              className="text-slate-400 transition hover:text-slate-600"
              aria-label={
                showConfirmPassword
                  ? t("auth.hidePassword")
                  : t("auth.showPassword")
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        {/*  Submit */}

        <motion.button
          type="submit"
          whileTap={
            formik.isSubmitting
              ? {}
              : {
                  scale: 0.98,
                }
          }
          disabled={formik.isSubmitting}
          className="
            mt-10
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
          {formik.isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />

              <span>
                {t("auth.resetPass.resetting", "Resetting password...")}
              </span>
            </>
          ) : (
            <>
              <span>{t("auth.resetPass.sendButton")}</span>

              <ArrowIcon className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};

export default ResetPass;

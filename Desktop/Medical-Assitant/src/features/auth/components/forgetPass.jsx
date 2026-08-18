import { useState } from "react";
import { Mail, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import FormField from "../../../component/ui/Field";
import { getApiErrorMessage, sendResetPasswordOtp } from "../services/authApi";

const ForgetPass = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.dir() === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const [apiError, setApiError] = useState("");

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .trim()
        .email(t("auth.errors.emailInvalid"))
        .required(t("auth.errors.emailRequired")),
    }),
    onSubmit: async (values, helpers) => {
      setApiError("");
      const email = values.email.trim().toLowerCase();

      try {
        const response = await sendResetPasswordOtp(email);
        console.log("FORGOT PASSWORD RESPONSE:", response.data);

        /*
         * تنظيف أي Verification قديم.
         * حتى لا تختلط عملية Confirm Email
         * مع عملية Forgot Password.
         */
        sessionStorage.removeItem("pendingVerificationEmail");
        sessionStorage.removeItem("pendingVerificationExpiresAt");
        sessionStorage.removeItem("pendingVerificationRemember");
        sessionStorage.removeItem("pendingVerificationPurpose");

        navigate("/verify", {
          replace: true,

          state: {
            email,
            purpose: "password-reset",
            otpJustSent: true,
          },
        });
      } catch (error) {
        console.error(
          "FORGOT PASSWORD ERROR:",
          error.response?.data || error.message,
        );

        setApiError(
          getApiErrorMessage(error, t("auth.forgetPass.errors.sendFailed")),
        );
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  return (
    <div className="w-full max-w-md">
      {/* Title */}

      <h1 className="text-2xl font-bold text-slate-800">
        {t("auth.forgetPass.title")}
      </h1>

      <p className="mt-2 mb-8 text-sm text-slate-500">
        {t("auth.forgetPass.subtitle")}
      </p>

      {/*  Info  */}

      <div className="mb-8 flex items-center justify-between rounded-xl bg-sky-100 px-4 py-4">
        <div className="flex items-center">
          <p className="text-sm text-slate-500">
            {t("auth.forgetPass.sendTo")}
          </p>
        </div>
      </div>

      {/* API Error */}

      {apiError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {apiError}
        </div>
      )}

      {/* Form  */}

      <form onSubmit={formik.handleSubmit} noValidate>
        {/* Email */}

        <div className="mb-6">
          <FormField
            label={t("auth.email")}
            name="email"
            type="email"
            formik={formik}
            dir="ltr"
            placeholder={t("auth.emailPlaceholder")}
            icon={Mail}
            isRtl={isRtl}
            extraClasses="pe-10 ps-4"
          />
        </div>

        {/*Send Button  */}

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

              <span>{t("auth.forgetPass.sending")}</span>
            </>
          ) : (
            <>
              <span>{t("auth.forgetPass.sendButton")}</span>

              <ArrowIcon className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </form>

      {/*  Back To Login  */}

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="font-medium text-primary hover:underline">
          {t("auth.forgetPass.back")}
        </Link>
      </p>
    </div>
  );
};

export default ForgetPass;

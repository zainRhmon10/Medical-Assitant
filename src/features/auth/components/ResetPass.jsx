import { useState } from "react";
import { ArrowLeft, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import FormField from "../../../component/ui/Field";
import { useFormik } from "formik";

const ResetPass = (props) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: (values) => {
      console.log(values);
    },
  });

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-slate-800">
        {t("auth.resetPass.title")}
      </h1>
      <p className="mt-2 mb-8 text-sm text-slate-500">
        {t("auth.resetPass.subtitle")}
      </p>

      <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
        {/* كلمة المرور الجديدة */}
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
              onClick={() => setShowPassword((p) => !p)}
              className="text-slate-400 transition hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

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
              onClick={() => setShowConfirmPassword((p) => !p)}
              className="text-slate-400 transition hover:text-slate-600"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
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

        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          className="flex w-full mt-10 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:cursor-pointer disabled:opacity-60"
        >
          {props.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {t("auth.resetPass.sendButton")}
              <ArrowLeft className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </form>

      <p className="mt-6 text-center flex flex-col items-center gap-2 text-sm text-slate-500">
        {t("auth.forgetPass.back")}
      </p>
    </div>
  );
};

export default ResetPass;

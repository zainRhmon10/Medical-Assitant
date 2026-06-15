import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import FormField from "../../../component/ui/Field";
import { useFormik } from "formik";

const ForgetPass = (props) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    onSubmit: (values) => {
      console.log(values);
    },
  });

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-slate-800">
        {t("auth.forgetPass.title")}
      </h1>
      <p className="mt-2 mb-8 text-sm text-slate-500">
        {t("auth.forgetPass.subtitle")}
      </p>

      <div className="mb-8 flex items-center justify-between rounded-xl bg-sky-100 px-4 py-4">
        <div className="flex items-center ">
          <p className="text-sm text-slate-500">
            {t("auth.forgetPass.sendTo")}
          </p>
        </div>
      </div>

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

      <motion.button
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:cursor-pointer disabled:opacity-60"
      >
        {props.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {t("auth.forgetPass.sendButton")}
            <ArrowLeft className="h-4 w-4" />
          </>
        )}
      </motion.button>

      <p className="mt-6 text-center flex flex-col items-center gap-2 text-sm text-slate-500">
        {t("auth.forgetPass.back")}
      </p>
    </div>
  );
};

export default ForgetPass;

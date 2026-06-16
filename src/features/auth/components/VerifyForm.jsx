import { Mail, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

const EmailVerification = (props) => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-slate-800">
        {t("auth.verify.title")}
      </h1>
      <p className="mt-2 mb-8 text-sm text-slate-500">
        {t("auth.verify.subtitle")}
      </p>

      <div className="mb-8 flex items-center justify-between rounded-xl bg-sky-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            <Mail className="h-5 w-5" />
          </div>
          <div className="text-sm space-y-1">
            <p className="text-xs text-slate-400">{t("auth.verify.sentTo")}</p>
            <p className="font-medium text-slate-800" dir="ltr">
              {props.email || "doctor@hospital.com"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-slate-700">
          {t("auth.verify.codeLabel")}
        </label>
        <div className="flex gap-7">
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              className="h-15 w-13 rounded-xl border border-slate-200 bg-white text-center text-lg font-semibold text-slate-800 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          ))}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:cursor-pointer disabled:opacity-60"
      >
        {props.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {t("auth.verify.verifyButton")}
            <ArrowLeft className="h-4 w-4" />
          </>
        )}
      </motion.button>

      <p className="mt-6 text-center flex flex-col items-center gap-2 text-sm text-slate-500">
        {t("auth.verify.noCode")}
        {props.timer > 0 ? (
          <span className="inline-flex items-center gap-1 text-primary ">
            <RefreshCw className="h-3 w-3" />
            {t("auth.verify.resend")} {props.timer}
          </span>
        ) : (
          <button
            onClick={props.onResend}
            className="font-medium text-primary hover:underline"
          >
            {props.resendNowText || "إعادة الإرسال"}
          </button>
        )}
      </p>
    </div>
  );
};

export default EmailVerification;

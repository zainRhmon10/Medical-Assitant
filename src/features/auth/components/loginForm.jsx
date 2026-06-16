import React, { useState, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Mail, Eye, EyeOff, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const LoginForm = () => {
  const { t, i18n } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const validationSchema = useMemo(
    () =>
      Yup.object({
        email: Yup.string()
          .email(t("auth.errors.emailInvalid"))
          .required(t("auth.errors.emailRequired")),
        password: Yup.string()
          .min(6, t("auth.errors.passwordMin"))
          .required(t("auth.errors.passwordRequired")),
      }),
    [t],
  );

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      remember: false,
    },
    validationSchema,
  });

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-slate-800">
        {t("auth.welcomeBack")}
      </h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">
        {t("auth.welcomeSubtitle")}
      </p>

      <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>
        {/* البريد الإلكتروني */}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {t("auth.email")}
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full rounded-lg border bg-white px-4 py-2.5 pe-11 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${
                formik.touched.email && formik.errors.email
                  ? "border-danger"
                  : "border-slate-200 focus:border-primary"
              }`}
            />
            <Mail className="absolute end-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          </div>
          {formik.touched.email && formik.errors.email && (
            <p className="mt-1 text-xs text-red-500">{formik.errors.email}</p>
          )}
        </div>
        {/* كلمة المرور */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              {t("auth.password")}
            </label>
            <Link
              to="/forget-password"
              className="text-xs text-primary hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full rounded-lg border bg-white px-4 py-2.5 ps-11 pe-4 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${
                formik.touched.password && formik.errors.password
                  ? "border-danger"
                  : "border-slate-200 focus:border-primary"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
          {formik.touched.password && formik.errors.password && (
            <p className="mt-1 text-xs text-red-500">
              {formik.errors.password}
            </p>
          )}
        </div>
        {/* تذكرني */}
        <div className="flex items-center justify-end gap-2">
          <label htmlFor="remember" className="text-sm text-slate-600">
            {t("auth.rememberMe")}
          </label>
          <input
            id="remember"
            name="remember"
            type="checkbox"
            checked={formik.values.remember}
            onChange={formik.handleChange}
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg  py-3 text-sm font-semibold bg-primary text-white transition hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("auth.login")}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">{t("auth.or")}</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <p className="text-center text-sm text-slate-500">
        {t("auth.noAccount")}{" "}

        <Link
          to="/register"
          className="font-medium text-primary hover:underline"
        >

          {t("auth.createAccount")}
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;

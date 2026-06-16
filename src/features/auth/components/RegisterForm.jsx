// components/RegisterForm.jsx
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Phone,
  Stethoscope,
  Building2,
  ChevronDown,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import FormField from "../../../component/ui/Field";

const STEP1_FIELDS = ["firstName", "lastName", "email", "phone"];

const RegisterForm = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const NextIcon = isRtl ? ArrowLeft : ArrowRight;

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const specialties = t("auth.register.specialties", { returnObjects: true });
  const specialtyOptions = Array.isArray(specialties) ? specialties : [];

  const validationSchema = useMemo(
    () =>
      Yup.object({
        firstName: Yup.string().required(
          t("auth.register.errors.firstNameRequired"),
        ),
        lastName: Yup.string().required(
          t("auth.register.errors.lastNameRequired"),
        ),
        email: Yup.string()
          .email(t("auth.errors.emailInvalid"))
          .required(t("auth.errors.emailRequired")),
        phone: Yup.string().required(t("auth.register.errors.phoneRequired")),
        specialty: Yup.string().required(
          t("auth.register.errors.specialtyRequired"),
        ),
        licenseNumber: Yup.string().required(
          t("auth.register.errors.licenseRequired"),
        ),
        clinicName: Yup.string(),
        password: Yup.string()
          .min(8, t("auth.register.passwordMin"))
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

  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialty: "",
      licenseNumber: "",
      clinicName: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema,
  });

  const goToNextStep = async () => {
    const errors = await formik.validateForm();
    const hasErrors = STEP1_FIELDS.some((field) => errors[field]);

    if (hasErrors) {
      const touched = {};
      STEP1_FIELDS.forEach((field) => (touched[field] = true));
      formik.setTouched({ ...formik.touched, ...touched });
      return;
    }

    setStep(2);
  };

  const goBack = () => setStep(1);

  const passwordStrength = Math.min(
    4,
    Math.floor(formik.values.password.length / 2),
  );

  const StepIndicator = () => (
    <div className="mb-8 flex items-center gap-2">
      {[1, 2].map((s) => (
        <div key={s} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              step >= s
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {s}
          </div>

          {/* اسم الخطوة */}
          <span
            className={`text-xs ${step >= s ? "text-slate-700" : "text-slate-400"}`}
          >
            {s === 1
              ? t("auth.register.steps.personalInfo")
              : t("auth.register.steps.professionalInfo")}
          </span>
          {/* الخط الفاصل (بس بين 1 و 2) */}
          {s < 2 && (
            <div
              className={`mx-2 h-0.5 flex-1 ${step > s ? "bg-[#0b7a9e]" : "bg-slate-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-lg">
      {/* العنوان */}
      <h1 className="text-2xl font-bold text-slate-800">
        {t("auth.register.title")}
      </h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">
        {t("auth.register.subtitle")}
      </p>

      {/* مؤشر الخطوات */}
      <StepIndicator />

      {/*  الخطوتين */}
      <AnimatePresence mode="wait" initial={false}>
        {step === 1 ? (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: isRtl ? -16 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? 16 : -16 }}
            transition={{ duration: 0.2 }}
            onSubmit={(e) => {
              e.preventDefault();
              goToNextStep();
            }}
            className="space-y-4"
            noValidate
          >
            {/* الاسم الأول + العائلة */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={t("auth.register.firstName")}
                name="firstName"
                dir="ltr"
                placeholder={t("auth.register.firstNamePlaceholder")}
                icon={User}
                formik={formik}
                isRtl={isRtl}
                extraClasses="pe-10 ps-4"
              />
              <FormField
                label={t("auth.register.lastName")}
                name="lastName"
                dir="ltr"
                placeholder={t("auth.register.lastNamePlaceholder")}
                icon={User}
                formik={formik}
                isRtl={isRtl}
                extraClasses="pe-10 ps-4"
              />
            </div>

            {/* البريد الإلكتروني */}
            <FormField
              label={t("auth.email")}
              name="email"
              type="email"
              dir="ltr"
              placeholder={t("auth.emailPlaceholder")}
              icon={Mail}
              formik={formik}
              isRtl={isRtl}
              extraClasses="pe-10 ps-4"
            />

            {/* رقم الهاتف */}
            <FormField
              label={t("auth.register.phone")}
              name="phone"
              type="tel"
              dir="ltr"
              placeholder={t("auth.register.phonePlaceholder")}
              icon={Phone}
              formik={formik}
              isRtl={isRtl}
              extraClasses="pe-10 ps-4"
            />

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:cursor-pointer"
            >
              {t("auth.register.next")}
              <NextIcon className="h-4 w-4" />
            </motion.button>

            <p className="text-center text-sm text-slate-500">
              {t("auth.register.haveAccount")}{" "}
              <Link to="/" className="font-medium text-primary hover:underline">
                {t("auth.register.signIn")}
              </Link>
            </p>
          </motion.form>
        ) : (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: isRtl ? 16 : -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? -16 : 16 }}
            transition={{ duration: 0.2 }}
            onSubmit={formik.handleSubmit}
            className="space-y-4"
            noValidate
          >
            {/* التخصص الطبي */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                {t("auth.register.specialty")}
              </label>
              <div className="relative">
                <ChevronDown className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Stethoscope className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  name="specialty"
                  value={formik.values.specialty}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full appearance-none rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-teal-500/20 pe-10 ps-9 ${
                    formik.touched.specialty && formik.errors.specialty
                      ? "border-danger"
                      : "border-slate-200 focus:border-teal-500"
                  }`}
                >
                  <option value="">
                    {t("auth.register.specialtyPlaceholder")}
                  </option>
                  {specialtyOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              {formik.touched.specialty && formik.errors.specialty && (
                <p className="text-xs text-red-500">
                  {formik.errors.specialty}
                </p>
              )}
            </div>

            <FormField
              label={t("auth.register.clinicName")}
              name="clinicName"
              icon={Building2}
              formik={formik}
              isRtl={isRtl}
              extraClasses="pe-10 ps-4"
            />

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
                  aria-label={showPassword ? "Hide" : "Show"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            >
              {formik.values.password && (
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-1 flex-1 rounded-full ${passwordStrength >= lvl ? "bg-primary" : "bg-slate-100"}`}
                    />
                  ))}
                </div>
              )}
            </FormField>

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
                  aria-label={showConfirmPassword ? "Hide" : "Show"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                {t("auth.register.back")}
              </button>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:cursor-pointer"
              >
                {t("auth.register.createAccount")}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegisterForm;

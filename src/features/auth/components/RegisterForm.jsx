import { useEffect, useMemo, useState } from "react";

import { motion, AnimatePresence } from "motion/react";

import { useFormik } from "formik";
import * as Yup from "yup";

import { useTranslation } from "react-i18next";

import { Link, useNavigate } from "react-router-dom";

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
  Loader2,
} from "lucide-react";

import FormField from "../../../component/ui/Field";

import {
  getApiErrorMessage,
  getSpecialties,
  registerDoctor,
} from "../services/authApi";

const STEP1_FIELDS = ["firstName", "lastName", "email", "phone"];

const RegisterForm = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("ar") ? "ar" : "en";

  const navigate = useNavigate();

  const isRtl = i18n.dir() === "rtl";

  const NextIcon = isRtl ? ArrowLeft : ArrowRight;

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [specialties, setSpecialties] = useState([]);
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(true);

  const [apiError, setApiError] = useState("");

  /* Load Specialties */
  useEffect(() => {
    let isMounted = true;

    const loadSpecialties = async () => {
      setIsLoadingSpecialties(true);

      try {
        const response = await getSpecialties();
        if (!isMounted) {
          return;
        }

        const data = Array.isArray(response.data) ? response.data : [];

        setSpecialties(data);
      } catch (error) {
        console.error(
          "SPECIALTIES ERROR:",
          error.response?.data || error.message,
        );

        if (isMounted) {
          setApiError(
            getApiErrorMessage(error, t("auth.register.errors.generic")),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingSpecialties(false);
        }
      }
    };

    loadSpecialties();

    return () => {
      isMounted = false;
    };
  }, [t]);

  /*
   * Validation
   * ============================
   * first_name:
   * max 50
   * last_name:
   * max 50
   *
   * email:
   * unique + max 70
   *
   * phone:
   * 09xxxxxxxx
   * max 10
   *
   * password:
   * min 8
   * max 50
   * letters
   * numbers
   * symbols
   */
  const validationSchema = useMemo(
    () =>
      Yup.object({
        firstName: Yup.string()
          .trim()
          .max(
            50,
            t("auth.register.errors.firstNameMax", "Maximum 50 characters"),
          )
          .required(t("auth.register.errors.firstNameRequired")),

        lastName: Yup.string()
          .trim()
          .max(
            50,
            t("auth.register.errors.lastNameMax", "Maximum 50 characters"),
          )
          .required(t("auth.register.errors.lastNameRequired")),

        email: Yup.string()
          .trim()
          .email(t("auth.errors.emailInvalid"))
          .max(70, t("auth.register.errors.emailMax", "Maximum 70 characters"))
          .required(t("auth.errors.emailRequired")),

        phone: Yup.string()
          .matches(/^09[0-9]{8}$/, {
            message: t(
              "auth.register.errors.phoneInvalid",
              "Phone number must start with 09 and contain 10 digits",
            ),
            excludeEmptyString: true,
          })
          .nullable(),

        specialty: Yup.string().required(
          t("auth.register.errors.specialtyRequired"),
        ),

        clinicName: Yup.string()
          .trim()
          .max(
            50,
            t("auth.register.errors.clinicMax", "Maximum 50 characters"),
          ),

        password: Yup.string()
          .min(8, t("auth.register.passwordMin"))
          .max(
            50,
            t(
              "auth.register.errors.passwordMax",
              "Password must not exceed 50 characters",
            ),
          )

          /*
           * حرف على الأقل.
           */
          .matches(
            /[A-Za-z]/,
            t(
              "auth.register.errors.passwordLetter",
              "Password must contain at least one letter",
            ),
          )

          /*
           * رقم على الأقل.
           */
          .matches(
            /[0-9]/,
            t(
              "auth.register.errors.passwordNumber",
              "Password must contain at least one number",
            ),
          )

          /*
           * رمز خاص واحد على الأقل.
           */
          .matches(
            /[^A-Za-z0-9]/,
            t(
              "auth.register.errors.passwordSymbol",
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

  // Formik
  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialty: "",
      clinicName: "",
      password: "",
      confirmPassword: "",
    },

    validationSchema,

    /*
     * Register
     */
    onSubmit: async (values, helpers) => {
      setApiError("");

      try {
        const doctorData = {
          first_name: values.firstName.trim(),
          last_name: values.lastName.trim(),
          email: values.email.trim().toLowerCase(),
          // Backend يسمح بـ null.
          phone: values.phone.trim() || null,
          specialty_ids: [String(values.specialty)],
          hospital_or_clinic: values.clinicName.trim() || null,
          password: values.password,
          password_confirmation: values.confirmPassword,
        };

        console.log("REGISTER DATA:", {
          ...doctorData,
          password: "********",
          password_confirmation: "********",
        });

        /*
         * POST:
         *
         * /api/doctor/register
         */
        const response = await registerDoctor(doctorData);

        console.log("REGISTER RESPONSE:", response.data);
        sessionStorage.removeItem("pendingVerificationEmail");
        sessionStorage.removeItem("pendingVerificationExpiresAt");
        sessionStorage.removeItem("pendingVerificationRemember");

        navigate("/verify", {
          replace: true,
          state: {
            email: values.email.trim().toLowerCase(),
            purpose: "confirmation",
            /*
             * بعد التسجيل نحتفظ
             * بالجلسة بعد Verify.
             */
            remember: true,
            otpJustSent: true,
          },
        });
      } catch (error) {
        console.error("REGISTER ERROR:", error.response?.data || error.message);
        const message = getApiErrorMessage(
          error,
          t("auth.register.errors.generic"),
        );

        setApiError(message);
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  /*
   * Step 1 → Step 2
   */
  const goToNextStep = async () => {
    setApiError("");

    const errors = await formik.validateForm();

    const hasErrors = STEP1_FIELDS.some((field) => errors[field]);

    if (hasErrors) {
      const touched = {};

      STEP1_FIELDS.forEach((field) => {
        touched[field] = true;
      });

      formik.setTouched({
        ...formik.touched,
        ...touched,
      });

      return;
    }

    setStep(2);
  };

  /*
   * Step 2 → Step 1
   */
  const goBack = () => {
    if (formik.isSubmitting) {
      return;
    }

    setApiError("");
    setStep(1);
  };

  /*
   * Password Strength
   */
  const calculatePasswordStrength = (password) => {
    if (!password) {
      return 0;
    }

    let strength = 0;

    if (password.length >= 8) {
      strength += 1;
    }

    if (/[A-Za-z]/.test(password)) {
      strength += 1;
    }

    if (/[0-9]/.test(password)) {
      strength += 1;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 1;
    }

    return strength;
  };

  const passwordStrength = calculatePasswordStrength(formik.values.password);

  /*
   * Step Indicator
   */
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

          <span
            className={`text-xs ${
              step >= s ? "text-slate-700" : "text-slate-400"
            }`}
          >
            {s === 1
              ? t("auth.register.steps.personalInfo")
              : t("auth.register.steps.professionalInfo")}
          </span>

          {s < 2 && (
            <div
              className={`mx-2 h-0.5 flex-1 ${
                step > s ? "bg-[#0b7a9e]" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-lg">
      {/*  Title */}

      <h1 className="text-2xl font-bold text-slate-800">
        {t("auth.register.title")}
      </h1>

      <p className="mt-1 mb-8 text-sm text-slate-500">
        {t("auth.register.subtitle")}
      </p>

      {/* API Error */}

      {apiError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {apiError}
        </div>
      )}

      {/* Step Indicator */}

      <StepIndicator />

      {/*  Steps */}

      <AnimatePresence mode="wait" initial={false}>
        {/* ==========================================
            STEP 1
        ========================================== */}

        {step === 1 ? (
          <motion.form
            key="step1"
            initial={{
              opacity: 0,
              x: isRtl ? -16 : 16,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: isRtl ? 16 : -16,
            }}
            transition={{
              duration: 0.2,
            }}
            onSubmit={(event) => {
              event.preventDefault();

              goToNextStep();
            }}
            className="space-y-4"
            noValidate
          >
            {/* First Name + Last Name */}

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

            {/* Email */}

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

            {/* Phone */}

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

            {/* Next */}

            <motion.button
              type="submit"
              whileTap={{
                scale: 0.98,
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:cursor-pointer"
            >
              {t("auth.register.next")}

              <NextIcon className="h-4 w-4" />
            </motion.button>

            {/* Login */}

            <p className="text-center text-sm text-slate-500">
              {t("auth.register.haveAccount")}{" "}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                {t("auth.register.signIn")}
              </Link>
            </p>
          </motion.form>
        ) : (
          /* ==========================================
             STEP 2
          ========================================== */

          <motion.form
            key="step2"
            initial={{
              opacity: 0,
              x: isRtl ? 16 : -16,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: isRtl ? -16 : 16,
            }}
            transition={{
              duration: 0.2,
            }}
            onSubmit={formik.handleSubmit}
            className="space-y-4"
            noValidate
          >
            {/* Specialty  */}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                {t("auth.register.specialty")}
              </label>

              <div className="relative">
                <ChevronDown className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Stethoscope className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <select
                  name="specialty"
                  value={formik.values.specialty}
                  onChange={(event) => {
                    formik.handleChange(event);

                    if (apiError) {
                      setApiError("");
                    }
                  }}
                  onBlur={formik.handleBlur}
                  disabled={isLoadingSpecialties || formik.isSubmitting}
                  className={`w-full appearance-none rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-teal-500/20 pe-10 ps-9 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 ${
                    formik.touched.specialty && formik.errors.specialty
                      ? "border-danger"
                      : "border-slate-200 focus:border-teal-500"
                  }`}
                >
                  <option value="">
                    {isLoadingSpecialties
                      ? t(
                          "auth.register.loadingSpecialties",
                          "Loading specialties...",
                        )
                      : t("auth.register.specialtyPlaceholder")}
                  </option>

                  {specialties.map((specialty) => (
                    <option key={specialty.id} value={String(specialty.id)}>
                      {typeof specialty.name === "object"
                        ? specialty.name?.[currentLang] ||
                          specialty.name?.en ||
                          specialty.name?.ar ||
                          specialty.slug
                        : specialty.name}
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

            {/*  Clinic  */}

            <FormField
              label={t("auth.register.clinicName")}
              name="clinicName"
              placeholder={t("auth.register.clinicNamePlaceholder")}
              icon={Building2}
              formik={formik}
              isRtl={isRtl}
              extraClasses="pe-10 ps-4"
            />

            {/* Password */}

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
                    showPassword
                      ? t("auth.hidePassword")
                      : t("auth.showPassword")
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            >
              {/* Password Strength */}

              {formik.values.password && (
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full ${
                        passwordStrength >= level
                          ? "bg-primary"
                          : "bg-slate-100"
                      }`}
                    />
                  ))}
                </div>
              )}
            </FormField>

            {/* Confirm Password */}

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
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
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

            {/* Buttons */}

            <div className="mt-6 flex gap-3">
              {/* Back */}

              <button
                type="button"
                onClick={goBack}
                disabled={formik.isSubmitting}
                className="flex-1 cursor-pointer rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("auth.register.back")}
              </button>

              {/* Create Account */}
              <motion.button
                type="submit"
                whileTap={
                  formik.isSubmitting
                    ? {}
                    : {
                        scale: 0.98,
                      }
                }
                disabled={formik.isSubmitting || isLoadingSpecialties}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formik.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                <span>
                  {formik.isSubmitting
                    ? t("auth.register.creatingAccount")
                    : t("auth.register.createAccount")}
                </span>
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegisterForm;

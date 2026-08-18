import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Phone,
  Building2,
  Mail,
  Camera,
  Save,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
  Stethoscope,
  ChevronDown,
  UserCheck,
} from "lucide-react";
import { useDoctorProfile } from "../context/DoctorProfileContext";

const ProfileTab = () => {
  const { t, i18n } = useTranslation();
  const {
    profile,
    specialties,
    isLoading,
    error,
    refetchProfile,
    updateProfile,
    updateImage,
  } = useDoctorProfile();

  const isRTL = i18n.language === "ar";
  const currentLang = i18n.language?.startsWith("ar") ? "ar" : "en";

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageSuccess, setImageSuccess] = useState("");
  const [imgError, setImgError] = useState(false);

  const validationSchema = Yup.object({
    firstName: Yup.string()
      .trim()
      .max(50, t("auth.register.errors.firstNameMax", "Maximum 50 characters"))
      .required(
        t("auth.register.errors.firstNameRequired", "First name is required")
      ),
    lastName: Yup.string()
      .trim()
      .max(50, t("auth.register.errors.lastNameMax", "Maximum 50 characters"))
      .required(
        t("auth.register.errors.lastNameRequired", "Last name is required")
      ),
    phone: Yup.string()
      .matches(/^09[0-9]{8}$/, {
        message: t(
          "auth.register.errors.phoneInvalid",
          "Phone number must start with 09 and contain 10 digits"
        ),
        excludeEmptyString: true,
      })
      .nullable(),
    clinicName: Yup.string()
      .trim()
      .max(50, t("auth.register.errors.clinicMax", "Maximum 50 characters"))
      .nullable(),
    specialties: Yup.array()
      .min(
        1,
        t(
          "dashboard.profile.specialtyRequired",
          "At least one specialty is required"
        )
      )
      .required(
        t("dashboard.profile.specialtyRequired", "Specialties are required")
      ),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      phone: profile?.phone || "",
      clinicName: profile?.hospital_or_clinic || "",
      specialties: profile?.specialties?.map((s) => String(s.id)) || [],
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSaving(true);
      setSaveSuccess(false);
      setSaveError("");

      try {
        const payload = {
          first_name: values.firstName.trim(),
          last_name: values.lastName.trim(),
          phone: values.phone.trim() || null,
          hospital_or_clinic: values.clinicName.trim() || null,
          specialty_ids: values.specialties.map((id) => Number(id)),
        };
        await updateProfile(payload);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } catch (err) {
        console.error("Update profile error:", err);
        setSaveError(
          err?.response?.data?.message ||
            t(
              "dashboard.profile.saveError",
              "Failed to update profile details."
            )
        );
      } finally {
        setIsSaving(false);
      }
    },
  });

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setImageError(
        t("dashboard.profile.imageSizeError", "Image must be smaller than 5MB")
      );
      return;
    }

    setIsUploadingImage(true);
    setImageError("");
    setImageSuccess("");

    try {
      await updateImage(file);
      setImgError(false);
      setImageSuccess(
        t(
          "dashboard.profile.imageSuccess",
          "Profile picture updated successfully!"
        )
      );
      setTimeout(() => setImageSuccess(""), 4000);
    } catch (err) {
      console.error("Upload avatar error:", err);
      setImageError(
        err?.response?.data?.message ||
          t(
            "dashboard.profile.imageError",
            "Failed to upload profile picture."
          )
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const doctorFullName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : "";

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500">
          {t("dashboard.profile.loadingData", "Loading profile details...")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex h-[60vh] flex-col items-center justify-center gap-5 text-center max-w-md mx-auto px-6"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-800">
            {t("dashboard.profile.fetchErrorTitle", "Failed to load profile")}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">{error}</p>
        </div>
        <button
          type="button"
          onClick={refetchProfile}
          className="mt-1 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary-dark hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          {t("dashboard.profile.tryAgain", "Try Again")}
        </button>
      </div>
    );
  }

  return (
    <div
      className="space-y-8 max-w-4xl mx-auto pb-8"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Profile Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" dir="ltr">
        {/* Colored Banner */}
        <div className="h-28 sm:h-32 bg-gradient-to-r from-teal-600 via-primary to-emerald-600 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
        </div>

        {/* Content: Name + Email (Left) | Avatar (Right) */}
        <div className="px-6 sm:px-8 pb-6 relative">
          <div className="flex items-end justify-between gap-5 -mt-12 sm:-mt-14">
            
            {/* Left Side: Name (at green edge) + Email under it */}
            <div className="flex-1 min-w-0 pt-10 sm:pt-11">
              {/* Name - black, sitting at the green border */}
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                {isRTL ? `د. ${doctorFullName}` : `Dr. ${doctorFullName}`}
              </h2>
              {/* Email - slightly raised under the name */}
              <p className="mt-1.5 text-sm font-medium text-slate-500 flex items-center gap-2 truncate">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{profile?.email}</span>
              </p>
            </div>

            {/* Right Side: Avatar */}
            <div className="relative group h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-2xl bg-white p-1.5 shadow-xl z-10">
              <div className="h-full w-full rounded-xl bg-slate-100 overflow-hidden relative flex items-center justify-center ring-2 ring-white">
                {profile?.image && !imgError ? (
                  <img
                    src={`https://tibscribe-api.onrender.com/api/doctor/images/${profile.image}`}
                    alt={doctorFullName}
                    onError={() => setImgError(true)}
                    className="h-full w-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 bg-slate-100 h-full w-full">
                    <UserCheck className="h-12 w-12 text-primary/70" />
                  </div>
                )}

                {/* Upload Overlay */}
                <label
                  htmlFor="avatar-input"
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-white transition-all duration-300 rounded-xl backdrop-blur-[2px]"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-5 w-5" />
                      <span className="text-[11px] font-bold tracking-wide">
                        {t("dashboard.profile.changePhoto", "Change")}
                      </span>
                    </>
                  )}
                </label>

                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isUploadingImage}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Alerts for Image */}
        <AnimatePresence>
          {imageSuccess && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-emerald-100 bg-emerald-50/80 px-6 sm:px-8 py-3.5 flex items-center gap-2.5 text-sm font-semibold text-emerald-700"
            >
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
              <span>{imageSuccess}</span>
            </motion.div>
          )}
          {imageError && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-red-100 bg-red-50/80 px-6 sm:px-8 py-3.5 flex items-center gap-2.5 text-sm font-semibold text-red-600"
            >
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{imageError}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Form Section */}
      <form
        onSubmit={formik.handleSubmit}
        className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-7"
      >
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 py-3.5 flex items-center gap-2.5 text-sm text-emerald-700 font-medium"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <span>
                {t(
                  "dashboard.profile.success",
                  "Profile updated successfully!"
                )}
              </span>
            </motion.div>
          )}
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3.5 flex items-center gap-2.5 text-sm text-red-600 font-medium"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{saveError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column 1: Personal Info */}
          <div className="space-y-5">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </span>
              {t("dashboard.profile.personalInfo", "Personal Information")}
            </h3>

            {/* First Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="firstName"
                className="block text-sm font-bold text-slate-700"
              >
                {t("dashboard.profile.firstName", "First Name")}
              </label>
              <div className="relative flex items-center">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    formik.touched.firstName && formik.errors.firstName
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-primary hover:border-slate-300"
                  } ${isRTL ? "pl-11 pr-4" : "pr-11 pl-4"}`}
                />
                <User
                  className={`absolute h-4 w-4 text-slate-400 pointer-events-none ${
                    isRTL ? "left-3.5" : "right-3.5"
                  }`}
                />
              </div>
              {formik.touched.firstName && formik.errors.firstName && (
                <p className="text-xs text-red-500 font-medium">
                  {formik.errors.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="lastName"
                className="block text-sm font-bold text-slate-700"
              >
                {t("dashboard.profile.lastName", "Last Name")}
              </label>
              <div className="relative flex items-center">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    formik.touched.lastName && formik.errors.lastName
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-primary hover:border-slate-300"
                  } ${isRTL ? "pl-11 pr-4" : "pr-11 pl-4"}`}
                />
                <User
                  className={`absolute h-4 w-4 text-slate-400 pointer-events-none ${
                    isRTL ? "left-3.5" : "right-3.5"
                  }`}
                />
              </div>
              {formik.touched.lastName && formik.errors.lastName && (
                <p className="text-xs text-red-500 font-medium">
                  {formik.errors.lastName}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label
                htmlFor="phone"
                className="block text-sm font-bold text-slate-700"
              >
                {t("dashboard.profile.phone", "Phone Number")}
              </label>
              <div className="relative flex items-center">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  dir="ltr"
                  placeholder="09xxxxxxxx"
                  value={formik.values.phone || ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full rounded-xl border bg-white py-2.5 text-sm font-medium text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    formik.touched.phone && formik.errors.phone
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-primary hover:border-slate-300"
                  } ${isRTL ? "pl-11 pr-4 text-right" : "pr-11 pl-4 text-left"}`}
                />
                <Phone
                  className={`absolute h-4 w-4 text-slate-400 pointer-events-none ${
                    isRTL ? "left-3.5" : "right-3.5"
                  }`}
                />
              </div>
              {formik.touched.phone && formik.errors.phone && (
                <p className="text-xs text-red-500 font-medium">
                  {formik.errors.phone}
                </p>
              )}
            </div>

            {/* Email Address (Disabled) */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-bold text-slate-400"
              >
                {t("dashboard.profile.email", "Email Address")}
              </label>
              <div className="relative flex items-center">
                <input
                  id="email"
                  type="email"
                  disabled
                  value={profile?.email || ""}
                  className={`w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed select-none ${
                    isRTL ? "pl-11 pr-4" : "pr-11 pl-4"
                  }`}
                />
                <Lock
                  className={`absolute h-4 w-4 text-slate-300 pointer-events-none ${
                    isRTL ? "left-3.5" : "right-3.5"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Column 2: Professional Info */}
          <div className="space-y-5">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </span>
              {t(
                "dashboard.profile.professionalInfo",
                "Professional Information"
              )}
            </h3>

            {/* Clinic Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="clinicName"
                className="block text-sm font-bold text-slate-700"
              >
                {t(
                  "dashboard.profile.hospitalOrClinic",
                  "Hospital or Clinic"
                )}
              </label>
              <div className="relative flex items-center">
                <input
                  id="clinicName"
                  name="clinicName"
                  type="text"
                  value={formik.values.clinicName || ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full rounded-xl border bg-white py-2.5 text-sm font-medium text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    formik.touched.clinicName && formik.errors.clinicName
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-primary hover:border-slate-300"
                  } ${isRTL ? "pl-11 pr-4" : "pr-11 pl-4"}`}
                />
                <Building2
                  className={`absolute h-4 w-4 text-slate-400 pointer-events-none ${
                    isRTL ? "left-3.5" : "right-3.5"
                  }`}
                />
              </div>
              {formik.touched.clinicName && formik.errors.clinicName && (
                <p className="text-xs text-red-500 font-medium">
                  {formik.errors.clinicName}
                </p>
              )}
            </div>

            {/* Medical Specialties */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">
                {t("dashboard.profile.specialties", "Medical Specialties")}
              </label>

              <div className="relative flex items-center">
                <ChevronDown
                  className={`pointer-events-none absolute h-4 w-4 text-slate-400 ${
                    isRTL ? "right-3.5" : "left-3.5"
                  }`}
                />
                <Stethoscope
                  className={`pointer-events-none absolute h-4 w-4 text-slate-400 ${
                    isRTL ? "left-3.5" : "right-3.5"
                  }`}
                />

                <select
                  value=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      value &&
                      !formik.values.specialties.includes(value)
                    ) {
                      formik.setFieldValue("specialties", [
                        ...formik.values.specialties,
                        value,
                      ]);
                    }
                    e.target.value = "";
                  }}
                  className={`w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-slate-300 ${
                    isRTL ? "pl-10 pr-10" : "pr-10 pl-10"
                  }`}
                >
                  <option value="">
                    {t(
                      "dashboard.profile.selectSpecialty",
                      "Add a specialty..."
                    )}
                  </option>

                  {specialties
                    .filter(
                      (spec) =>
                        !formik.values.specialties.includes(String(spec.id))
                    )
                    .map((spec) => (
                      <option key={spec.id} value={String(spec.id)}>
                        {typeof spec.name === "object"
                          ? spec.name?.[currentLang] ||
                            spec.name?.en ||
                            spec.name?.ar ||
                            spec.slug
                          : spec.name}
                      </option>
                    ))}
                </select>
              </div>

              {formik.touched.specialties && formik.errors.specialties && (
                <p className="text-xs text-red-500 font-medium">
                  {formik.errors.specialties}
                </p>
              )}

              {/* Specialties Badges */}
              <div className="flex flex-wrap gap-2 mt-4 min-h-[36px]">
                <AnimatePresence>
                  {formik.values.specialties.map((specId) => {
                    const spec = specialties.find(
                      (s) => String(s.id) === String(specId)
                    );
                    if (!spec) return null;

                    const specLabel =
                      typeof spec.name === "object"
                        ? spec.name?.[currentLang] ||
                          spec.name?.en ||
                          spec.name?.ar ||
                          spec.slug
                        : spec.name;

                    return (
                      <motion.span
                        key={specId}
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.85, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/15 shadow-sm"
                      >
                        <span>{specLabel}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formik.values.specialties.filter(
                              (id) => id !== specId
                            );
                            formik.setFieldValue("specialties", updated);
                          }}
                          className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer shrink-0"
                        >
                          <X size={11} className="stroke-[2.5]" />
                        </button>
                      </motion.span>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="border-t border-slate-100 pt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || !formik.isValid}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-primary hover:bg-primary-dark transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg px-7 py-3 text-sm font-bold text-white shadow-md shadow-primary/25 cursor-pointer disabled:cursor-not-allowed disabled:opacity-55 disabled:transform-none disabled:shadow-none"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>
              {isSaving
                ? t("dashboard.profile.saving", "Saving...")
                : t("dashboard.profile.save", "Save Changes")}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileTab;

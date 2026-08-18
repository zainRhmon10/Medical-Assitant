import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  ClipboardCheck,
  Mic,
  LogOut,
  Stethoscope,
  Loader2,
  Users,
} from "lucide-react";
import { useDoctorProfile } from "../../features/profile/context/DoctorProfileContext";
import api, {
  logoutDoctor,
  removeAuthToken,
} from "../../features/auth/services/authApi";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const { profile } = useDoctorProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isRTL = i18n.language?.startsWith("ar");
  const currentLang = isRTL ? "ar" : "en";

  const doctorName =
    profile?.first_name || profile?.last_name
      ? `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
      : t("dashboard.profile.doctorName");

  const doctorInitial =
    profile?.first_name?.trim()?.charAt(0)?.toUpperCase() ||
    t("dashboard.profile.doctorInitial");

  const doctorImageUrl = profile?.image
    ? `${api.defaults.baseURL}/images/${encodeURIComponent(profile.image)}`
    : null;

  useEffect(() => {
    setImageError(false);
  }, [profile?.image]);

  const getSpecialtyName = (specialty) => {
    if (!specialty) {
      return "";
    }

    if (currentLang === "ar" && specialty.name_ar) {
      return specialty.name_ar;
    }

    if (currentLang === "en" && specialty.name_en) {
      return specialty.name_en;
    }

    if (typeof specialty.name === "object") {
      return (
        specialty.name?.[currentLang] ||
        specialty.name?.ar ||
        specialty.name?.en ||
        specialty.slug ||
        ""
      );
    }

    return specialty.name || specialty.slug || "";
  };

  const doctorTitle =
    Array.isArray(profile?.specialties) && profile.specialties.length > 0
      ? profile.specialties
          .map(getSpecialtyName)
          .filter(Boolean)
          .join(isRTL ? "، " : ", ")
      : t("dashboard.profile.doctorTitle");

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const response = await logoutDoctor();
      console.log("LOGOUT RESPONSE:", response.data);
    } catch (error) {
      console.error("LOGOUT ERROR:", error.response?.data || error.message);
    } finally {
      // حذف الـ token من localStorage / sessionStorage
      removeAuthToken();
      localStorage.removeItem("userData");

      setIsLoggingOut(false);

      navigate("/login", {
        replace: true,
      });
    }
  };

  const menuItems = [
    {
      id: "overview",
      path: "/dashboard/overview",
      label: t("dashboard.menu.overview"),
      icon: LayoutDashboard,
    },
    {
      id: "appointments",
      path: "/dashboard/appointments",
      label: t("dashboard.menu.sessions"),
      icon: FolderOpen,
    },
    {
      id: "patients",
      path: "/dashboard/patients",
      label: t("dashboard.menu.patients"),
      icon: Users,
    },
    {
      id: "new-session",
      path: "/dashboard/new-session",
      label: t("dashboard.menu.newSession"),
      icon: Mic,
    },
    {
      id: "reports",
      path: "/dashboard/reports",
      label: t("dashboard.menu.reports"),
      icon: ClipboardCheck,
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0
          ${isRTL ? "right-0 border-l" : "left-0 border-r"}
          h-screen bg-white text-slate-700
          flex flex-col justify-between
          font-sans select-none
          border-slate-200
          transition-all duration-300 ease-in-out
          z-50
          overflow-hidden
          ${
            isOpen
              ? "w-72 translate-x-0"
              : "w-0 md:w-72 translate-x-full md:translate-x-0"
          }
        `}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header  */}
        <div className="overflow-hidden">
          <div className="border-b border-slate-100 p-3">
            <div className="flex flex-row items-center justify-start gap-3">
              <NavLink
                to="/dashboard/new-session"
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 active:translate-y-0"
              >
                <Stethoscope size={22} className="text-white" />
              </NavLink>

              <div className={isRTL ? "text-right" : "text-left"}>
                <h2 className="text-xl font-bold leading-none tracking-tight text-slate-800">
                  {t("auth.sidebar.title")}
                </h2>

                <p className="mt-1.5 text-xs text-slate-500">
                  {t("auth.sidebar.titleHighlight")}
                </p>
              </div>
            </div>
          </div>

          {/* Menu */}

          <div className="space-y-2 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setIsOpen(false);
                    }
                  }}
                  className="group relative block w-full cursor-pointer"
                >
                  {active && (
                    <>
                      <motion.div
                        layoutId="activeMenu"
                        className="absolute inset-0 rounded-xl bg-primary/10"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />

                      <motion.div
                        layoutId="activeLine"
                        className={`
                          absolute
                          ${
                            isRTL
                              ? "left-0 rounded-l-md"
                              : "right-0 rounded-r-md"
                          }
                          top-1 bottom-1
                          w-1
                          bg-primary
                        `}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    </>
                  )}

                  <div
                    className={`
                      relative z-10
                      flex h-11
                      items-center
                      justify-start
                      gap-3
                      rounded-xl
                      px-4
                      transition-all
                      ${
                        active
                          ? "font-semibold text-primary"
                          : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                      }
                    `}
                  >
                    <Icon
                      size={18}
                      className="shrink-0 transition-transform group-hover:scale-105"
                    />

                    <span className="truncate text-sm">{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer  */}

        <div className="space-y-4 overflow-hidden border-t border-slate-100 p-4">
          <NavLink
            to="/dashboard/profile"
            onClick={() => {
              if (window.innerWidth < 768) {
                setIsOpen(false);
              }
            }}
            className="
              group
              flex items-center justify-start gap-3
              rounded-xl
              px-2 py-2
              transition-all
              hover:bg-primary/5
            "
          >
            <div
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                overflow-hidden
                rounded-xl
                bg-primary
                text-sm font-bold text-white
                shadow-md shadow-primary/20
                transition-transform
                group-hover:scale-105
              "
            >
              {doctorImageUrl && !imageError ? (
                <img
                  src={doctorImageUrl}
                  alt={doctorName}
                  onError={() => setImageError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                doctorInitial
              )}
            </div>

            <div
              className={`min-w-0 flex-1 ${isRTL ? "text-right" : "text-left"}`}
            >
              <h4 className="truncate text-sm font-semibold leading-tight text-slate-800">
                {doctorName}
              </h4>

              <p className="mt-1 truncate text-xs text-slate-500">
                {doctorTitle}
              </p>
            </div>
          </NavLink>

          {/*  Logout  */}

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="
              group
              flex h-11 w-full
              cursor-pointer
              items-center
              justify-center
              gap-2
              rounded-xl
              border border-slate-200
              bg-transparent
              text-sm
              font-semibold
              text-slate-500
              transition-all
              hover:border-red-200
              hover:bg-red-50
              hover:text-red-600
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {isLoggingOut ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogOut
                size={18}
                className="transition-transform group-hover:-translate-x-0.5"
              />
            )}

            <span>
              {isLoggingOut ? t("auth.loggingOut") : t("auth.logout")}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

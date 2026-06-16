import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  ClipboardCheck,
  Mic,
  LogOut,
  Stethoscope,
} from "lucide-react";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isRTL = i18n.language === "ar";

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
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed md:sticky top-0 ${isRTL ? 'right-0' : 'left-0'} h-screen bg-white text-slate-700 
          flex flex-col justify-between font-sans select-none border-${isRTL ? 'l' : 'r'} border-slate-200
          transition-all duration-300 ease-in-out z-50
          overflow-hidden
          ${isOpen ? 'w-72 translate-x-0' : 'w-0 md:w-72 translate-x-full md:translate-x-0'}
        `}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center gap-3 flex-row justify-start">
              <NavLink 
                to="/dashboard/new-session"
                className="w-11 h-11 rounded-xl bg-[#0b7a9e] hover:bg-[#096684] flex items-center justify-center transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#0b7a9e]/25 active:translate-y-0 shrink-0"
              >
                <Stethoscope size={22} className="text-white" />
              </NavLink>

              <div className={isRTL ? "text-right" : "text-left"}>
                <h2 className="font-bold text-xl text-slate-800 tracking-tight leading-none">
                  {t("auth.sidebar.title")}
                </h2>
                <p className="text-xs text-slate-500 mt-1.5">
                  {t("auth.sidebar.titleHighlight")}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                  className="relative w-full block group cursor-pointer"
                >
                  {active && (
                    <>
                      <motion.div
                        layoutId="activeMenu"
                        className="absolute inset-0 rounded-xl bg-[#0b7a9e]/10"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                      <motion.div
                        layoutId="activeLine"
                        className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-1 bottom-1 w-1 rounded-${isRTL ? 'l' : 'r'}-md bg-[#0b7a9e]`}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    </>
                  )}

                  <div
                    className={`relative z-10 h-11 px-4 rounded-xl flex items-center justify-start gap-3 transition-all ${
                      active
                        ? "text-[#0b7a9e] font-semibold"
                        : "text-slate-500 hover:bg-slate-50 hover:text-[#0b7a9e]"
                    }`}
                  >
                    <Icon size={18} className="transition-transform group-hover:scale-105 shrink-0" />
                    
                    <span className="text-sm truncate">
                      {item.label}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 space-y-4 overflow-hidden">
          <div className="flex items-center justify-start gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-[#0b7a9e] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-[#0b7a9e]/20 shrink-0">
              {t("dashboard.profile.doctorInitial")}
            </div>

            <div className={isRTL ? "text-right" : "text-left"}>
              <h4 className="font-semibold text-sm text-slate-800 leading-tight">
                {t("dashboard.profile.doctorName")}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {t("dashboard.profile.doctorTitle")}
              </p>
            </div>
          </div>

          <button className="w-full h-11 rounded-xl border border-slate-200 bg-transparent hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all flex items-center justify-center gap-2 text-slate-500 text-sm font-semibold cursor-pointer group">
            <LogOut size={18} className="transition-transform group-hover:-translate-x-0.5" />
            <span>{t("auth.logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
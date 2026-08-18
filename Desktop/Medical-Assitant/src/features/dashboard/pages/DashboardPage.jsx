import React from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Sidebar from "../../../component/layout/Sidebar";
import Header from "../../../component/layout/Header";
import { DoctorProfileProvider } from "../../profile/context/DoctorProfileContext";

const DashboardPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const getCurrentTitle = () => {
    const path = location.pathname.split("/").pop();
    switch (path) {
      case "overview": return t("dashboard.menu.overview", "المؤشرات العامة");
      case "appointments": return t("dashboard.menu.appointments", "المواعيد والجدول");
      case "patients": return t("dashboard.menu.patients", "إدارة المرضى");
      case "new-session": return t("dashboard.menu.newSession", "جلسة جديدة");
      case "reports": return t("dashboard.menu.reports", "التقارير المعتمدة");
      case "profile": return t("dashboard.menu.profile", "الملف الشخصي");
      default: return t("dashboard.menu.overview", "المؤشرات العامة");
    }
  };

  return (
    <DoctorProfileProvider>
      <div className="flex min-h-screen bg-slate-50 font-sans antialiased">
        <Sidebar 
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Header 
            currentTitle={getCurrentTitle()}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="p-6 md:p-8 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </DoctorProfileProvider>
  );
};

export default DashboardPage;
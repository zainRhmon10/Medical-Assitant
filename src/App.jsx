import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./features/auth/pages/loginpage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import ForgetPassPage from "./features/auth/pages/ForgetPage";
import ResetPassPage from "./features/auth/pages/ResetPage";
import VerifyPage from "./features/auth/pages/verifyPage";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import OverviewTab from "./features/dashboard/components/OverviewTab";
import AppointmentsTab from "./features/dashboard/components/AppointmentsTab";
import PatientsTab from "./features/dashboard/components/PatientsTab";
import ReportsTab from "./features/dashboard/components/ReportsTab";
import ReportDetail from "./features/dashboard/components/ReportDetail";

import AuthLayout from "../src/component/layout/AuthLayout";

import { useTranslation } from "react-i18next";

const EmptyFeature = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100 shadow-sm h-64 text-slate-400 text-xs">
      {t(
        "dashboard.common.emptyFeature",
        "هذه الشاشة تحت التطوير البرمجي حالياً سيتم ربطها قريباً."
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forget-password" element={<ForgetPassPage />} />
          <Route path="/verify-otp" element={<VerifyPage />} />
          <Route path="/reset-password" element={<ResetPassPage />} />
          <Route path="/" element={<LoginPage />} />
        </Route>

        <Route path="/dashboard" element={<DashboardPage />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewTab />} />
          <Route path="appointments" element={<AppointmentsTab />} />
          <Route path="patients" element={<PatientsTab />} />
          <Route path="new-session" element={<EmptyFeature />} />
          <Route path="reports" element={<ReportsTab />} />
          <Route path="reports/:reportId" element={<ReportDetail />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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
import NewSessionPage from "./features/create_session/pages/NewSession";
import AuthLayout from "./component/layout/AuthLayout";

import ProtectedRoute from "./features/auth/components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forget-password" element={<ForgetPassPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/reset-password" element={<ResetPassPage />} />
          <Route path="/" element={<LoginPage />} />
        </Route>

        {/* Protected Dashboard  */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewTab />} />
          <Route path="appointments" element={<AppointmentsTab />} />
          <Route path="patients" element={<PatientsTab />} />
          <Route path="new-session" element={<NewSessionPage />} />
          <Route path="reports" element={<ReportsTab />} />
          <Route path="reports/:reportId" element={<ReportDetail />} />
        </Route>

        <Route
          path="/setup-session"
          element={<Navigate to="/dashboard/new-session" replace />}
        />
        {/*  Fallback  */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

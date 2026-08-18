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

import NewSessionPage from "./features/create_session/pages/NewSession";

import AuthLayout from "./component/layout/AuthLayout";

// تمت الإضافة سابقًا:
// صفحة تفاصيل المريضة الحقيقية.
import PatientDetailsPage from "./features/patients/pages/PatientDetailsPage";

// تمت الإضافة سابقًا:
// صفحة التقرير والمراجعة والتصحيحات وKBS قبل الاعتماد.
import ReportResult from "./features/reports/pages/ReportResult";

// تمت الإضافة:
// واجهة منفصلة للـSnapshot النهائية بعد اعتماد التقرير.
import FinalizedReportPage from "./features/reports/pages/FinalizedReportPage";

// تمت الإضافة:
// صفحة الملف الشخصي الحقيقية للطبيب.
import ProfileTab from "./features/profile/pages/ProfileTab";

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

          {/* تمت الإضافة سابقًا:
              صفحة المريضة وتاريخ معايناتها. */}
          <Route path="patients/:patientId" element={<PatientDetailsPage />} />

          <Route path="new-session" element={<NewSessionPage />} />

          <Route path="reports" element={<ReportsTab />} />

          {/* تمت الإضافة سابقًا:
              التقرير القابل للمراجعة قبل الاعتماد. */}
          <Route path="reports/:reportId" element={<ReportResult />} />

          {/* تمت الإضافة:
              النسخة النهائية النظيفة والقابلة للطباعة/PDF. */}
          <Route
            path="reports/:reportId/final"
            element={<FinalizedReportPage />}
          />

          {/* تمت الإضافة:
              صفحة الملف الشخصي الحقيقية للطبيب. */}
          <Route path="profile" element={<ProfileTab />} />
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

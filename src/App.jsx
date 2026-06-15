import ForgetPassPage from "./features/auth/pages/ForgetPage";
import LoginPage from "./features/auth/pages/loginpage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import ResetPassPage from "./features/auth/pages/ResetPage";
import VerifyPage from "./features/auth/pages/verifyPage";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthLayout from "../src/component/layout/AuthLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forget-password" element={<ForgetPassPage />} />
          <Route path="/verify-otp" element={<VerifyPage />} />
          <Route path="/reset-password" element={<ResetPassPage />} />
          <Route path="/" element={<LoginPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { Outlet } from "react-router-dom";
import AuthSidebar from "../../features/auth/components/authSidebar";
import LanguageSwitcher from "../../component/common/LanguageSwitch";

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen flex-col font-sans md:flex-row">
      <AuthSidebar />
      <main className="relative flex flex-1 items-center justify-center bg-slate-50 p-6 md:p-12">
        <div className="absolute top-6 end-6">
          <LanguageSwitcher />
        </div>
        <Outlet /> {/* ← هون بيظهر LoginForm أو RegisterForm... */}
      </main>
    </div>
  );
};

export default AuthLayout;

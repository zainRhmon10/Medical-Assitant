import AuthSidebar from "../components/authSidebar";
import LoginForm from "../components/loginForm";
import LanguageSwitcher from "../../../component/common/LanguageSwitch";

const LoginPage = () => {
  return (
    <div className="flex min-h-screen flex-col font-sans md:flex-row">
      <AuthSidebar />

      <main className="relative flex flex-1 items-center justify-center bg-slate-50 p-6 md:p-12">
        <div className="absolute top-6 end-6">
          <LanguageSwitcher />
        </div>

        <LoginForm />
      </main>
    </div>
  );
};

export default LoginPage;

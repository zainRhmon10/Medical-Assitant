import AuthSidebar from "../components/authSidebar";
import RegisterForm from "../components/RegisterForm";
import LanguageSwitcher from "../../../component/common/LanguageSwitch";

const RegisterPage = () => {
  return (
    <div className="flex min-h-screen flex-col font-sans md:flex-row">
      <AuthSidebar />

      <main className="relative flex flex-1 items-center justify-center bg-slate-50 p-6 py-12 md:p-12">
        <div className="absolute top-6 end-6">
          <LanguageSwitcher />
        </div>

        <RegisterForm />
      </main>
    </div>
  );
};

export default RegisterPage;

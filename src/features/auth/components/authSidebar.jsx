import { useTranslation } from "react-i18next";
import { Stethoscope } from "lucide-react";

const AuthSidebar = () => {
  const { t } = useTranslation();
  const features = t("auth.sidebar.features", { returnObjects: true });

  return (
    <aside className="relative hidden md:flex md:w-[44%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0A3A48] via-[#0E5A6E] to-[#1A92AC] px-10 py-12 text-white">
      <div className="pointer-events-none absolute -bottom-32 -end-32 h-[420px] w-[420px] rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-20 -end-20 h-[300px] w-[300px] rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-10 -end-10 h-[180px] w-[180px] rounded-full border border-white/10" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
          <Stethoscope className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold">MedAssist</span>
      </div>

      <div className="relative z-10 max-w-md">
        <h1 className="text-4xl font-extrabold leading-tight">
          {t("auth.sidebar.title")}
          <br />
          <span className="text-cyan-300">
            {t("auth.sidebar.titleHighlight")}
          </span>
        </h1>
        <p className="mt-4 text-sm leading-7 text-white/70">
          {t("auth.sidebar.description")}
        </p>

        <div className="mt-10 space-y-4 flex flex-row  gap-4">
          {features.map((feature, index) => {
            return (
              <div
                key={feature.title}
                className="flex justify-between h-20  rounded-xl bg-white/10 p-4 backdrop-blur-sm"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold">{feature.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="relative z-10 max-w-sm text-sm leading-7 text-white/60">
        {t("auth.sidebar.quote")}
      </p>
    </aside>
  );
};

export default AuthSidebar;

import React from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../common/LanguageSwitch";
import { Bell, Menu } from "lucide-react";

const Header = ({ currentTitle, onMenuClick }) => {
  const { t, i18n } = useTranslation();

  const isRTL = i18n.language === "ar";
  const currentLocale = isRTL ? "ar-SA" : "en-US";

  const currentDay = new Date().toLocaleDateString(currentLocale, {
    weekday: "long",
  });

  const currentDate = new Date().toLocaleDateString(currentLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="h-16 border-b border-slate-200/60 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm shadow-slate-100/40">
      <div className="flex items-center gap-6 flex-1">
        {/* زر القائمة للشاشات الصغيرة */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 md:hidden"
        >
          <Menu size={20} />
        </button>

        {/* العنوان ظاهراً دائماً */}
        <h1 className="text-base font-bold text-slate-800">{currentTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />

        {/* الإشعارات */}
        <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition relative cursor-pointer">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 end-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </button>

        {/* التاريخ */}
        <div
          className={`flex items-center gap-2.5 ${isRTL ? "ps-3 border-s" : "pe-3 border-e"} border-slate-200 flex-row`}
        >
          <div
            className={`${isRTL ? "text-end" : "text-start"} hidden sm:block`}
          >
            <p className="text-sm font-normal text-slate-400 whitespace-nowrap">
              {isRTL
                ? `${currentDay}، ${currentDate}`
                : `${currentDay}, ${currentDate}`}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

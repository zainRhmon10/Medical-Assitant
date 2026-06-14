import React from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

/**
 * زر لتبديل اللغة بين العربية والإنكليزية
 * يخزّن الاختيار في localStorage ويبدّل اتجاه الصفحة تلقائياً (تم في src/i18n/config.js)
 */
const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(nextLang);
    localStorage.setItem("lang", nextLang);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
    >
      <Languages className="h-3.5 w-3.5" />
      {i18n.language === "ar"
        ? t("common.switchToEnglish")
        : t("common.switchToArabic")}
    </button>
  );
};

export default LanguageSwitcher;

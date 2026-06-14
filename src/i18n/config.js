import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "./locales/ar/translation.json";
import en from "./locales/en/translation.json";

const storedLang =
  typeof window !== "undefined" ? localStorage.getItem("lang") : null;

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: storedLang || "ar",
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
  },
});

// مزامنة اتجاه ولغة الصفحة <html dir="" lang="">
const applyDocumentDirection = (lng) => {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);
};

applyDocumentDirection(i18n.language);
i18n.on("languageChanged", applyDocumentDirection);

export default i18n;

import React from "react";
import { useTranslation } from "react-i18next";
import { Eye, Edit2, Trash2 } from "lucide-react";

const PatientsTab = () => {
  const { t } = useTranslation();

  const patients = [
    { id: "MED-9921", name: "خالد منصور العتيبي", age: "42 سنة", diagnostic: "السكري من النوع الثاني", lastVisit: "2026-06-10" },
    { id: "MED-8840", name: "ريما عبد العزيز السلطان", age: "29 سنة", diagnostic: "قصور الغدة الدرقية", lastVisit: "2026-05-24" },
    { id: "MED-7712", name: "فيصل فهد القحطاني", age: "61 سنة", diagnostic: "ارتفاع ضغط الدم الشرياني", lastVisit: "2026-06-14" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-sm font-bold text-slate-800">{t("dashboard.patients.title", "سجلات السيرة الطبية للمرضى")}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-100">
              <th className="px-5 py-3 text-start">{t("dashboard.patients.id", "المعرف الطبي")}</th>
              <th className="px-5 py-3 text-start">{t("dashboard.patients.name", "الاسم الكامل")}</th>
              <th className="px-5 py-3 text-start">{t("dashboard.patients.age", "العمر")}</th>
              <th className="px-5 py-3 text-start">{t("dashboard.patients.diagnostic", "التشخيص الرئيسي")}</th>
              <th className="px-5 py-3 text-start">{t("dashboard.patients.lastVisit", "آخر زيارة")}</th>
              <th className="px-5 py-3 text-center">{t("dashboard.patients.actions", "الإجراءات")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-5 py-3.5 font-mono text-slate-500">{patient.id}</td>
                <td className="px-5 py-3.5 font-bold text-slate-900">{patient.name}</td>
                <td className="px-5 py-3.5 text-slate-600">{patient.age}</td>
                <td className="px-5 py-3.5">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium">{patient.diagnostic}</span>
                </td>
                <td className="px-5 py-3.5 text-slate-500">{patient.lastVisit}</td>
                <td className="px-5 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1.5 rounded-lg border border-slate-100 bg-white text-slate-400 hover:text-[#0b7a9e] hover:border-[#0b7a9e]/20 transition-colors">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg border border-slate-100 bg-white text-slate-400 hover:text-amber-500 hover:border-amber-100 transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg border border-slate-100 bg-white text-slate-400 hover:text-red-500 hover:border-red-100 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientsTab;
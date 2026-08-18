import { useEffect, useState } from "react";
import {
  User,
  Plus,
  Search,
  Check,
  Stethoscope,
  FileText,
  Mic,
} from "lucide-react";
import FormField from "../../../component/ui/Field";

const StepInfo = ({ formik, onNext }) => {
  const [sessionType, setSessionType] = useState("new");
  useEffect(() => {
    formik.setFieldValue("sessionType", sessionType);
  }, [sessionType]);
  return (
    <div className="space-y-5 bg-blue-50">
      {/* ─── قسم المريض ─── */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">اختيار المريض</h3>
          </div>
          {/* <button
            type="button"
            className="flex items-center gap-1 rounded-lg bg-[#0b7a9e] px-3 py-1.5 text-xs font-medium text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            عرض جديد
          </button> */}
        </div>

        <FormField
          name="patientName"
          placeholder="اسم المريض"
          icon={Search}
          formik={formik}
          extraClasses="pe-10 ps-4"
        />
      </div>

      {/* ─── قسم نوع الجلسة ─── */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="mb-4 flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-800">نوع الجلسة</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* زيارة جديدة */}
          <button
            type="button"
            onClick={() => setSessionType("new")}
            className={`relative flex flex-col items-start rounded-xl border p-4 text-start transition ${
              sessionType === "new"
                ? "border-[#0b7a9e] bg-[#0b7a9e]/5"
                : "border-slate-200 bg-white"
            }`}
          >
            {sessionType === "new" && (
              <div className="absolute top-3 end-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                <Check className="h-3 w-3" />
              </div>
            )}
            <div
              className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${sessionType === "new" ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}
            >
              <Plus className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-slate-800">زيارة جديدة</p>
            <p className="mt-1 text-xs text-slate-500">مرضى جديد أو أول مرة</p>
          </button>

          {/* متابعة */}
          <button
            type="button"
            onClick={() => setSessionType("followup")}
            className={`relative flex flex-col items-start rounded-xl border p-4 text-start transition ${
              sessionType === "followup"
                ? "border-primary bg-primary/5"
                : "border-slate-200 bg-white"
            }`}
          >
            {sessionType === "followup" && (
              <div className="absolute top-3 end-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                <Check className="h-3 w-3" />
              </div>
            )}
            <div
              className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${sessionType === "followup" ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}
            >
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-slate-800">متابعة</p>
            <p className="mt-1 text-xs text-slate-500">متابعة حالة سابقة</p>
          </button>
        </div>
      </div>

      {/* ─── قسم الملاحظات ─── */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-800">ملاحظات سريعة</h3>
        </div>
        <textarea
          name="notes"
          value={formik.values.notes}
          onChange={formik.handleChange}
          placeholder="أضف أي ملاحظات أولية..."
          className="min-h-[100px] w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="mt-2 text-end text-xs text-slate-400">
          {formik.values.notes?.length || 0}/150
        </div>
      </div>

      {/* ─── زر التسجيل الصوتي ─── */}
      <button
        type="button"
        onClick={onNext}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition hover:cursor-pointer"
      >
        <Mic className="h-4 w-4" />
        بدء التسجيل الصوتي
      </button>
    </div>
  );
};

export default StepInfo;

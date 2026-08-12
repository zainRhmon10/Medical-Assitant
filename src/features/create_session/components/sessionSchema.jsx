import * as Yup from "yup";

// ═══════════════════════════════════════════════════
// الخطوة 1: معلومات الجلسة
// ═══════════════════════════════════════════════════
export const step1Schema = Yup.object({
  patientName: Yup.string().required("يرجى إدخال اسم المريض"),
  sessionType: Yup.string().oneOf(["new", "followup"]).required(),
  notes: Yup.string().max(150).nullable(),
});

// ═══════════════════════════════════════════════════
// الخطوة 2: التشخيص (التسجيل)
// ═══════════════════════════════════════════════════
export const step2Schema = Yup.object({
  diagnosisAudio: Yup.string().nullable(), // رابط/بيانات التسجيل
  diagnosisText: Yup.string().nullable(), // النص المستخرج (لاحقاً)
  recordingDuration: Yup.number().min(0).default(0),
});

// ═══════════════════════════════════════════════════
// حقول كل خطوة (للفحص قبل الانتقال)
// ═══════════════════════════════════════════════════
export const STEP_FIELDS = {
  1: ["patientName", "sessionType", "notes"],
  2: ["diagnosisAudio"], // هلق إجباري بس لما يكون في تسجيل
};

// الـ Schema الكامل (للحفظ النهائي)
export const fullSessionSchema = step1Schema.concat(step2Schema);

import { useFormik } from "formik";
import {
  step1Schema,
  step2Schema,
  fullSessionSchema,
  STEP_FIELDS,
} from "../components/sessionSchema";
import SessionStepper from "../components/Stepper";
import StepInfo from "../components/SetupSess";
import StepDiagnosis from "../components/StepDiagnosis";

import { useState } from "react";

const NewSessionPage = () => {
  const [step, setStep] = useState(1);

  const formik = useFormik({
    initialValues: {
      patientName: "",
      sessionType: "new",
      notes: "",
      diagnosisAudio: null,
      diagnosisText: "",
      recordingDuration: 0,
    },
    validationSchema: step === 1 ? step1Schema : step2Schema,
    // ★ ما بدنا onSubmit هلق — بنتعامل مع الزر يدوياً
  });

  const goNext = async () => {
    const errors = await formik.validateForm();
    const currentFields = STEP_FIELDS[step];
    const hasErrors = currentFields.some((f) => errors[f]);

    if (hasErrors) {
      const touched = {};
      currentFields.forEach((f) => (touched[f] = true));
      formik.setTouched({ ...formik.touched, ...touched });
      return;
    }

    if (step < 4) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800">جلسة طبية جديدة</h1>
          <p className="mt-1 text-sm text-slate-500">أكمل المعلومات أدناه</p>
        </div>

        <SessionStepper step={step} />

        {/* ★ شلنا onSubmit من هون — صار div عادي */}
        <div className="space-y-5">
          {step === 1 && <StepInfo formik={formik} onNext={goNext} />}
          {step === 2 && (
            <StepDiagnosis
              formik={formik}
              isRtl={true}
              onNext={goNext}
              onBack={goBack}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NewSessionPage;

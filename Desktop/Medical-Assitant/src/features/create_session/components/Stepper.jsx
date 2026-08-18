import React from "react";
const SessionStepper = ({ step }) => {
  const steps = ["معلومات الجلسة", "التشخيص", "المعالجة", "التوصيات"];

  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {[1, 2, 3, 4].map((s, idx) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                step >= s ? "bg-primary text-white" : "bg-white text-slate-400"
              }`}
            >
              {s}
            </div>
            <span
              className={`text-xs ${step >= s ? "text-slate-700" : "text-slate-400"}`}
            >
              {steps[idx]}
            </span>
          </div>
          {s < 4 && (
            <div
              className={`mx-2 h-0.5 w-12 ${step > s ? "bg-primary" : "bg-slate-200"}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default SessionStepper;

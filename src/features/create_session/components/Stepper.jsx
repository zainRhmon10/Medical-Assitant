import React from "react";

import { useTranslation } from "react-i18next";

const SessionStepper = ({ step }) => {
  const { t } = useTranslation();
  const steps = [
    t("createSession.steps.patient"),
    t("createSession.steps.audio"),
    t("createSession.steps.processing"),
    t("createSession.steps.result"),
  ];

  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {[1, 2, 3, 4].map((stepNumber, index) => (
        <React.Fragment key={stepNumber}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  text-sm
                  font-medium
                  transition-colors

                  ${
                    step >= stepNumber
                      ? "bg-primary text-white"
                      : "bg-white text-slate-400"
                  }
                `}
            >
              {stepNumber}
            </div>

            <span
              className={`
                  text-xs
                  whitespace-nowrap

                  ${step >= stepNumber ? "text-slate-700" : "text-slate-400"}
                `}
            >
              {steps[index]}
            </span>
          </div>

          {stepNumber < 4 && (
            <div
              className={`
                  mx-2
                  h-0.5
                  w-12

                  ${step > stepNumber ? "bg-primary" : "bg-slate-200"}
                `}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default SessionStepper;

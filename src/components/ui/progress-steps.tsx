import React from "react";

const STEPS = [
  { number: 1, label: "Product Info" },
  { number: 2, label: "Fixed Costs" },
  { number: 3, label: "Variable Costs" },
  { number: 4, label: "Pricing" },
  { number: 5, label: "Results" },
];

export function ProgressSteps({ currentStep, mode = "create" }: { currentStep: number; mode?: "create" | "improve" }) {
  const steps = mode === "improve"
    ? STEPS.map((step) => step.number === 1 ? { ...step, label: "Current Product" } : step.number === 5 ? { ...step, label: "Improvement Plan" } : step)
    : STEPS;
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {steps.map((step, index) => {
        const isActive = step.number === currentStep;
        const isDone = step.number < currentStep;
        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-[#2F6F7A] text-white shadow-md shadow-[#2F6F7A]/40 scale-110"
                    : isDone
                    ? "bg-[#2F6F7A] text-white"
                    : "bg-[#DCE5E8] text-[#84999E]"
                }`}
              >
                {isDone ? "✓" : step.number}
              </div>
              <span
                className={`text-[9px] sm:text-[10px] font-semibold hidden sm:block max-w-[56px] text-center leading-tight ${
                  isActive ? "text-[#2F6F7A]" : isDone ? "text-[#2F6F7A]/70" : "text-[#9AA9AD]"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 max-w-[32px] sm:max-w-[48px] rounded-full transition-all mb-4 ${
                  isDone ? "bg-[#2F6F7A]" : "bg-[#DCE5E8]"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

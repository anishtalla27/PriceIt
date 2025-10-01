import { Check } from 'lucide-react';

interface ProgressStepperProps {
  steps: string[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function ProgressStepper({ steps, currentStep, onStepClick }: ProgressStepperProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 border-b border-gray-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <button
                onClick={() => onStepClick(index)}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  index < currentStep
                    ? 'bg-green-500 border-green-500 text-white'
                    : index === currentStep
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </button>
              
              <span className={`ml-3 text-sm font-medium ${
                index <= currentStep ? 'text-gray-800' : 'text-gray-400'
              }`}>
                {step}
              </span>
              
              {index < steps.length - 1 && (
                <div className={`ml-6 w-16 h-1 rounded-full ${
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
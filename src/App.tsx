import { useState } from 'react';
import { LandingPage } from './src/pages/LandingPage';
import { ProductInfoPage } from './src/pages/ProductInfoPage';
import { CostInputsPage } from './src/pages/CostInputsPage';
import { MarketInputsPage } from './src/pages/MarketInputsPage';
import { ValueInputsPage } from './src/pages/ValueInputsPage';
import { ResultsPage } from './src/pages/ResultsPage';
import { ProgressStepper } from './src/components/ProgressStepper';
import { Toaster } from './components/ui/sonner';
import { AppData } from './src/types';



const initialData: AppData = {
  productName: '',
  productDescription: '',
  uniqueFeature: '',
  directCosts: [
    { id: '1', name: 'Main Material', icon: '🧱', costPerUnit: 2.50, unitsProduced: 1, category: 'materials' }
  ],
  indirectCosts: [],
  extraCosts: [],
  competitors: [
    { id: '1', name: 'Competitor 1', price: 10, strengths: 'Popular brand', weaknesses: 'More expensive', website: '' }
  ],
  productionCost: 0,
  minimumPrice: 0,
  targetAge: '8-12 years',
  spendingRange: '$5-15',
  competitionLevel: 'Medium',
  problemSolved: '',
  specialBenefit: '',
  alternatives: [
    { id: '1', name: 'DIY Option', cost: 5 }
  ]
};

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<AppData>(initialData);

  const steps = [
    'Welcome',
    'Product Info', 
    'Your Costs',
    'Competition',
    'Customer Value',
    'Results'
  ];

  const updateData = (updates: Partial<AppData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Enhanced Cost Calculations
  const directCostTotal = data.directCosts.reduce((sum, cost) => {
    return sum + (cost.unitsProduced > 0 ? cost.costPerUnit / cost.unitsProduced : cost.costPerUnit);
  }, 0);
  const indirectCostPerUnit = data.indirectCosts.reduce((sum, cost) => {
    return sum + (cost.unitsBeforeReplacement > 0 ? cost.totalCost / cost.unitsBeforeReplacement : 0);
  }, 0);
  const extraCostTotal = data.extraCosts.reduce((sum, cost) => sum + cost.costPerUnit, 0);
  
  const totalMaterialCost = directCostTotal + indirectCostPerUnit + extraCostTotal;
  const averageCompetitorPrice = data.competitors.length > 0
    ? data.competitors.reduce((sum, comp) => sum + comp.price, 0) / data.competitors.length
    : 0;
  
  const costPlusPrice = Number((totalMaterialCost * 1.5).toFixed(2)); // 50% markup
  const marketPrice = Number(averageCompetitorPrice.toFixed(2));
  const valuePrice = Number(Math.max(totalMaterialCost * 2, averageCompetitorPrice * 1.1).toFixed(2)); // Simple value-based calc

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <LandingPage onStart={() => nextStep()} />;
      case 1:
        return (
          <ProductInfoPage 
            data={data} 
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 2:
        return (
          <CostInputsPage 
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
            totalCost={totalMaterialCost}
          />
        );
      case 3:
        return (
          <MarketInputsPage 
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <ValueInputsPage 
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <ResultsPage 
            costPlusPrice={costPlusPrice}
            marketPrice={marketPrice}
            valuePrice={valuePrice}
            totalMaterialCost={totalMaterialCost}
            data={data}
            onBack={prevStep}
            onRestart={() => {
              setCurrentStep(0);
              setData(initialData);
            }}
          />
        );
      default:
        return <LandingPage onStart={() => nextStep()} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {currentStep > 0 && currentStep < steps.length - 1 && (
        <ProgressStepper 
          steps={steps.slice(1, -1)} // Exclude Welcome and Results from stepper
          currentStep={currentStep - 1}
          onStepClick={(step) => goToStep(step + 1)}
        />
      )}
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {renderCurrentStep()}
      </div>
      
      {/* Toast notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
}
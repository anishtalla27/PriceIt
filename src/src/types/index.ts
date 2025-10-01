// Type definitions for the entire application

export interface DirectCost {
  id: string;
  name: string;
  icon: string;
  costPerUnit: number;
  unitsProduced: number; // How many units this material makes
  category: 'materials' | 'packaging';
}

export interface IndirectCost {
  id: string;
  name: string;
  icon: string;
  totalCost: number;
  unitsBeforeReplacement: number; // How many units equipment makes before needing replacement
  category: 'equipment' | 'startup';
}

export interface ExtraCost {
  id: string;
  name: string;
  icon: string;
  costPerUnit: number;
  category: 'shipping' | 'marketing' | 'other';
}

export interface Competitor {
  id: string;
  name: string;
  price: number;
  strengths: string;
  weaknesses: string;
  website?: string;
}

export interface Alternative {
  id: string;
  name: string;
  cost: number;
}

export interface AppData {
  // Product Info
  productName: string;
  productDescription: string;
  uniqueFeature: string;
  
  // Enhanced Cost Inputs
  directCosts: DirectCost[];
  indirectCosts: IndirectCost[];
  extraCosts: ExtraCost[];
  
  // Market Inputs
  competitors: Competitor[];
  productionCost: number;
  minimumPrice: number;
  targetAge: string;
  spendingRange: string;
  competitionLevel: 'Low' | 'Medium' | 'High';
  
  // Value Inputs
  problemSolved: string;
  specialBenefit: string;
  alternatives: Alternative[];
}

// AI Response Types
export interface AISuggestedCosts {
  materials: Array<{name: string, costPerUnit: number, unitsProduced: number}>;
  packaging: Array<{name: string, costPerUnit: number, unitsProduced: number}>;
  equipment: Array<{name: string, totalCost: number, unitsBeforeReplacement: number}>;
  extra: Array<{name: string, costPerUnit: number, category: string}>;
}

export interface AISuggestedCompetitors {
  competitors: Array<{
    name: string;
    price: number;
    strengths: string;
    weaknesses: string;
    website?: string;
  }>;
}

export interface AISuggestedValue {
  problemSolved: string;
  specialBenefit: string;
  alternatives: Array<{name: string, cost: number}>;
}

export interface AIPricingStrategies {
  costPlus: {
    price: number;
    markup: number;
    explanation: string;
  };
  market: {
    price: number;
    explanation: string;
  };
  value: {
    price: number;
    explanation: string;
  };
}

export interface AIResponse {
  suggestedCosts: AISuggestedCosts;
  suggestedCompetitors: AISuggestedCompetitors;
  suggestedValue: AISuggestedValue;
  pricingStrategies: AIPricingStrategies;
}

// AI Input Types
export interface AIInput {
  productName: string;
  productDescription: string;
  uniqueFeature: string;
  targetAge: string;
  spendingRange: string;
  competitionLevel: string;
  currentCosts?: {
    materials: number;
    equipment: number;
    extra: number;
  };
}
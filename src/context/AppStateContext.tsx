import React, { createContext, useCallback, useContext, useState } from "react";

export interface ProductInfo {
  id: string;
  productName: string;
  productDescription: string;
  targetCustomer: string;
  specialFeature: string;
  category: string;
  currentChallenge: string;
  improvementGoal: string;
  inspiration: string;
}

export type JourneyMode = "create" | "improve";

export type FixedCostCategory = "Equipment" | "Rent" | "Supplies" | "Packaging" | "Other";
export type CostType = "one-time" | "monthly";

export interface FixedCostItem {
  id: string;
  name: string;
  totalCost: number | "";
  type: CostType;
  monthsOfUse: number | "";
  category: FixedCostCategory;
}

export type VariableCostCategory = "Materials" | "Ingredients" | "Packaging" | "Labor" | "Other";

export interface VariableCostItem {
  id: string;
  name: string;
  pricePerPack: number | "";
  unitsPerPack: number | "";
  unitsPerProduct: number | "";
  category: VariableCostCategory;
}

export interface PricingInfo {
  sellingPrice: number | "";
  unitsPerMonth: number | "";
}

export type StartingQuality = "Standard" | "Premium" | "Deluxe";

export interface SimConfig {
  startingCash: number | "";
  maxWeeklyUnits: number | "";
  startingQuality: StartingQuality;
}

export interface AppState {
  journeyMode: JourneyMode | null;
  productInfo: ProductInfo;
  fixedCosts: FixedCostItem[];
  variableCosts: VariableCostItem[];
  pricing: PricingInfo;
  simConfig: SimConfig;
}

const defaultProductInfo: ProductInfo = {
  id: "product-1",
  productName: "",
  productDescription: "",
  targetCustomer: "",
  specialFeature: "",
  category: "",
  currentChallenge: "",
  improvementGoal: "",
  inspiration: "",
};

const defaultState: AppState = {
  journeyMode: null,
  productInfo: defaultProductInfo,
  fixedCosts: [],
  variableCosts: [],
  pricing: { sellingPrice: "", unitsPerMonth: "" },
  simConfig: { startingCash: "", maxWeeklyUnits: "", startingQuality: "Standard" },
};

const APP_STATE_STORAGE_KEY = "priceit_app_state_v1";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function loadPersistedState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed)) return defaultState;

    const productInfo = isObject(parsed.productInfo) ? parsed.productInfo : {};
    const pricing = isObject(parsed.pricing) ? parsed.pricing : {};
    const simConfig = isObject(parsed.simConfig) ? parsed.simConfig : {};

    return {
      journeyMode: parsed.journeyMode === "improve" ? "improve" : parsed.journeyMode === "create" ? "create" : null,
      productInfo: {
        ...defaultState.productInfo,
        ...productInfo,
      },
      fixedCosts: Array.isArray(parsed.fixedCosts) ? parsed.fixedCosts as FixedCostItem[] : [],
      variableCosts: Array.isArray(parsed.variableCosts)
        ? parsed.variableCosts as VariableCostItem[]
        : [],
      pricing: {
        ...defaultState.pricing,
        ...pricing,
      },
      simConfig: {
        ...defaultState.simConfig,
        ...simConfig,
      },
    };
  } catch {
    return defaultState;
  }
}

function makeFixedCostItem(): FixedCostItem {
  return {
    id: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: "",
    totalCost: "",
    type: "one-time",
    monthsOfUse: "",
    category: "Equipment",
  };
}

function makeVariableCostItem(): VariableCostItem {
  return {
    id: `vc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: "",
    pricePerPack: "",
    unitsPerPack: "",
    unitsPerProduct: "",
    category: "Materials",
  };
}

interface AppStateContextValue {
  state: AppState;
  beginJourney: (mode: JourneyMode) => void;
  updateProductInfo: (updates: Partial<ProductInfo>) => void;
  addFixedCost: () => string;
  updateFixedCost: (id: string, updates: Partial<FixedCostItem>) => void;
  deleteFixedCost: (id: string) => void;
  addVariableCost: () => string;
  updateVariableCost: (id: string, updates: Partial<VariableCostItem>) => void;
  deleteVariableCost: (id: string) => void;
  updatePricing: (updates: Partial<PricingInfo>) => void;
  updateSimConfig: (updates: Partial<SimConfig>) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadPersistedState());

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const beginJourney = useCallback((mode: JourneyMode) => {
    setState({
      ...defaultState,
      journeyMode: mode,
      productInfo: { ...defaultProductInfo },
    });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("priceit_sim_game_v1");
    }
  }, []);

  const updateProductInfo = (updates: Partial<ProductInfo>) => {
    setState((prev) => ({
      ...prev,
      productInfo: { ...prev.productInfo, ...updates },
    }));
  };

  const addFixedCost = (): string => {
    const item = makeFixedCostItem();
    setState((prev) => ({ ...prev, fixedCosts: [...prev.fixedCosts, item] }));
    return item.id;
  };

  const updateFixedCost = (id: string, updates: Partial<FixedCostItem>) => {
    setState((prev) => ({
      ...prev,
      fixedCosts: prev.fixedCosts.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const deleteFixedCost = (id: string) => {
    setState((prev) => ({
      ...prev,
      fixedCosts: prev.fixedCosts.filter((item) => item.id !== id),
    }));
  };

  const addVariableCost = (): string => {
    const item = makeVariableCostItem();
    setState((prev) => ({ ...prev, variableCosts: [...prev.variableCosts, item] }));
    return item.id;
  };

  const updateVariableCost = (id: string, updates: Partial<VariableCostItem>) => {
    setState((prev) => ({
      ...prev,
      variableCosts: prev.variableCosts.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const deleteVariableCost = (id: string) => {
    setState((prev) => ({
      ...prev,
      variableCosts: prev.variableCosts.filter((item) => item.id !== id),
    }));
  };

  const updatePricing = (updates: Partial<PricingInfo>) => {
    setState((prev) => ({
      ...prev,
      pricing: { ...prev.pricing, ...updates },
    }));
  };

  const updateSimConfig = (updates: Partial<SimConfig>) => {
    setState((prev) => ({
      ...prev,
      simConfig: { ...prev.simConfig, ...updates },
    }));
  };

  return (
    <AppStateContext.Provider
      value={{
        state,
        beginJourney,
        updateProductInfo,
        addFixedCost,
        updateFixedCost,
        deleteFixedCost,
        addVariableCost,
        updateVariableCost,
        deleteVariableCost,
        updatePricing,
        updateSimConfig,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

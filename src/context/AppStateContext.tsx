import React, { createContext, useCallback, useContext, useState } from "react";
import type { SavedProduct } from "@/lib/saved-products";
import { clearActiveProductSidecarData, restoreProductSidecarData } from "@/lib/saved-products";

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

export type FixedCostCategory =
  | "Equipment"
  | "Facility Rental"
  | "Instructor Fee"
  | "Rent"
  | "Supplies"
  | "Packaging"
  | "Other";
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

export interface AppState {
  journeyMode: JourneyMode | null;
  activeSavedProductId: string | null;
  productInfo: ProductInfo;
  fixedCosts: FixedCostItem[];
  variableCosts: VariableCostItem[];
  pricing: PricingInfo;
}

function makeDefaultProductInfo(): ProductInfo {
  return {
    id: `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productName: "",
    productDescription: "",
    targetCustomer: "",
    specialFeature: "",
    category: "",
    currentChallenge: "",
    improvementGoal: "",
    inspiration: "",
  };
}

const defaultProductInfo: ProductInfo = makeDefaultProductInfo();

const defaultState: AppState = {
  journeyMode: null,
  activeSavedProductId: null,
  productInfo: defaultProductInfo,
  fixedCosts: [],
  variableCosts: [],
  pricing: { sellingPrice: "", unitsPerMonth: "" },
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
    return {
      journeyMode: parsed.journeyMode === "improve" ? "improve" : parsed.journeyMode === "create" ? "create" : null,
      activeSavedProductId: typeof parsed.activeSavedProductId === "string" ? parsed.activeSavedProductId : null,
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
  lastSavedAt: number;
  beginJourney: (mode: JourneyMode) => void;
  updateProductInfo: (updates: Partial<ProductInfo>) => void;
  addFixedCost: () => string;
  updateFixedCost: (id: string, updates: Partial<FixedCostItem>) => void;
  deleteFixedCost: (id: string) => void;
  addVariableCost: () => string;
  updateVariableCost: (id: string, updates: Partial<VariableCostItem>) => void;
  deleteVariableCost: (id: string) => void;
  updatePricing: (updates: Partial<PricingInfo>) => void;
  setActiveSavedProductId: (id: string | null) => void;
  loadSavedProduct: (product: SavedProduct) => void;
  loadTestProject: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadPersistedState());
  const [lastSavedAt, setLastSavedAt] = useState<number>(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
    setLastSavedAt(Date.now());
  }, [state]);

  const beginJourney = useCallback((mode: JourneyMode) => {
    clearActiveProductSidecarData();
    setState({
      ...defaultState,
      journeyMode: mode,
      activeSavedProductId: null,
      productInfo: makeDefaultProductInfo(),
    });
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

  const setActiveSavedProductId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, activeSavedProductId: id }));
  }, []);

  const loadSavedProduct = useCallback((product: SavedProduct) => {
    restoreProductSidecarData(product);
    setState({
      journeyMode: product.journeyMode,
      activeSavedProductId: product.id,
      productInfo: product.productInfo,
      fixedCosts: product.fixedCosts,
      variableCosts: product.variableCosts,
      pricing: product.pricing,
    });
  }, []);

  const loadTestProject = useCallback(() => {
    clearActiveProductSidecarData();
    setState({
      journeyMode: "create",
      activeSavedProductId: null,
      productInfo: {
        id: "test-product-friendship-bracelets",
        productName: "Sunshine Friendship Bracelets",
        productDescription:
          "Handmade colorful friendship bracelets with custom color patterns and a small initial charm.",
        targetCustomer:
          "Kids ages 8 to 13 who want affordable gifts for friends, birthdays, camp, and school events.",
        specialFeature:
          "Customers can choose their colors and add one initial charm, so each bracelet feels personal.",
        category: "Handmade accessories",
        currentChallenge:
          "Figuring out a price that is still affordable but leaves enough profit after supplies and booth costs.",
        improvementGoal:
          "Test a price and bundle offer that can earn at least $100 profit in one month.",
        inspiration:
          "Bright summer colors, friendship gifts, craft fairs, and custom bracelets kids can trade.",
      },
      fixedCosts: [
        {
          id: "test-fc-starter-kit",
          name: "Bracelet tool starter kit",
          totalCost: 24,
          type: "one-time",
          monthsOfUse: 6,
          category: "Equipment",
        },
        {
          id: "test-fc-fair-table",
          name: "Craft fair table fee",
          totalCost: 15,
          type: "monthly",
          monthsOfUse: "",
          category: "Rent",
        },
        {
          id: "test-fc-signs",
          name: "Display signs and price cards",
          totalCost: 12,
          type: "one-time",
          monthsOfUse: 4,
          category: "Supplies",
        },
      ],
      variableCosts: [
        {
          id: "test-vc-thread",
          name: "Embroidery thread",
          pricePerPack: 9,
          unitsPerPack: 30,
          unitsPerProduct: 3,
          category: "Materials",
        },
        {
          id: "test-vc-charms",
          name: "Initial charms",
          pricePerPack: 12,
          unitsPerPack: 40,
          unitsPerProduct: 1,
          category: "Materials",
        },
        {
          id: "test-vc-bags",
          name: "Small gift bags",
          pricePerPack: 6,
          unitsPerPack: 50,
          unitsPerProduct: 1,
          category: "Packaging",
        },
        {
          id: "test-vc-labor",
          name: "Making time",
          pricePerPack: 6,
          unitsPerPack: 12,
          unitsPerProduct: 1,
          category: "Labor",
        },
      ],
      pricing: {
        sellingPrice: 6,
        unitsPerMonth: 45,
      },
    });
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        state,
        lastSavedAt,
        beginJourney,
        updateProductInfo,
        addFixedCost,
        updateFixedCost,
        deleteFixedCost,
        addVariableCost,
        updateVariableCost,
        deleteVariableCost,
        updatePricing,
        setActiveSavedProductId,
        loadSavedProduct,
        loadTestProject,
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

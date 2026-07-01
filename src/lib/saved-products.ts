import type {
  AppState,
  FixedCostItem,
  JourneyMode,
  PricingInfo,
  ProductInfo,
  VariableCostItem,
} from "@/context/AppStateContext";

export const SAVED_PRODUCTS_STORAGE_KEY = "launchpad_saved_products_v1";

const PRICING_LAB_DRAFT_KEY = "priceit_pricing_lab_draft_v1";
const PRICING_STRATEGY_DRAFT_KEY = "priceit_pricing_strategy_draft_v1";
const RESULTS_CACHE_STORAGE_KEY = "priceit_results_analysis_cache_v1";

export interface SavedProductSummary {
  sellingPrice: number;
  costPerUnit: number;
  profitPerUnit: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  profitMargin: number;
  breakEvenUnits: number | null;
}

export interface SavedProductResults {
  contextKey: string;
  businessRating: unknown;
  feedbackSummary: unknown;
  reviews: unknown[];
  nextSteps: string[];
  cachedAt: number;
}

export interface SavedProductPricingLabData {
  labDraft?: unknown;
  strategyDraft?: unknown;
}

export interface SavedProduct {
  id: string;
  createdAt: string;
  updatedAt: string;
  journeyMode: JourneyMode | null;
  productInfo: ProductInfo;
  fixedCosts: FixedCostItem[];
  variableCosts: VariableCostItem[];
  pricing: PricingInfo;
  pricingLab?: SavedProductPricingLabData;
  results?: SavedProductResults;
  summary: SavedProductSummary;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function makeId(): string {
  return `saved-product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fixedMonthly(item: FixedCostItem): number {
  if (item.totalCost === "" || Number(item.totalCost) <= 0) return 0;
  if (item.type === "monthly") return Number(item.totalCost);
  if (item.monthsOfUse === "" || Number(item.monthsOfUse) <= 0) return 0;
  return Number(item.totalCost) / Number(item.monthsOfUse);
}

function variableCostPerUnit(item: VariableCostItem): number {
  const pricePerPack = Number(item.pricePerPack);
  const unitsPerPack = Number(item.unitsPerPack);
  const unitsPerProduct = Number(item.unitsPerProduct);
  if (!pricePerPack || !unitsPerPack || !unitsPerProduct) return 0;
  return (pricePerPack / unitsPerPack) * unitsPerProduct;
}

function readJson(key: string): unknown {
  if (typeof window === "undefined") return undefined;
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "null") as unknown;
  } catch {
    return undefined;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeKey(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export function calculateSavedProductSummary(state: Pick<AppState, "fixedCosts" | "variableCosts" | "pricing">): SavedProductSummary {
  const sellingPrice = Number(state.pricing.sellingPrice) || 0;
  const unitsPerMonth = Number(state.pricing.unitsPerMonth) || 0;
  const monthlyFixed = state.fixedCosts.reduce((sum, item) => sum + fixedMonthly(item), 0);
  const variablePerUnit = state.variableCosts.reduce((sum, item) => sum + variableCostPerUnit(item), 0);
  const fixedPerUnit = unitsPerMonth > 0 ? monthlyFixed / unitsPerMonth : 0;
  const costPerUnit = variablePerUnit + fixedPerUnit;
  const profitPerUnit = sellingPrice - costPerUnit;
  const monthlyRevenue = sellingPrice * unitsPerMonth;
  const monthlyProfit = profitPerUnit * unitsPerMonth;
  const profitMargin = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0;
  const breakEvenUnits = sellingPrice > variablePerUnit
    ? Math.ceil(monthlyFixed / (sellingPrice - variablePerUnit))
    : null;

  return {
    sellingPrice,
    costPerUnit,
    profitPerUnit,
    monthlyRevenue,
    monthlyProfit,
    profitMargin,
    breakEvenUnits,
  };
}

export function getSavedProductStatus(product: SavedProduct): "Profitable" | "Needs work" | "Missing price" {
  if (product.summary.sellingPrice <= 0) return "Missing price";
  if (product.summary.profitPerUnit > 0 && product.summary.monthlyProfit > 0) return "Profitable";
  return "Needs work";
}

export function hasMeaningfulProductData(state: AppState): boolean {
  return (
    state.productInfo.productName.trim() !== "" ||
    state.productInfo.productDescription.trim() !== "" ||
    state.productInfo.targetCustomer.trim() !== "" ||
    state.fixedCosts.length > 0 ||
    state.variableCosts.length > 0 ||
    state.pricing.sellingPrice !== "" ||
    state.pricing.unitsPerMonth !== ""
  );
}

export function readSavedProducts(): SavedProduct[] {
  if (typeof window === "undefined") return [];
  const parsed = readJson(SAVED_PRODUCTS_STORAGE_KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((product): product is SavedProduct => {
    if (!isObject(product) || typeof product.id !== "string") return false;
    return isObject(product.productInfo) && Array.isArray(product.fixedCosts) && Array.isArray(product.variableCosts);
  });
}

export function writeSavedProducts(products: SavedProduct[]) {
  writeJson(SAVED_PRODUCTS_STORAGE_KEY, products);
}

export function collectPricingLabData(): SavedProductPricingLabData | undefined {
  const labDraft = readJson(PRICING_LAB_DRAFT_KEY);
  const strategyDraft = readJson(PRICING_STRATEGY_DRAFT_KEY);
  const data: SavedProductPricingLabData = {};
  if (labDraft !== undefined && labDraft !== null && isObject(labDraft) && Object.keys(labDraft).length > 0) {
    data.labDraft = labDraft;
  }
  if (strategyDraft !== undefined && strategyDraft !== null && isObject(strategyDraft) && Object.keys(strategyDraft).length > 0) {
    data.strategyDraft = strategyDraft;
  }
  return data.labDraft || data.strategyDraft ? data : undefined;
}

export function clearActiveProductSidecarData() {
  removeKey(PRICING_LAB_DRAFT_KEY);
  removeKey(PRICING_STRATEGY_DRAFT_KEY);
  removeKey(RESULTS_CACHE_STORAGE_KEY);
}

export function restoreProductSidecarData(product: SavedProduct) {
  if (product.pricingLab?.labDraft) {
    writeJson(PRICING_LAB_DRAFT_KEY, product.pricingLab.labDraft);
  } else {
    removeKey(PRICING_LAB_DRAFT_KEY);
  }

  if (product.pricingLab?.strategyDraft) {
    writeJson(PRICING_STRATEGY_DRAFT_KEY, product.pricingLab.strategyDraft);
  } else {
    removeKey(PRICING_STRATEGY_DRAFT_KEY);
  }

  if (product.results) {
    writeJson(RESULTS_CACHE_STORAGE_KEY, product.results);
  } else {
    removeKey(RESULTS_CACHE_STORAGE_KEY);
  }
}

export function saveCurrentProduct(
  state: AppState,
  options: { existingId?: string | null; results?: SavedProductResults } = {}
): SavedProduct | null {
  if (!hasMeaningfulProductData(state)) return null;

  const products = readSavedProducts();
  const now = new Date().toISOString();
  const existingIndex = options.existingId
    ? products.findIndex((product) => product.id === options.existingId)
    : -1;
  const existing = existingIndex >= 0 ? products[existingIndex] : null;
  const id = existing?.id ?? makeId();
  const saved: SavedProduct = {
    id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    journeyMode: state.journeyMode,
    productInfo: { ...state.productInfo, id: state.productInfo.id || `product-${id}` },
    fixedCosts: state.fixedCosts,
    variableCosts: state.variableCosts,
    pricing: state.pricing,
    pricingLab: collectPricingLabData(),
    results: options.results ?? existing?.results,
    summary: calculateSavedProductSummary(state),
  };

  if (existingIndex >= 0) {
    products[existingIndex] = saved;
  } else {
    products.unshift(saved);
  }

  writeSavedProducts(products);
  return saved;
}

export function duplicateSavedProduct(productId: string): SavedProduct | null {
  const products = readSavedProducts();
  const source = products.find((product) => product.id === productId);
  if (!source) return null;
  const now = new Date().toISOString();
  const duplicate: SavedProduct = {
    ...source,
    id: makeId(),
    createdAt: now,
    updatedAt: now,
    productInfo: {
      ...source.productInfo,
      id: `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    },
  };
  writeSavedProducts([duplicate, ...products]);
  return duplicate;
}

export function deleteSavedProduct(productId: string): SavedProduct[] {
  const nextProducts = readSavedProducts().filter((product) => product.id !== productId);
  writeSavedProducts(nextProducts);
  return nextProducts;
}

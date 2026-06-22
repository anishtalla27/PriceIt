// ─── Upgrade IDs ──────────────────────────────────────────────────────────────

export type UpgradeId =
  | "bulk_discount"
  | "second_helper"
  | "fast_production"
  | "email_list"
  | "local_ad"
  | "sponsored_post"
  | "wom_boost"
  | "artisan_quality"
  | "signature_feature";

// ─── Event system ─────────────────────────────────────────────────────────────

export type EventType = "oneoff" | "arc_start" | "arc_mid" | "arc_end" | "seasonal";

export type MarketingKey =
  | "flyers"
  | "social"
  | "wom"
  | "sale"
  | "email_list"
  | "local_ad"
  | "sponsored_post";

export type QualityTier = "Standard" | "Premium" | "Deluxe" | "Artisan";

export interface EventChoice {
  label: string;
  hint: string;
  arcChoiceKey?: string;
  modifierOverride?: number;
  materialCostModifierOverride?: number;
  priceAdjust?: number;
  marketingForce?: MarketingKey[];
}

export interface RandomEvent {
  id: string;
  name: string;
  description: string;
  modifier: number;
  materialCostModifier?: number;
  modifierLabel?: string;
  type?: EventType;
  arcId?: string;
  arcWeek?: number;
  choices?: EventChoice[];
}

// ─── Game state ───────────────────────────────────────────────────────────────

export interface WeeklyResult {
  week: number;
  event: RandomEvent;
  unitsSold: number;
  finalDemand: number;
  revenue: number;
  totalCost: number;
  profit: number;
  endCash: number;
}

export interface SimGameState {
  week: number;
  cash: number;
  cashHistory: number[];
  inventory: number;
  satisfaction: number;
  helpers: number;
  wordOfMouthStack: number;
  weeklyResults: WeeklyResult[];
  gameStatus: "active" | "gameover" | "complete";
  currentEvent: RandomEvent;
  // Progression (new fields — extend PersistedSimSnapshot gracefully)
  xp: number;
  unlockedUpgrades: UpgradeId[];
  streakCount: number;
  activeArcId?: string;
  activeArcWeek?: number;
  activeArcChoice?: string;
}

export interface Decisions {
  unitsToProduce: number;
  sellingPrice: number;
  quality: QualityTier;
  marketing: MarketingKey[];
  hireHelper: boolean;
}

export interface Computed {
  effectiveMax: number;
  effectivePrice: number;
  finalDemand: number;
  supply: number;
  unitsSold: number;
  unsold: number;
  productionCost: number;
  marketingCost: number;
  helperCost: number;
  totalCost: number;
  revenue: number;
  profit: number;
  projectedCash: number;
}

export interface PersistedSimSnapshot {
  simState: SimGameState;
  decisions: Decisions;
  base: {
    variableCostPerUnit: number;
    weeklyFixed: number;
    originalPrice: number;
    maxWeeklyUnits: number;
    startingCash: number;
    startingQuality: "Standard" | "Premium" | "Deluxe";
    productName: string;
    category: string;
    targetCustomer: string;
  };
}

// ─── Upgrade definition ───────────────────────────────────────────────────────

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  effect: string;
  xpCost: number;
  category: "operations" | "marketing" | "product";
}

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import type { FixedCostItem, StartingQuality, VariableCostItem } from "@/context/AppStateContext";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import { generateAI, type AIProgress, type AIWarning } from "@/lib/ai-provider";
import { simulationEventTemplate } from "@/lib/ai-templates";
 
import { extractJsonObject } from "@/lib/safe-json";
import logo from "../../logo.png";
import stand from "../../stand2.png";

// ─── Cost helpers ──────────────────────────────────────────────────────────────

function fixedMonthly(item: FixedCostItem): number {
  if (item.totalCost === "" || Number(item.totalCost) <= 0) return 0;
  if (item.type === "monthly") return Number(item.totalCost);
  if (item.monthsOfUse === "" || Number(item.monthsOfUse) <= 0) return 0;
  return Number(item.totalCost) / Number(item.monthsOfUse);
}

function variableCPP(item: VariableCostItem): number {
  const p = Number(item.pricePerPack);
  const pp = Number(item.unitsPerPack);
  const u = Number(item.unitsPerProduct);
  if (!p || !pp || !u) return 0;
  return (p / pp) * u;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type PromotionType = "none" | "friends" | "posters" | "social" | "deal";
type DealType = "bundle" | "dollarOff" | "freeExtra";
type Mood = "Happy" | "Okay" | "Worried";

interface RandomEvent {
  id: string;
  name: string;
  description: string;
  modifier: number;
  materialCostModifier?: number;
  modifierLabel?: string;
}

interface WeeklyResult {
  week: number;
  event: RandomEvent;
  unitsSold: number;
  finalDemand: number;
  revenue: number;
  totalCost: number;
  profit: number;
  endCash: number;
}

interface SimGameState {
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
}

interface Decisions {
  unitsToProduce: number;
  sellingPrice: number;
  quality: StartingQuality;
  promotionType: PromotionType;
  dealType: DealType | null;
  hireHelper: boolean;
}

interface PersistedSimSnapshot {
  simState: SimGameState;
  decisions: Decisions;
  base: {
    variableCostPerUnit: number;
    weeklyFixed: number;
    originalPrice: number;
    maxWeeklyUnits: number;
    startingCash: number;
    startingQuality: StartingQuality;
    productName: string;
    category: string;
    targetCustomer: string;
  };
}

interface Computed {
  effectivePrice: number;
  finalDemand: number;
  supply: number;
  unitsSold: number;
  unsold: number;
  productionCost: number;
  promotionCost: number;
  totalCost: number;
  revenue: number;
  profit: number;
  projectedCash: number;
}

interface PendingWeek {
  result: WeeklyResult;
  newSat: number;
  newInventory: number;
  lesson: string;
}

interface DealOption {
  id: DealType;
  label: string;
  description: string;
  demandBoost: number;
  priceDrop: number;
  extraUnitCost: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_WEEKS = 12;
const SIM_GAME_STORAGE_KEY = "priceit_sim_game_v1";

const RANDOM_EVENTS: RandomEvent[] = [
  { id: "fair", name: "School fair this weekend", description: "Lots of families may be out shopping.", modifier: 1.4, modifierLabel: "More customers" },
  { id: "rain", name: "Rainy week", description: "Fewer people may come out this week.", modifier: 0.8, modifierLabel: "Fewer customers" },
  { id: "viral", name: "A friend shared your product", description: "People are talking about what you sell!", modifier: 1.3, modifierLabel: "More customers" },
  { id: "comp", name: "Another seller showed up", description: "You now have a little competition nearby.", modifier: 0.75, modifierLabel: "Fewer customers" },
  { id: "news", name: "Local community spotlight", description: "People are excited to support kid businesses.", modifier: 1.2, modifierLabel: "More customers" },
  { id: "holiday", name: "Holiday weekend", description: "People may spend more on fun treats and gifts.", modifier: 1.35, modifierLabel: "More customers" },
  { id: "slow", name: "Regular week", description: "No big surprises this week.", modifier: 1.0, modifierLabel: "Normal week" },
  { id: "supply", name: "Supplies cost more this week", description: "Materials are pricier than usual right now.", modifier: 0.9, modifierLabel: "Costs up", materialCostModifier: 1.2 },
  { id: "loyal", name: "Repeat customers came back", description: "People who liked your product returned.", modifier: 1.15, modifierLabel: "More customers" },
  { id: "sunny", name: "Perfect weather for selling", description: "More people are out and about this week.", modifier: 1.1, modifierLabel: "More customers" },
];

const RUN_FEEDBACK_STEPS = ["Getting ready...", "Customers are arriving...", "Checking this week's results..."];

const MOOD_COPY: Record<Mood, string[]> = {
  Happy: ["Happy", "Very happy", "Excited"],
  Okay: ["Okay", "Mixed", "Neutral"],
  Worried: ["Not happy", "Unsure", "Worried"],
};

const QUALITY_DEMAND: Record<StartingQuality, number> = {
  Standard: 0.88,
  Premium: 1.0,
  Deluxe: 1.15,
};

const QUALITY_COST_MULT: Record<StartingQuality, number> = {
  Standard: 1.0,
  Premium: 1.25,
  Deluxe: 1.5,
};

const QUALITY_LABEL: Record<StartingQuality, string> = {
  Standard: "Standard",
  Premium: "Better",
  Deluxe: "Best",
};

const QUALITY_NOTE: Record<StartingQuality, string> = {
  Standard: "Lower cost, easier to sell",
  Premium: "Balanced choice",
  Deluxe: "Higher cost, happier buyers",
};

// ─── Utility functions ─────────────────────────────────────────────────────────

function pickRandomEvent(): RandomEvent {
  return RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
}

function readSimSnapshot(): PersistedSimSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SIM_GAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSimSnapshot;
    if (!parsed?.simState || !parsed?.decisions || !parsed?.base) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSimSnapshot(snapshot: PersistedSimSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SIM_GAME_STORAGE_KEY, JSON.stringify(snapshot));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

function floorToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.floor(value / step) * step;
}

function ceilToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.ceil(value / step) * step;
}

function money(value: number): string {
  return `$${Math.abs(value).toFixed(2)}`;
}

function eventTag(event: RandomEvent): string {
  if ((event.materialCostModifier ?? 1) > 1) return "Supplies cost more";
  if (event.modifier >= 1.2) return "Busy week";
  if (event.modifier >= 1.05) return "Good buzz";
  if (event.modifier <= 0.85) return "Fewer customers";
  return "Regular week";
}

function cleanLabel(label: string): string {
  return label
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getStoryVisual(event: RandomEvent): {
  border: string;
  background: string;
  chipBackground: string;
  chipBorder: string;
  iconColor: string;
  iconBackground: string;
} {
  if ((event.materialCostModifier ?? 1) > 1) {
    return {
      border: "#F2C8B3",
      background: "linear-gradient(180deg, #ffffff 0%, #FFF7F2 100%)",
      chipBackground: "#FFF2EA",
      chipBorder: "#F3D8C8",
      iconColor: "#C65A2E",
      iconBackground: "#FFE8DC",
    };
  }
  if (event.modifier >= 1.2) {
    return {
      border: "#A9DDB4",
      background: "linear-gradient(180deg, #ffffff 0%, #F4FBF6 100%)",
      chipBackground: "#EFF9F2",
      chipBorder: "#D2EED8",
      iconColor: "#1D8D3C",
      iconBackground: "#DFF4E5",
    };
  }
  if (event.modifier <= 0.85) {
    return {
      border: "#F1D8BE",
      background: "linear-gradient(180deg, #ffffff 0%, #FFF9F3 100%)",
      chipBackground: "#FFF4E8",
      chipBorder: "#F2DFC9",
      iconColor: "#B36A1F",
      iconBackground: "#FFEBD5",
    };
  }
  return {
    border: "#A9DDE3",
    background: "linear-gradient(180deg, #ffffff 0%, #F1FAFB 100%)",
    chipBackground: "#F0FAFB",
    chipBorder: "#D4EBEE",
    iconColor: "#1E6470",
    iconBackground: "#E4F4F6",
  };
}

function moodFromScore(score: number): Mood {
  if (score >= 75) return "Happy";
  if (score >= 45) return "Okay";
  return "Worried";
}

function lessonForWeek(result: WeeklyResult, mood: Mood): string {
  if (result.finalDemand > result.unitsSold) {
    return "You sold out. Try making a few more items next week.";
  }
  if (result.profit < 0) {
    return "You spent more than you earned. Try a lower cost plan or a small price bump.";
  }
  if (mood === "Happy") {
    return "Great week. Happy customers can help bring repeat sales.";
  }
  return "Nice effort. Small weekly changes can improve your results.";
}

function productWord(productName: string): string {
  const trimmed = productName.trim();
  if (!trimmed) return "item";
  const tokens = trimmed.split(/\s+/);
  const last = tokens[tokens.length - 1] ?? trimmed;
  return last.toLowerCase();
}

function buildDealOptions(productName: string, price: number): DealOption[] {
  const unitWord = productWord(productName);
  const bundlePrice = Math.max(1, Math.round((price * 2 - Math.max(1, price * 0.2)) * 4) / 4);
  const itemOff = Math.max(0.5, Math.min(2, Math.round(Math.max(0.5, price * 0.15) * 4) / 4));

  return [
    {
      id: "bundle",
      label: `Buy 2 for ${money(bundlePrice)}`,
      description: `A small bundle deal for your ${unitWord}s.`,
      demandBoost: 1.22,
      priceDrop: Math.max(0.5, price * 0.12),
      extraUnitCost: 0,
    },
    {
      id: "dollarOff",
      label: `${money(itemOff)} off each item`,
      description: "A simple discount that can attract more buyers.",
      demandBoost: 1.18,
      priceDrop: Math.min(itemOff, price * 0.25),
      extraUnitCost: 0,
    },
    {
      id: "freeExtra",
      label: `Free mini extra with each ${unitWord}`,
      description: "Adds value for buyers, but your cost goes up.",
      demandBoost: 1.15,
      priceDrop: 0,
      extraUnitCost: 0.3,
    },
  ];
}

function applyDemandVariance(
  computed: Computed,
  varianceFactor: number,
  weeklyFixed: number,
  cash: number
): Computed {
  const variedDemand = Math.max(0, Math.round(computed.finalDemand * varianceFactor));
  const unitsSold = Math.min(computed.supply, variedDemand);
  const unsold = computed.supply - unitsSold;

  const baseDealCost = Math.max(
    0,
    computed.totalCost - (computed.productionCost + computed.promotionCost + weeklyFixed)
  );
  const variedDealCost =
    computed.unitsSold > 0 ? baseDealCost * (unitsSold / computed.unitsSold) : 0;

  const totalCost = computed.productionCost + computed.promotionCost + weeklyFixed + variedDealCost;
  const revenue = unitsSold * computed.effectivePrice;
  const profit = revenue - totalCost;

  return {
    ...computed,
    finalDemand: variedDemand,
    unitsSold,
    unsold,
    totalCost,
    revenue,
    profit,
    projectedCash: cash + profit,
  };
}

function computeSatisfactionDelta(
  quality: StartingQuality,
  computed: Computed,
  promoted: boolean
): number {
  let delta = quality === "Standard" ? -4 : quality === "Premium" ? 1 : 5;
  if (computed.unitsSold >= computed.finalDemand && computed.finalDemand > 0) delta += 8;
  if (computed.finalDemand > computed.supply) delta -= 12;
  if (promoted) delta += 2;
  return delta;
}

function computeWeek(
  decisions: Decisions,
  sim: Pick<SimGameState, "cash" | "inventory" | "satisfaction">,
  event: RandomEvent,
  opts: { variableCostPerUnit: number; weeklyFixed: number; maxWeeklyUnits: number; originalPrice: number }
): Computed {
  const unitsToProduce = clamp(Math.round(decisions.unitsToProduce || 0), 0, opts.maxWeeklyUnits);
  const basePrice = Math.max(0, decisions.sellingPrice || 0);

  let promoFactor = 1;
  let promotionCost = 0;
  let dealPriceDrop = 0;
  let dealExtraUnitCost = 0;

  if (decisions.promotionType === "friends") {
    promoFactor = 1.08;
  } else if (decisions.promotionType === "posters") {
    promoFactor = 1.16;
    promotionCost = 5;
  } else if (decisions.promotionType === "social") {
    promoFactor = 1.26;
    promotionCost = 10;
  } else if (decisions.promotionType === "deal") {
    if (decisions.dealType === "bundle") {
      promoFactor = 1.22;
      dealPriceDrop = Math.max(0.5, basePrice * 0.12);
    } else if (decisions.dealType === "dollarOff") {
      promoFactor = 1.18;
      dealPriceDrop = Math.max(0.5, Math.min(2, Math.round(Math.max(0.5, basePrice * 0.15) * 4) / 4));
    } else if (decisions.dealType === "freeExtra") {
      promoFactor = 1.15;
      dealExtraUnitCost = opts.variableCostPerUnit * 0.3;
    }
  }

  const effectivePrice = Math.max(0, basePrice - dealPriceDrop);

  const priceFactor =
    opts.originalPrice > 0
      ? 1 - ((effectivePrice - opts.originalPrice) / opts.originalPrice) * 0.8
      : 1;
  const qualityFactor = QUALITY_DEMAND[decisions.quality];
  const satFactor = (sim.satisfaction / 100) * 0.3 + 0.7;

  const rawDemand =
    opts.maxWeeklyUnits *
    Math.max(0, priceFactor) *
    qualityFactor *
    promoFactor *
    satFactor *
    event.modifier;
  const finalDemand = isFinite(rawDemand) ? Math.max(0, Math.round(rawDemand)) : 0;

  const supply = unitsToProduce + sim.inventory;
  const unitsSold = Math.min(supply, finalDemand);
  const unsold = supply - unitsSold;

  const materialMult = QUALITY_COST_MULT[decisions.quality] * (event.materialCostModifier ?? 1);
  const productionCost = unitsToProduce * opts.variableCostPerUnit * materialMult;
  const dealCost = unitsSold * dealExtraUnitCost;
  const totalCost = productionCost + promotionCost + opts.weeklyFixed;
  const adjustedTotalCost = totalCost + dealCost;

  const revenue = unitsSold * effectivePrice;
  const profit = revenue - adjustedTotalCost;

  return {
    effectivePrice,
    finalDemand,
    supply,
    unitsSold,
    unsold,
    productionCost,
    promotionCost,
    totalCost: adjustedTotalCost,
    revenue,
    profit,
    projectedCash: sim.cash + profit,
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

type SectionKey = "production" | "price" | "quality" | "promotion";
type DecisionTheme = {
  accent: string;
  border: string;
  soft: string;
  label: string;
  muted: string;
};

const DECISION_THEMES: Record<SectionKey, DecisionTheme> = {
  production: {
    accent: "#5DB7C4",
    border: "#A9DDE3",
    soft: "#EAF7F9",
    label: "#86B2BA",
    muted: "#B0C8CC",
  },
  price: {
    accent: "#5E8FC7",
    border: "#BED5EE",
    soft: "#F1F6FD",
    label: "#8EA9CB",
    muted: "#B2C3DA",
  },
  quality: {
    accent: "#4E9B78",
    border: "#BFE2D2",
    soft: "#EFF9F4",
    label: "#7DAC99",
    muted: "#AFC9BD",
  },
  promotion: {
    accent: "#C47A5A",
    border: "#E8C8B8",
    soft: "#FCF3EE",
    label: "#BB9B8B",
    muted: "#D2BBB0",
  },
};
type IconKind =
  | "story"
  | "production"
  | "price"
  | "quality"
  | "promotion"
  | "moodHappy"
  | "moodOkay"
  | "moodWorried";

function SectionIcon({
  kind,
  color = "#1E6470",
  background = "#EAF7F9",
  borderColor = "#D5ECEF",
}: {
  kind: IconKind;
  color?: string;
  background?: string;
  borderColor?: string;
}) {
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border flex-shrink-0"
      style={{ background, borderColor }}
      aria-hidden="true"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {kind === "story" && (
          <>
            <path d="M5 4h10l4 4v12H5z" />
            <path d="M15 4v4h4" />
            <path d="M8 13h8" />
          </>
        )}
        {kind === "production" && (
          <>
            <path d="M3 8l9-5 9 5-9 5-9-5z" />
            <path d="M3 8v8l9 5 9-5V8" />
          </>
        )}
        {kind === "price" && (
          <>
            <path d="M3 12l7-7h7l4 4v7l-7 7-11-11z" />
            <circle cx="15.5" cy="8.5" r="1.2" />
          </>
        )}
        {kind === "quality" && (
          <path d="M12 3l2.8 5.6 6.2.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.2-.9L12 3z" />
        )}
        {kind === "promotion" && (
          <>
            <path d="M3 11l12-5v12l-12-5z" />
            <path d="M15 10h4" />
            <path d="M7 14l1.4 5" />
          </>
        )}
        {kind === "moodHappy" && (
          <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M8.5 13.5c.9 1.3 2.1 2 3.5 2s2.6-.7 3.5-2" />
            <path d="M9.5 10.2h.01M14.5 10.2h.01" />
          </>
        )}
        {kind === "moodOkay" && (
          <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M8.5 14h7" />
            <path d="M9.5 10.2h.01M14.5 10.2h.01" />
          </>
        )}
        {kind === "moodWorried" && (
          <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M8.5 15.2c.9-1.3 2.1-2 3.5-2s2.6.7 3.5 2" />
            <path d="M9.5 10.2h.01M14.5 10.2h.01" />
          </>
        )}
      </svg>
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ open, color }: { open: boolean; color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
    >
      <path d="M4 6L8 10L12 6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DecisionTile({
  icon,
  title,
  summary,
  isSet,
  isRequired,
  highlightMissing,
  isOpen,
  onToggle,
  theme,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  summary: string;
  isSet: boolean;
  isRequired: boolean;
  highlightMissing: boolean;
  isOpen: boolean;
  onToggle: () => void;
  theme: DecisionTheme;
  children: React.ReactNode;
}) {
  const isMissing = isRequired && highlightMissing && !isSet;

  return (
    <div
      className="rounded-lg bg-white overflow-hidden transition-all duration-200 transform-gpu hover:-translate-y-[1px]"
      style={{
        border: `1.5px solid ${isOpen ? theme.accent : isMissing ? "#F36C3D" : isSet ? theme.border : "#E0EFF1"}`,
        background: isOpen ? `linear-gradient(180deg, #ffffff 0%, ${theme.soft} 150%)` : "#ffffff",
        boxShadow: isOpen
          ? "rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px"
          : "rgba(23,23,23,0.06) 0px 3px 6px",
      }}
    >
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        {icon}
        <div className="flex-1 min-w-0">
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: isMissing ? "#F36C3D" : theme.label }}
          >
            {title}
            {isRequired && (
              <span style={{ color: isMissing ? "#F36C3D" : "#D0E8EC" }}> •</span>
            )}
          </p>
          <p className="text-sm font-semibold text-[#061b31] mt-0.5 truncate">{summary}</p>
        </div>

        {isSet && !isOpen && (
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: theme.accent }}
          >
            <CheckIcon />
          </span>
        )}
        {!isSet && (
          <span
            className="text-[10px] font-bold flex-shrink-0 whitespace-nowrap"
            style={{ color: isMissing ? "#F36C3D" : theme.muted }}
          >
            {isMissing ? "Required" : "Tap to set"}
          </span>
        )}

        <ChevronIcon open={isOpen} color={theme.label} />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="px-4 border-t border-[#E8F4F6] transition-[padding,opacity] duration-200"
            style={{ paddingBottom: isOpen ? "1rem" : "0", opacity: isOpen ? 1 : 0.25 }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function DecisionSlider({
  value,
  min,
  max,
  step,
  ariaLabel,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  ariaLabel: string;
  onChange: (value: number) => void;
}) {
  const safeMax = Math.max(max, min + step);
  const safeValue = clamp(value, min, safeMax);
  const pct = safeMax > min ? ((safeValue - min) / (safeMax - min)) * 100 : 0;

  return (
    <input
      type="range"
      className="priceit-range mt-2 w-full transition-[background,filter] duration-150 ease-out"
      min={min}
      max={safeMax}
      step={step}
      value={safeValue}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={ariaLabel}
      style={
        {
          "--range-accent": "#5DB7C4",
          background: `linear-gradient(90deg, #5DB7C4 0%, #5DB7C4 ${pct}%, #D8E4E6 ${pct}%, #D8E4E6 100%)`,
          transition: "background 160ms ease-out",
        } as CSSProperties
      }
    />
  );
}

function WeekResultModal({
  week,
  result,
  lesson,
  onNext,
}: {
  week: number;
  result: WeeklyResult;
  lesson: string;
  onNext: () => void;
}) {
  const positive = result.profit >= 0;
  const isLast = week >= TOTAL_WEEKS;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-[#E0EFF1] bg-white p-5 shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
        <p className="text-[11px] uppercase tracking-wider font-bold text-[#7B9EA3]">Week {result.week} recap</p>
        <h2 className="mt-1 text-2xl font-extrabold text-[#061b31]">{positive ? "Nice work!" : "Keep going!"}</h2>

        <div className="mt-3 rounded-2xl border border-[#A9DDE3] bg-[#F0FAFB] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#5DB7C4] flex items-center gap-1.5">
            <SectionIcon kind="story" />
            This week&apos;s story
          </p>
          <p className="text-sm font-bold text-[#061b31] mt-0.5">{cleanLabel(result.event.name)}</p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-[#E0EFF1] bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BBFC3]">Sold</p>
            <p className="text-sm font-extrabold text-[#061b31] mt-0.5">{result.unitsSold}</p>
          </div>
          <div className="rounded-xl border border-[#E0EFF1] bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BBFC3]">Profit</p>
            <p className="text-sm font-extrabold mt-0.5" style={{ color: positive ? "#16a34a" : "#dc2626" }}>
              {positive ? "+" : "-"}{money(result.profit)}
            </p>
          </div>
          <div className="rounded-xl border border-[#E0EFF1] bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BBFC3]">Cash</p>
            <p className="text-sm font-extrabold mt-0.5" style={{ color: result.endCash >= 0 ? "#5DB7C4" : "#dc2626" }}>
              ${result.endCash.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-[#E0EFF1] bg-[#F7F9FA] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#9BBFC3]">Lesson</p>
          <p className="text-sm text-[#5B7780] mt-0.5">{lesson}</p>
        </div>

        <div className="mt-4 flex justify-center">
          <ChronicleButton
            text={isLast ? "See Final Results" : "Next Week"}
            onClick={onNext}
            hoverColor="#4AA8B5"
            customBackground="#5DB7C4"
            customForeground="#ffffff"
            hoverForeground="#ffffff"
            width="220px"
            borderRadius="10px"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function SimulateGamePage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const { fixedCosts, variableCosts, pricing, simConfig, productInfo } = state;

  const savedSnapshot = useMemo(() => readSimSnapshot(), []);

  const hasCoreSetup =
    productInfo.productName.trim() !== "" &&
    Number(pricing.sellingPrice) > 0 &&
    Number(pricing.unitsPerMonth) > 0;
  const hasSimConfig =
    simConfig.startingCash !== "" &&
    Number(simConfig.startingCash) >= 50 &&
    simConfig.maxWeeklyUnits !== "" &&
    Number(simConfig.maxWeeklyUnits) >= 1;

  const canResumeSavedGame = savedSnapshot !== null;
  const shouldRedirectToSetup = !canResumeSavedGame && !hasCoreSetup;
  const shouldRedirectToSimSetup = !canResumeSavedGame && hasCoreSetup && !hasSimConfig;

  const variableCostPerUnit = canResumeSavedGame
    ? savedSnapshot.base.variableCostPerUnit
    : variableCosts.reduce((sum, item) => sum + variableCPP(item), 0);
  const weeklyFixed = canResumeSavedGame
    ? savedSnapshot.base.weeklyFixed
    : fixedCosts.reduce((sum, item) => sum + fixedMonthly(item), 0) / 4;
  const originalPrice = canResumeSavedGame
    ? savedSnapshot.base.originalPrice
    : Number(pricing.sellingPrice) || 0;
  const maxWeeklyUnits = canResumeSavedGame
    ? savedSnapshot.base.maxWeeklyUnits
    : Math.max(1, Number(simConfig.maxWeeklyUnits) || 5);
  const startingCash = canResumeSavedGame
    ? savedSnapshot.base.startingCash
    : Math.max(50, Number(simConfig.startingCash) || 200);
  const startingQuality = canResumeSavedGame
    ? savedSnapshot.base.startingQuality
    : simConfig.startingQuality;

  const productNameForAI = productInfo.productName || savedSnapshot?.base.productName || "your product";
  const productCategoryForAI = productInfo.category || savedSnapshot?.base.category || "General";
  const targetCustomerForAI = productInfo.targetCustomer || savedSnapshot?.base.targetCustomer || "kids and families";

  const computeOpts = useMemo(
    () => ({ variableCostPerUnit, weeklyFixed, maxWeeklyUnits, originalPrice }),
    [variableCostPerUnit, weeklyFixed, maxWeeklyUnits, originalPrice]
  );

  useEffect(() => {
    if (shouldRedirectToSetup) {
      navigate("/setup", {
        replace: true,
        state: { message: "Finish your setup first, then jump into the simulator!" },
      });
      return;
    }
    if (shouldRedirectToSimSetup) {
      navigate("/simulate", {
        replace: true,
        state: { message: "Pick your starting cash, weekly units, and quality first." },
      });
    }
  }, [shouldRedirectToSetup, shouldRedirectToSimSetup, navigate]);

  // ─── Game state ──────────────────────────────────────────────────────────────

  const [simState, setSimState] = useState<SimGameState>(() => ({
    ...(savedSnapshot?.simState ?? {
      week: 1,
      cash: startingCash,
      cashHistory: [],
      inventory: 0,
      satisfaction: 70,
      helpers: 0,
      wordOfMouthStack: 0,
      weeklyResults: [],
      gameStatus: "active" as const,
      currentEvent: pickRandomEvent(),
    }),
  }));

  const [decisions, setDecisions] = useState<Decisions>(() => {
    const saved = savedSnapshot?.decisions as (Decisions & { marketing?: string[] }) | undefined;
    const q = saved?.quality;
    const quality: StartingQuality =
      q === "Standard" || q === "Premium" || q === "Deluxe" ? q : startingQuality;
    const unitsToProduce = clamp(Math.round(Number(saved?.unitsToProduce ?? maxWeeklyUnits)), 0, maxWeeklyUnits);
    const sellingPrice = Math.max(0, Number(saved?.sellingPrice ?? originalPrice));
    const legacyPromoted = Array.isArray(saved?.marketing) && saved.marketing.includes("social");
    const savedPromotion = saved?.promotionType;
    const promotionType: PromotionType =
      savedPromotion === "friends" ||
      savedPromotion === "posters" ||
      savedPromotion === "social" ||
      savedPromotion === "deal" ||
      savedPromotion === "none"
        ? savedPromotion
        : legacyPromoted
          ? "social"
          : "none";
    const savedDeal = saved?.dealType;
    const dealType: DealType | null =
      savedDeal === "bundle" || savedDeal === "dollarOff" || savedDeal === "freeExtra"
        ? savedDeal
        : null;

    return {
      unitsToProduce,
      sellingPrice,
      quality,
      promotionType,
      dealType: promotionType === "deal" ? dealType ?? "bundle" : null,
      hireHelper: false,
    };
  });

  // ─── Dashboard UI state ──────────────────────────────────────────────────────

  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  // Initialize all three as touched since decisions always have valid defaults on load
  const [touched, setTouched] = useState(new Set<"production" | "price" | "quality">(["production", "price", "quality"]));
  const [showValidation, setShowValidation] = useState(false);
  const [priceDraft, setPriceDraft] = useState<string | null>(null);

  const [isRunningWeek, setIsRunningWeek] = useState(false);
  const [runFeedbackStep, setRunFeedbackStep] = useState(0);
  const [pendingWeek, setPendingWeek] = useState<PendingWeek | null>(null);
  const runTimerRef = useRef<number | null>(null);
  const runFeedbackTimersRef = useRef<number[]>([]);
  const prevProfitRef = useRef<number | null>(null);
  const [profitPulse, setProfitPulse] = useState(false);
  const [aiWarning, setAIWarning] = useState<AIWarning | null>(null);
  const [localAIProgress, setLocalAIProgress] = useState<AIProgress | null>(null);
  const aiRetryNonce = 0;

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const toggleSection = (section: SectionKey) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const markTouched = (section: "production" | "price" | "quality") => {
    setTouched((prev) => new Set([...prev, section]));
    if (showValidation) setShowValidation(false);
  };

  // Gate on actual decision values, not on user-interaction tracking
  const allRequiredSet = decisions.sellingPrice > 0 && decisions.unitsToProduce >= 0;

  const missingLabels = [
    decisions.unitsToProduce < 0 && "Production",
    decisions.sellingPrice <= 0 && "Price",
  ].filter(Boolean) as string[];

  // ─── Persistence ─────────────────────────────────────────────────────────────

  useEffect(() => {
    writeSimSnapshot({
      simState,
      decisions,
      base: {
        variableCostPerUnit,
        weeklyFixed,
        originalPrice,
        maxWeeklyUnits,
        startingCash,
        startingQuality,
        productName: productNameForAI,
        category: productCategoryForAI,
        targetCustomer: targetCustomerForAI,
      },
    });
  }, [
    simState,
    decisions,
    variableCostPerUnit,
    weeklyFixed,
    originalPrice,
    maxWeeklyUnits,
    startingCash,
    startingQuality,
    productNameForAI,
    productCategoryForAI,
    targetCustomerForAI,
  ]);

  // ─── AI event fetching ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 6000);

    async function fetchEvent() {
      try {
        const prompt = `You are generating one weekly event for a kid business simulation.
Product: ${productNameForAI} (${productCategoryForAI})
Customer: ${targetCustomerForAI}

Return JSON only in this exact format:
{"headline": "short headline, max 8 words", "description": "one short kid-friendly sentence", "modifier": <number between 0.7 and 1.5>, "modifierLabel": "short label like More customers or Fewer customers"}`;

        const fallback = simulationEventTemplate(simState.week, productNameForAI);
        const result = await generateAI({
          messages: [{ role: "user", content: prompt }],
          template: () => JSON.stringify(fallback),
          maxTokens: 120,
          temperature: 0.5,
          jsonMode: true,
          onProgress: setLocalAIProgress,
          signal: controller.signal,
        });
        if (cancelled) return;

        setAIWarning(result.warning ?? null);
        const json = extractJsonObject(result.text) ?? fallback;
        const modifier = Math.max(0.7, Math.min(1.5, Number(json.modifier) || 1));
        const aiEvent: RandomEvent = {
          id: `ai-week-${simState.week}`,
          name:
            cleanLabel(String(json.headline ?? "Something happened this week")) ||
            "Something happened this week",
          description: cleanLabel(String(json.description ?? "")),
          modifier,
          modifierLabel: cleanLabel(String(json.modifierLabel ?? "")),
        };

        setSimState((prev) =>
          prev.week === simState.week ? { ...prev, currentEvent: aiEvent } : prev
        );
      } catch {
        // keep fallback event
      } finally {
        if (!cancelled) setLocalAIProgress(null);
        window.clearTimeout(timeoutId);
      }
    }

    fetchEvent();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [simState.week, productNameForAI, productCategoryForAI, targetCustomerForAI, aiRetryNonce]);

  useEffect(() => {
    return () => {
      if (runTimerRef.current) window.clearTimeout(runTimerRef.current);
      runFeedbackTimersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  // ─── Preview computations ─────────────────────────────────────────────────────

  const projection = useMemo(
    () => computeWeek(decisions, simState, simState.currentEvent, computeOpts),
    [decisions, simState, computeOpts]
  );

  const promoted = decisions.promotionType !== "none";
  const satDelta = computeSatisfactionDelta(decisions.quality, projection, promoted);
  const projectedSat = clamp(simState.satisfaction + satDelta, 0, 100);
  const mood = moodFromScore(projectedSat);
  const storyVisual = useMemo(() => getStoryVisual(simState.currentEvent), [simState.currentEvent]);
  const eventHeadline = cleanLabel(simState.currentEvent.name) || "Something happened this week";
  const eventDescription = cleanLabel(simState.currentEvent.description);
  const variantIndex = Math.abs(
    Math.round(decisions.sellingPrice * 4) + decisions.unitsToProduce + simState.week * 3
  );

  const moodColor =
    mood === "Happy" ? "#16a34a" : mood === "Okay" ? "#b45309" : "#dc2626";
  const moodLabel = MOOD_COPY[mood][variantIndex % MOOD_COPY[mood].length];
  const moodIconKind: IconKind =
    mood === "Happy" ? "moodHappy" : mood === "Okay" ? "moodOkay" : "moodWorried";

  const profitColor =
    projection.profit >= 20
      ? "#16a34a"
      : projection.profit >= 0
        ? "#1E6470"
        : projection.profit >= -10
          ? "#b45309"
          : "#dc2626";

  const previewSuggestionOptions = (() => {
    if (projection.productionCost > simState.cash) {
      return [
        "Try making fewer items so you can afford this week.",
        "This plan costs too much right now. Lower production a little.",
      ];
    }
    if (projection.finalDemand > projection.supply) {
      return [
        "Try making a few more items.",
        "Demand looks strong. A few extra items could help.",
      ];
    }
    if (projection.profit < 0) {
      return decisions.sellingPrice < originalPrice
        ? [
            "A small price increase might help.",
            "Try raising the price a little to protect profit.",
          ]
        : [
            "Lowering your price might help.",
            "Try a small price drop to boost sales.",
          ];
    }
    if (projection.profit >= 20 && projectedSat >= 70) {
      return [
        "This looks like a great plan!",
        "Strong plan. You are in a good spot this week.",
      ];
    }
    return [
      "This plan looks solid for this week.",
      "Steady plan. Small tweaks can make it even better.",
    ];
  })();

  const previewSuggestion = previewSuggestionOptions[variantIndex % previewSuggestionOptions.length];

  const previewFlavorMessages = (() => {
    const messages: string[] = [];
    if (projection.unitsSold >= projection.supply && projection.supply > 0) {
      messages.push("You could sell out early this week.");
    }
    if (projection.unsold > 0) {
      messages.push("A few items may still be left by week end.");
    }
    if (decisions.promotionType !== "none") {
      messages.push("More people may hear about your product.");
    }
    if (projection.finalDemand > projection.unitsSold) {
      messages.push("Interest may be a bit higher than your supply.");
    }
    if (messages.length === 0) {
      messages.push("This week looks steady and predictable.");
    }
    return messages;
  })();
  const previewFlavor = previewFlavorMessages[variantIndex % previewFlavorMessages.length];

  const previewSuggestionColor =
    projection.productionCost > simState.cash
      ? "#dc2626"
      : projection.profit < 0
        ? "#b45309"
        : "#16a34a";

  useEffect(() => {
    if (prevProfitRef.current === null) {
      prevProfitRef.current = projection.profit;
      return;
    }
    if (Math.abs(prevProfitRef.current - projection.profit) < 0.01) return;
    prevProfitRef.current = projection.profit;
    setProfitPulse(true);
    const pulseTimer = window.setTimeout(() => setProfitPulse(false), 240);
    return () => window.clearTimeout(pulseTimer);
  }, [projection.profit]);

  const priceStep = 0.25;
  const estimatedCostPerItem = useMemo(() => {
    const fixedPerItemAtCap = weeklyFixed / Math.max(1, maxWeeklyUnits);
    return Math.max(0.25, variableCostPerUnit + fixedPerItemAtCap);
  }, [variableCostPerUnit, weeklyFixed, maxWeeklyUnits]);

  const priceMin = useMemo(
    () => Math.max(0.25, floorToStep(Math.max(estimatedCostPerItem * 0.4, originalPrice * 0.4), priceStep)),
    [estimatedCostPerItem, originalPrice]
  );

  const priceMax = useMemo(
    () =>
      Math.max(
        priceMin + priceStep,
        ceilToStep(Math.max(estimatedCostPerItem * 2, originalPrice * 2), priceStep)
      ),
    [estimatedCostPerItem, originalPrice, priceMin]
  );

  useEffect(() => {
    setDecisions((prev) => ({
      ...prev,
      sellingPrice: clamp(prev.sellingPrice, priceMin, priceMax),
    }));
  }, [priceMin, priceMax]);

  const dealOptions = useMemo(
    () => buildDealOptions(productNameForAI, decisions.sellingPrice),
    [productNameForAI, decisions.sellingPrice]
  );

  const selectedDeal =
    decisions.dealType
      ? dealOptions.find((option) => option.id === decisions.dealType) ?? dealOptions[0]
      : dealOptions[0];

  const promotionSummary = (() => {
    if (decisions.promotionType === "none") return "No promotion";
    if (decisions.promotionType === "friends") return "Tell friends (free)";
    if (decisions.promotionType === "posters") return "Posters this week (-$5)";
    if (decisions.promotionType === "social") return "Social post this week (-$10)";
    return selectedDeal ? `Deal: ${selectedDeal.label}` : "Run a deal";
  })();

  const canAfford = projection.productionCost <= simState.cash;

  // ─── Week actions ─────────────────────────────────────────────────────────────

  const handleRunWeek = () => {
    if (simState.gameStatus !== "active" || isRunningWeek) return;

    if (!allRequiredSet) {
      setShowValidation(true);
      return;
    }

    if (!canAfford) return;

    if (runTimerRef.current) window.clearTimeout(runTimerRef.current);
    runFeedbackTimersRef.current.forEach((id) => window.clearTimeout(id));
    runFeedbackTimersRef.current = [];

    setIsRunningWeek(true);
    setRunFeedbackStep(0);

    const baseComputed = computeWeek(decisions, simState, simState.currentEvent, computeOpts);
    const demandVariance = 0.9 + Math.random() * 0.2;
    const computed = applyDemandVariance(baseComputed, demandVariance, weeklyFixed, simState.cash);
    const nextSat = clamp(
      simState.satisfaction + computeSatisfactionDelta(decisions.quality, computed, promoted),
      0,
      100
    );

    const result: WeeklyResult = {
      week: simState.week,
      event: simState.currentEvent,
      unitsSold: computed.unitsSold,
      finalDemand: computed.finalDemand,
      revenue: computed.revenue,
      totalCost: computed.totalCost,
      profit: computed.profit,
      endCash: computed.projectedCash,
    };

    const lesson = lessonForWeek(result, moodFromScore(nextSat));

    const runDelay = 1000 + Math.floor(Math.random() * 500);
    const stepOne = window.setTimeout(() => setRunFeedbackStep(1), Math.round(runDelay * 0.34));
    const stepTwo = window.setTimeout(() => setRunFeedbackStep(2), Math.round(runDelay * 0.68));
    runFeedbackTimersRef.current = [stepOne, stepTwo];

    runTimerRef.current = window.setTimeout(() => {
      setPendingWeek({ result, newSat: nextSat, newInventory: computed.unsold, lesson });
      setIsRunningWeek(false);
      setRunFeedbackStep(0);
    }, runDelay);
  };

  const handleNextWeek = () => {
    if (!pendingWeek) return;
    const { result, newSat, newInventory } = pendingWeek;

    const newCash = result.endCash;
    const newHistory = [...simState.cashHistory, result.profit];

    if (newCash <= 0) {
      setSimState((prev) => ({
        ...prev,
        cash: newCash,
        cashHistory: newHistory,
        gameStatus: "gameover",
        weeklyResults: [...prev.weeklyResults, result],
      }));
      setPendingWeek(null);
      window.localStorage.removeItem(SIM_GAME_STORAGE_KEY);
      navigate("/simulate/gameover", {
        state: {
          week: simState.week,
          cash: newCash,
          cashHistory: newHistory,
          satisfaction: newSat,
          weeklyResults: [...simState.weeklyResults, result],
        },
      });
      return;
    }

    if (simState.week >= TOTAL_WEEKS) {
      setSimState((prev) => ({
        ...prev,
        cash: newCash,
        cashHistory: newHistory,
        gameStatus: "complete",
        weeklyResults: [...prev.weeklyResults, result],
      }));
      setPendingWeek(null);
      window.localStorage.removeItem(SIM_GAME_STORAGE_KEY);
      navigate("/simulate/results", {
        state: {
          week: simState.week,
          cash: newCash,
          cashHistory: newHistory,
          satisfaction: newSat,
          weeklyResults: [...simState.weeklyResults, result],
        },
      });
      return;
    }

    setSimState((prev) => ({
      ...prev,
      week: prev.week + 1,
      cash: newCash,
      cashHistory: newHistory,
      inventory: newInventory,
      satisfaction: newSat,
      weeklyResults: [...prev.weeklyResults, result],
      currentEvent: pickRandomEvent(),
    }));

    setDecisions((prev) => ({ ...prev, promotionType: "none", dealType: null, hireHelper: false }));
    setPendingWeek(null);
    setPriceDraft(null);

    // Carry forward touched state — production/price/quality values persist into the next week
    setTouched(new Set(["production", "price", "quality"] as const));
    setOpenSection(null);
    setShowValidation(false);
  };

  if (shouldRedirectToSetup || shouldRedirectToSimSetup) return null;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col priceit-fade-in"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)",
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#E0EFF1] bg-white/85 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate("/simulate")}
            className="min-h-11 px-3 text-[#5DB7C4] font-semibold text-sm hover:text-[#4AA8B5] transition-colors"
          >
            ← Back
          </button>

          <img src={logo} alt="PriceIt logo" className="h-8 w-auto" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#2B2B2B] bg-[#EAF7F9] px-2.5 py-1 rounded-full whitespace-nowrap">
              Week {simState.week}/{TOTAL_WEEKS}
            </span>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
              style={{
                background: simState.cash >= 0 ? "#EAF7F9" : "#FFF5F5",
                color: simState.cash >= 0 ? "#5DB7C4" : "#dc2626",
              }}
            >
              ${simState.cash.toFixed(2)}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 sm:px-6 py-5">
        <div className="w-full max-w-5xl mx-auto">
          {(localAIProgress || aiWarning) && (
            <div className="mb-3 rounded-xl border border-[#A9DDE3] bg-[#F0FAFB] px-4 py-3 text-sm text-[#2B2B2B]">
              <p className="font-semibold">
                {localAIProgress
                  ? `${Math.round(localAIProgress.progress * 100)}% — ${localAIProgress.text}`
                  : aiWarning?.message}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_296px] gap-4 items-start">

            {/* ── Left column: event + decision tiles ─────────────────────── */}
            <div className="flex flex-col gap-3">

              {/* This Week's Story */}
              <div
                className="rounded-lg px-4 py-4 shadow-[rgba(23,23,23,0.06)_0px_3px_6px] transition-all duration-200 transform-gpu hover:-translate-y-[1px]"
                style={{
                  border: `1.5px solid ${storyVisual.border}`,
                  background: storyVisual.background,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5DB7C4] flex items-center gap-1.5">
                      <SectionIcon
                        kind="story"
                        color={storyVisual.iconColor}
                        background={storyVisual.iconBackground}
                      />
                      This Week&apos;s Story
                    </p>
                    <p className="mt-1 text-base font-semibold text-[#061b31] leading-snug">
                      {eventHeadline}
                    </p>
                    <p className="mt-1 text-sm text-[#5B7780] leading-relaxed">
                      {eventDescription}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold text-[#1E6470] whitespace-nowrap"
                      style={{
                        background: storyVisual.chipBackground,
                        border: `1px solid ${storyVisual.chipBorder}`,
                      }}
                    >
                      {eventTag(simState.currentEvent)}
                    </span>
                    {simState.currentEvent.modifierLabel && (
                      <span
                        className="inline-flex items-center rounded-md border border-[#E0EFF1] bg-[#F7F9FA] px-2 py-0.5 text-[11px] font-bold text-[#7B9EA3] whitespace-nowrap"
                      >
                        {cleanLabel(simState.currentEvent.modifierLabel)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Production tile */}
              <DecisionTile
                icon={
                  <SectionIcon
                    kind="production"
                    color={DECISION_THEMES.production.accent}
                    background={DECISION_THEMES.production.soft}
                    borderColor={DECISION_THEMES.production.border}
                  />
                }
                title="Production"
                summary={
                  touched.has("production")
                    ? `${decisions.unitsToProduce} item${decisions.unitsToProduce !== 1 ? "s" : ""} this week`
                    : "How many will you make?"
                }
                isSet={touched.has("production")}
                isRequired
                highlightMissing={showValidation}
                isOpen={openSection === "production"}
                onToggle={() => toggleSection("production")}
                theme={DECISION_THEMES.production}
              >
                <div className="mt-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#061b31]">Items to make this week</p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={maxWeeklyUnits}
                        step={1}
                        value={decisions.unitsToProduce}
                        onChange={(e) => {
                          markTouched("production");
                          setDecisions((prev) => ({
                            ...prev,
                            unitsToProduce: clamp(Number(e.target.value) || 0, 0, maxWeeklyUnits),
                          }));
                        }}
                        onBlur={(e) =>
                          setDecisions((prev) => ({
                            ...prev,
                            unitsToProduce: clamp(Math.round(Number(e.target.value) || 0), 0, maxWeeklyUnits),
                          }))
                        }
                        className="w-20 border border-[#E0EFF1] focus:border-[#5DB7C4] rounded-md px-2.5 py-2 text-[#061b31] font-semibold bg-white outline-none text-sm"
                      />
                      <span className="text-xs font-semibold text-[#7B9EA3]">items</span>
                    </div>
                  </div>
                  <DecisionSlider
                    value={decisions.unitsToProduce}
                    min={0}
                    max={maxWeeklyUnits}
                    step={1}
                    ariaLabel="Units to produce"
                    onChange={(value) => {
                      markTouched("production");
                      setDecisions((prev) => ({
                        ...prev,
                        unitsToProduce: clamp(Math.round(value), 0, maxWeeklyUnits),
                      }));
                    }}
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-[#9BBFC3]">
                    <span>0</span>
                    <span>{maxWeeklyUnits} max</span>
                  </div>
                  {simState.inventory > 0 && (
                    <p className="mt-2 text-[11px] text-[#5B7780]">
                      You have {simState.inventory} unsold item{simState.inventory !== 1 ? "s" : ""} from last week too.
                    </p>
                  )}
                </div>
              </DecisionTile>

              {/* Price tile */}
              <DecisionTile
                icon={
                  <SectionIcon
                    kind="price"
                    color={DECISION_THEMES.price.accent}
                    background={DECISION_THEMES.price.soft}
                    borderColor={DECISION_THEMES.price.border}
                  />
                }
                title="Price"
                summary={
                  touched.has("price")
                    ? `$${decisions.sellingPrice.toFixed(2)} each`
                    : "What will you charge?"
                }
                isSet={touched.has("price")}
                isRequired
                highlightMissing={showValidation}
                isOpen={openSection === "price"}
                onToggle={() => toggleSection("price")}
                theme={DECISION_THEMES.price}
              >
                <div className="mt-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#061b31]">Selling price per item</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[#5DB7C4] font-semibold text-sm">$</span>
                      <input
                        type="number"
                        min={priceMin}
                        max={priceMax}
                        step={priceStep}
                        value={priceDraft !== null ? priceDraft : decisions.sellingPrice.toFixed(2)}
                        onChange={(e) => {
                          setPriceDraft(e.target.value);
                          markTouched("price");
                          const n = parseFloat(e.target.value);
                          if (isFinite(n) && n > 0) {
                            setDecisions((prev) => ({
                              ...prev,
                              sellingPrice: clamp(n, priceMin, priceMax),
                            }));
                          }
                        }}
                        onBlur={() => {
                          const n = priceDraft !== null ? parseFloat(priceDraft) : decisions.sellingPrice;
                          setDecisions((prev) => ({
                            ...prev,
                            sellingPrice: clamp(
                              roundToStep(isFinite(n) && n > 0 ? n : prev.sellingPrice, priceStep),
                              priceMin,
                              priceMax
                            ),
                          }));
                          setPriceDraft(null);
                        }}
                        className="w-20 border border-[#E0EFF1] focus:border-[#5DB7C4] rounded-md px-2.5 py-2 text-[#061b31] font-semibold bg-white outline-none text-sm"
                      />
                    </div>
                  </div>
                  <DecisionSlider
                    value={decisions.sellingPrice}
                    min={priceMin}
                    max={priceMax}
                    step={priceStep}
                    ariaLabel="Selling price"
                    onChange={(value) => {
                      markTouched("price");
                      setDecisions((prev) => ({
                        ...prev,
                        sellingPrice: clamp(roundToStep(value, priceStep), priceMin, priceMax),
                      }));
                    }}
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-[#9BBFC3]">
                    <span>${priceMin.toFixed(2)}</span>
                    <span>${priceMax.toFixed(2)}</span>
                  </div>
                </div>
              </DecisionTile>

              {/* Quality tile */}
              <DecisionTile
                icon={
                  <SectionIcon
                    kind="quality"
                    color={DECISION_THEMES.quality.accent}
                    background={DECISION_THEMES.quality.soft}
                    borderColor={DECISION_THEMES.quality.border}
                  />
                }
                title="Quality"
                summary={
                  touched.has("quality")
                    ? QUALITY_LABEL[decisions.quality]
                    : "Which quality level?"
                }
                isSet={touched.has("quality")}
                isRequired
                highlightMissing={showValidation}
                isOpen={openSection === "quality"}
                onToggle={() => toggleSection("quality")}
                theme={DECISION_THEMES.quality}
              >
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(["Standard", "Premium", "Deluxe"] as StartingQuality[]).map((quality) => {
                    const selected = decisions.quality === quality;
                    return (
                      <button
                        key={quality}
                        type="button"
                        onClick={() => {
                          markTouched("quality");
                          setDecisions((prev) => ({ ...prev, quality }));
                        }}
                        className="rounded-md border px-2 py-2.5 text-center transition-colors"
                        style={{
                          borderColor: selected ? "#5DB7C4" : "#E0EFF1",
                          background: selected ? "#EAF7F9" : "#ffffff",
                        }}
                      >
                        <p
                          className="text-sm font-semibold"
                          style={{ color: selected ? "#1E6470" : "#2B2B2B" }}
                        >
                          {QUALITY_LABEL[quality]}
                        </p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: selected ? "#1E6470" : "#7B9EA3" }}
                        >
                          {QUALITY_NOTE[quality]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </DecisionTile>

              {/* Promotion tile (optional) */}
              <DecisionTile
                icon={
                  <SectionIcon
                    kind="promotion"
                    color={DECISION_THEMES.promotion.accent}
                    background={DECISION_THEMES.promotion.soft}
                    borderColor={DECISION_THEMES.promotion.border}
                  />
                }
                title="Promotion"
                summary={promotionSummary}
                isSet={false}
                isRequired={false}
                highlightMissing={false}
                isOpen={openSection === "promotion"}
                onToggle={() => toggleSection("promotion")}
                theme={DECISION_THEMES.promotion}
              >
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-[#7B9EA3]">
                    Pick one way to spread the word this week.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        id: "none" as PromotionType,
                        title: "No promotion",
                        note: "Save your money this week.",
                      },
                      {
                        id: "friends" as PromotionType,
                        title: "Tell Friends (Free)",
                        note: "Small boost in demand.",
                      },
                      {
                        id: "posters" as PromotionType,
                        title: "Put Up Posters ($5)",
                        note: "Medium demand boost.",
                      },
                      {
                        id: "social" as PromotionType,
                        title: "Post on Social Media ($10)",
                        note: "Biggest reach this week.",
                      },
                      {
                        id: "deal" as PromotionType,
                        title: "Run a Deal (Special)",
                        note: "More buyers, lower profit per item.",
                      },
                    ].map((option) => {
                      const selected = decisions.promotionType === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setDecisions((prev) => ({
                              ...prev,
                              promotionType: option.id,
                              dealType:
                                option.id === "deal"
                                  ? prev.dealType ?? dealOptions[0].id
                                  : null,
                            }))
                          }
                          className="rounded-md border px-3 py-2 text-left transition-colors"
                          style={{
                            borderColor: selected ? "#5DB7C4" : "#E0EFF1",
                            background: selected ? "#EAF7F9" : "#ffffff",
                          }}
                        >
                          <p
                            className="text-xs font-semibold"
                            style={{ color: selected ? "#1E6470" : "#061b31" }}
                          >
                            {option.title}
                          </p>
                          <p className="text-[10px] mt-0.5 text-[#7B9EA3]">{option.note}</p>
                        </button>
                      );
                    })}
                  </div>

                  {decisions.promotionType === "deal" && (
                    <div className="rounded-md border border-[#A9DDE3] bg-[#F0FAFB] p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#5DB7C4]">
                        Choose a deal
                      </p>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {dealOptions.map((deal) => {
                          const selected = decisions.dealType === deal.id;
                          return (
                            <button
                              key={deal.id}
                              type="button"
                              onClick={() =>
                                setDecisions((prev) => ({
                                  ...prev,
                                  promotionType: "deal",
                                  dealType: deal.id,
                                }))
                              }
                              className="rounded-md border px-2.5 py-2 text-left transition-colors"
                              style={{
                                borderColor: selected ? "#5DB7C4" : "#D3ECEF",
                                background: selected ? "#EAF7F9" : "#ffffff",
                              }}
                            >
                              <p
                                className="text-[11px] font-semibold leading-tight"
                                style={{ color: selected ? "#1E6470" : "#061b31" }}
                              >
                                {deal.label}
                              </p>
                              <p className="text-[10px] mt-1 text-[#7B9EA3] leading-tight">
                                {deal.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </DecisionTile>
            </div>

            {/* ── Right column: preview + run ──────────────────────────────── */}
            <div className="flex flex-col gap-3 lg:sticky lg:top-[72px]">

              {/* Preview card */}
              <div
                className="rounded-lg bg-white px-4 py-4 transition-all duration-200 transform-gpu hover:-translate-y-[1px]"
                style={{
                  border: "1.5px solid #5DB7C4",
                  boxShadow: "rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px",
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5DB7C4]">
                  This week, you might earn
                </p>
                <p
                  className="mt-1 text-[2rem] leading-none font-semibold transition-transform duration-200"
                  style={{ color: profitColor, transform: profitPulse ? "scale(1.03)" : "scale(1)" }}
                >
                  {projection.profit >= 0 ? "+" : "-"}{money(projection.profit)}
                </p>
                <p className="mt-0.5 text-xs text-[#5B7780]">
                  {projection.profit >= 0 ? "estimated profit" : "estimated loss"}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-[#E0EFF1] bg-[#F7F9FA] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BBFC3]">Might sell</p>
                    <p className="text-sm font-semibold text-[#061b31] mt-0.5">
                      {projection.unitsSold} item{projection.unitsSold !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="rounded-md border border-[#E0EFF1] bg-[#F7F9FA] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BBFC3]">
                      Customer mood
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <SectionIcon kind={moodIconKind} color={moodColor} background="#ffffff" />
                      <p className="text-sm font-semibold" style={{ color: moodColor }}>
                        {moodLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 rounded-md border border-[#E0EFF1] bg-white px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BBFC3]">Suggestion</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: previewSuggestionColor }}>
                    {previewSuggestion}
                  </p>
                </div>

                <div className="mt-2 rounded-md border border-[#E0EFF1] bg-[#F7F9FA] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BBFC3]">Week note</p>
                  <p className="text-xs text-[#5B7780] mt-0.5">{previewFlavor}</p>
                </div>
              </div>

              {/* Validation warning */}
              {showValidation && !allRequiredSet && (
                <div className="rounded-lg border border-[#F36C3D]/40 bg-[#FFF5F0] px-4 py-3">
                  <p className="text-sm font-semibold text-[#C0441D]">
                    Almost ready!
                  </p>
                  <p className="text-xs text-[#9B4520] mt-0.5">
                    Still need to set:{" "}
                    {missingLabels.map((label, i) => (
                      <span key={label}>
                        <strong>{label}</strong>
                        {i < missingLabels.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {/* Can't afford warning */}
              {allRequiredSet && !canAfford && (
                <div className="rounded-lg border border-[#F36C3D]/40 bg-[#FFF5F0] px-4 py-3">
                  <p className="text-xs font-semibold text-[#C0441D]">
                    You can't afford to make that many. Try reducing your production count.
                  </p>
                </div>
              )}

              {/* Run Week button */}
              <ChronicleButton
                text={isRunningWeek ? "Running this week..." : "Run This Week →"}
                onClick={handleRunWeek}
                hoverColor="#4AA8B5"
                customBackground={allRequiredSet && canAfford ? "#5DB7C4" : "#5DB7C4"}
                customForeground="#ffffff"
                hoverForeground="#ffffff"
                width="100%"
                borderRadius="8px"
                disabled={isRunningWeek}
              />

              {isRunningWeek && (
                <div className="rounded-lg border border-[#A9DDE3] bg-[#F0FAFB] px-4 py-2.5">
                  <p className="text-sm font-semibold text-[#1E6470] transition-opacity duration-200">
                    {RUN_FEEDBACK_STEPS[runFeedbackStep]}
                  </p>
                </div>
              )}

              {/* Completion status */}
              {!allRequiredSet && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {(["production", "price", "quality"] as const).map((key) => {
                    const isDone = touched.has(key);
                    const labels = { production: "Make", price: "Price", quality: "Quality" };
                    return (
                      <span
                        key={key}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: isDone ? "#EAF7F9" : showValidation ? "#FFF5F0" : "#F7F9FA",
                          color: isDone ? "#1E6470" : showValidation ? "#C0441D" : "#9BBFC3",
                          border: `1px solid ${isDone ? "#A9DDE3" : showValidation ? "#F36C3D40" : "#E0EFF1"}`,
                        }}
                      >
                        {isDone ? "✓ " : ""}{labels[key]}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Progress bar */}
              <div className="rounded-lg border border-[#E0EFF1] bg-white px-4 py-3 shadow-[rgba(23,23,23,0.06)_0px_3px_6px]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BBFC3]">
                    12-week run
                  </p>
                  <p className="text-xs font-semibold text-[#5DB7C4]">
                    {TOTAL_WEEKS - simState.week + 1} left
                  </p>
                </div>
                <div className="grid grid-cols-12 gap-1">
                  {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
                    const weekNum = i + 1;
                    const result = simState.weeklyResults[i];
                    const isDone = weekNum < simState.week;
                    const isActive = weekNum === simState.week;
                    return (
                      <div
                        key={weekNum}
                        className="h-2 rounded-full"
                        style={{
                          background: isActive
                            ? "#5DB7C4"
                            : isDone
                              ? result && result.profit >= 0
                                ? "#86efac"
                                : "#fecaca"
                              : "#E8ECEE",
                        }}
                        title={
                          isDone
                            ? `Week ${weekNum}: ${result && result.profit >= 0 ? "+" : ""}$${(result?.profit ?? 0).toFixed(2)}`
                            : `Week ${weekNum}`
                        }
                      />
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <div className="px-4 sm:px-6 pb-4 -mt-4">
        <div className="w-full max-w-5xl mx-auto flex justify-center">
          <img
            src={stand}
            alt="Stand"
            className="w-full max-w-[640px] h-auto select-none pointer-events-none"
          />
        </div>
      </div>

      {pendingWeek && (
        <WeekResultModal
          week={simState.week}
          result={pendingWeek.result}
          lesson={pendingWeek.lesson}
          onNext={handleNextWeek}
        />
      )}
    </div>
  );
}

import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import type { StartingQuality, FixedCostItem, VariableCostItem } from "@/context/AppStateContext";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import logo from "../../logo.png";

// ─── cost helpers (same as other pages) ──────────────────────────────────────

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

// ─── types ────────────────────────────────────────────────────────────────────

type MarketingKey = "flyers" | "social" | "wom" | "sale";

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
  marketing: MarketingKey[];
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

// ─── constants ────────────────────────────────────────────────────────────────

const TOTAL_WEEKS = 12;
const SIM_GAME_STORAGE_KEY = "priceit_sim_game_v1";

const RANDOM_EVENTS: RandomEvent[] = [
  { id: "fair",    name: "School fair nearby this weekend! 🎪", description: "A big crowd is coming to your area!", modifier: 1.4 },
  { id: "rain",    name: "Rainy week, fewer shoppers ☔",        description: "People are staying home this week.", modifier: 0.8 },
  { id: "viral",   name: "Your product got shared online! 📱",   description: "Someone posted about it and everyone wants one!", modifier: 1.3 },
  { id: "comp",    name: "A competitor launched nearby 😬",       description: "Someone else started selling something similar.", modifier: 0.75 },
  { id: "news",    name: "Local news featured kid entrepreneurs! 📰", description: "Everyone loves a good kid business story!", modifier: 1.2 },
  { id: "holiday", name: "Holiday weekend coming up 🎉",          description: "People are in a spending mood!", modifier: 1.35 },
  { id: "slow",    name: "Slow week, nothing special 😐",         description: "Just a regular week. Stay the course!", modifier: 1.0 },
  { id: "supply",  name: "Supply costs spiked this week 📦",      description: "Materials cost more than usual.", modifier: 0.9, materialCostModifier: 1.2 },
  { id: "loyal",   name: "Your regular customers came back 💛",    description: "Your biggest fans showed up for you!", modifier: 1.15 },
  { id: "sunny",   name: "Weather was perfect for shopping ☀️",   description: "A beautiful day brought out the crowds.", modifier: 1.1 },
];

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

// ─── OpenRouter helper ────────────────────────────────────────────────────────

async function callOpenRouter(
  prompt: string,
  maxTokens: number,
  _timeoutMs: number,
  signal?: AbortSignal
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
    signal,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}

function extractJson(text: string): Record<string, unknown> {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (!m) throw new Error("No JSON");
  return JSON.parse(m[1]) as Record<string, unknown>;
}

const QUALITY_DEMAND: Record<StartingQuality, number> = {
  Standard: 0.85,
  Premium: 1.0,
  Deluxe: 1.2,
};
const QUALITY_COST_MULT: Record<StartingQuality, number> = {
  Standard: 1.0,
  Premium: 1.3,
  Deluxe: 1.6,
};
const QUALITY_SAT_DELTA: Record<StartingQuality, number> = {
  Standard: -5,
  Premium: 0,
  Deluxe: 5,
};

const MARKETING_META: Record<MarketingKey, { label: string; cost: number; emoji: string; note: string }> = {
  flyers: { label: "Put up flyers",       cost: 5,  emoji: "📌", note: "+10% demand · costs $5" },
  social: { label: "Post on social media", cost: 15, emoji: "📱", note: "+20% demand · costs $15" },
  wom:    { label: "Word of mouth",        cost: 0,  emoji: "💬", note: "Cumulative +5%/week · free" },
  sale:   { label: "Run a sale",           cost: 0,  emoji: "🏷️", note: "+30% demand · −15% price" },
};

// ─── core simulation (pure) ───────────────────────────────────────────────────

interface Computed {
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

function computeWeek(
  d: Decisions,
  s: Pick<SimGameState, "cash" | "inventory" | "satisfaction" | "wordOfMouthStack">,
  event: RandomEvent,
  opts: { variableCostPerUnit: number; weeklyFixed: number; originalPrice: number; maxWeeklyUnits: number }
): Computed {
  const { variableCostPerUnit, weeklyFixed, originalPrice, maxWeeklyUnits } = opts;

  const effectiveMax = d.hireHelper ? Math.floor(maxWeeklyUnits * 1.5) : maxWeeklyUnits;
  const unitsToProduce = Math.min(Math.max(0, d.unitsToProduce || 0), effectiveMax);

  const saleOn = d.marketing.includes("sale");
  const effectivePrice = saleOn ? d.sellingPrice * 0.85 : d.sellingPrice;

  const priceFactor = originalPrice > 0 ? 1 - ((effectivePrice - originalPrice) / originalPrice) * 0.8 : 1;
  const qualityFactor = QUALITY_DEMAND[d.quality];

  let mktFactor = 1.0;
  if (d.marketing.includes("flyers")) mktFactor += 0.10;
  if (d.marketing.includes("social")) mktFactor += 0.20;
  if (d.marketing.includes("wom"))    mktFactor += (s.wordOfMouthStack + 1) * 0.05;
  if (saleOn)                          mktFactor += 0.30;

  const satFactor = (s.satisfaction / 100) * 0.3 + 0.7;

  const finalDemand = Math.max(0, Math.round(
    maxWeeklyUnits * Math.max(0, priceFactor) * qualityFactor * mktFactor * satFactor * event.modifier
  ));

  const supply = unitsToProduce + s.inventory;
  const unitsSold = Math.min(supply, finalDemand);
  const unsold = supply - unitsSold;

  const matMult = QUALITY_COST_MULT[d.quality] * (event.materialCostModifier ?? 1);
  const productionCost = unitsToProduce * variableCostPerUnit * matMult;

  let marketingCost = 0;
  if (d.marketing.includes("flyers")) marketingCost += 5;
  if (d.marketing.includes("social")) marketingCost += 15;
  const helperCost = d.hireHelper ? 20 : 0;
  const totalCost = productionCost + marketingCost + helperCost + weeklyFixed;

  const revenue = unitsSold * effectivePrice;
  const profit = revenue - totalCost;

  return {
    effectiveMax, effectivePrice, finalDemand, supply,
    unitsSold, unsold, productionCost, marketingCost, helperCost,
    totalCost, revenue, profit, projectedCash: s.cash + profit,
  };
}

// ─── tiny helpers ─────────────────────────────────────────────────────────────

const fd = (n: number) => "$" + Math.abs(n).toFixed(2);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ─── sub-components ───────────────────────────────────────────────────────────

function EventCard({ event }: { event: RandomEvent }) {
  const good = event.modifier >= 1.0;
  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-start gap-3"
      style={{ background: good ? "#EAF7F9" : "#FFF5F0", border: `1.5px solid ${good ? "#A9DDE3" : "#FCCBB0"}` }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: good ? "#5DB7C4" : "#F36C3D" }}>
          This week's event
        </p>
        <p className="font-extrabold text-sm text-[#2B2B2B] leading-snug">{event.name}</p>
        <p className="text-xs text-[#7B9EA3] mt-0.5">{event.description}</p>
        {event.modifierLabel && (
          <span
            className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: good ? "#A9DDE3" : "#FCCBB0", color: good ? "#1E6470" : "#9A3412" }}
          >
            {event.modifierLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function SatisfactionBar({ score }: { score: number }) {
  const color = score >= 61 ? "#22c55e" : score >= 31 ? "#f59e0b" : "#ef4444";
  const label = score >= 61 ? "Customers love you! 😊" : score >= 31 ? "Pretty happy 😐" : "Not happy 😟";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider">Customer Satisfaction</span>
        <span className="text-xs font-bold" style={{ color }}>{score}/100 · {label}</span>
      </div>
      <div className="h-3 rounded-full bg-[#E0EFF1] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}

function WeekHistoryBar({ history }: { history: number[] }) {
  const max = Math.max(...history.map(Math.abs), 1);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider">Cash History (12 weeks)</span>
      <div className="flex gap-1 items-end h-10">
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
          const profit = history[i];
          const done = i < history.length;
          const positive = (profit ?? 0) >= 0;
          const pct = done ? Math.max(8, (Math.abs(profit) / max) * 100) : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 h-full">
              {done ? (
                <div
                  className="w-full rounded-sm"
                  style={{ height: `${pct}%`, background: positive ? "#22c55e" : "#ef4444", minHeight: 4 }}
                  title={`Week ${i + 1}: ${positive ? "+" : "-"}${fd(profit)}`}
                />
              ) : (
                <div className="w-full rounded-sm border border-dashed border-[#D1D5DB] h-1" />
              )}
              <span className="text-[8px] text-[#C8D8DC] font-bold">{i + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryModal({
  result,
  week,
  onNext,
  tip,
}: {
  result: WeeklyResult;
  week: number;
  onNext: () => void;
  tip: string | null;
}) {
  const pos = result.profit >= 0;
  const stockout = result.finalDemand > result.unitsSold && result.finalDemand > 0;
  const lastWeek = week === TOTAL_WEEKS;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        style={{ border: `2px solid ${pos ? "#86efac" : "#FCCBB0"}` }}
      >
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">{pos ? "🎉" : "💪"}</div>
          <h2 className="text-xl font-extrabold text-[#2B2B2B]">
            {pos ? "Great week!" : "Tough week!"}
          </h2>
          <p className="text-xs text-[#9BBFC3] mt-1">Week {result.week} complete</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: "Units Sold",  val: `${result.unitsSold} / ${result.finalDemand}`,          color: "#2B2B2B" },
            { label: "Revenue",     val: `+${fd(result.revenue)}`,                                color: "#16a34a" },
            { label: "Costs",       val: `-${fd(result.totalCost)}`,                              color: "#F36C3D" },
            { label: "Profit",      val: `${result.profit >= 0 ? "+" : "-"}${fd(result.profit)}`, color: pos ? "#16a34a" : "#ef4444" },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-[#F7F9FA] rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-[#9BBFC3] uppercase tracking-wider">{label}</p>
              <p className="font-extrabold text-sm mt-0.5" style={{ color }}>{val}</p>
            </div>
          ))}
        </div>

        {stockout && (
          <div className="bg-[#FFF5F0] border border-[#FCCBB0] rounded-xl px-3 py-2 mb-4 text-xs text-[#F36C3D] font-semibold text-center">
            ⚠️ You ran out of stock! {result.finalDemand - result.unitsSold} customers left empty-handed.
          </div>
        )}

        <div
          className="rounded-xl px-4 py-3 text-center mb-4"
          style={{ background: result.endCash >= 0 ? "#EAF7F9" : "#FFF5F0" }}
        >
          <p className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider">Cash Balance</p>
          <p className="text-2xl font-extrabold" style={{ color: result.endCash >= 0 ? "#5DB7C4" : "#ef4444" }}>
            ${result.endCash.toFixed(2)}
          </p>
        </div>

        {tip && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2">
            <span className="text-base flex-shrink-0 mt-0.5">💡</span>
            <p className="text-xs text-[#78716C] font-semibold leading-relaxed">{tip}</p>
          </div>
        )}

        <div className="flex justify-center">
          <ChronicleButton
            text={lastWeek ? "See Final Results →" : "Next Week →"}
            onClick={onNext}
            hoverColor="#F36C3D"
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

// ─── page ─────────────────────────────────────────────────────────────────────

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

  // ── derived constants (stable for whole game) ──────────────────────────
  const variableCostPerUnit = canResumeSavedGame
    ? savedSnapshot.base.variableCostPerUnit
    : variableCosts.reduce((s, i) => s + variableCPP(i), 0);
  const weeklyFixed = canResumeSavedGame
    ? savedSnapshot.base.weeklyFixed
    : fixedCosts.reduce((s, i) => s + fixedMonthly(i), 0) / 4;
  const originalPrice = canResumeSavedGame
    ? savedSnapshot.base.originalPrice
    : Number(pricing.sellingPrice) || 0;
  const maxWeeklyUnits = canResumeSavedGame
    ? savedSnapshot.base.maxWeeklyUnits
    : Math.max(1, Number(simConfig.maxWeeklyUnits) || 5);
  const startingCash = canResumeSavedGame
    ? savedSnapshot.base.startingCash
    : Math.max(50, Number(simConfig.startingCash) || 200);
  const productNameForAI = productInfo.productName || savedSnapshot?.base.productName || "your product";
  const productCategoryForAI = productInfo.category || savedSnapshot?.base.category || "General";
  const targetCustomerForAI = productInfo.targetCustomer || savedSnapshot?.base.targetCustomer || "kids and families";
  const startingQuality = canResumeSavedGame
    ? savedSnapshot.base.startingQuality
    : simConfig.startingQuality;

  const opts = { variableCostPerUnit, weeklyFixed, originalPrice, maxWeeklyUnits };

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

  if (shouldRedirectToSetup || shouldRedirectToSimSetup) {
    return null;
  }

  // ── game state ────────────────────────────────────────────────────────
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

  // ── weekly decisions ──────────────────────────────────────────────────
  const [decisions, setDecisions] = useState<Decisions>(() => ({
    ...(savedSnapshot?.decisions ?? {
      unitsToProduce: maxWeeklyUnits,
      sellingPrice: originalPrice,
      quality: startingQuality,
      marketing: [],
      hireHelper: false,
    }),
  }));
  const [isStartingWeek, setIsStartingWeek] = useState(false);

  // ── AI: weekly tip ────────────────────────────────────────────────────
  const [weeklyTip, setWeeklyTip] = useState<string | null>(null);
  const tipAbortRef = useRef<AbortController | null>(null);
  const startWeekTimerRef = useRef<number | null>(null);

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

  // ── AI: event generation (fires once per week number change) ──────────
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    async function fetchEvent() {
      try {
        const prompt = `You are generating a random business event for a kids business simulation game.
The kid is selling: ${productNameForAI} (${productCategoryForAI})
Their target customer is: ${targetCustomerForAI}

Generate one realistic random event that could affect their sales this week.
Return JSON only in this exact format:
{"headline": "short headline with an emoji, max 8 words", "description": "one sentence explaining what happened, kid-friendly", "modifier": <number between 0.7 and 1.5>, "modifierLabel": "e.g. Demand up 30% or Demand down 20%"}

Make it specific to their product, not generic. Be creative and fun.`;

        const text = await callOpenRouter(prompt, 120, 6000, controller.signal);
        clearTimeout(timer);
        if (cancelled) return;
        const json = extractJson(text);
        const mod = Math.max(0.7, Math.min(1.5, Number(json.modifier) || 1.0));
        const aiEvent: RandomEvent = {
          id: `ai-week-${simState.week}`,
          name: String(json.headline ?? "Something happened this week"),
          description: String(json.description ?? ""),
          modifier: mod,
          modifierLabel: String(json.modifierLabel ?? ""),
        };
        setSimState(prev =>
          prev.week === simState.week ? { ...prev, currentEvent: aiEvent } : prev
        );
      } catch {
        clearTimeout(timer);
        // Silently keep the fallback hardcoded event
      }
    }

    fetchEvent();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [simState.week, productNameForAI, productCategoryForAI, targetCustomerForAI]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── modal ─────────────────────────────────────────────────────────────
  const [pendingResult, setPendingResult] = useState<{
    result: WeeklyResult;
    newSat: number;
    newWomStack: number;
    newInventory: number;
  } | null>(null);

  // ── live projections (updates as decisions change) ────────────────────
  const proj = useMemo(
    () => computeWeek(decisions, simState, simState.currentEvent, opts),
    [decisions, simState, opts] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const effectiveMax = decisions.hireHelper ? Math.floor(maxWeeklyUnits * 1.5) : maxWeeklyUnits;
  const canStart =
    simState.gameStatus === "active" &&
    proj.productionCost <= simState.cash &&
    !isStartingWeek;

  // ── decision handlers ─────────────────────────────────────────────────
  const toggleMarketing = (key: MarketingKey) => {
    setDecisions(prev => {
      const sel = prev.marketing;
      if (sel.includes(key)) return { ...prev, marketing: sel.filter(k => k !== key) };
      if (sel.length >= 2) return prev;
      return { ...prev, marketing: [...sel, key] };
    });
  };

  const toggleHelper = () => {
    setDecisions(prev => {
      const newHelper = !prev.hireHelper;
      const newMax = newHelper ? Math.floor(maxWeeklyUnits * 1.5) : maxWeeklyUnits;
      return { ...prev, hireHelper: newHelper, unitsToProduce: Math.min(prev.unitsToProduce, newMax) };
    });
  };

  // ── start week ────────────────────────────────────────────────────────
  const handleStartWeek = () => {
    if (!canStart) return;
    setIsStartingWeek(true);

    const c = computeWeek(decisions, simState, simState.currentEvent, opts);

    // Satisfaction delta
    let satDelta = QUALITY_SAT_DELTA[decisions.quality];
    if (c.unitsSold >= c.finalDemand && c.finalDemand > 0) satDelta += 10;
    if (c.finalDemand > c.supply) satDelta -= 15;
    if (decisions.marketing.includes("sale")) satDelta += 5;
    const newSat = clamp(simState.satisfaction + satDelta, 0, 100);

    const newWomStack = decisions.marketing.includes("wom") ? simState.wordOfMouthStack + 1 : 0;

    const result: WeeklyResult = {
      week: simState.week,
      event: simState.currentEvent,
      unitsSold: c.unitsSold,
      finalDemand: c.finalDemand,
      revenue: c.revenue,
      totalCost: c.totalCost,
      profit: c.profit,
      endCash: c.projectedCash,
    };

    if (startWeekTimerRef.current) {
      window.clearTimeout(startWeekTimerRef.current);
    }
    startWeekTimerRef.current = window.setTimeout(() => {
      setPendingResult({ result, newSat, newWomStack, newInventory: c.unsold });
      setIsStartingWeek(false);

      // Kick off AI tip — non-blocking, 3s hard timeout
      tipAbortRef.current?.abort();
      const tipController = new AbortController();
      tipAbortRef.current = tipController;
      setWeeklyTip(null);
      window.setTimeout(() => tipController.abort(), 3000);

      const tipPrompt = `You are a friendly business coach for kids aged 8-12.
Based on these weekly results, give exactly one short encouraging tip (max 20 words) that helps them do better next week.
Be specific to the numbers, not generic.

Product: ${productNameForAI}
Week: ${simState.week}
Units produced: ${decisions.unitsToProduce}
Units sold: ${c.unitsSold}
Revenue: $${c.revenue.toFixed(2)}
Profit: $${c.profit.toFixed(2)}
Customer satisfaction: ${newSat}/100
Marketing actions used: ${decisions.marketing.join(", ") || "none"}`;

      callOpenRouter(tipPrompt, 60, 3000, tipController.signal)
        .then(text => {
          if (!tipController.signal.aborted) {
            setWeeklyTip(text.trim().replace(/^["']|["']$/g, ""));
          }
        })
        .catch(() => {/* silently skip */});
    }, 450);
  };

  // ── next week (after modal) ───────────────────────────────────────────
  const handleNextWeek = () => {
    if (!pendingResult) return;
    tipAbortRef.current?.abort();
    setWeeklyTip(null);
    const { result, newSat, newWomStack, newInventory } = pendingResult;

    const newCash = result.endCash;
    const newWeek = simState.week + 1;

    const newHistory = [...simState.cashHistory, result.profit];

    // Check end conditions
    if (newCash <= 0) {
      setSimState(prev => ({
        ...prev,
        cash: newCash,
        cashHistory: newHistory,
        gameStatus: "gameover",
        weeklyResults: [...prev.weeklyResults, result],
      }));
      setPendingResult(null);
      window.localStorage.removeItem(SIM_GAME_STORAGE_KEY);
      navigate("/simulate/gameover", { state: {
        week: simState.week, cash: newCash, cashHistory: newHistory,
        satisfaction: newSat, weeklyResults: [...simState.weeklyResults, result],
      }});
      return;
    }

    if (simState.week >= TOTAL_WEEKS) {
      setSimState(prev => ({
        ...prev,
        cash: newCash, cashHistory: newHistory, gameStatus: "complete",
        weeklyResults: [...prev.weeklyResults, result],
      }));
      setPendingResult(null);
      window.localStorage.removeItem(SIM_GAME_STORAGE_KEY);
      navigate("/simulate/results", { state: {
        week: simState.week, cash: newCash, cashHistory: newHistory,
        satisfaction: newSat, weeklyResults: [...simState.weeklyResults, result],
      }});
      return;
    }

    // Advance to next week
    setSimState(prev => ({
      ...prev,
      week: newWeek,
      cash: newCash,
      cashHistory: newHistory,
      inventory: newInventory,
      satisfaction: newSat,
      helpers: decisions.hireHelper ? 1 : 0,
      wordOfMouthStack: newWomStack,
      weeklyResults: [...prev.weeklyResults, result],
      currentEvent: pickRandomEvent(),
    }));

    // Reset marketing + helper each week, keep price/quality/units
    setDecisions(prev => ({ ...prev, marketing: [], hireHelper: false }));
    setPendingResult(null);
  };

  useEffect(() => {
    return () => {
      tipAbortRef.current?.abort();
      if (startWeekTimerRef.current) {
        window.clearTimeout(startWeekTimerRef.current);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col priceit-fade-in"
      style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#E0EFF1] bg-white/80 backdrop-blur-sm sticky top-0 z-20 gap-2">
        <button
          onClick={() => navigate("/simulate")}
          className="min-h-11 px-3 text-[#5DB7C4] font-semibold text-sm hover:text-[#F36C3D] transition-colors whitespace-nowrap"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
          <img src={logo} alt="PriceIt logo" className="h-7 w-auto" />
          <span className="text-xs font-bold text-[#2B2B2B] bg-[#EAF7F9] px-3 py-1 rounded-full">
            Week {simState.week} of {TOTAL_WEEKS}
          </span>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: simState.cash >= 0 ? "#EAF7F9" : "#FFF5F0",
              color: simState.cash >= 0 ? "#5DB7C4" : "#ef4444",
            }}
          >
            ${simState.cash.toFixed(2)} cash
          </span>
        </div>
        <div className="w-16" />
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ══════════════════════════════════════════════════════════════
              LEFT: Decision Panel
          ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-3">

            {/* Event card */}
            <EventCard event={simState.currentEvent} />

            {/* Production section */}
            <div className="bg-white rounded-2xl border border-[#E0EFF1] px-4 py-4 flex flex-col gap-4">
              <p className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider">Production</p>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[#2B2B2B]">
                  How many will you make? <span className="text-[#9BBFC3] font-normal">(max {effectiveMax})</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={effectiveMax}
                    value={decisions.unitsToProduce}
                    onChange={e => setDecisions(prev => ({
                      ...prev,
                      unitsToProduce: Math.min(effectiveMax, Math.max(0, Number(e.target.value) || 0)),
                    }))}
                    className="flex-1 border-2 border-[#E0EFF1] focus:border-[#5DB7C4] rounded-xl px-3 py-2.5 text-[#2B2B2B] font-bold text-lg bg-[#F7F9FA] outline-none transition-colors"
                  />
                  <span className="text-xs text-[#9BBFC3] font-semibold whitespace-nowrap">units</span>
                </div>
                {simState.inventory > 0 && (
                  <p className="text-xs text-[#5DB7C4] font-semibold">
                    + {simState.inventory} in stock from last week → total supply: {decisions.unitsToProduce + simState.inventory}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[#2B2B2B]">Material quality</label>
                <div className="flex gap-2">
                  {(["Standard", "Premium", "Deluxe"] as StartingQuality[]).map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setDecisions(prev => ({ ...prev, quality: q }))}
                      className="flex-1 rounded-xl py-2.5 text-sm font-bold border-2 transition-all"
                      style={{
                        borderColor: decisions.quality === q ? "#5DB7C4" : "#E0EFF1",
                        background: decisions.quality === q ? "#EAF7F9" : "#F7F9FA",
                        color: decisions.quality === q ? "#5DB7C4" : "#9BBFC3",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing section */}
            <div className="bg-white rounded-2xl border border-[#E0EFF1] px-4 py-4 flex flex-col gap-2">
              <p className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider">Pricing</p>
              <label className="text-sm font-bold text-[#2B2B2B]">
                What's your selling price?
              </label>
              <div className="flex items-center border-2 border-[#E0EFF1] focus-within:border-[#5DB7C4] rounded-xl px-3 py-2.5 bg-[#F7F9FA] transition-colors">
                <span className="text-[#5DB7C4] font-bold text-lg mr-2">$</span>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  value={decisions.sellingPrice}
                  onChange={e => setDecisions(prev => ({ ...prev, sellingPrice: Math.max(0, Number(e.target.value) || 0) }))}
                  className="bg-transparent flex-1 outline-none text-[#2B2B2B] font-bold text-lg"
                />
              </div>
              {decisions.sellingPrice !== originalPrice && originalPrice > 0 && (
                <p className="text-xs text-[#F36C3D] font-semibold">
                  Original price was ${originalPrice.toFixed(2)} —
                  {decisions.sellingPrice < originalPrice ? " lower price may boost demand" : " higher price may reduce demand"}
                </p>
              )}
            </div>

            {/* Marketing section */}
            <div className="bg-white rounded-2xl border border-[#E0EFF1] px-4 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider">Marketing</p>
                <span className="text-[10px] font-bold text-[#C8D8DC] uppercase tracking-wider">
                  {decisions.marketing.length}/2 selected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(MARKETING_META) as MarketingKey[]).map(key => {
                  const meta = MARKETING_META[key];
                  const selected = decisions.marketing.includes(key);
                  const disabled = !selected && decisions.marketing.length >= 2;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleMarketing(key)}
                      disabled={disabled}
                      className="rounded-xl px-3 py-2.5 text-left border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        borderColor: selected ? "#5DB7C4" : "#E0EFF1",
                        background: selected ? "#EAF7F9" : "#F7F9FA",
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base">{meta.emoji}</span>
                        <span className="text-xs font-bold" style={{ color: selected ? "#5DB7C4" : "#2B2B2B" }}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#9BBFC3] font-semibold leading-tight">{meta.note}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Staff section */}
            <div className="bg-white rounded-2xl border border-[#E0EFF1] px-4 py-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-[#2B2B2B]">Hire a helper this week?</p>
                <p className="text-xs text-[#9BBFC3] mt-0.5">
                  Costs $20 · lets you produce {Math.floor(maxWeeklyUnits * 1.5)} units max (50% more)
                </p>
              </div>
              <button
                type="button"
                onClick={toggleHelper}
                className="w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 relative"
                style={{ background: decisions.hireHelper ? "#5DB7C4" : "#D1D5DB" }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
                  style={{ left: decisions.hireHelper ? "calc(100% - 22px)" : "2px" }}
                />
              </button>
            </div>

            {/* Start Week */}
            <div className="flex flex-col items-center gap-2">
              {proj.productionCost > simState.cash && (
                <p className="text-xs text-[#F36C3D] font-semibold text-center">
                  ⚠️ You can't afford to produce {decisions.unitsToProduce} units (costs {fd(proj.productionCost)}, you have ${simState.cash.toFixed(2)})
                </p>
              )}
              <ChronicleButton
                text={isStartingWeek ? "Running Week..." : "Start Week →"}
                onClick={handleStartWeek}
                hoverColor="#F36C3D"
                customBackground="#5DB7C4"
                customForeground="#ffffff"
                hoverForeground="#ffffff"
                width="100%"
                borderRadius="12px"
                disabled={!canStart}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              RIGHT: Dashboard
          ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-3">

            {/* Week progress */}
            <div className="bg-white rounded-2xl border border-[#E0EFF1] px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider">Progress</p>
                <p className="text-xs font-bold text-[#5DB7C4]">Week {simState.week} of {TOTAL_WEEKS}</p>
              </div>
              <div className="h-2.5 rounded-full bg-[#E0EFF1] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#5DB7C4] transition-all duration-500"
                  style={{ width: `${((simState.week - 1) / TOTAL_WEEKS) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-[#9BBFC3] mt-1.5 text-right">
                {TOTAL_WEEKS - simState.week + 1} week{TOTAL_WEEKS - simState.week + 1 !== 1 ? "s" : ""} remaining
              </p>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Cash Balance", val: `$${simState.cash.toFixed(2)}`, color: simState.cash >= 0 ? "#5DB7C4" : "#ef4444" },
                { label: "In Stock",     val: `${simState.inventory} units`,   color: "#F36C3D" },
                { label: "Satisfaction", val: `${simState.satisfaction}/100`,  color: simState.satisfaction >= 61 ? "#22c55e" : simState.satisfaction >= 31 ? "#f59e0b" : "#ef4444" },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-[#E0EFF1] px-3 py-3 text-center">
                  <p className="text-[9px] font-bold text-[#9BBFC3] uppercase tracking-wider leading-tight mb-1">{label}</p>
                  <p className="font-extrabold text-sm leading-tight" style={{ color }}>{val}</p>
                </div>
              ))}
            </div>

            {/* Live projections */}
            <div className="bg-white rounded-2xl border border-[#E0EFF1] px-4 py-4 flex flex-col gap-3">
              <p className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider">
                This Week's Projection
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Est. Demand",  val: `~${proj.finalDemand} units`,   color: "#2B2B2B" },
                  { label: "Your Supply",  val: `${proj.supply} units`,          color: "#2B2B2B" },
                  { label: "Est. Revenue", val: `+${fd(proj.revenue)}`,          color: "#16a34a" },
                  { label: "Est. Costs",   val: `-${fd(proj.totalCost)}`,        color: "#F36C3D" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-[#F7F9FA] rounded-xl px-3 py-2">
                    <p className="text-[10px] font-bold text-[#9BBFC3] uppercase tracking-wider">{label}</p>
                    <p className="font-extrabold text-sm mt-0.5" style={{ color }}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Projected profit — full width */}
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: proj.profit >= 0 ? "#EAF7F9" : "#FFF5F0" }}
              >
                <span className="text-sm font-bold text-[#2B2B2B]">Est. Profit</span>
                <span
                  className="text-xl font-extrabold"
                  style={{ color: proj.profit >= 0 ? "#5DB7C4" : "#ef4444" }}
                >
                  {proj.profit >= 0 ? "+" : "-"}{fd(proj.profit)}
                </span>
              </div>

              {proj.finalDemand > proj.supply && (
                <p className="text-xs text-[#F36C3D] font-semibold text-center">
                  ⚠️ You might run out! Demand (~{proj.finalDemand}) &gt; your supply ({proj.supply})
                </p>
              )}
            </div>

            {/* Satisfaction bar */}
            <div className="bg-white rounded-2xl border border-[#E0EFF1] px-4 py-4">
              <SatisfactionBar score={simState.satisfaction} />
              <p className="text-[10px] text-[#9BBFC3] mt-2 font-semibold">
                Satisfied customers come back and tell their friends!
              </p>
            </div>

            {/* Cash history */}
            <div className="bg-white rounded-2xl border border-[#E0EFF1] px-4 py-4">
              <WeekHistoryBar history={simState.cashHistory} />
            </div>
          </div>
        </div>
      </main>

      {/* Weekly summary modal */}
      {pendingResult && (
        <SummaryModal
          result={pendingResult.result}
          week={simState.week}
          onNext={handleNextWeek}
          tip={weeklyTip}
        />
      )}
    </div>
  );
}

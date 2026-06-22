import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import type { StartingQuality, FixedCostItem, VariableCostItem } from "@/context/AppStateContext";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import logo from "../../logo.png";

const SIM_GAME_STORAGE_KEY = "priceit_sim_game_v1";

// ─── cost math (mirrors ResultsPage / PricingPage) ───────────────────────────

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

// ─── small helpers ────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "teal" | "orange" | "green" | "red";
}) {
  const colors: Record<string, string> = {
    teal: "text-[#5DB7C4]",
    orange: "text-[#F36C3D]",
    green: "text-[#16a34a]",
    red: "text-[#dc2626]",
  };
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 bg-[#F7F9FA] rounded-2xl min-w-0 border border-[#EAF0F2]">
      <p className="text-[10px] uppercase tracking-wider font-bold text-[#9BBFC3] whitespace-nowrap">
        {label}
      </p>
      <p className={`text-base font-extrabold truncate ${colors[accent ?? "teal"]}`}>{value}</p>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

const QUALITY_OPTIONS: StartingQuality[] = ["Standard", "Premium", "Deluxe"];

const QUALITY_DESC: Record<StartingQuality, string> = {
  Standard: "Affordable materials. Easier to sell in volume.",
  Premium: "Better materials. Customers can pay more.",
  Deluxe: "Top quality. Highest margin, but usually fewer sales.",
};

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SimulateSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, updateSimConfig } = useAppState();
  const { productInfo, fixedCosts, variableCosts, pricing, simConfig } = state;
  const routeMessage = (location.state as { message?: string } | null)?.message ?? null;
  const [flowNotice] = useState<string | null>(routeMessage);

  // ── derived numbers ──────────────────────────────────────────────────────
  const totalMonthlyFixed = fixedCosts.reduce((s, i) => s + fixedMonthly(i), 0);
  const totalVariablePerUnit = variableCosts.reduce((s, i) => s + variableCPP(i), 0);
  const unitsPerMonth = Number(pricing.unitsPerMonth) || 0;
  const fixedPerUnit = unitsPerMonth > 0 ? totalMonthlyFixed / unitsPerMonth : 0;
  const costPerUnit = totalVariablePerUnit + fixedPerUnit;
  const sellingPrice = Number(pricing.sellingPrice) || 0;
  const profitPerUnit = sellingPrice - costPerUnit;
  const profitable = profitPerUnit >= 0;

  // ── smart defaults (only applied once when the page first loads) ─────────
  const defaultCash = Math.max(100, Math.ceil((totalMonthlyFixed * 2) / 50) * 50);
  const defaultWeekly = Math.max(1, Math.round(unitsPerMonth / 4));

  const [cash, setCash] = useState<number | "">(
    simConfig.startingCash !== "" ? simConfig.startingCash : defaultCash
  );
  const [weekly, setWeekly] = useState<number | "">(
    simConfig.maxWeeklyUnits !== "" ? simConfig.maxWeeklyUnits : defaultWeekly
  );
  const [quality, setQuality] = useState<StartingQuality>(simConfig.startingQuality);

  const cashStep = 50;
  const cashMin = 50;
  const cashMax = Math.max(
    1000,
    Math.ceil(
      Math.max(defaultCash * 2, Number(cash) || 0, totalMonthlyFixed * 8, 500) / cashStep
    ) * cashStep
  );
  const cashSliderValue =
    cash === "" ? defaultCash : clamp(roundToStep(Number(cash), cashStep), cashMin, cashMax);

  const weeklyStep = Math.max(1, Math.ceil(defaultWeekly / 12));
  const weeklyMin = 1;
  const weeklyMax = Math.max(
    40,
    Math.ceil(Math.max(defaultWeekly * 3, Number(weekly) || 0, Math.round(unitsPerMonth / 2), 20) / weeklyStep) *
      weeklyStep
  );
  const weeklySliderValue =
    weekly === "" ? defaultWeekly : clamp(roundToStep(Number(weekly), weeklyStep), weeklyMin, weeklyMax);

  // keep simConfig in sync as user edits
  useEffect(() => {
    updateSimConfig({ startingCash: cash, maxWeeklyUnits: weekly, startingQuality: quality });
  }, [cash, weekly, quality]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (routeMessage) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, navigate, routeMessage]);

  const canStart = cash !== "" && Number(cash) >= 50 && weekly !== "" && Number(weekly) >= 1;

  const handleStart = () => {
    if (!canStart) return;
    window.localStorage.removeItem(SIM_GAME_STORAGE_KEY);
    navigate("/simulate/game");
  };

  return (
    <div
      className="min-h-screen flex flex-col priceit-fade-in"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)",
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#E0EFF1] bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <button
          onClick={() => navigate("/results")}
          className="min-h-11 px-3 text-[#5DB7C4] font-semibold text-sm hover:text-[#F36C3D] transition-colors"
        >
          Back
        </button>
        <img src={logo} alt="PriceIt logo" className="h-9 w-auto" />
        <div className="w-16" />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-4 sm:py-5">
        <div className="w-full max-w-4xl flex flex-col gap-3">
          {/* ── Headline ── */}
          <div className="text-center">
            {flowNotice && (
              <div className="mb-2 rounded-xl border border-[#A9DDE3] bg-white px-4 py-2 text-sm font-semibold text-[#2B2B2B]">
                {flowNotice}
              </div>
            )}
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#F36C3D] mb-1">
              Business Simulator
            </p>
            <h1 className="text-3xl sm:text-[2.4rem] font-extrabold text-[#2B2B2B] leading-tight">
              Ready to run your business?
            </h1>
            <p className="mt-1 text-[#7B9EA3] text-sm leading-relaxed max-w-lg mx-auto">
              You are about to run <strong>{productInfo.productName || "your product"}</strong> for <strong>12 weeks</strong>.
              Tune your settings, then hit start.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
            {/* ── Product summary card ── */}
            <div className="bg-white rounded-3xl border border-[#E0EFF1] px-4 py-4 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-lg text-[#2B2B2B] truncate">
                    {productInfo.productName || "Your Product"}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-[#EAF7F9] text-[#5DB7C4] px-2 py-0.5 rounded-full">
                      {productInfo.category || "Product"}
                    </span>
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: profitable ? "#F0FFF4" : "#FFF5F0",
                        color: profitable ? "#16a34a" : "#F36C3D",
                      }}
                    >
                      {profitable ? "Profitable Setup" : "Tight Margins"}
                    </span>
                  </div>
                </div>
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: profitable ? "#F0FFF4" : "#FFF5F0" }}
                >
                  {profitable ? "📈" : "📉"}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <StatPill label="Selling Price" value={`$${sellingPrice.toFixed(2)}`} accent="teal" />
                <StatPill label="Cost / Unit" value={`$${costPerUnit.toFixed(2)}`} accent="orange" />
                <StatPill
                  label="Profit / Unit"
                  value={`${profitable ? "+" : ""}$${profitPerUnit.toFixed(2)}`}
                  accent={profitable ? "green" : "red"}
                />
              </div>
            </div>

            {/* ── Config controls ── */}
            <div className="bg-white rounded-3xl border border-[#E0EFF1] px-4 py-4 shadow-sm flex flex-col gap-3">
              <p className="text-sm font-bold text-[#2B2B2B]">Simulation controls</p>

              {/* Starting cash */}
              <div className="rounded-2xl border border-[#E7EFF1] bg-[#F8FBFC] px-3 py-2.5">
                <label className="text-sm font-bold text-[#2B2B2B]">Starting cash</label>
                <p className="text-[11px] text-[#7B9EA3] mt-0.5">
                  More cash gives you a bigger safety net if a week goes badly.
                </p>
                <div className="mt-2 flex items-center border-2 border-[#E0EFF1] focus-within:border-[#5DB7C4] rounded-xl px-3 py-2.5 bg-white transition-colors">
                  <span className="text-[#5DB7C4] font-bold mr-1.5 text-base">$</span>
                  <input
                    type="number"
                    min={cashMin}
                    step={cashStep}
                    value={cash}
                    onChange={(e) => setCash(e.target.value === "" ? "" : Number(e.target.value))}
                    onBlur={() => {
                      if (cash === "") return;
                      setCash(Math.max(cashMin, roundToStep(Number(cash), cashStep)));
                    }}
                    placeholder={String(defaultCash)}
                    className="bg-transparent flex-1 outline-none text-[#2B2B2B] text-base font-bold placeholder-[#C8D8DC]"
                  />
                </div>
                <input
                  type="range"
                  className="priceit-range mt-2"
                  min={cashMin}
                  max={cashMax}
                  step={cashStep}
                  value={cashSliderValue}
                  onChange={(e) => setCash(Number(e.target.value))}
                  aria-label="Starting cash slider"
                  style={{ "--range-accent": "#5DB7C4" } as CSSProperties}
                />
                <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-[#9BBFC3]">
                  <span>${cashMin}</span>
                  <span>${cashMax.toLocaleString()}</span>
                </div>
                {cash !== "" && Number(cash) < cashMin && (
                  <p className="text-xs text-[#F36C3D] font-semibold mt-1">Minimum starting cash is $50.</p>
                )}
              </div>

              {/* Max weekly units */}
              <div className="rounded-2xl border border-[#E7EFF1] bg-[#F8FBFC] px-3 py-2.5">
                <label className="text-sm font-bold text-[#2B2B2B]">Max units per week</label>
                <p className="text-[11px] text-[#7B9EA3] mt-0.5">
                  This is your weekly production cap. Lower numbers make growth slower.
                </p>
                <div className="mt-2 flex items-center border-2 border-[#E0EFF1] focus-within:border-[#5DB7C4] rounded-xl px-3 py-2.5 bg-white transition-colors">
                  <input
                    type="number"
                    min={weeklyMin}
                    step={1}
                    value={weekly}
                    onChange={(e) => setWeekly(e.target.value === "" ? "" : Number(e.target.value))}
                    onBlur={() => {
                      if (weekly === "") return;
                      setWeekly(Math.max(weeklyMin, Math.round(Number(weekly))));
                    }}
                    placeholder={String(defaultWeekly)}
                    className="bg-transparent flex-1 outline-none text-[#2B2B2B] text-base font-bold placeholder-[#C8D8DC]"
                  />
                  <span className="text-[#9BBFC3] text-sm font-semibold ml-2">units/week</span>
                </div>
                <input
                  type="range"
                  className="priceit-range mt-2"
                  min={weeklyMin}
                  max={weeklyMax}
                  step={weeklyStep}
                  value={weeklySliderValue}
                  onChange={(e) => setWeekly(Number(e.target.value))}
                  aria-label="Max weekly units slider"
                  style={{ "--range-accent": "#F36C3D" } as CSSProperties}
                />
                <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-[#9BBFC3]">
                  <span>{weeklyMin}</span>
                  <span>{weeklyMax} units</span>
                </div>
              </div>

              {/* Material quality */}
              <div className="rounded-2xl border border-[#E7EFF1] bg-[#F8FBFC] px-3 py-2.5">
                <label className="text-sm font-bold text-[#2B2B2B]">Starting material quality</label>
                <p className="text-[11px] text-[#7B9EA3] mt-0.5">Quality changes demand and margin.</p>
                <div className="mt-2 flex gap-2">
                  {QUALITY_OPTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q)}
                      className="flex-1 rounded-xl py-2.5 text-sm font-bold border-2 transition-all"
                      style={{
                        borderColor: quality === q ? "#5DB7C4" : "#E0EFF1",
                        background: quality === q ? "#EAF7F9" : "#FFFFFF",
                        color: quality === q ? "#5DB7C4" : "#9BBFC3",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#7B9EA3] mt-1 font-medium">{QUALITY_DESC[quality]}</p>
              </div>
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="flex justify-center pt-1 pb-2">
            <div className={canStart ? "priceit-btn-ready" : ""}>
              <ChronicleButton
                text="Start Simulation 🚀"
                onClick={handleStart}
                hoverColor="#F36C3D"
                customBackground="#5DB7C4"
                customForeground="#ffffff"
                hoverForeground="#ffffff"
                width="280px"
                borderRadius="12px"
                disabled={!canStart}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

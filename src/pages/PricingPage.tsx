import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import type { FixedCostItem, VariableCostItem } from "@/context/AppStateContext";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { FieldCard } from "@/components/ui/field-card";
import logo from "../../logo.png";

// ─── cost math (mirrors Steps 2 & 3) ─────────────────────────────────────────

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundUp(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.ceil(value / step) * step;
}

// ─── metric card ─────────────────────────────────────────────────────────────

function SummaryMetric({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "neutral" | "teal" | "profit";
}) {
  const toneStyles =
    tone === "teal"
      ? { color: "#5DB7C4", bg: "#F0FAFB", border: "#C8E8ED" }
      : tone === "profit"
        ? { color: "#16a34a", bg: "#F0FFF4", border: "#86efac" }
        : { color: "#647B84", bg: "#F7F9FA", border: "#E0EFF1" };

  return (
    <div
      className="rounded-2xl px-3 py-2.5 flex flex-col gap-0.5"
      style={{ background: toneStyles.bg, border: `1.5px solid ${toneStyles.border}` }}
    >
      <p className="font-extrabold leading-tight text-[1.38rem]" style={{ color: toneStyles.color }}>
        {value}
      </p>
      <p className="text-[11px] font-bold text-[#6F8A91] uppercase tracking-wider">{label}</p>
      <p className="text-[11px] text-[#8FA8AE]">{helper}</p>
    </div>
  );
}

// ─── margin bar ──────────────────────────────────────────────────────────────

function MarginBar({ pct, active }: { pct: number; active: boolean }) {
  if (!active) {
    return (
      <div className="rounded-2xl bg-white border border-[#E0EFF1] px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B9EA3]">
          Profit margin
        </p>
        <p className="text-xs text-[#9BBFC3] mt-1">Set your price and units to unlock this.</p>
      </div>
    );
  }

  const clamped = Math.max(0, Math.min(100, pct));
  const color = pct >= 20 ? "#22c55e" : pct >= 10 ? "#f59e0b" : "#ef4444";
  const label = pct >= 20 ? "Healthy margin" : pct >= 10 ? "Okay margin" : "Thin margin";

  return (
    <div className="rounded-2xl bg-white border border-[#E0EFF1] px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B9EA3]">Profit margin</p>
        <p className="font-extrabold text-base" style={{ color }}>
          {pct.toFixed(1)}%
        </p>
      </div>
      <div className="h-2.5 rounded-full bg-[#E8ECEE] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      <p className="text-[11px] font-semibold mt-1" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

function RangeInput({
  value,
  min,
  max,
  step,
  accent,
  ariaLabel,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  accent: string;
  ariaLabel: string;
  onChange: (value: number) => void;
}) {
  const safeMax = Math.max(max, min + step);
  const safeValue = clamp(value, min, safeMax);
  const pct = safeMax > min ? ((safeValue - min) / (safeMax - min)) * 100 : 0;

  return (
    <input
      type="range"
      className="priceit-range"
      min={min}
      max={safeMax}
      step={step}
      value={safeValue}
      onChange={(event) => onChange(Number(event.target.value))}
      aria-label={ariaLabel}
      style={
        {
          "--range-accent": accent,
          background: `linear-gradient(90deg, ${accent} 0%, ${accent} ${pct}%, #D8E4E6 ${pct}%, #D8E4E6 100%)`,
        } as CSSProperties
      }
    />
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, updatePricing } = useAppState();
  const { pricing, fixedCosts, variableCosts } = state;
  const [touched, setTouched] = useState({
    sellingPrice: false,
    unitsPerMonth: false,
  });
  const [assistantHighlight, setAssistantHighlight] = useState(false);
  const [flowNotice, setFlowNotice] = useState<string | null>(null);

  const sellingPrice = Number(pricing.sellingPrice) || 0;
  const unitsPerMonth = Number(pricing.unitsPerMonth) || 0;

  // aggregated costs from previous steps
  const totalMonthlyFixed = fixedCosts.reduce((s, i) => s + fixedMonthly(i), 0);
  const totalVariablePerUnit = variableCosts.reduce((s, i) => s + variableCPP(i), 0);

  // per-unit cost = variable cost + fixed cost spread over estimated units
  const fixedPerUnit = unitsPerMonth > 0 ? totalMonthlyFixed / unitsPerMonth : 0;
  const costPerUnit = totalVariablePerUnit + fixedPerUnit;

  // derived metrics
  const profitPerUnit = sellingPrice - costPerUnit;
  const monthlyRevenue = sellingPrice * unitsPerMonth;
  const monthlyCosts = costPerUnit * unitsPerMonth;
  const monthlyProfit = monthlyRevenue - monthlyCosts;
  const marginPct = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0;
  const rawBreakEven = profitPerUnit > 0 ? Math.ceil(totalMonthlyFixed / profitPerUnit) : null;
  const breakEvenUnits = rawBreakEven !== null && rawBreakEven <= unitsPerMonth * 50 ? rawBreakEven : null;

  const profitable = profitPerUnit > 0;
  const canProceed =
    pricing.sellingPrice !== "" &&
    Number(pricing.sellingPrice) > 0 &&
    pricing.unitsPerMonth !== "" &&
    Number(pricing.unitsPerMonth) > 0;
  const sellingPriceError =
    touched.sellingPrice && (pricing.sellingPrice === "" || Number(pricing.sellingPrice) <= 0);
  const unitsError =
    touched.unitsPerMonth && (pricing.unitsPerMonth === "" || Number(pricing.unitsPerMonth) <= 0);
  const priceBelowCostWarning = sellingPrice > 0 && costPerUnit > 0 && sellingPrice < costPerUnit;
  const missingCosts = totalMonthlyFixed <= 0 && totalVariablePerUnit <= 0;

  const priceStep = sellingPrice >= 100 || costPerUnit >= 100 ? 1 : sellingPrice >= 25 || costPerUnit >= 25 ? 0.5 : 0.25;
  const priceMin = 0;
  const priceMax = roundUp(
    Math.max(20, costPerUnit * 3, totalVariablePerUnit * 3, sellingPrice * 1.5),
    priceStep
  );
  const priceSliderValue = pricing.sellingPrice === "" ? priceMin : clamp(sellingPrice, priceMin, priceMax);

  const breakEvenScale = rawBreakEven === null ? 0 : Math.min(rawBreakEven, 5000);
  const unitsStep = unitsPerMonth >= 600 || breakEvenScale >= 600 ? 10 : unitsPerMonth >= 150 || breakEvenScale >= 150 ? 5 : 1;
  const unitsMin = 1;
  const unitsMax = roundUp(Math.max(120, unitsPerMonth * 1.8, breakEvenScale * 1.5), unitsStep);
  const unitsSliderValue = pricing.unitsPerMonth === "" ? unitsMin : clamp(Math.round(unitsPerMonth), unitsMin, unitsMax);

  useEffect(() => {
    const handleStateChange = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: string }>).detail;
      if (detail?.section !== "pricing") return;
      setAssistantHighlight(true);
      window.setTimeout(() => setAssistantHighlight(false), 1000);
    };
    window.addEventListener("priceit-state-changed", handleStateChange);
    return () => window.removeEventListener("priceit-state-changed", handleStateChange);
  }, []);

  useEffect(() => {
    const routeState = location.state as { message?: string } | null;
    if (routeState?.message) {
      setFlowNotice(routeState.message);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen flex flex-col priceit-fade-in" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#E0EFF1] bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <button
          onClick={() => navigate("/setup/variable-costs")}
          className="min-h-11 px-3 text-[#5DB7C4] font-semibold text-sm hover:text-[#F36C3D] transition-colors"
        >
          Back
        </button>
        <img src={logo} alt="PriceIt logo" className="h-9 w-auto" />
        <div className="w-16" />
      </header>

      <main className="flex-1 px-4 py-4 sm:py-5">
        <div className="w-full max-w-6xl mx-auto">
          <ProgressSteps currentStep={4} />

          <div className="mt-3 mb-4 flex flex-col gap-2">
            {flowNotice && (
              <div className="rounded-xl border border-[#A9DDE3] bg-white px-4 py-2 text-sm font-semibold text-[#2B2B2B]">
                {flowNotice}
              </div>
            )}
            <h1 className="text-2xl sm:text-[2rem] font-extrabold text-[#2B2B2B] leading-tight">Set your price</h1>
            <p className="text-[#6F8A91] text-sm sm:text-[0.95rem]">
              Pick a price, move the sliders, and instantly see if your business is healthy.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.04fr_0.96fr]">
            <section className={`rounded-3xl border border-[#DCE9EC] bg-white/95 px-3 py-3 sm:px-4 sm:py-4 shadow-sm ${assistantHighlight ? "priceit-agent-highlight" : ""}`}>
              <div className="flex flex-col gap-3">
                <FieldCard label="Selling price per unit" accentColor="#5DB7C4">
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7B9EA3] font-semibold select-none pointer-events-none">
                        $
                      </span>
                      <input
                        className="bauhaus-field-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={pricing.sellingPrice}
                        onChange={(e) => {
                          if (e.target.value === "") {
                            updatePricing({ sellingPrice: "" });
                            return;
                          }
                          const parsed = Number(e.target.value);
                          if (!Number.isFinite(parsed)) return;
                          updatePricing({ sellingPrice: Math.max(0, parsed) });
                        }}
                        onBlur={() => {
                          setTouched((prev) => ({ ...prev, sellingPrice: true }));
                          if (pricing.sellingPrice !== "") {
                            updatePricing({
                              sellingPrice: Number(Number(pricing.sellingPrice).toFixed(2)),
                            });
                          }
                        }}
                        placeholder="0.00"
                        style={{
                          paddingLeft: "1.75rem",
                          ...(sellingPriceError ? { borderColor: "#F36C3D", background: "#FFF5F0" } : {}),
                        }}
                      />
                    </div>
                    <RangeInput
                      value={priceSliderValue}
                      min={priceMin}
                      max={priceMax}
                      step={priceStep}
                      accent="#5DB7C4"
                      ariaLabel="Selling price slider"
                      onChange={(value) => {
                        setTouched((prev) => ({ ...prev, sellingPrice: true }));
                        updatePricing({ sellingPrice: Number(value.toFixed(2)) });
                      }}
                    />
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#7B9EA3]">
                      <span>$0</span>
                      <span>${fmt(priceMax)}</span>
                    </div>
                    {sellingPriceError ? (
                      <p className="text-xs font-semibold text-[#F36C3D]">
                        Enter a selling price above $0.00.
                      </p>
                    ) : (
                      <p className="text-xs text-[#7B9EA3]">
                        {costPerUnit > 0
                          ? `Your current cost per unit is $${fmt(costPerUnit)}. Stay above that line to profit.`
                          : "Add your costs in previous steps to get a more realistic price range."}
                      </p>
                    )}
                  </div>
                </FieldCard>

                <FieldCard label="Estimated units sold per month" accentColor="#F36C3D">
                  <div className="space-y-2">
                    <input
                      className="bauhaus-field-input"
                      type="number"
                      min="1"
                      step="1"
                      value={pricing.unitsPerMonth}
                      onChange={(e) => {
                        if (e.target.value === "") {
                          updatePricing({ unitsPerMonth: "" });
                          return;
                        }
                        const parsed = Number(e.target.value);
                        if (!Number.isFinite(parsed)) return;
                        updatePricing({ unitsPerMonth: Math.max(0, parsed) });
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, unitsPerMonth: true }));
                        if (pricing.unitsPerMonth !== "") {
                          updatePricing({ unitsPerMonth: Math.round(Number(pricing.unitsPerMonth)) });
                        }
                      }}
                      placeholder="e.g. 20"
                      style={unitsError ? { borderColor: "#F36C3D", background: "#FFF5F0" } : undefined}
                    />
                    <RangeInput
                      value={unitsSliderValue}
                      min={unitsMin}
                      max={unitsMax}
                      step={unitsStep}
                      accent="#F36C3D"
                      ariaLabel="Units sold per month slider"
                      onChange={(value) => {
                        setTouched((prev) => ({ ...prev, unitsPerMonth: true }));
                        updatePricing({ unitsPerMonth: Math.round(value) });
                      }}
                    />
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#7B9EA3]">
                      <span>1</span>
                      <span>{unitsMax.toLocaleString()} units</span>
                    </div>
                    {unitsError ? (
                      <p className="text-xs font-semibold text-[#F36C3D]">
                        Enter at least 1 unit per month.
                      </p>
                    ) : (
                      <p className="text-xs text-[#7B9EA3]">
                        {breakEvenUnits !== null
                          ? `Break-even target is ${breakEvenUnits.toLocaleString()} units per month.`
                          : "Slide this to test your monthly plan and see how profit changes."}
                      </p>
                    )}
                  </div>
                </FieldCard>

                {missingCosts && (
                  <div className="rounded-2xl border border-[#FCCBB0] bg-[#FFF5F0] px-3 py-2.5">
                    <p className="text-xs font-bold text-[#F36C3D]">Cost per unit is $0.00 right now.</p>
                    <p className="text-[11px] text-[#9A3412] mt-0.5">
                      Add fixed and variable costs so your pricing estimate is realistic.
                    </p>
                  </div>
                )}

                {priceBelowCostWarning && (
                  <div className="rounded-2xl border border-[#FCCBB0] bg-[#FFF5F0] px-3 py-2">
                    <p className="text-xs font-bold text-[#F36C3D]">
                      This price is below your cost per unit.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-[#DCE9EC] bg-white/95 px-3 py-3 sm:px-4 sm:py-4 shadow-sm">
              <div
                className={`rounded-2xl border-2 px-4 py-3 ${
                  canProceed
                    ? profitable
                      ? "bg-[#F0FFF4] border-[#86efac]"
                      : "bg-[#FFF5F5] border-[#fca5a5]"
                    : "bg-[#F7F9FA] border-[#E0EFF1]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#6F8A91]">Profit per unit</p>
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{
                      background: canProceed
                        ? profitable
                          ? "rgba(34, 197, 94, 0.16)"
                          : "rgba(239, 68, 68, 0.16)"
                        : "rgba(123, 158, 163, 0.16)",
                      color: canProceed ? (profitable ? "#16a34a" : "#dc2626") : "#7B9EA3",
                    }}
                  >
                    {canProceed ? (profitable ? "Profitable" : "Losing money") : "Waiting for inputs"}
                  </span>
                </div>
                <p
                  className="text-4xl sm:text-[2.75rem] font-extrabold leading-none mt-1"
                  style={{
                    color: canProceed ? (profitable ? "#16a34a" : "#dc2626") : "#7B9EA3",
                  }}
                >
                  {canProceed ? `${profitPerUnit >= 0 ? "+" : ""}$${fmt(profitPerUnit)}` : "$0.00"}
                </p>
                <p className="text-xs mt-1.5 text-[#6F8A91]">
                  {canProceed
                    ? profitable
                      ? "Each sale adds money to your business."
                      : "Each sale loses money. Raise the price or lower costs."
                    : "Set a price and monthly units to see your live result."}
                </p>
              </div>

              <div className={`grid grid-cols-2 gap-2 mt-3 ${canProceed ? "" : "opacity-80"}`}>
                <SummaryMetric
                  label="Cost per unit"
                  value={`$${fmt(costPerUnit)}`}
                  helper={`$${fmt(totalVariablePerUnit)} variable + $${fmt(fixedPerUnit)} fixed`}
                />
                <SummaryMetric
                  label="Monthly revenue"
                  value={`$${fmt(monthlyRevenue)}`}
                  helper={`${unitsPerMonth.toLocaleString()} units × $${fmt(sellingPrice)}`}
                  tone="teal"
                />
                <SummaryMetric
                  label="Monthly costs"
                  value={`$${fmt(monthlyCosts)}`}
                  helper={`${unitsPerMonth.toLocaleString()} units × $${fmt(costPerUnit)}`}
                />
                <SummaryMetric
                  label="Monthly profit"
                  value={`${monthlyProfit >= 0 ? "+" : ""}$${fmt(monthlyProfit)}`}
                  helper="Revenue minus all costs"
                  tone={canProceed && monthlyProfit >= 0 ? "profit" : "neutral"}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2 mt-3">
                <MarginBar pct={marginPct} active={canProceed && sellingPrice > 0} />

                <div
                  className={`rounded-2xl border px-3 py-2.5 ${
                    breakEvenUnits !== null
                      ? "bg-[#FFFBEA] border-[#FDE68A]"
                      : canProceed && profitPerUnit <= 0
                        ? "bg-[#FFF5F5] border-[#fca5a5]"
                        : "bg-white border-[#E0EFF1]"
                  }`}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color:
                        breakEvenUnits !== null
                          ? "#92400e"
                          : canProceed && profitPerUnit <= 0
                            ? "#dc2626"
                            : "#7B9EA3",
                    }}
                  >
                    Break-even point
                  </p>
                  {breakEvenUnits !== null ? (
                    <>
                      <p className="text-2xl font-extrabold text-[#b45309] leading-tight mt-0.5">
                        {breakEvenUnits.toLocaleString()} units
                      </p>
                      <p className="text-[11px] text-[#92400e] mt-1">
                        {unitsPerMonth >= breakEvenUnits
                          ? "On track at your current plan."
                          : `${(breakEvenUnits - unitsPerMonth).toLocaleString()} more units needed.`}
                      </p>
                    </>
                  ) : canProceed && profitPerUnit <= 0 ? (
                    <p className="text-xs text-[#dc2626] mt-1">
                      Raise your selling price to unlock break-even.
                    </p>
                  ) : (
                    <p className="text-xs text-[#9BBFC3] mt-1">
                      We’ll calculate this once you enter a profitable setup.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Navigation */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <ChronicleButton
              text="Back"
              onClick={() => navigate("/setup/variable-costs")}
              hoverColor="#5DB7C4"
              customBackground="#E8ECEE"
              customForeground="#5DB7C4"
              hoverForeground="#ffffff"
              width="140px"
              borderRadius="10px"
            />
            <ChronicleButton
              text="See My Results"
              onClick={() => { if (canProceed) navigate("/results"); }}
              hoverColor="#F36C3D"
              customBackground="#5DB7C4"
              customForeground="#ffffff"
              hoverForeground="#ffffff"
              width="190px"
              borderRadius="10px"
              disabled={!canProceed}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import type { FixedCostItem, VariableCostItem } from "@/context/AppStateContext";
import { FlaskConical } from "lucide-react";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { FieldCard } from "@/components/ui/field-card";
import { SaveStatus } from "@/components/ui/save-status";
import logo from "../../logo.png";

// ─── cost math ────────────────────────────────────────────────────────────────

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

function niceMax(base: number, step: number): number {
  if (step <= 0 || base <= 0) return step > 0 ? step : 1;
  return Math.ceil(base / step) * step;
}

function priceStepFor(max: number): number {
  return max <= 10 ? 0.10 : 0.25;
}

// ─── range slider ─────────────────────────────────────────────────────────────

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
      onChange={(e) => onChange(Number(e.target.value))}
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
  const mode = state.journeyMode ?? "create";
  const { pricing, fixedCosts, variableCosts } = state;

  const [touched, setTouched] = useState({ sellingPrice: false, unitsPerMonth: false });
  const [assistantHighlight, setAssistantHighlight] = useState(false);
  const routeMessage = (location.state as { message?: string } | null)?.message ?? null;
  const [flowNotice] = useState<string | null>(routeMessage);

  const sellingPrice = Number(pricing.sellingPrice) || 0;
  const unitsPerMonth = Number(pricing.unitsPerMonth) || 0;

  const totalMonthlyFixed = fixedCosts.reduce((s, i) => s + fixedMonthly(i), 0);
  const totalVariablePerUnit = variableCosts.reduce((s, i) => s + variableCPP(i), 0);
  const fixedPerUnit = unitsPerMonth > 0 ? totalMonthlyFixed / unitsPerMonth : 0;
  const costPerUnit = totalVariablePerUnit + fixedPerUnit;
  const profitPerUnit = sellingPrice - costPerUnit;
  const monthlyRevenue = sellingPrice * unitsPerMonth;
  const monthlyCosts = costPerUnit * unitsPerMonth;
  const monthlyProfit = monthlyRevenue - monthlyCosts;
  const marginPct = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0;

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

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Stable slider bounds ──
  // priceMax based only on variable costs (never on sellingPrice) — no feedback loop when sliding
  const [priceMax, priceStep] = useMemo(() => {
    const base = Math.max(50, totalVariablePerUnit * 5);
    const step = priceStepFor(base);
    return [niceMax(base, step), step];
  }, [totalVariablePerUnit]);
  const priceSliderValue = pricing.sellingPrice === "" ? 0 : clamp(sellingPrice, 0, priceMax);

  // Contribution-margin break-even: uses variable cost only, NOT fixedPerUnit,
  // so it never depends on unitsPerMonth — units slider max won't shift as you drag it
  const contribBreakEven =
    sellingPrice > totalVariablePerUnit && totalMonthlyFixed > 0
      ? Math.ceil(totalMonthlyFixed / (sellingPrice - totalVariablePerUnit))
      : null;
  const [unitsMax, unitsStep] = useMemo(() => {
    const base = Math.max(200, (contribBreakEven ?? 0) * 3);
    const step = base >= 2000 ? 50 : base >= 500 ? 10 : base >= 100 ? 5 : 1;
    return [niceMax(base, step), step];
  }, [contribBreakEven]);
  const unitsSliderValue = pricing.unitsPerMonth === "" ? 1 : clamp(Math.round(unitsPerMonth), 1, unitsMax);

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
    if (routeMessage) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, navigate, routeMessage]);

  return (
    <div
      className="min-h-screen flex flex-col priceit-fade-in"
      style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#E0EFF1] bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <button
          onClick={() => navigate("/setup/variable-costs")}
          className="min-h-11 px-3 text-[#5DB7C4] font-semibold text-sm hover:text-[#F36C3D] transition-colors"
        >
          Back
        </button>
        <img src={logo} alt="PriceIt logo" className="h-14 w-auto" />
        <div className="w-16" />
      </header>

      <main className="flex-1 px-4 py-4 sm:py-5">
        <div className="w-full max-w-2xl mx-auto">
          <ProgressSteps currentStep={4} mode={mode} />

          <div className="mt-3 mb-4">
            {flowNotice && (
              <div className="mb-3 rounded-xl border border-[#A9DDE3] bg-white px-4 py-2 text-sm font-semibold text-[#2B2B2B]">
                {flowNotice}
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2B2B2B] leading-tight">
              {mode === "improve" ? "Test a new price" : "Set your price"}
            </h1>
            <p className="mt-1 text-[#6F8A91] text-sm">
              {mode === "improve"
                ? "Try a better price and see the effect on your profit instantly."
                : "Pick a price and how many you plan to sell, then see if your business makes money."}
            </p>
          </div>

          <div className={`flex flex-col gap-3 ${assistantHighlight ? "priceit-agent-highlight p-1 rounded-2xl" : ""}`}>
            {/* ── Price input ── */}
            <FieldCard label="Selling price per item" accentColor="#5DB7C4">
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
                      if (e.target.value === "") { updatePricing({ sellingPrice: "" }); return; }
                      const n = Number(e.target.value);
                      if (!Number.isFinite(n)) return;
                      updatePricing({ sellingPrice: Math.max(0, n) });
                    }}
                    onBlur={() => {
                      setTouched((p) => ({ ...p, sellingPrice: true }));
                      if (pricing.sellingPrice !== "")
                        updatePricing({ sellingPrice: Number(Number(pricing.sellingPrice).toFixed(2)) });
                    }}
                    placeholder="0.00"
                    style={{ paddingLeft: "1.75rem", ...(sellingPriceError ? { borderColor: "#F36C3D", background: "#FFF5F0" } : {}) }}
                  />
                </div>
                <RangeInput
                  value={priceSliderValue}
                  min={0}
                  max={priceMax}
                  step={priceStep}
                  accent="#5DB7C4"
                  ariaLabel="Selling price slider"
                  onChange={(v) => {
                    setTouched((p) => ({ ...p, sellingPrice: true }));
                    updatePricing({ sellingPrice: Number(v.toFixed(2)) });
                  }}
                />
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#7B9EA3]">
                  <span>$0</span>
                  <span>${fmt(priceMax)}</span>
                </div>
                {sellingPriceError ? (
                  <p className="text-xs font-semibold text-[#F36C3D]">Enter a selling price above $0.00.</p>
                ) : priceBelowCostWarning ? (
                  <p className="text-xs font-semibold text-[#F36C3D]">
                    This is below your cost of ${fmt(costPerUnit)} per item — you'd lose money on every sale.
                  </p>
                ) : costPerUnit > 0 ? (
                  <p className="text-xs text-[#7B9EA3]">
                    Your cost per item is <strong className="text-[#2B2B2B]">${fmt(costPerUnit)}</strong>. Price above that to make a profit.
                  </p>
                ) : (
                  <p className="text-xs text-[#7B9EA3]">Add costs in previous steps to see your break-even price.</p>
                )}
              </div>
            </FieldCard>

            {/* ── Units per month ── */}
            <FieldCard label="How many do you plan to sell per month?" accentColor="#F36C3D">
              <div className="space-y-2">
                <input
                  className="bauhaus-field-input"
                  type="number"
                  min="1"
                  step="1"
                  value={pricing.unitsPerMonth}
                  onChange={(e) => {
                    if (e.target.value === "") { updatePricing({ unitsPerMonth: "" }); return; }
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    updatePricing({ unitsPerMonth: Math.max(0, n) });
                  }}
                  onBlur={() => {
                    setTouched((p) => ({ ...p, unitsPerMonth: true }));
                    if (pricing.unitsPerMonth !== "")
                      updatePricing({ unitsPerMonth: Math.round(Number(pricing.unitsPerMonth)) });
                  }}
                  placeholder="e.g. 20"
                  style={unitsError ? { borderColor: "#F36C3D", background: "#FFF5F0" } : undefined}
                />
                <RangeInput
                  value={unitsSliderValue}
                  min={1}
                  max={unitsMax}
                  step={unitsStep}
                  accent="#F36C3D"
                  ariaLabel="Units sold per month slider"
                  onChange={(v) => {
                    setTouched((p) => ({ ...p, unitsPerMonth: true }));
                    updatePricing({ unitsPerMonth: Math.round(v) });
                  }}
                />
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#7B9EA3]">
                  <span>1</span>
                  <span>{unitsMax.toLocaleString()} items</span>
                </div>
                {unitsError ? (
                  <p className="text-xs font-semibold text-[#F36C3D]">Enter at least 1 item per month.</p>
                ) : (
                  <p className="text-xs text-[#7B9EA3]">Think about how many customers you can realistically reach each month.</p>
                )}
              </div>
            </FieldCard>

            {/* ── Live result card ── */}
            {canProceed && (
              <div
                className={`rounded-2xl border-2 px-4 py-4 transition-all ${
                  profitable ? "bg-[#F0FFF4] border-[#86efac]" : "bg-[#FFF5F5] border-[#fca5a5]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#6F8A91]">
                    Profit per item sold
                  </p>
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{
                      background: profitable ? "rgba(34,197,94,0.16)" : "rgba(239,68,68,0.16)",
                      color: profitable ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {profitable ? "Profitable ✓" : "Losing money"}
                  </span>
                </div>
                <p
                  className="text-4xl font-extrabold leading-none"
                  style={{ color: profitable ? "#16a34a" : "#dc2626" }}
                >
                  {profitPerUnit >= 0 ? "+" : "−"}${fmt(Math.abs(profitPerUnit))}
                </p>
                <div className="mt-3 pt-3 border-t border-black/[0.06] grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[11px] text-[#6F8A91] font-semibold uppercase tracking-wide">Monthly revenue</p>
                    <p className="font-extrabold text-[#5DB7C4]">${fmt(monthlyRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6F8A91] font-semibold uppercase tracking-wide">Monthly profit</p>
                    <p className="font-extrabold" style={{ color: profitable ? "#16a34a" : "#dc2626" }}>
                      {monthlyProfit >= 0 ? "+" : "−"}${fmt(Math.abs(monthlyProfit))}
                    </p>
                  </div>
                </div>
                {profitable && (
                  <p className="mt-2 text-[11px] text-[#16a34a] font-semibold">
                    Profit margin: {marginPct.toFixed(1)}%
                    {marginPct >= 20 ? " — healthy! 🎉" : marginPct >= 10 ? " — getting there." : " — try raising your price a little."}
                  </p>
                )}
                {!profitable && (
                  <p className="mt-2 text-[11px] text-[#dc2626] font-semibold">
                    Raise your price or lower your costs to start making money.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Pricing Lab CTA */}
          <button
            type="button"
            onClick={() => navigate("/setup/pricing-lab")}
            className="priceit-feature-cta mt-3 w-full flex items-center justify-between gap-3 rounded-2xl bg-[#F0FAFB] px-4 py-3 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white border-2 border-[#A9DDE3] flex items-center justify-center shadow-sm flex-shrink-0 group-hover:border-[#5DB7C4] transition-colors">
                <FlaskConical className="h-4 w-4 text-[#5DB7C4]" />
              </div>
              <div className="text-left">
                <p className="priceit-cta-badge mb-1">Recommended</p>
                <p className="text-base font-extrabold text-[#2B2B2B]">Open Pricing Lab</p>
                <p className="text-xs text-[#5B7780]">Test your price before moving to final results</p>
              </div>
            </div>
            <span className="priceit-cta-arrow">Start →</span>
          </button>

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
              text="See My Results →"
              onClick={() => { if (canProceed) navigate("/results"); }}
              hoverColor="#F36C3D"
              customBackground="#5DB7C4"
              customForeground="#ffffff"
              hoverForeground="#ffffff"
              width="200px"
              borderRadius="10px"
              disabled={!canProceed}
            />
          </div>
          <SaveStatus />
        </div>
      </main>
    </div>
  );
}

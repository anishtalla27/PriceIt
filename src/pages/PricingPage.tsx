import { useEffect, useState } from "react";
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

// ─── metric card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  color = "#5DB7C4",
  bg = "#F0FAFB",
  border = "#C8E8ED",
  large = false,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  bg?: string;
  border?: string;
  large?: boolean;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-4 flex flex-col gap-0.5"
      style={{ background: bg, border: `1.5px solid ${border}` }}
    >
      <p
        className={`font-extrabold leading-tight ${large ? "text-3xl" : "text-2xl"}`}
        style={{ color }}
      >
        {value}
      </p>
      <p className="text-xs font-bold text-[#7B9EA3] uppercase tracking-wider">{label}</p>
      {sub && <p className="text-[11px] text-[#9BBFC3] mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── margin bar ──────────────────────────────────────────────────────────────

function MarginBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const color = pct >= 20 ? "#22c55e" : pct >= 10 ? "#f59e0b" : "#ef4444";
  const label = pct >= 20 ? "Healthy margin 💪" : pct >= 10 ? "Okay margin 👍" : "Thin margin ⚠️";

  return (
    <div className="rounded-2xl bg-white border border-[#E0EFF1] px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[#7B9EA3]">Profit Margin</p>
        <p className="font-extrabold text-lg" style={{ color }}>
          {pct.toFixed(1)}%
        </p>
      </div>
      <div className="h-3 rounded-full bg-[#E8ECEE] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      <p className="text-xs font-semibold mt-1.5" style={{ color }}>
        {label}
      </p>
    </div>
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
  const breakEvenUnits =
    profitPerUnit > 0 ? Math.ceil(totalMonthlyFixed / profitPerUnit) : null;

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
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#E0EFF1] bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <button
          onClick={() => navigate("/setup/variable-costs")}
          className="min-h-11 px-3 text-[#5DB7C4] font-semibold text-sm hover:text-[#F36C3D] transition-colors"
        >
          Back
        </button>
        <img src={logo} alt="PriceIt logo" className="h-9 w-auto" />
        <div className="w-16" />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg">
          <ProgressSteps currentStep={4} />

          <div className="mb-5 text-center">
            {flowNotice && (
              <div className="mb-3 rounded-xl border border-[#A9DDE3] bg-white px-4 py-2 text-sm font-semibold text-[#2B2B2B]">
                {flowNotice}
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2B2B2B]">
              Set your price!
            </h1>
            <p className="mt-1 text-[#7B9EA3] text-sm">
              Try different prices and watch the numbers change live.
            </p>
          </div>

          {/* Inputs */}
          <div className={`flex flex-col gap-3 mb-6 rounded-2xl ${assistantHighlight ? "priceit-agent-highlight p-1" : ""}`}>
            <FieldCard label="Selling price per unit" accentColor="#5DB7C4">
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
              {sellingPriceError && (
                <p className="mt-1 text-xs font-semibold text-[#F36C3D]">
                  Enter a selling price above $0.00.
                </p>
              )}
            </FieldCard>

            <FieldCard label="Estimated units sold per month" accentColor="#F36C3D">
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
              {unitsError && (
                <p className="mt-1 text-xs font-semibold text-[#F36C3D]">
                  Enter at least 1 unit per month.
                </p>
              )}
            </FieldCard>
          </div>

          {missingCosts && (
            <div className="rounded-2xl border-2 border-[#FCCBB0] bg-[#FFF5F0] px-5 py-4 mb-5">
              <p className="text-sm font-bold text-[#F36C3D]">Heads up! Your cost per unit is $0.00 right now.</p>
              <p className="text-xs text-[#9A3412] mt-1">
                Go back and add your fixed and variable costs so your pricing math is realistic.
              </p>
            </div>
          )}

          {priceBelowCostWarning && (
            <div className="rounded-2xl border border-[#FCCBB0] bg-[#FFF5F0] px-4 py-3 mb-4">
              <p className="text-xs font-bold text-[#F36C3D]">
                Friendly warning: this price is below your cost per unit.
              </p>
            </div>
          )}

          {/* Live analysis — only show when both inputs are filled */}
          {canProceed && (
            <div className="flex flex-col gap-3">
              {/* Profit-per-unit hero banner */}
              <div
                className={`rounded-2xl px-5 py-4 border-2 text-center ${
                  profitable
                    ? "bg-[#F0FFF4] border-[#86efac]"
                    : "bg-[#FFF5F5] border-[#fca5a5]"
                }`}
              >
                <p
                  className="text-4xl font-extrabold"
                  style={{ color: profitable ? "#16a34a" : "#dc2626" }}
                >
                  {profitable ? "+" : ""}${fmt(profitPerUnit)}
                </p>
                <p className="text-sm font-bold mt-1" style={{ color: profitable ? "#16a34a" : "#dc2626" }}>
                  profit per unit
                </p>
                <p className="text-xs text-[#9BBFC3] mt-1.5">
                  {profitable
                    ? "Nice, you're making money! 🎉"
                    : "Oh no - you're losing money on each sale 😬"}
                </p>
              </div>

              {/* 2×2 metric grid */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Cost per unit"
                  value={`$${fmt(costPerUnit)}`}
                  sub={`$${fmt(totalVariablePerUnit)} variable + $${fmt(fixedPerUnit)} fixed`}
                  color="#7B9EA3"
                  bg="#F7F9FA"
                  border="#E0EFF1"
                />
                <MetricCard
                  label="Selling price"
                  value={`$${fmt(sellingPrice)}`}
                  sub="per unit"
                  color="#5DB7C4"
                  bg="#F0FAFB"
                  border="#C8E8ED"
                />
                <MetricCard
                  label="Monthly revenue"
                  value={`$${fmt(monthlyRevenue)}`}
                  sub={`${unitsPerMonth} units × $${fmt(sellingPrice)}`}
                  color="#5DB7C4"
                  bg="#F0FAFB"
                  border="#C8E8ED"
                />
                <MetricCard
                  label="Monthly costs"
                  value={`$${fmt(monthlyCosts)}`}
                  sub={`${unitsPerMonth} units × $${fmt(costPerUnit)}`}
                  color="#7B9EA3"
                  bg="#F7F9FA"
                  border="#E0EFF1"
                />
              </div>

              {/* Monthly profit — full width */}
              <div
                className={`rounded-2xl px-5 py-4 border-2 flex items-center justify-between ${
                  monthlyProfit >= 0
                    ? "bg-[#F0FFF4] border-[#86efac]"
                    : "bg-[#FFF5F5] border-[#fca5a5]"
                }`}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7B9EA3]">
                    Monthly profit
                  </p>
                  <p className="text-[11px] text-[#9BBFC3] mt-0.5">
                    Revenue minus all costs
                  </p>
                </div>
                <p
                  className="text-3xl font-extrabold"
                  style={{ color: monthlyProfit >= 0 ? "#16a34a" : "#dc2626" }}
                >
                  {monthlyProfit >= 0 ? "+" : ""}${fmt(monthlyProfit)}
                </p>
              </div>

              {/* Margin bar */}
              {sellingPrice > 0 && <MarginBar pct={marginPct} />}

              {/* Break-even callout */}
              {breakEvenUnits !== null ? (
                <div className="rounded-2xl bg-[#FFFBEA] border-2 border-[#fde68a] px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#92400e] mb-1">
                    Break-even point
                  </p>
                  <p className="text-2xl font-extrabold text-[#b45309]">
                    {breakEvenUnits.toLocaleString()} units
                  </p>
                  <p className="text-xs text-[#92400e] mt-1">
                    You need to sell at least{" "}
                    <strong>{breakEvenUnits.toLocaleString()} units</strong> per month to cover
                    your fixed costs.
                    {unitsPerMonth >= breakEvenUnits
                      ? " You're on track! ✅"
                      : ` You're planning to sell ${unitsPerMonth} — ${
                          breakEvenUnits - unitsPerMonth
                        } more to break even.`}
                  </p>
                </div>
              ) : (
                profitPerUnit <= 0 && (
                  <div className="rounded-2xl bg-[#FFF5F5] border-2 border-[#fca5a5] px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#dc2626] mb-1">
                      Break-even point
                    </p>
                    <p className="text-sm text-[#dc2626]">
                      You can't break even at this price — you're losing money on every unit sold.
                      Try raising the selling price.
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-7 flex items-center justify-between gap-2">
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

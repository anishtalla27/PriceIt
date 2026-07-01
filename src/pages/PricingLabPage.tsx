import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeDollarSign, ClipboardCheck, TrendingUp } from "lucide-react";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import { FieldCard } from "@/components/ui/field-card";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { SaveStatus } from "@/components/ui/save-status";
import { useAppState } from "@/context/AppStateContext";
import type { FixedCostItem, VariableCostItem } from "@/context/AppStateContext";
import logo from "../../logo.png";

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

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roundMoney(n: number): number {
  return Math.max(0, Math.round(n * 100) / 100);
}

function niceMax(base: number, step: number): number {
  if (step <= 0 || base <= 0) return step > 0 ? step : 1;
  return Math.ceil(base / step) * step;
}

function priceStepFor(max: number): number {
  return max <= 10 ? 0.10 : 0.25;
}

function unitsStepFor(amount: number): number {
  if (amount >= 1000) return 50;
  if (amount >= 500) return 25;
  if (amount >= 150) return 10;
  if (amount >= 60) return 5;
  return 1;
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
  const safeValue = clamp(value, min, max);
  const pct = max > min ? ((safeValue - min) / (max - min)) * 100 : 0;

  return (
    <input
      type="range"
      className="priceit-range"
      min={min}
      max={max}
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

function MetricCard({
  label,
  value,
  helper,
  accent = "#5DB7C4",
  term,
}: {
  label: string;
  value: string;
  helper: string;
  accent?: string;
  term?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#DCE9EC] bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6F8A91]">
          {label}
          {term && <HelpTooltip term={term} />}
        </p>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
      </div>
      <p className="mt-2 text-2xl font-extrabold leading-tight text-[#2B2B2B]">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#6F8A91]">{helper}</p>
    </div>
  );
}

export default function PricingLabPage() {
  const navigate = useNavigate();
  const { state, updatePricing } = useAppState();
  const { productInfo, pricing, fixedCosts, variableCosts } = state;
  const mode = state.journeyMode ?? "create";

  const currentPrice = Number(pricing.sellingPrice) || 0;
  const currentUnits = Number(pricing.unitsPerMonth) || 0;
  const fixedMonthlyTotal = fixedCosts.reduce((sum, item) => sum + fixedMonthly(item), 0);
  const variableCost = variableCosts.reduce((sum, item) => sum + variableCPP(item), 0);
  const fixedPerUnit = currentUnits > 0 ? fixedMonthlyTotal / currentUnits : 0;
  const currentCostPerProduct = variableCost + fixedPerUnit;
  const currentProfitPerProduct = currentPrice - currentCostPerProduct;
  const currentMargin = currentPrice > 0 ? (currentProfitPerProduct / currentPrice) * 100 : 0;
  const currentRevenue = currentPrice * currentUnits;
  const currentMonthlyProfit = currentProfitPerProduct * currentUnits;
  const currentBreakEven =
    currentPrice > variableCost ? Math.ceil(fixedMonthlyTotal / (currentPrice - variableCost)) : null;

  const [labPrice, setLabPrice] = useState(currentPrice || Math.max(5, roundMoney(currentCostPerProduct + 2)));
  const [expectedSales, setExpectedSales] = useState(currentUnits || 20);

  // Stable slider bounds — never include the current slider value so there's no feedback loop
  const [labPriceMax, labPriceStep] = useMemo(() => {
    const base = Math.max(50, currentCostPerProduct * 5, variableCost * 5, currentPrice * 2);
    const step = priceStepFor(base);
    return [niceMax(base, step), step];
  }, [currentCostPerProduct, variableCost, currentPrice]);

  const [expectedSalesMax, expectedSalesStep] = useMemo(() => {
    const be = currentBreakEven ?? 0;
    const base = Math.max(200, currentUnits * 3, be * 3);
    const step = unitsStepFor(base);
    return [niceMax(base, step), step];
  }, [currentBreakEven, currentUnits]);

  const revenue = labPrice * expectedSales;
  const costPerUnitAtSales = variableCost + (expectedSales > 0 ? fixedMonthlyTotal / expectedSales : 0);
  const profitPerSale = labPrice - costPerUnitAtSales;
  const monthlyProfit = revenue - costPerUnitAtSales * expectedSales;
  const margin = labPrice > 0 ? (profitPerSale / labPrice) * 100 : 0;
  const breakEven = labPrice > variableCost ? Math.ceil(fixedMonthlyTotal / (labPrice - variableCost)) : null;
  const canSaveTestPrice =
    labPrice > 0 && (costPerUnitAtSales <= 0 || labPrice >= costPerUnitAtSales);
  const saveTestPriceWarning =
    labPrice <= 0
      ? "Set a price above $0 before saving it to your plan."
      : !canSaveTestPrice
        ? `This test price is below your $${fmt(costPerUnitAtSales)} cost per sale. Raise it before saving.`
        : null;

  const feedback = useMemo(() => {
    if (labPrice <= variableCost) return "Too low: this price does not cover the cost to make one product.";
    if (margin >= 30) return "Strong profit. Make sure customers understand why it is worth the price.";
    if (margin >= 15) return "Good balance. This price has room for profit and still feels testable.";
    if (monthlyProfit > 0) return "Thin profit. A small price increase could make this healthier.";
    return "Not profitable yet. Raise the price, lower costs, or sell more units.";
  }, [labPrice, margin, monthlyProfit, variableCost]);

  const currentDiagnosis = useMemo(() => {
    if (currentPrice <= 0) return "Add a price first so the lab can judge your plan.";
    if (currentProfitPerProduct <= 0) return "Your current price is below your full cost, so each sale loses money.";
    if (currentMargin >= 30) return "Your current price has a strong profit cushion.";
    if (currentMargin >= 15) return "Your current price looks workable, but it is still worth testing.";
    return "Your current price makes money, but the profit is thin.";
  }, [currentMargin, currentPrice, currentProfitPerProduct]);

  return (
    <div className="min-h-screen priceit-fade-in" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)" }}>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E0EFF1] bg-white/80 px-6 py-4 backdrop-blur-sm">
        <button onClick={() => navigate("/setup/pricing")} className="min-h-11 px-3 text-sm font-semibold text-[#5DB7C4] transition-colors hover:text-[#F36C3D]">
          Back
        </button>
        <img src={logo} alt="LaunchPad logo" className="h-14 w-auto" />
        <div className="w-16" />
      </header>

      <main className="px-4 py-4 sm:py-5">
        <div className="mx-auto w-full max-w-5xl">
          <ProgressSteps currentStep={4} mode={mode} />

          <div className="mb-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#5DB7C4]">Pricing Lab</p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight text-[#2B2B2B] sm:text-[2.35rem]">
              Understand your current price, then run a quick test.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6F8A91]">
              This first screen focuses on what your current price does for {productInfo.productName || "your product"}. The next screen helps you choose a pricing method.
            </p>
          </div>

          <section className="mb-4 rounded-3xl border border-[#DCE9EC] bg-white/95 px-4 py-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BadgeDollarSign className="h-6 w-6 text-[#5DB7C4]" />
                  <h2 className="text-2xl font-extrabold text-[#2B2B2B]">Current Pricing Snapshot</h2>
                </div>
                <p className="mt-1 text-base leading-relaxed text-[#6F8A91]">
                  These numbers use your saved price, costs, and monthly sales estimate.
                </p>
              </div>
              <p className="rounded-2xl border border-[#A9DDE3] bg-[#F0FAFB] px-4 py-3 text-base font-extrabold leading-snug text-[#2B2B2B] sm:max-w-sm">
                {currentDiagnosis}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-3xl border border-[#A9DDE3] bg-[#F0FAFB] px-5 py-5 sm:px-6 sm:py-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#5DB7C4]">
                  Main takeaway
                </p>
                <p className="mt-3 text-5xl font-extrabold leading-none text-[#2B2B2B] sm:text-6xl">
                  {currentProfitPerProduct >= 0 ? "+" : ""}${fmt(currentProfitPerProduct)}
                </p>
                <p className="mt-3 text-lg font-semibold leading-snug text-[#5B7780]">
                  profit each time you sell one at ${fmt(currentPrice)}.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#6F8A91]">
                      Monthly profit<HelpTooltip term="Monthly profit" />
                    </p>
                    <p className="mt-2 text-3xl font-extrabold leading-tight" style={{ color: currentMonthlyProfit >= 0 ? "#16a34a" : "#F36C3D" }}>
                      {currentMonthlyProfit >= 0 ? "+" : ""}${fmt(currentMonthlyProfit)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#6F8A91]">
                      Margin<HelpTooltip term="Profit margin" />
                    </p>
                    <p className="mt-2 text-3xl font-extrabold leading-tight text-[#F36C3D]">
                      {fmt(currentMargin)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#DCE9EC] bg-white px-5 py-5 sm:px-6 sm:py-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#6F8A91]">
                  Price check
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 border-b border-[#EAF0F2] pb-4">
                  <div>
                    <p className="text-sm font-bold text-[#6F8A91]">Price</p>
                    <p className="mt-1 text-3xl font-extrabold leading-tight text-[#2B2B2B]">${fmt(currentPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#6F8A91]">Cost</p>
                    <p className="mt-1 text-3xl font-extrabold leading-tight text-[#2B2B2B]">${fmt(currentCostPerProduct)}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-base">
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                    <span className="text-[#6F8A91]">Monthly revenue</span>
                    <strong className="text-[#2B2B2B]">${fmt(currentRevenue)}</strong>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                    <span className="text-[#6F8A91]">Break-even</span>
                    <strong className="text-[#2B2B2B]">
                      {currentBreakEven === null ? "Not yet" : `${currentBreakEven} units`}
                    </strong>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                    <span className="text-[#6F8A91]">Materials per item</span>
                    <strong className="text-[#2B2B2B]">${fmt(variableCost)}</strong>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                    <span className="text-[#6F8A91]">Fixed costs/month</span>
                    <strong className="text-[#2B2B2B]">${fmt(fixedMonthlyTotal)}</strong>
                  </div>
                </div>
                <p className="mt-4 rounded-2xl bg-[#F7F9FA] px-4 py-3 text-sm leading-relaxed text-[#6F8A91]">
                  Cost per product includes ${fmt(variableCost)} in materials plus about ${fmt(fixedPerUnit)} from fixed costs.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-4 rounded-3xl border border-[#DCE9EC] bg-white/95 px-4 py-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#F36C3D]" />
                  <h2 className="text-xl font-extrabold text-[#2B2B2B]">Quick Price Test</h2>
                </div>
                <p className="mt-1 text-sm text-[#6F8A91]">Only two controls: price and expected monthly sales.</p>
              </div>
              <div className="rounded-2xl border border-[#A9DDE3] bg-[#F0FAFB] px-3 py-2 text-sm font-extrabold text-[#2B2B2B]">
                {feedback}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="grid gap-3">
                <FieldCard label="Selling price" accentColor="#5DB7C4">
                  <div className="grid gap-2">
                    <input className="bauhaus-field-input" type="number" min="0" step={labPriceStep} value={labPrice} onChange={(event) => setLabPrice(Math.max(0, Number(event.target.value) || 0))} />
                    <RangeInput value={labPrice} min={0} max={labPriceMax} step={labPriceStep} accent="#5DB7C4" ariaLabel="Lab selling price" onChange={(value) => setLabPrice(roundMoney(value))} />
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#7B9EA3]">
                      <span>$0</span>
                      <span>${fmt(labPriceMax)}</span>
                    </div>
                    {saveTestPriceWarning && (
                      <p className="rounded-xl border border-[#F36C3D]/25 bg-[#FFF5F0] px-3 py-2 text-xs font-bold leading-relaxed text-[#F36C3D]">
                        {saveTestPriceWarning}
                      </p>
                    )}
                  </div>
                </FieldCard>
                <FieldCard label="Expected sales per month" accentColor="#F36C3D">
                  <div className="grid gap-2">
                    <input className="bauhaus-field-input" type="number" min="1" step={expectedSalesStep} value={expectedSales} onChange={(event) => setExpectedSales(Math.max(1, Math.round(Number(event.target.value) || 1)))} />
                    <RangeInput value={expectedSales} min={1} max={expectedSalesMax} step={expectedSalesStep} accent="#F36C3D" ariaLabel="Expected sales volume" onChange={(value) => setExpectedSales(Math.round(value))} />
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#7B9EA3]">
                      <span>1</span>
                      <span>{expectedSalesMax.toLocaleString()} sales</span>
                    </div>
                  </div>
                </FieldCard>
              </div>

              <div className="grid content-start gap-3 sm:grid-cols-2">
                <MetricCard label="Monthly revenue" value={`$${fmt(revenue)}`} helper={`${expectedSales.toLocaleString()} sales x $${fmt(labPrice)}`} accent="#5DB7C4" term="Monthly revenue" />
                <MetricCard label="Monthly profit" value={`${monthlyProfit >= 0 ? "+" : ""}$${fmt(monthlyProfit)}`} helper="Revenue minus monthly costs." accent={monthlyProfit >= 0 ? "#16a34a" : "#F36C3D"} term="Monthly profit" />
                <MetricCard label="Profit per sale" value={`${profitPerSale >= 0 ? "+" : ""}$${fmt(profitPerSale)}`} helper="Average money kept per sale." accent={profitPerSale >= 0 ? "#16a34a" : "#F36C3D"} />
                <MetricCard label="Break-even" value={breakEven === null ? "Not yet" : `${breakEven} units`} helper="Sales needed before profit starts." accent="#F59E0B" term="Break-even point" />
              </div>
            </div>
          </section>

          <section className="priceit-feature-cta mb-4 rounded-3xl bg-white/95 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border-2 border-[#A9DDE3] bg-white text-[#5DB7C4] shadow-sm">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="priceit-cta-badge mb-1">Next screen</p>
                  <h2 className="text-xl font-extrabold text-[#2B2B2B]">Next: choose a pricing method</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6F8A91]">
                    After you understand the quick test, move to the next lab screen to compare cost-plus, market-based, and value-based pricing.
                  </p>
                </div>
              </div>
              <ChronicleButton
                text="Choose Method"
                onClick={() => navigate("/setup/pricing-lab/strategies")}
                hoverColor="#F36C3D"
                customBackground="#5DB7C4"
                customForeground="#ffffff"
                hoverForeground="#ffffff"
                width="175px"
                borderRadius="10px"
              />
            </div>
          </section>

          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <ChronicleButton
              text="Use Test Price"
              onClick={() => {
                if (!canSaveTestPrice) return;
                updatePricing({ sellingPrice: roundMoney(labPrice), unitsPerMonth: Math.round(expectedSales) });
              }}
              hoverColor="#F36C3D"
              customBackground="#5DB7C4"
              customForeground="#ffffff"
              hoverForeground="#ffffff"
              width="170px"
              borderRadius="10px"
              disabled={!canSaveTestPrice}
            />
            <ChronicleButton
              text="See My Results"
              onClick={() => navigate("/results")}
              hoverColor="#F36C3D"
              customBackground="#5DB7C4"
              customForeground="#ffffff"
              hoverForeground="#ffffff"
              width="190px"
              borderRadius="10px"
            />
          </div>
          {saveTestPriceWarning && (
            <p className="mb-3 rounded-2xl border border-[#F36C3D]/25 bg-white px-4 py-3 text-sm font-bold text-[#F36C3D]">
              {saveTestPriceWarning}
            </p>
          )}
          <SaveStatus />
        </div>
      </main>
    </div>
  );
}

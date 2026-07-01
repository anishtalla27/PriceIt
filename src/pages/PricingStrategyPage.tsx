import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calculator, CheckCircle2, Sparkles, Store } from "lucide-react";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { SaveStatus } from "@/components/ui/save-status";
import { useAppState } from "@/context/AppStateContext";
import type { FixedCostItem, VariableCostItem } from "@/context/AppStateContext";
import logo from "../../logo.png";

type Strategy = "cost-plus" | "market" | "value";
type PriceInputValue = number | "";

interface ValueAnswers {
  custom: boolean;
  unique: boolean;
  quality: boolean;
  solvesProblem: boolean;
  giftable: boolean;
}

interface PricingStrategyDraft {
  markupPct?: number;
  lowPrice?: PriceInputValue;
  averagePrice?: PriceInputValue;
  highPrice?: PriceInputValue;
  valueAnswers?: ValueAnswers;
}

const PRICING_STRATEGY_DRAFT_KEY = "priceit_pricing_strategy_draft_v1";

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

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roundMoney(n: number): number {
  return Math.max(0, Math.round(n * 100) / 100);
}

function priceStepFor(amount: number): number {
  if (amount >= 5000) return 500;
  if (amount >= 1000) return 100;
  if (amount >= 500) return 50;
  if (amount >= 100) return 10;
  if (amount >= 25) return 1;
  return 0.25;
}

function readPriceInput(value: unknown): PriceInputValue | undefined {
  if (value === "") return "";
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  return undefined;
}

function priceNumber(value: PriceInputValue): number {
  return value === "" ? 0 : value;
}

function readPricingStrategyDraft(): PricingStrategyDraft {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PRICING_STRATEGY_DRAFT_KEY) ?? "{}") as Record<string, unknown>;
    const answers = parsed.valueAnswers && typeof parsed.valueAnswers === "object"
      ? parsed.valueAnswers as Partial<ValueAnswers>
      : null;
    return {
      markupPct: typeof parsed.markupPct === "number" && Number.isFinite(parsed.markupPct)
        ? parsed.markupPct
        : undefined,
      lowPrice: readPriceInput(parsed.lowPrice),
      averagePrice: readPriceInput(parsed.averagePrice),
      highPrice: readPriceInput(parsed.highPrice),
      valueAnswers: answers
        ? {
            custom: Boolean(answers.custom),
            unique: Boolean(answers.unique),
            quality: Boolean(answers.quality),
            solvesProblem: Boolean(answers.solvesProblem),
            giftable: Boolean(answers.giftable),
          }
        : undefined,
    };
  } catch {
    return {};
  }
}

function stripEndingPunctuation(value: string): string {
  return value.trim().replace(/[.!?]+$/, "");
}

function valueReasonFromAnswers(answers: ValueAnswers, specialFeature: string): string {
  if (answers.custom) return "it is made for each customer";
  if (answers.unique) return "customers cannot easily find the same thing somewhere else";
  if (answers.quality) return "it uses better materials or looks higher quality";
  if (answers.solvesProblem) return "it solves a problem customers care about";
  if (answers.giftable) return "it feels special enough to give as a gift";

  const feature = stripEndingPunctuation(specialFeature);
  if (/costs? less|cheaper|affordable|low price|discount/i.test(feature)) {
    return "it gives customers good value while still covering your costs";
  }
  return feature || "customers can see what makes it special";
}

function Metric({
  label,
  value,
  helper,
  accent = "#2F6F7A",
  term,
  warning,
}: {
  label: string;
  value: string;
  helper: string;
  accent?: string;
  term?: string;
  warning?: string | null;
}) {
  return (
    <div className={`rounded-2xl border bg-white px-4 py-4 shadow-sm ${warning ? "border-[#A65A3F]" : "border-[#D9E2E5]"}`}>
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#65777D]">
        {label}
        {term && <HelpTooltip term={term} />}
      </p>
      <p className="mt-2 break-words text-2xl font-extrabold text-[#2B2B2B]" style={{ color: accent }}>
        {value}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[#65777D]">{helper}</p>
      {warning && (
        <p className="mt-2 rounded-xl border border-[#A65A3F]/25 bg-[#F7F0EC] px-3 py-2 text-xs font-bold leading-relaxed text-[#A65A3F]">
          {warning}
        </p>
      )}
    </div>
  );
}

function LessonBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[#D9E2E5] bg-white px-4 py-4 shadow-sm">
      {children}
    </div>
  );
}

export default function PricingStrategyPage() {
  const navigate = useNavigate();
  const params = useParams();
  const strategy = (params.strategy ?? "cost-plus") as Strategy;
  const { state, updatePricing } = useAppState();
  const { productInfo, pricing, fixedCosts, variableCosts } = state;

  const currentPrice = Number(pricing.sellingPrice) || 0;
  const unitsPerMonth = Number(pricing.unitsPerMonth) || 1;
  const fixedMonthlyTotal = fixedCosts.reduce((sum, item) => sum + fixedMonthly(item), 0);
  const variableCost = variableCosts.reduce((sum, item) => sum + variableCPP(item), 0);
  const costPerProduct = variableCost + fixedMonthlyTotal / unitsPerMonth;
  const [markupPct, setMarkupPct] = useState(() => readPricingStrategyDraft().markupPct ?? 50);
  const desiredProfit = roundMoney(costPerProduct * markupPct / 100);
  const [lowPrice, setLowPrice] = useState<PriceInputValue>(() =>
    readPricingStrategyDraft().lowPrice ?? Math.max(1, roundMoney(currentPrice * 0.8 || costPerProduct + 1))
  );
  const [averagePrice, setAveragePrice] = useState<PriceInputValue>(() =>
    readPricingStrategyDraft().averagePrice ?? Math.max(2, roundMoney(currentPrice || costPerProduct + 2))
  );
  const [highPrice, setHighPrice] = useState<PriceInputValue>(() =>
    readPricingStrategyDraft().highPrice ?? Math.max(3, roundMoney(currentPrice * 1.25 || costPerProduct + 4))
  );
  const [valueAnswers, setValueAnswers] = useState<ValueAnswers>(() => readPricingStrategyDraft().valueAnswers ?? {
    custom: false,
    unique: false,
    quality: false,
    solvesProblem: false,
    giftable: false,
  });

  useEffect(() => {
    window.localStorage.setItem(
      PRICING_STRATEGY_DRAFT_KEY,
      JSON.stringify({ markupPct, lowPrice, averagePrice, highPrice, valueAnswers })
    );
  }, [averagePrice, highPrice, lowPrice, markupPct, valueAnswers]);

  const costPlusPrice = roundMoney(costPerProduct + desiredProfit);
  const valueScore = Object.values(valueAnswers).filter(Boolean).length;
  const valueLow = roundMoney(costPerProduct + Math.max(1, desiredProfit) + valueScore * 0.75);
  const valueHigh = roundMoney(valueLow + Math.max(1.5, valueScore * 1.2));
  const priceStep = priceStepFor(Math.max(costPerProduct, currentPrice, priceNumber(highPrice), desiredProfit));
  const marketWarning = (price: PriceInputValue) => {
    if (price === "") return "Add a competitor price to compare it with your costs.";
    return costPerProduct > 0 && price < costPerProduct
      ? `Below your $${fmt(costPerProduct)} cost. This would lose money unless your costs change.`
      : null;
  };
  const selectedStrategyPrice =
    strategy === "cost-plus" ? costPlusPrice : strategy === "market" ? priceNumber(averagePrice) : valueLow;
  const canUseStrategyPrice =
    (strategy !== "market" || averagePrice !== "") &&
    selectedStrategyPrice > 0 &&
    (costPerProduct <= 0 || selectedStrategyPrice >= costPerProduct);
  const strategyPriceWarning =
    strategy === "market" && averagePrice === ""
      ? "Add an average competitor price before saving this method."
      : selectedStrategyPrice <= 0
      ? "Choose a price above $0 before saving it."
      : !canUseStrategyPrice
        ? `This price is below your $${fmt(costPerProduct)} cost per product. Raise it before saving.`
        : null;
  const valueReason = valueReasonFromAnswers(valueAnswers, productInfo.specialFeature);

  const meta = {
    "cost-plus": {
      title: "Cost-Plus Pricing",
      eyebrow: "Start with your costs",
      icon: <Calculator className="h-5 w-5" />,
      intro: "Cost-plus pricing means: cost per product plus the profit you want. It is the easiest way to avoid accidentally losing money.",
    },
    market: {
      title: "Market-Based Pricing",
      eyebrow: "Compare similar products",
      icon: <Store className="h-5 w-5" />,
      intro: "Market-based pricing means looking at what similar products sell for, then deciding where your product belongs.",
    },
    value: {
      title: "Value-Based Pricing",
      eyebrow: "Price the extra value",
      icon: <Sparkles className="h-5 w-5" />,
      intro: "Value-based pricing asks what customers get from your product, not just what it costs to make.",
    },
  }[strategy] ?? {
    title: "Cost-Plus Pricing",
    eyebrow: "Start with your costs",
    icon: <Calculator className="h-5 w-5" />,
    intro: "Cost-plus pricing means: cost per product plus the profit you want.",
  };

  return (
    <div className="min-h-screen priceit-fade-in" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)" }}>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#DCE5E8] bg-white px-6 py-4">
        <button onClick={() => navigate("/setup/pricing-lab/strategies")} className="min-h-11 px-3 text-sm font-semibold text-[#2F6F7A] transition-colors hover:text-[#A65A3F]">
          Methods
        </button>
        <img src={logo} alt="LaunchPad logo" className="h-14 w-auto" />
        <div className="w-16" />
      </header>

      <main className="px-4 py-5">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#2F6F7A]">{meta.eyebrow}</p>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F7F8] text-[#2F6F7A]">
                {meta.icon}
              </div>
              <h1 className="text-3xl font-extrabold leading-tight text-[#2B2B2B] sm:text-[2.35rem]">{meta.title}</h1>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#65777D]">
              {meta.intro}
            </p>
          </div>

          <section className="mb-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Your price" value={`$${fmt(currentPrice)}`} helper="The price saved in your plan." />
            <Metric label="Cost per product" value={`$${fmt(costPerProduct)}`} helper="Your estimated cost for one product." term="Cost per unit" />
            <Metric label="Product" value={productInfo.productName || "Your product"} helper={productInfo.category || "Use this lesson with your current idea."} accent="#A65A3F" />
          </section>

          {strategy === "cost-plus" && (
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <LessonBox>
                <h2 className="text-xl font-extrabold text-[#2B2B2B]">Build the price</h2>
                <p className="mt-1 text-sm text-[#65777D]">Choose how much profit you want from each sale.</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#65777D]">Desired profit %</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={500}
                        step={1}
                        value={markupPct}
                        onChange={(e) => setMarkupPct(Math.max(0, Math.min(500, Number(e.target.value) || 0)))}
                        className="w-16 rounded-lg border border-[#B9C9CE] bg-white px-2 py-1 text-right text-sm font-bold text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#2F6F7A]"
                      />
                      <span className="text-sm font-bold text-[#65777D]">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={5}
                    value={Math.min(markupPct, 200)}
                    onChange={(e) => setMarkupPct(Number(e.target.value))}
                    className="w-full accent-[#2F6F7A]"
                  />
                  <div className="flex justify-between text-xs text-[#8A9CA1] mt-1">
                    <span>0%</span>
                    <span>100%</span>
                    <span>200%+</span>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-[#F4F7F8] px-4 py-4">
                  <p className="text-sm font-bold text-[#65777D]">${fmt(costPerProduct)} cost + {markupPct}% = ${fmt(desiredProfit)} profit</p>
                  <p className="mt-1 text-3xl font-extrabold text-[#2F6F7A]">${fmt(costPlusPrice)}</p>
                </div>
              </LessonBox>
              <LessonBox>
                <h2 className="text-xl font-extrabold text-[#2B2B2B]">When this works best</h2>
                <div className="mt-3 grid gap-2">
                  {[
                    "You are still learning what customers will pay.",
                    "Your costs are clear and you do not want to lose money.",
                    "You want a simple starting price to test for one week.",
                  ].map((item) => (
                    <p key={item} className="flex gap-2 rounded-2xl bg-[#F7F9FA] px-3 py-2 text-sm text-[#2B2B2B]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#2E7D52]" />
                      {item}
                    </p>
                  ))}
                </div>
                <p className="mt-3 text-sm text-[#65777D]">Watch out: cost-plus does not tell you whether customers think the price feels fair. Test it with real people.</p>
              </LessonBox>
            </div>
          )}

          {strategy === "market" && (
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <LessonBox>
                <h2 className="text-xl font-extrabold text-[#2B2B2B]">Enter competitor prices</h2>
                <p className="mt-1 text-sm text-[#65777D]">Use prices from similar products. They do not need to be perfect.</p>
                <div className="mt-4 flex flex-col gap-3">
                  {([
                    { label: "Low", dot: "#2F7D52", value: lowPrice, setter: setLowPrice },
                    { label: "Average", dot: "#A86F20", value: averagePrice, setter: setAveragePrice },
                    { label: "High", dot: "#A65A3F", value: highPrice, setter: setHighPrice },
                  ] as const).map(({ label, dot, value, setter }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-3 rounded-2xl border bg-[#F7FCFD] px-4 py-3 ${
                        value === "" ? "border-[#A65A3F]" : "border-[#DCE5E8]"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: dot }} />
                      <span className="w-16 text-xs font-bold uppercase tracking-wider text-[#65777D]">{label}</span>
                      <div className="flex flex-1 items-center gap-1">
                        <span className="text-sm font-bold text-[#65777D]">$</span>
                        <input
                          type="number"
                          min="0"
                          step={priceStep}
                          value={value}
                          placeholder="0.00"
                          onChange={(e) => {
                            if (e.target.value === "") {
                              setter("");
                              return;
                            }
                            const next = Number(e.target.value);
                            if (!Number.isFinite(next)) return;
                            setter(Math.max(0, next));
                          }}
                          onBlur={() => {
                            if (value !== "") setter(roundMoney(value));
                          }}
                          className={`w-full rounded-xl border bg-white px-3 py-2 text-sm font-bold text-[#2B2B2B] placeholder:text-[#9AA9AD] focus:outline-none focus:ring-2 focus:ring-[#2F6F7A] ${
                            value === "" ? "border-[#A65A3F]" : "border-[#B9C9CE]"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </LessonBox>
              <LessonBox>
                <h2 className="text-xl font-extrabold text-[#2B2B2B]">Choose your position</h2>
                <div className="mt-3 grid gap-3">
                  <Metric
                    label="Budget option"
                    value={lowPrice === "" ? "Add price" : `$${fmt(lowPrice)}`}
                    helper="Good if you want customers to try you easily."
                    accent={marketWarning(lowPrice) ? "#A65A3F" : "#2F6F7A"}
                    warning={marketWarning(lowPrice)}
                  />
                  <Metric
                    label="Average option"
                    value={averagePrice === "" ? "Add price" : `$${fmt(averagePrice)}`}
                    helper="Good if your product is similar to others."
                    accent={marketWarning(averagePrice) ? "#A65A3F" : "#A86F20"}
                    warning={marketWarning(averagePrice)}
                  />
                  <Metric
                    label="Premium option"
                    value={highPrice === "" ? "Add price" : `$${fmt(highPrice)}`}
                    helper="Good only if your product looks or feels better."
                    accent="#A65A3F"
                    warning={marketWarning(highPrice)}
                  />
                </div>
                <p className="mt-3 text-sm text-[#65777D]">Watch out: if a competitor is cheaper because their costs are lower, copying them may hurt your profit.</p>
              </LessonBox>
            </div>
          )}

          {strategy === "value" && (
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <LessonBox>
                <h2 className="text-xl font-extrabold text-[#2B2B2B]">What extra value do customers get?</h2>
                <p className="mt-1 text-sm text-[#65777D]">Check what makes your product worth more than a basic version.</p>
                <div className="mt-4 grid gap-2">
                  {[
                    ["custom", "It is custom-made for the customer."],
                    ["unique", "It is different from what people usually see."],
                    ["quality", "It uses better materials or looks higher quality."],
                    ["solvesProblem", "It saves time or solves a real problem."],
                    ["giftable", "It feels special enough to give as a gift."],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 rounded-2xl border border-[#D9E2E5] bg-[#F7F9FA] px-3 py-2 text-sm font-bold text-[#2B2B2B]">
                      <input
                        type="checkbox"
                        checked={valueAnswers[key as keyof typeof valueAnswers]}
                        onChange={(event) => setValueAnswers((prev) => ({ ...prev, [key]: event.target.checked }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </LessonBox>
              <LessonBox>
                <h2 className="text-xl font-extrabold text-[#2B2B2B]">Value price range</h2>
                <div className="mt-3 rounded-2xl bg-[#F4F7F8] px-4 py-4">
                  <p className="text-sm font-bold text-[#65777D]">{valueScore} value signals selected</p>
                  <p className="mt-1 text-3xl font-extrabold text-[#2F6F7A]">${fmt(valueLow)} - ${fmt(valueHigh)}</p>
                </div>
                <p className="mt-3 text-sm text-[#65777D]">This is not a magic answer. It is a test range. Customers need to understand the extra value before they pay more.</p>
                <p className="mt-3 rounded-2xl bg-[#F7F9FA] px-3 py-2 text-sm text-[#2B2B2B]">
                  Try saying: “This price works because {valueReason}.”
                </p>
              </LessonBox>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <ChronicleButton
              text="Back to Methods"
              onClick={() => navigate("/setup/pricing-lab/strategies")}
              hoverColor="#2F6F7A"
              customBackground="#E7EBED"
              customForeground="#2F6F7A"
              hoverForeground="#ffffff"
              width="150px"
              borderRadius="10px"
            />
            <ChronicleButton
              text="Use This Price"
              onClick={() => {
                if (!canUseStrategyPrice) return;
                updatePricing({ sellingPrice: roundMoney(selectedStrategyPrice) });
                navigate("/setup/pricing-lab");
              }}
              hoverColor="#A65A3F"
              customBackground="#2F6F7A"
              customForeground="#ffffff"
              hoverForeground="#ffffff"
              width="170px"
              borderRadius="10px"
              disabled={!canUseStrategyPrice}
            />
          </div>
          {strategyPriceWarning && (
            <p className="mt-3 rounded-2xl border border-[#A65A3F]/25 bg-white px-4 py-3 text-sm font-bold text-[#A65A3F]">
              {strategyPriceWarning}
            </p>
          )}
          <SaveStatus />
        </div>
      </main>
    </div>
  );
}

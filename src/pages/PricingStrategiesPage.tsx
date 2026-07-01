import { useNavigate } from "react-router-dom";
import { Calculator, Sparkles, Store } from "lucide-react";
import { ChronicleButton } from "@/components/ui/chronicle-button";
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

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PricingStrategiesPage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const { productInfo, pricing, fixedCosts, variableCosts } = state;
  const currentPrice = Number(pricing.sellingPrice) || 0;
  const currentUnits = Number(pricing.unitsPerMonth) || 1;
  const fixedMonthlyTotal = fixedCosts.reduce((sum, item) => sum + fixedMonthly(item), 0);
  const variableCost = variableCosts.reduce((sum, item) => sum + variableCPP(item), 0);
  const costPerProduct = variableCost + fixedMonthlyTotal / currentUnits;

  const strategies = [
    {
      path: "cost-plus",
      icon: <Calculator className="h-6 w-6" />,
      title: "Cost-Plus Pricing",
      subtitle: "Start with your costs.",
      text: "Best when you want a clear, safe starting price. You choose how much profit to add on top of what each product costs.",
      example: `$${fmt(costPerProduct)} cost + your profit goal = your price`,
      accent: "#0E92A3",
    },
    {
      path: "market",
      icon: <Store className="h-6 w-6" />,
      title: "Market-Based Pricing",
      subtitle: "Compare similar products.",
      text: "Best when customers can compare your product to other options. You decide if you want to be budget, average, or premium.",
      example: `Your current price is $${fmt(currentPrice)}. Compare it with similar products.`,
      accent: "#F0A92E",
    },
    {
      path: "value",
      icon: <Sparkles className="h-6 w-6" />,
      title: "Value-Based Pricing",
      subtitle: "Price what makes it special.",
      text: "Best when your product is custom, unique, higher quality, or solves a problem. You test whether customers see extra value.",
      example: productInfo.specialFeature
        ? `Your special feature: ${productInfo.specialFeature}`
        : "Special features can support a higher price.",
      accent: "#E1603F",
    },
  ];

  return (
    <div className="min-h-screen priceit-fade-in" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)" }}>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#CDEBF0] bg-white px-6 py-4">
        <button onClick={() => navigate("/setup/pricing-lab")} className="min-h-11 rounded-xl bg-[#0E92A3] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#E1603F]">
          Lab
        </button>
        <img src={logo} alt="LaunchPad logo" className="h-14 w-auto" />
        <div className="w-16" />
      </header>

      <main className="px-4 py-5">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0E92A3]">Pricing Lab: methods</p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight text-[#2B2B2B] sm:text-[2.35rem]">
              Pick one way to think about your price.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#4F747C]">
              These are three common pricing models. Each one teaches a different way to decide what {productInfo.productName || "your product"} should cost.
            </p>
          </div>

          <div className="mb-4 grid gap-3 lg:grid-cols-3">
            {strategies.map((strategy) => (
              <button
                key={strategy.path}
                type="button"
                onClick={() => navigate(`/setup/pricing-lab/${strategy.path}`)}
                className="priceit-feature-cta flex min-h-[290px] flex-col rounded-3xl bg-white px-4 py-4 text-left transition-all"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#9BD8E2] bg-white shadow-sm" style={{ color: strategy.accent }}>
                  {strategy.icon}
                </div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: strategy.accent }}>
                  {strategy.subtitle}
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-[#2B2B2B]">{strategy.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#4F747C]">{strategy.text}</p>
                <p className="mt-3 rounded-2xl bg-[#F8FBFC] px-3 py-2 text-sm font-bold text-[#2B2B2B]">
                  {strategy.example}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="priceit-cta-badge">Tap to open</span>
                  <span className="priceit-cta-arrow">→</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <ChronicleButton
              text="Back to Lab"
              onClick={() => navigate("/setup/pricing-lab")}
              hoverColor="#0E92A3"
              customBackground="#0E92A3"
              customForeground="#ffffff"
              hoverForeground="#ffffff"
              width="150px"
              borderRadius="10px"
            />
            <ChronicleButton
              text="See Results"
              onClick={() => navigate("/results")}
              hoverColor="#E1603F"
              customBackground="#0E92A3"
              customForeground="#ffffff"
              hoverForeground="#ffffff"
              width="160px"
              borderRadius="10px"
            />
          </div>
          <SaveStatus />
        </div>
      </main>
    </div>
  );
}

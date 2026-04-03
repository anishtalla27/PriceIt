import { useEffect, useState } from "react";
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
    <div className="flex flex-col items-center gap-1 px-4 py-3 bg-[#F7F9FA] rounded-2xl flex-1 min-w-0">
      <p className="text-[10px] uppercase tracking-wider font-bold text-[#9BBFC3] whitespace-nowrap">
        {label}
      </p>
      <p className={`text-lg font-extrabold truncate ${colors[accent ?? "teal"]}`}>{value}</p>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

const QUALITY_OPTIONS: StartingQuality[] = ["Standard", "Premium", "Deluxe"];

const QUALITY_DESC: Record<StartingQuality, string> = {
  Standard: "Affordable materials — easier to sell in volume",
  Premium: "Better materials — customers pay more",
  Deluxe: "Top quality — fewer sales, highest margins",
};

export default function SimulateSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, updateSimConfig } = useAppState();
  const { productInfo, fixedCosts, variableCosts, pricing, simConfig } = state;
  const [flowNotice, setFlowNotice] = useState<string | null>(null);

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
  const defaultCash = Math.max(
    100,
    Math.ceil((totalMonthlyFixed * 2) / 50) * 50
  );
  const defaultWeekly = Math.max(1, Math.round(unitsPerMonth / 4));

  const [cash, setCash] = useState<number | "">(
    simConfig.startingCash !== "" ? simConfig.startingCash : defaultCash
  );
  const [weekly, setWeekly] = useState<number | "">(
    simConfig.maxWeeklyUnits !== "" ? simConfig.maxWeeklyUnits : defaultWeekly
  );
  const [quality, setQuality] = useState<StartingQuality>(simConfig.startingQuality);

  // keep simConfig in sync as user edits
  useEffect(() => {
    updateSimConfig({ startingCash: cash, maxWeeklyUnits: weekly, startingQuality: quality });
  }, [cash, weekly, quality]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const routeState = location.state as { message?: string } | null;
    if (routeState?.message) {
      setFlowNotice(routeState.message);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const canStart =
    cash !== "" && Number(cash) >= 50 && weekly !== "" && Number(weekly) >= 1;

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
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#E0EFF1] bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <button
          onClick={() => navigate("/results")}
          className="min-h-11 px-3 text-[#5DB7C4] font-semibold text-sm hover:text-[#F36C3D] transition-colors"
        >
          Back
        </button>
        <img src={logo} alt="PriceIt logo" className="h-9 w-auto" />
        <div className="w-16" />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-lg flex flex-col gap-6">

          {/* ── Headline ── */}
          <div className="text-center">
            {flowNotice && (
              <div className="mb-3 rounded-xl border border-[#A9DDE3] bg-white px-4 py-2 text-sm font-semibold text-[#2B2B2B]">
                {flowNotice}
              </div>
            )}
            <p className="text-xs font-bold uppercase tracking-widest text-[#F36C3D] mb-2">
              Business Simulator
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2B2B2B] leading-tight">
              Ready to run your business?
            </h1>
            <p className="mt-2 text-[#7B9EA3] text-sm leading-relaxed max-w-sm mx-auto">
              You're about to run{" "}
              <strong>{productInfo.productName || "your product"}</strong> for{" "}
              <strong>12 weeks</strong>. Good luck, CEO! 🚀
            </p>
          </div>

          {/* ── Product summary card ── */}
          <div className="bg-white rounded-3xl border border-[#E0EFF1] px-5 py-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-lg text-[#2B2B2B] truncate">
                  {productInfo.productName || "Your Product"}
                </p>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-[#EAF7F9] text-[#5DB7C4] px-2 py-0.5 rounded-full">
                  {productInfo.category || "Product"}
                </span>
              </div>
              <div
                className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: profitable ? "#F0FFF4" : "#FFF5F0" }}
              >
                {profitable ? "📈" : "📉"}
              </div>
            </div>

            <div className="flex gap-2">
              <StatPill label="Selling Price" value={`$${sellingPrice.toFixed(2)}`} accent="teal" />
              <StatPill
                label="Cost / Unit"
                value={`$${costPerUnit.toFixed(2)}`}
                accent="orange"
              />
              <StatPill
                label="Profit / Unit"
                value={`${profitable ? "+" : ""}$${profitPerUnit.toFixed(2)}`}
                accent={profitable ? "green" : "red"}
              />
            </div>
          </div>

          {/* ── Config inputs ── */}
          <div className="bg-white rounded-3xl border border-[#E0EFF1] px-5 py-6 shadow-sm flex flex-col gap-6">
            <p className="text-sm font-bold text-[#2B2B2B]">
              Set up your simulation ⚙️
            </p>

            {/* Starting cash */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#2B2B2B]">
                Starting Budget
              </label>
              <p className="text-xs text-[#9BBFC3] -mt-1">
                How much money are you starting with? (minimum $50)
              </p>
              <div className="flex items-center border-2 border-[#E0EFF1] focus-within:border-[#5DB7C4] rounded-xl px-4 py-3 bg-[#F7F9FA] transition-colors">
                <span className="text-[#5DB7C4] font-bold mr-2 text-lg">$</span>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={cash}
                  onChange={(e) =>
                    setCash(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder={String(defaultCash)}
                  className="bg-transparent flex-1 outline-none text-[#2B2B2B] text-lg font-bold placeholder-[#C8D8DC]"
                />
              </div>
              {cash !== "" && Number(cash) < 50 && (
                <p className="text-xs text-[#F36C3D] font-semibold">
                  Minimum starting budget is $50
                </p>
              )}
            </div>

            {/* Max weekly units */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#2B2B2B]">
                Max Units Per Week
              </label>
              <p className="text-xs text-[#9BBFC3] -mt-1">
                How many units can you make each week? (suggested:{" "}
                {defaultWeekly})
              </p>
              <div className="flex items-center border-2 border-[#E0EFF1] focus-within:border-[#5DB7C4] rounded-xl px-4 py-3 bg-[#F7F9FA] transition-colors">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={weekly}
                  onChange={(e) =>
                    setWeekly(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder={String(defaultWeekly)}
                  className="bg-transparent flex-1 outline-none text-[#2B2B2B] text-lg font-bold placeholder-[#C8D8DC]"
                />
                <span className="text-[#9BBFC3] text-sm font-semibold ml-2">
                  units / week
                </span>
              </div>
            </div>

            {/* Material quality */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#2B2B2B]">
                Starting Material Quality
              </label>
              <p className="text-xs text-[#9BBFC3] -mt-1">
                This affects how many customers want to buy from you
              </p>
              <div className="flex gap-2">
                {QUALITY_OPTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    className="flex-1 rounded-xl py-3 text-sm font-bold border-2 transition-all"
                    style={{
                      borderColor: quality === q ? "#5DB7C4" : "#E0EFF1",
                      background: quality === q ? "#EAF7F9" : "#F7F9FA",
                      color: quality === q ? "#5DB7C4" : "#9BBFC3",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#7B9EA3] mt-1 font-medium">
                {QUALITY_DESC[quality]}
              </p>
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="flex justify-center pb-6">
            <ChronicleButton
              text="Start Simulation 🚀"
              onClick={handleStart}
              hoverColor="#F36C3D"
              customBackground="#5DB7C4"
              customForeground="#ffffff"
              hoverForeground="#ffffff"
              width="240px"
              borderRadius="12px"
              disabled={!canStart}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

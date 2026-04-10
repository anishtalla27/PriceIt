import { useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import logo from "../../logo.png";

// ─── types (subset of game state passed via navigate) ────────────────────────

interface PassedResult {
  week: number;
  unitsSold: number;
  finalDemand: number;
  revenue: number;
  totalCost: number;
  profit: number;
  endCash: number;
}

interface PassedState {
  week: number;
  cash: number;
  cashHistory: number[];
  satisfaction: number;
  weeklyResults: PassedResult[];
}

// ─── lessons logic ────────────────────────────────────────────────────────────

function generateLessons(results: PassedResult[], satisfaction: number): string[] {
  const lessons: string[] = [];
  const stockoutWeeks = results.filter(r => r.finalDemand > r.unitsSold).length;
  const lossWeeks = results.filter(r => r.profit < 0).length;
  const totalRevenue = results.reduce((s, r) => s + r.revenue, 0);
  const totalCost = results.reduce((s, r) => s + r.totalCost, 0);

  // Lesson 1: production vs demand
  if (stockoutWeeks > results.length * 0.5) {
    lessons.push("You kept running out of stock! Next time, try making a few extra units each week so more customers can buy.");
  } else if (lossWeeks > results.length * 0.6) {
    lessons.push("Most weeks ended in a loss. Try making fewer items so your costs stay low, or bump up your selling price a little.");
  } else {
    lessons.push("Getting production just right is tricky. Too much wastes money, too little loses sales. Keep practicing!");
  }

  // Lesson 2: revenue vs cost
  if (totalCost > totalRevenue) {
    lessons.push("Your costs ended up higher than your income. A small price increase or cheaper materials can make a big difference.");
  } else {
    lessons.push("Marketing can really help. Even free stuff like word of mouth or a small flyer budget can bring in a lot more customers.");
  }

  // Lesson 3: satisfaction
  if (satisfaction < 50) {
    lessons.push("Customer happiness got pretty low. Keeping items in stock and using good materials helps people come back for more.");
  } else {
    lessons.push("Happy customers are your best tool. Keep them satisfied and they will tell their friends about you!");
  }

  return lessons;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SimulateGameOverPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: appState } = useAppState();
  const startingCash = Math.max(50, Number(appState.simConfig.startingCash) || 200);

  const gs = location.state as PassedState | null;

  // Fallback if landed here directly
  if (!gs || !gs.weeklyResults) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center"
        style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)" }}
      >
        <p className="text-xl font-bold text-[#2B2B2B]">No game data found.</p>
        <ChronicleButton
          text="Go to Simulator"
          onClick={() => navigate("/simulate")}
          hoverColor="#F36C3D"
          customBackground="#5DB7C4"
          customForeground="#ffffff"
          hoverForeground="#ffffff"
          width="200px"
          borderRadius="10px"
        />
      </div>
    );
  }

  const { weeklyResults, satisfaction, cashHistory } = gs;

  // ── derived stats ────────────────────────────────────────────────────
  const weeksCompleted = weeklyResults.length;

  const allCash = [startingCash, ...weeklyResults.map(r => r.endCash)];
  const peakCash = Math.max(...allCash);
  const peakWeekIdx = allCash.indexOf(peakCash); // 0 = before week 1, 1 = after week 1, etc.
  const peakLabel = peakWeekIdx === 0 ? "at start" : `Week ${peakWeekIdx}`;

  const bestResult = [...weeklyResults].sort((a, b) => b.profit - a.profit)[0];
  const worstResult = [...weeklyResults].sort((a, b) => a.profit - b.profit)[0];

  const lessons = generateLessons(weeklyResults, satisfaction);

  return (
    <div
      className="min-h-screen flex flex-col priceit-fade-in"
      style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)" }}
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
        <div className="w-full max-w-lg flex flex-col gap-5">

          {/* ── Heading ── */}
          <div className="text-center">
            <div className="text-5xl mb-3">😔</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2B2B2B] leading-tight">
              You ran out of cash
            </h1>
            <p className="mt-3 text-[#7B9EA3] text-sm leading-relaxed max-w-sm mx-auto">
              Running a business is hard! Even the best entrepreneurs fail sometimes.
              The important thing is what you learned — and you learned a lot. 💡
            </p>
          </div>

          {/* ── What went wrong card ── */}
          <div className="bg-white rounded-3xl border border-[#E0EFF1] px-5 py-5 shadow-sm flex flex-col gap-3">
            <p className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider">What happened</p>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Made it to",
                  val: `Week ${weeksCompleted} of 12`,
                  color: "#5DB7C4",
                },
                {
                  label: "Peak cash",
                  val: `$${peakCash.toFixed(2)}`,
                  sub: peakLabel,
                  color: "#16a34a",
                },
                {
                  label: "Best week",
                  val: bestResult
                    ? `${bestResult.profit >= 0 ? "+" : ""}$${bestResult.profit.toFixed(2)}`
                    : "—",
                  sub: bestResult ? `Week ${bestResult.week}` : undefined,
                  color: "#16a34a",
                },
                {
                  label: "Worst week",
                  val: worstResult
                    ? `-$${Math.abs(worstResult.profit).toFixed(2)}`
                    : "—",
                  sub: worstResult ? `Week ${worstResult.week}` : undefined,
                  color: "#F36C3D",
                },
              ].map(({ label, val, sub, color }) => (
                <div key={label} className="bg-[#F7F9FA] rounded-2xl px-4 py-3">
                  <p className="text-[10px] font-bold text-[#9BBFC3] uppercase tracking-wider mb-1">{label}</p>
                  <p className="font-extrabold text-base leading-tight" style={{ color }}>{val}</p>
                  {sub && <p className="text-[10px] text-[#9BBFC3] font-semibold mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>

            {/* Satisfaction */}
            <div className="bg-[#F7F9FA] rounded-2xl px-4 py-3 flex items-center justify-between">
              <p className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider">Final Customer Satisfaction</p>
              <p
                className="font-extrabold text-base"
                style={{ color: satisfaction >= 61 ? "#22c55e" : satisfaction >= 31 ? "#f59e0b" : "#ef4444" }}
              >
                {satisfaction}/100
              </p>
            </div>

            {/* Mini cash history */}
            {cashHistory.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-bold text-[#9BBFC3] uppercase tracking-wider">Weekly profit/loss</p>
                <div className="flex gap-1 items-end h-8">
                  {cashHistory.map((p, i) => {
                    const maxAbs = Math.max(...cashHistory.map(Math.abs), 1);
                    const pct = Math.max(8, (Math.abs(p) / maxAbs) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col justify-end h-full" title={`Week ${i + 1}: ${p >= 0 ? "+" : ""}$${p.toFixed(2)}`}>
                        <div
                          className="w-full rounded-sm"
                          style={{ height: `${pct}%`, background: p >= 0 ? "#22c55e" : "#ef4444", minHeight: 3 }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Lessons ── */}
          <div className="bg-white rounded-3xl border border-[#E0EFF1] px-5 py-5 shadow-sm flex flex-col gap-3">
            <p className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider">Lessons learned 📚</p>
            <div className="flex flex-col gap-2.5">
              {lessons.map((lesson, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#EAF7F9] flex items-center justify-center text-[#5DB7C4] font-extrabold text-xs mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-[#5B7780] leading-relaxed">{lesson}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Buttons ── */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pb-6">
            <ChronicleButton
              text="Try Again →"
              onClick={() => navigate("/simulate")}
              hoverColor="#F36C3D"
              customBackground="#5DB7C4"
              customForeground="#ffffff"
              hoverForeground="#ffffff"
              width="200px"
              borderRadius="10px"
            />
            <ChronicleButton
              text="Back to Results"
              onClick={() => navigate("/results")}
              hoverColor="#5DB7C4"
              customBackground="#E8ECEE"
              customForeground="#5B7780"
              hoverForeground="#ffffff"
              width="200px"
              borderRadius="10px"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

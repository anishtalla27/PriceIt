import { useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import logo from "../../logo.png";

// ─── types ────────────────────────────────────────────────────────────────────

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

// ─── grade ────────────────────────────────────────────────────────────────────

type Grade = "A" | "B" | "C" | "D" | "F";

function computeGrade(totalProfit: number, totalRevenue: number): Grade {
  if (totalRevenue <= 0) return "F";
  const margin = (totalProfit / totalRevenue) * 100;
  if (margin > 40) return "A";
  if (margin > 25) return "B";
  if (margin > 10) return "C";
  if (margin > 0)  return "D";
  return "F";
}

const GRADE_COLOR: Record<Grade, string> = {
  A: "#16a34a",
  B: "#5DB7C4",
  C: "#f59e0b",
  D: "#F36C3D",
  F: "#ef4444",
};

const GRADE_BG: Record<Grade, string> = {
  A: "#F0FFF4",
  B: "#EAF7F9",
  C: "#FFFBEB",
  D: "#FFF5F0",
  F: "#FFF1F2",
};

// ─── heading ─────────────────────────────────────────────────────────────────

function getHeading(finalCash: number, startingCash: number): { text: string; emoji: string } {
  const ratio = finalCash / startingCash;
  if (ratio >= 2)   return { text: "You crushed it!", emoji: "🚀" };
  if (ratio >= 1.5) return { text: "Great work, CEO!", emoji: "🎉" };
  if (ratio >= 1)   return { text: "Solid effort!", emoji: "📈" };
  return              { text: "You made it!", emoji: "💪" };
}

// ─── achievements ─────────────────────────────────────────────────────────────

interface Badge {
  emoji: string;
  name: string;
  description: string;
}

function computeBadges(results: PassedResult[], cashHistory: number[]): Badge[] {
  const badges: Badge[] = [];

  // Comeback Kid: loss week immediately followed by profit week
  for (let i = 1; i < cashHistory.length; i++) {
    if (cashHistory[i - 1] < 0 && cashHistory[i] > 0) {
      badges.push({ emoji: "💪", name: "Comeback Kid", description: "Bounced back from a bad week to a great one!" });
      break;
    }
  }

  // Consistent CEO: never two consecutive loss weeks
  let twoBad = false;
  for (let i = 1; i < cashHistory.length; i++) {
    if (cashHistory[i - 1] < 0 && cashHistory[i] < 0) { twoBad = true; break; }
  }
  if (!twoBad && cashHistory.length >= 4) {
    badges.push({ emoji: "📊", name: "Consistent CEO", description: "Never had two bad weeks in a row!" });
  }

  // Demand Machine: stocked out (ran short) 3+ times — people wanted MORE
  const stockouts = results.filter(r => r.finalDemand > r.unitsSold).length;
  if (stockouts >= 3) {
    badges.push({ emoji: "🔥", name: "Demand Machine", description: "Your product was so popular you kept selling out!" });
  }

  // Hot Streak: 5+ consecutive profitable weeks
  let maxStreak = 0, streak = 0;
  for (const p of cashHistory) {
    streak = p > 0 ? streak + 1 : 0;
    maxStreak = Math.max(maxStreak, streak);
  }
  if (maxStreak >= 5) {
    badges.push({ emoji: "🌟", name: `${maxStreak}-Week Streak`, description: `${maxStreak} profitable weeks in a row!` });
  }

  // Perfect Run: all 12 weeks profitable
  if (cashHistory.length === 12 && cashHistory.every(p => p > 0)) {
    badges.push({ emoji: "🏆", name: "Perfect Run", description: "12 out of 12 profitable weeks — legendary!" });
  }

  // Revenue Rocket: high total revenue
  const totalRev = results.reduce((s, r) => s + r.revenue, 0);
  if (totalRev > 5000) {
    badges.push({ emoji: "💰", name: "Revenue Rocket", description: `Generated over $${Math.round(totalRev)} in total revenue!` });
  }

  // Default badge if none earned
  if (badges.length === 0) {
    badges.push({ emoji: "🌱", name: "First Timer", description: "You finished your first full simulation. Now you know the ropes!" });
  }

  return badges.slice(0, 3);
}

// ─── lessons ─────────────────────────────────────────────────────────────────

function generateLessons(results: PassedResult[], satisfaction: number): string[] {
  const lessons: string[] = [];
  const profitWeeks = results.filter(r => r.profit > 0).length;
  const stockoutWeeks = results.filter(r => r.finalDemand > r.unitsSold).length;

  if (profitWeeks === 12) {
    lessons.push("You were profitable every single week. That is incredibly rare. Real businesses try really hard to do this!");
  } else if (profitWeeks >= 8) {
    lessons.push(`${profitWeeks} out of 12 profitable weeks is solid work. A few small tweaks to your pricing or production could get you even higher next time.`);
  } else {
    lessons.push("Every week you ran taught you something useful. The more you practice, the better your instincts get.");
  }

  if (stockoutWeeks === 0) {
    lessons.push("You always had enough stock for every customer. That kind of planning keeps people happy and coming back.");
  } else if (stockoutWeeks <= 3) {
    lessons.push(`You ran out of stock ${stockoutWeeks} time${stockoutWeeks > 1 ? "s" : ""}. Making just a few extra units each week would have captured those missed sales.`);
  } else {
    lessons.push("Stock management is one of the hardest parts of running a business. You are already learning skills that real CEOs use.");
  }

  if (satisfaction >= 70) {
    lessons.push("Your customers stayed happy the whole time. In a real business, a loyal customer is worth way more than any ad.");
  } else {
    lessons.push("Customer happiness dropped a bit. Keeping shelves stocked and quality consistent is the best way to keep people smiling.");
  }

  return lessons;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SimulateResultsPage() {
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

  const { cash: finalCash, cashHistory, satisfaction, weeklyResults } = gs;

  // ── aggregate stats ──────────────────────────────────────────────────
  const totalRevenue  = weeklyResults.reduce((s, r) => s + r.revenue, 0);
  const totalProfit   = weeklyResults.reduce((s, r) => s + r.profit, 0);
  const totalUnits    = weeklyResults.reduce((s, r) => s + r.unitsSold, 0);
  const bestResult    = [...weeklyResults].sort((a, b) => b.profit - a.profit)[0];
  const worstResult   = [...weeklyResults].sort((a, b) => a.profit - b.profit)[0];

  const grade = computeGrade(totalProfit, totalRevenue);
  const { text: headingText, emoji: headingEmoji } = getHeading(finalCash, startingCash);
  const badges = computeBadges(weeklyResults, cashHistory);
  const lessons = generateLessons(weeklyResults, satisfaction);

  const profitPct = startingCash > 0 ? ((finalCash - startingCash) / startingCash) * 100 : 0;

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
            <div className="text-5xl mb-3">{headingEmoji}</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2B2B2B] leading-tight">
              {headingText}
            </h1>
            <p className="mt-2 text-[#7B9EA3] text-sm">
              You ran{" "}
              <strong>{appState.productInfo.productName || "your product"}</strong>{" "}
              for 12 weeks and finished with{" "}
              <strong style={{ color: finalCash >= startingCash ? "#16a34a" : "#F36C3D" }}>
                ${finalCash.toFixed(2)}
              </strong>
              {" "}({profitPct >= 0 ? "+" : ""}{profitPct.toFixed(0)}% from start).
            </p>
          </div>

          {/* ── Grade card ── */}
          <div
            className="rounded-3xl border-2 px-6 py-5 flex items-center gap-5"
            style={{ background: GRADE_BG[grade], borderColor: GRADE_COLOR[grade] + "66" }}
          >
            <div
              className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center font-extrabold text-5xl"
              style={{ background: GRADE_COLOR[grade] + "22", color: GRADE_COLOR[grade] }}
            >
              {grade}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9BBFC3] mb-1">Final Grade</p>
              <p className="font-extrabold text-lg text-[#2B2B2B] leading-tight">
                {grade === "A" ? "Outstanding" : grade === "B" ? "Great Work" : grade === "C" ? "Good Effort" : grade === "D" ? "Needs Work" : "Keep Trying"}
              </p>
              <p className="text-xs text-[#7B9EA3] mt-0.5">
                {totalRevenue > 0
                  ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% average profit margin`
                  : "No revenue recorded"}
              </p>
            </div>
          </div>

          {/* ── Stats grid ── */}
          <div className="bg-white rounded-3xl border border-[#E0EFF1] px-5 py-5 shadow-sm">
            <p className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider mb-3">Your 12-Week Stats</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Total Revenue",  val: `$${totalRevenue.toFixed(2)}`,   color: "#16a34a" },
                { label: "Total Profit",   val: `${totalProfit >= 0 ? "+" : ""}$${Math.abs(totalProfit).toFixed(2)}`, color: totalProfit >= 0 ? "#5DB7C4" : "#ef4444" },
                { label: "Units Sold",     val: totalUnits.toString(),            color: "#2B2B2B" },
                { label: "Best Week",      val: `+$${bestResult?.profit.toFixed(2) ?? "0"}`, color: "#16a34a" },
                { label: "Worst Week",     val: `-$${Math.abs(worstResult?.profit ?? 0).toFixed(2)}`, color: "#F36C3D" },
                { label: "Satisfaction",   val: `${satisfaction}/100`,            color: satisfaction >= 61 ? "#22c55e" : satisfaction >= 31 ? "#f59e0b" : "#ef4444" },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-[#F7F9FA] rounded-2xl px-3 py-3 text-center">
                  <p className="text-[9px] font-bold text-[#9BBFC3] uppercase tracking-wider leading-tight mb-1">{label}</p>
                  <p className="font-extrabold text-sm leading-tight" style={{ color }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Journey timeline ── */}
          <div className="bg-white rounded-3xl border border-[#E0EFF1] px-5 py-5 shadow-sm">
            <p className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider mb-3">Your Business Journey</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {weeklyResults.map((r) => {
                const pos = r.profit >= 0;
                return (
                  <div key={r.week} className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-[10px] text-center leading-tight"
                      style={{ background: pos ? "#22c55e" : "#ef4444" }}
                      title={`Week ${r.week}: ${pos ? "+" : ""}$${r.profit.toFixed(2)}`}
                    >
                      {pos ? "+" : ""}${Math.round(Math.abs(r.profit))}
                    </div>
                    <span className="text-[9px] text-[#C8D8DC] font-bold">W{r.week}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Achievement badges ── */}
          <div className="bg-white rounded-3xl border border-[#E0EFF1] px-5 py-5 shadow-sm">
            <p className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider mb-3">Achievement Badges</p>
            <div className="flex flex-col gap-2.5">
              {badges.map((b) => (
                <div key={b.name} className="flex items-center gap-3 bg-[#F7F9FA] rounded-2xl px-4 py-3">
                  <span className="text-2xl flex-shrink-0">{b.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm text-[#2B2B2B]">{b.name}</p>
                    <p className="text-xs text-[#7B9EA3]">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Lessons ── */}
          <div className="bg-white rounded-3xl border border-[#E0EFF1] px-5 py-5 shadow-sm">
            <p className="text-xs font-bold text-[#9BBFC3] uppercase tracking-wider mb-3">Key takeaways 📚</p>
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
              text="Play Again →"
              onClick={() => navigate("/simulate")}
              hoverColor="#F36C3D"
              customBackground="#5DB7C4"
              customForeground="#ffffff"
              hoverForeground="#ffffff"
              width="200px"
              borderRadius="10px"
            />
            <ChronicleButton
              text="Back to Home"
              onClick={() => navigate("/")}
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

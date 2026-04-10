import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import type { FixedCostItem, VariableCostItem } from "@/context/AppStateContext";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import { ProgressSteps } from "@/components/ui/progress-steps";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts";
import logo from "../../logo.png";

// ─── cost math (mirrors PricingPage) ─────────────────────────────────────────

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

// ─── types ───────────────────────────────────────────────────────────────────

interface BusinessRating {
  rating: number; // 0–5 in 0.5 increments
  verdict: string;
}

interface CustomerReview {
  name: string;
  age: number;
  rating: number; // 1–5
  text: string;
  tag: "Love it ❤️" | "Needs work 🔧";
}

// ─── star renderer ────────────────────────────────────────────────────────────

function Stars({
  rating,
  size = "md",
  color = "#F36C3D",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  color?: string;
}) {
  const sizeClass = size === "lg" ? "text-4xl" : size === "md" ? "text-xl" : "text-sm";
  return (
    <span className={`inline-flex gap-0.5 ${sizeClass}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i;
        const half = !filled && rating >= i - 0.5;
        return (
          <span
            key={i}
            style={{ color: filled || half ? color : "#D1D5DB", position: "relative", display: "inline-block" }}
          >
            {half ? (
              <>
                <span style={{ position: "absolute", overflow: "hidden", width: "50%", color }}>★</span>
                <span style={{ color: "#D1D5DB" }}>★</span>
              </>
            ) : (
              "★"
            )}
          </span>
        );
      })}
    </span>
  );
}

// ─── loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = [
    "Crunching your numbers... 🧮",
    "Asking our business experts... 💼",
    "Reading customer minds... 🔮",
    "Almost ready... ✨",
  ];

  useEffect(() => {
    const id = setInterval(() => setMsgIdx((p) => (p + 1) % messages.length), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 priceit-fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-[#E0EFF1] bg-white px-5 py-5 shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-4 text-2xl" aria-hidden="true">
          <span className="animate-bounce">🧠</span>
          <span className="animate-bounce" style={{ animationDelay: "150ms" }}>📈</span>
          <span className="animate-bounce" style={{ animationDelay: "300ms" }}>✨</span>
        </div>
        <div className="h-2 rounded-full bg-[#E0EFF1] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#5DB7C4]"
            style={{ width: `${((msgIdx + 1) / messages.length) * 100}%`, transition: "width 900ms ease" }}
          />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <div className="text-center">
        <p
          className="text-lg font-bold text-[#2B2B2B] transition-all duration-500"
          key={msgIdx}
        >
          {messages[msgIdx]}
        </p>
        <p className="text-sm text-[#9BBFC3] mt-1">This takes about 10 seconds</p>
      </div>
    </div>
  );
}

// ─── error screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ onRetry, isTimeout }: { onRetry: () => void; isTimeout: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
      <div className="text-5xl">{isTimeout ? "⏳" : "😬"}</div>
      <div>
        <p className="text-xl font-extrabold text-[#2B2B2B]">
          {isTimeout ? "That took longer than expected" : "Oops! Something went wrong"}
        </p>
        <p className="text-sm text-[#9BBFC3] mt-1 max-w-xs">
          {isTimeout
            ? "No worries - tap Try Again and we'll fetch your results one more time."
            : "Our AI experts had a hiccup. Check your connection and try again!"}
        </p>
      </div>
      <ChronicleButton
        text="Try Again"
        onClick={onRetry}
        hoverColor="#F36C3D"
        customBackground="#5DB7C4"
        customForeground="#ffffff"
        hoverForeground="#ffffff"
        width="140px"
        borderRadius="10px"
      />
    </div>
  );
}

// ─── review card ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: CustomerReview }) {
  const positive = review.tag === "Love it ❤️";
  return (
    <div
      className="bg-white rounded-2xl px-4 py-4 border border-[#E0EFF1] flex flex-col gap-2"
      style={{ borderLeft: `4px solid ${positive ? "#22c55e" : "#F36C3D"}` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-sm text-[#2B2B2B]">
            {review.name}, {review.age}
          </p>
          <Stars rating={review.rating} size="sm" color={positive ? "#22c55e" : "#F36C3D"} />
        </div>
        <span
          className="text-xs font-bold px-2 py-1 rounded-full"
          style={{
            background: positive ? "#F0FFF4" : "#FFF5F0",
            color: positive ? "#16a34a" : "#F36C3D",
          }}
        >
          {review.tag}
        </span>
      </div>
      <p className="text-xs text-[#5B7780] leading-relaxed">{review.text}</p>
    </div>
  );
}

// ─── charts ──────────────────────────────────────────────────────────────────

const costBreakdownChartConfig = {
  fixed: {
    label: "Fixed Costs",
    color: "#5DB7C4",
  },
  variable: {
    label: "Variable Costs",
    color: "#F36C3D",
  },
} satisfies ChartConfig;

const monthlyBreakdownChartConfig = {
  revenue: {
    label: "Revenue",
    color: "#5DB7C4",
  },
  cost: {
    label: "Cost",
    color: "#F36C3D",
  },
  profit: {
    label: "Profit",
    color: "#2B2B2B",
  },
} satisfies ChartConfig;

function CostPieChart({
  monthlyFixed,
  monthlyVariable,
}: {
  monthlyFixed: number;
  monthlyVariable: number;
}) {
  const costData = [
    {
      key: "fixed",
      name: "Fixed Costs",
      value: Math.max(0, monthlyFixed),
      fill: "var(--color-fixed)",
    },
    {
      key: "variable",
      name: "Variable Costs",
      value: Math.max(0, monthlyVariable),
      fill: "var(--color-variable)",
    },
  ];
  const total = costData.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E0EFF1] px-4 py-4 flex flex-col gap-2 h-full">
      <div>
        <h2 className="text-sm font-extrabold text-[#2B2B2B]">Where Your Money Goes</h2>
        <p className="text-[11px] text-[#7B9EA3]">Fixed vs variable monthly costs</p>
      </div>
      <ChartContainer config={costBreakdownChartConfig} className="h-[230px] sm:h-[250px] w-full">
        <PieChart margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Pie
            data={costData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={76}
            innerRadius={34}
            stroke="#ffffff"
            strokeWidth={2}
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {costData.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  );
}

function MonthlyBarChart({
  revenue,
  cost,
  profit,
}: {
  revenue: number;
  cost: number;
  profit: number;
}) {
  const monthlyData = [
    {
      name: "Monthly",
      revenue: Math.max(0, revenue),
      cost: Math.max(0, cost),
      profit,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E0EFF1] px-4 py-4 flex flex-col gap-2 h-full">
      <div>
        <h2 className="text-sm font-extrabold text-[#2B2B2B]">Your Monthly Breakdown</h2>
        <p className="text-[11px] text-[#7B9EA3]">Revenue, costs, and profit side-by-side</p>
      </div>
      <ChartContainer config={monthlyBreakdownChartConfig} className="h-[230px] sm:h-[250px] w-full">
        <BarChart data={monthlyData} margin={{ top: 8, right: 16, bottom: 0, left: 16 }}>
          <CartesianGrid vertical={false} stroke="#E0EFF1" strokeDasharray="2 2" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "#7B9EA3", fontWeight: 700, fontSize: 12 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="cost" fill="var(--color-cost)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="profit" fill="var(--color-profit)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ChartContainer>
      {profit < 0 && (
        <p className="text-[10px] text-[#F36C3D] font-semibold text-center">
          You're spending more than you earn. Try a higher price or lower costs next.
        </p>
      )}
    </div>
  );
}

// ─── OpenRouter API helper ────────────────────────────────────────────────────

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here") {
    throw new Error("VITE_OPENROUTER_API_KEY is not set in your .env file.");
  }
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10000);
  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("REQUEST_TIMEOUT");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenRouter response missing message content.");
  }
  return content;
}

function extractJson(text: string): unknown {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (!match) throw new Error("No JSON found in response");
  return JSON.parse(match[1]);
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const { productInfo, fixedCosts, variableCosts, pricing } = state;
  const productInfoComplete =
    productInfo.productName.trim() !== "" &&
    productInfo.productDescription.trim() !== "" &&
    productInfo.targetCustomer.trim() !== "" &&
    productInfo.specialFeature.trim() !== "" &&
    productInfo.category.trim() !== "";
  const missingPricing =
    pricing.sellingPrice === "" ||
    Number(pricing.sellingPrice) <= 0 ||
    pricing.unitsPerMonth === "" ||
    Number(pricing.unitsPerMonth) <= 0;

  const sellingPrice = Number(pricing.sellingPrice) || 0;
  const unitsPerMonth = Number(pricing.unitsPerMonth) || 0;
  const totalMonthlyFixed = fixedCosts.reduce((s, i) => s + fixedMonthly(i), 0);
  const totalVariablePerUnit = variableCosts.reduce((s, i) => s + variableCPP(i), 0);
  const fixedPerUnit = unitsPerMonth > 0 ? totalMonthlyFixed / unitsPerMonth : 0;
  const costPerUnit = totalVariablePerUnit + fixedPerUnit;
  const profitPerUnit = sellingPrice - costPerUnit;
  const marginPct = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0;

  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<"none" | "timeout" | "generic">("none");
  const [businessRating, setBusinessRating] = useState<BusinessRating | null>(null);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const hasRunRef = useRef(false);

  const fmt2 = (n: number) => n.toFixed(2);

  const buildContext = useCallback(() => {
    return `
Product: ${productInfo.productName || "Unnamed product"}
Description: ${productInfo.productDescription || "No description"}
Target customer: ${productInfo.targetCustomer || "Not specified"}
Special feature: ${productInfo.specialFeature || "None"}
Category: ${productInfo.category || "Other"}

Fixed costs (monthly total): $${fmt2(totalMonthlyFixed)}
Variable cost per unit: $${fmt2(totalVariablePerUnit)}
Cost per unit (total): $${fmt2(costPerUnit)}
Selling price: $${fmt2(sellingPrice)}
Profit per unit: $${fmt2(profitPerUnit)}
Profit margin: ${marginPct.toFixed(1)}%
Estimated units per month: ${unitsPerMonth}
`.trim();
  }, [
    productInfo,
    totalMonthlyFixed,
    totalVariablePerUnit,
    costPerUnit,
    sellingPrice,
    profitPerUnit,
    marginPct,
    unitsPerMonth,
  ]);

  useEffect(() => {
    if (missingPricing) {
      navigate("/pricing", {
        replace: true,
        state: { message: "Set your selling price first, then we can show your results!" },
      });
      return;
    }
    if (!productInfoComplete) {
      navigate("/setup", {
        replace: true,
        state: { message: "Let's finish your product info before we build your results." },
      });
    }
  }, [missingPricing, productInfoComplete, navigate]);

  if (missingPricing || !productInfoComplete) {
    return null;
  }

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setErrorType("none");
    setBusinessRating(null);
    setReviews([]);

    const ctx = buildContext();

    const ratingPrompt = `You are a friendly business mentor for kids aged 8-12. A kid has created a business plan. Evaluate it honestly but encouragingly.

Business data:
${ctx}

Rate this business idea. Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{"rating": <number from 0 to 5 in 0.5 increments>, "verdict": "<2-3 sentence honest but encouraging verdict written for a kid>"}`;

    const reviewPrompt = `You are generating realistic fake customer reviews for a kid's business project.

Business data:
${ctx}

Generate exactly 10 realistic customer reviews. Mix positive and constructive feedback. Each reviewer is either a kid (age 8-14) or a parent (age 28-45). Make names and ages varied and realistic.

Grounding rules (strict):
- Use ONLY facts present in the Business data above.
- Do NOT invent extra features, materials, promises, outcomes, shipping details, brand history, certifications, or user experiences not explicitly provided.
- If information is missing, mention uncertainty naturally (for example: "I wish I knew more about ___") instead of making assumptions.
- Keep review text focused on the known product description, target customer, special feature, category, and the provided business numbers.

Return ONLY valid JSON (no markdown) in this exact format:
{"reviews": [{"name": "string", "age": number, "rating": number (1-5 integer), "text": "2-3 sentences written naturally", "tag": "Love it ❤️" or "Needs work 🔧"}, ...]}

Rules: at least 6 "Love it ❤️" and at least 3 "Needs work 🔧". Ratings should match the tag (Love it = 4-5, Needs work = 1-3).`;

    try {
      const [ratingText, reviewText] = await Promise.all([
        callOpenRouter(ratingPrompt),
        callOpenRouter(reviewPrompt),
      ]);

      const ratingData = extractJson(ratingText) as { rating: number; verdict: string };
      const reviewData = extractJson(reviewText) as { reviews: CustomerReview[] };

      setBusinessRating({ rating: ratingData.rating, verdict: ratingData.verdict });
      const rawReviews = Array.isArray(reviewData.reviews) ? reviewData.reviews : [];
      setReviews(rawReviews.slice(0, 10));
    } catch (e) {
      console.error(e);
      if (e instanceof Error && e.message === "REQUEST_TIMEOUT") {
        setErrorType("timeout");
      } else {
        setErrorType("generic");
      }
    } finally {
      setLoading(false);
    }
  }, [buildContext]);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    runAnalysis();
  }, [runAnalysis]);

  return (
    <div className="min-h-screen flex flex-col priceit-fade-in" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#E0EFF1] bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <button
          onClick={() => navigate("/setup/pricing")}
          className="min-h-11 px-3 text-[#5DB7C4] font-semibold text-sm hover:text-[#F36C3D] transition-colors"
        >
          Back
        </button>
        <img src={logo} alt="PriceIt logo" className="h-9 w-auto" />
        <div className="w-16" />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-4 sm:py-5">
        <div className="w-full max-w-5xl">
          <ProgressSteps currentStep={5} />

          <div className="mb-4 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2B2B2B]">
              Your Results!
            </h1>
            <p className="mt-1 text-[#7B9EA3] text-sm">
              Here's what our AI business experts think of{" "}
              <strong>{productInfo.productName || "your product"}</strong>.
            </p>
          </div>

          {loading && <LoadingScreen />}
          {!loading && errorType !== "none" && <ErrorScreen onRetry={runAnalysis} isTimeout={errorType === "timeout"} />}

          {!loading && errorType === "none" && businessRating && (
            <div className="flex flex-col gap-4">
              {/* ── Overall rating ── */}
              <section className="rounded-3xl border border-[#E0EFF1] bg-white/95 px-4 py-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#9BBFC3] mb-2 text-center">
                  Business Rating
                </p>
                <div className="bg-white rounded-3xl border border-[#EAF0F2] px-5 py-5 text-center">
                  <Stars rating={businessRating.rating} size="lg" color="#F36C3D" />
                  <p className="text-4xl font-extrabold text-[#2B2B2B] mt-1">
                    {businessRating.rating} / 5
                  </p>
                  <p className="text-[15px] text-[#5B7780] mt-2 leading-relaxed max-w-2xl mx-auto">
                    {businessRating.verdict}
                  </p>
                  <div className="mt-3 flex justify-center">
                    <ChronicleButton
                      text="Tweak My Pricing"
                      onClick={() => navigate("/setup/pricing")}
                      hoverColor="#F36C3D"
                      customBackground="#EAF7F9"
                      customForeground="#5DB7C4"
                      hoverForeground="#ffffff"
                      width="200px"
                      borderRadius="999px"
                    />
                  </div>
                </div>
              </section>

              {/* ── Business data ── */}
              <section className="rounded-3xl border border-[#E0EFF1] bg-white/95 px-4 py-4 shadow-sm">
                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#9BBFC3]">
                    Business Data
                  </p>
                  <p className="text-sm text-[#6F8A91] font-semibold">
                    See how your pricing turns into money, costs, and profit.
                  </p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-stretch">
                  <CostPieChart
                    monthlyFixed={totalMonthlyFixed}
                    monthlyVariable={totalVariablePerUnit * unitsPerMonth}
                  />
                  <MonthlyBarChart
                    revenue={sellingPrice * unitsPerMonth}
                    cost={costPerUnit * unitsPerMonth}
                    profit={profitPerUnit * unitsPerMonth}
                  />
                </div>
              </section>

              {/* ── Customer reviews ── */}
              {reviews.length > 0 && (
                <section className="rounded-3xl border border-[#E0EFF1] bg-white/95 px-4 py-4 shadow-sm">
                  <div className="mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#9BBFC3]">
                      Customer Reviews
                    </p>
                    <h2 className="text-base font-extrabold text-[#2B2B2B]">
                      What people might say ({reviews.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {reviews.map((r, i) => (
                      <ReviewCard key={i} review={r} />
                    ))}
                  </div>
                </section>
              )}

              {/* ── CTA ── */}
              <div className="flex justify-center pt-1 pb-2">
                <ChronicleButton
                  text="Try the Business Simulator →"
                  onClick={() => navigate("/simulate")}
                  hoverColor="#F36C3D"
                  customBackground="#5DB7C4"
                  customForeground="#ffffff"
                  hoverForeground="#ffffff"
                  width="260px"
                  borderRadius="10px"
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

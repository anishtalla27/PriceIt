import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import type { FixedCostItem, VariableCostItem } from "@/context/AppStateContext";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { MarkdownMessage } from "@/components/ui/markdown-message";
import { generateAI, type AIProgress, type AIWarning } from "@/lib/ai-provider";
import { businessRatingTemplate, customerReviewsTemplate } from "@/lib/ai-templates";
import { extractJsonObject } from "@/lib/safe-json";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts";
import { Bot, ThumbsUp, Lightbulb, Send, ChevronDown, ChevronUp } from "lucide-react";
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

interface AIFeedbackSummary {
  praises: string[];
  improvements: string[];
}

interface CustomerReview {
  name: string;
  age: number;
  rating: number; // 1–5
  text: string;
  tag: "Love it ❤️" | "Needs work 🔧";
}

type ChatRole = "user" | "assistant";
interface ChatMessage {
  role: ChatRole;
  content: string;
}

function isCustomerReview(value: unknown): value is CustomerReview {
  if (!value || typeof value !== "object") return false;
  const review = value as Record<string, unknown>;
  return (
    typeof review.name === "string" &&
    typeof review.age === "number" &&
    typeof review.rating === "number" &&
    typeof review.text === "string" &&
    (review.tag === "Love it ❤️" || review.tag === "Needs work 🔧")
  );
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

const LOADING_MESSAGES = [
  "Crunching your numbers... 🧮",
  "Asking our business experts... 💼",
  "Reading customer minds... 🔮",
  "Almost ready... ✨",
];

function LoadingScreen({ progress }: { progress: AIProgress | null }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setMsgIdx((p) => (p + 1) % LOADING_MESSAGES.length), 1500);
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
            style={{ width: `${progress ? progress.progress * 100 : ((msgIdx + 1) / LOADING_MESSAGES.length) * 100}%`, transition: "width 900ms ease" }}
          />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <div className="text-center">
        <p
          className="text-lg font-bold text-[#2B2B2B] transition-all duration-500"
          key={msgIdx}
        >
          {progress?.text || LOADING_MESSAGES[msgIdx]}
        </p>
        <p className="text-sm text-[#9BBFC3] mt-1">
          {progress ? `${Math.round(progress.progress * 100)}% loaded` : "Getting your results ready"}
        </p>
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

// ─── chat components ──────────────────────────────────────────────────────────

function ChatTypingIndicator() {
  return (
    <div className="flex justify-start items-end gap-2">
      <div className="h-8 w-8 rounded-full border border-[#A9DDE3] bg-white flex items-center justify-center shadow-sm flex-shrink-0">
        <Bot className="h-4 w-4 text-[#5DB7C4]" />
      </div>
      <div className="bg-white border border-[#A9DDE3] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center shadow-sm">
        <style>{`
          @keyframes typingBounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-5px); }
          }
        `}</style>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#5DB7C4]"
            style={{ animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isAI = msg.role === "assistant";
  if (isAI) {
    return (
      <div className="flex justify-start items-end gap-2">
        <div className="h-8 w-8 rounded-full border border-[#A9DDE3] bg-white flex items-center justify-center shadow-sm flex-shrink-0">
          <Bot className="h-4 w-4 text-[#5DB7C4]" />
        </div>
        <div className="max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm bg-white border border-[#A9DDE3] text-[#2B2B2B] rounded-tl-sm">
          <MarkdownMessage>{msg.content}</MarkdownMessage>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm bg-[#5DB7C4] text-white rounded-tr-sm">
        {msg.content}
      </div>
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

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const { productInfo, fixedCosts, variableCosts, pricing } = state;
  const mode = state.journeyMode ?? "create";
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
  const [feedbackSummary, setFeedbackSummary] = useState<AIFeedbackSummary | null>(null);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [aiWarning, setAIWarning] = useState<AIWarning | null>(null);
  const [localAIProgress, setLocalAIProgress] = useState<AIProgress | null>(null);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const hasRunRef = useRef(false);

  const fmt2 = (n: number) => n.toFixed(2);

  const buildContext = useCallback(() => {
    return `
Product: ${productInfo.productName || "Unnamed product"}
Description: ${productInfo.productDescription || "No description"}
Target customer: ${productInfo.targetCustomer || "Not specified"}
Special feature: ${productInfo.specialFeature || "None"}
Category: ${productInfo.category || "Other"}
Journey: ${mode === "improve" ? "Improve an existing product" : "Create a new product"}
Current challenge: ${productInfo.currentChallenge || "Not applicable"}
Improvement goal: ${productInfo.improvementGoal || "Not applicable"}
Inspiration: ${productInfo.inspiration || "Not provided"}

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
    mode,
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

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setErrorType("none");
    setBusinessRating(null);
    setFeedbackSummary(null);
    setReviews([]);
    setAIWarning(null);

    const ctx = buildContext();

    const ratingPrompt = `You are a friendly business mentor for kids aged 8-12. A kid is ${mode === "improve" ? "improving an existing product" : "creating a new product"}. Evaluate the plan honestly but encouragingly. ${mode === "improve" ? "Judge whether the new numbers and plan address the stated challenge and improvement goal." : "Judge whether the new product plan is financially sensible."}

Business data:
${ctx}

Rate this business idea. Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{"rating": <number from 0 to 5 in 0.5 increments>, "verdict": "<2-3 sentence honest but encouraging verdict written for a kid>"}`;

    const feedbackPrompt = `You are a business mentor for kids aged 8-12. Analyze this business plan and give specific, grounded feedback.

Business data:
${ctx}

Return ONLY valid JSON (no markdown) in this exact format:
{"praises": ["...", "...", "..."], "improvements": ["...", "...", "..."]}

Rules:
- praises: exactly 3 things that are genuinely working well. Reference actual details like the product name, special feature, target customer, price, or margin. Be specific and encouraging.
- improvements: exactly 3 concrete, actionable suggestions to make the business stronger. Be specific — name the numbers, suggest actual changes (e.g. "raise your price by $2", "cut packaging costs", "target a new audience"). Kid-friendly language.
- Do NOT invent facts not in the business data.
- Write for a kid aged 8-12. Keep each item to 1-2 sentences.`;

    const reviewPrompt = `You are generating realistic customer reviews for a kid's business project.

Business data:
${ctx}

Generate exactly 10 reviews. Mix positive (6-7) and constructive (3-4) feedback. Reviewers are a mix of kids (age 8-14) and parents/adults (age 28-45). Use varied, realistic names.

Grounding rules (strict):
- Base every review on facts in the Business data above. Do NOT invent extra features, materials, history, or experiences not provided.
- "Love it ❤️" reviews: praise 1-2 SPECIFIC things they love — the special feature, the product description, the target audience fit, or the value for money at $${fmt2(sellingPrice)}. Sound genuine and personal.
- "Needs work 🔧" reviews: suggest ONE concrete improvement they'd want (e.g. lower price, a specific missing feature based on the category, packaging, availability). Honest but polite.
- Make each review sound like a real person — vary sentence structure, use natural speech, avoid corporate language.

Return ONLY valid JSON (no markdown):
{"reviews": [{"name": "string", "age": number, "rating": number (1-5 integer), "text": "2-3 sentences written naturally", "tag": "Love it ❤️" or "Needs work 🔧"}, ...]}

Rules: at least 6 "Love it ❤️" and at least 3 "Needs work 🔧". Ratings must match tag (Love it = 4-5, Needs work = 1-3).`;

    try {
      const templateInput = {
        productName: productInfo.productName,
        targetCustomer: productInfo.targetCustomer,
        sellingPrice,
        costPerUnit,
        profitPerUnit,
        marginPct,
      };
      const ratingFallback = businessRatingTemplate(templateInput);
      const reviewsFallback = customerReviewsTemplate(templateInput);
      const feedbackFallback: AIFeedbackSummary = {
        praises: [
          `${productInfo.productName} has a clear target customer in "${productInfo.targetCustomer}", which is a great start!`,
          profitPerUnit > 0
            ? `You're earning $${fmt2(profitPerUnit)} profit on every sale at your $${fmt2(sellingPrice)} price — that's real money!`
            : `You've thought carefully about what your product costs to make, which is exactly the right first step.`,
          `Your special feature — "${productInfo.specialFeature}" — gives customers a real reason to choose you.`,
        ],
        improvements: [
          profitPerUnit > 0 && marginPct < 25
            ? `Your profit margin is ${marginPct.toFixed(0)}%. Try raising your price by $1–2 to push it above 25% and give yourself more breathing room.`
            : !profitPerUnit || profitPerUnit <= 0
            ? `Your costs are higher than your selling price right now. Look for ways to reduce material costs or increase your price.`
            : `Keep looking for bulk deals on your supplies — buying more at once often lowers your cost per item.`,
          `Think about a simple marketing plan — even telling 10 friends or making a flyer can double your early customers.`,
          `Consider offering a "starter pack" or bundle deal to encourage people to buy more than one at a time.`,
        ],
      };

      const [ratingResult, feedbackResult, reviewResult] = await Promise.all([
        generateAI({
          messages: [{ role: "user", content: ratingPrompt }],
          template: () => JSON.stringify(ratingFallback),
          maxTokens: 300,
          temperature: 0.2,
          jsonMode: true,
          onProgress: setLocalAIProgress,
        }),
        generateAI({
          messages: [{ role: "user", content: feedbackPrompt }],
          template: () => JSON.stringify(feedbackFallback),
          maxTokens: 600,
          temperature: 0.3,
          jsonMode: true,
          onProgress: setLocalAIProgress,
        }),
        generateAI({
          messages: [{ role: "user", content: reviewPrompt }],
          template: () => JSON.stringify({ reviews: reviewsFallback }),
          maxTokens: 1400,
          temperature: 0.5,
          jsonMode: true,
          onProgress: setLocalAIProgress,
        }),
      ]);

      setAIWarning(ratingResult.warning ?? feedbackResult.warning ?? reviewResult.warning ?? null);

      const ratingData = extractJsonObject(ratingResult.text);
      const rating = Number(ratingData?.rating);
      const verdict = ratingData?.verdict;
      setBusinessRating(
        Number.isFinite(rating) && typeof verdict === "string"
          ? { rating: Math.max(0, Math.min(5, Math.round(rating * 2) / 2)), verdict }
          : ratingFallback
      );

      const feedbackData = extractJsonObject(feedbackResult.text);
      const praises = Array.isArray(feedbackData?.praises) ? feedbackData.praises.filter((s): s is string => typeof s === "string") : [];
      const improvements = Array.isArray(feedbackData?.improvements) ? feedbackData.improvements.filter((s): s is string => typeof s === "string") : [];
      setFeedbackSummary(
        praises.length >= 2 && improvements.length >= 2
          ? { praises, improvements }
          : feedbackFallback
      );

      const rawReviews = Array.isArray(reviewResult.text ? extractJsonObject(reviewResult.text)?.reviews : null)
        ? (extractJsonObject(reviewResult.text)?.reviews as unknown[]).filter(isCustomerReview)
        : reviewsFallback;
      setReviews(rawReviews.length >= 10 ? rawReviews.slice(0, 10) : reviewsFallback);
    } catch (e) {
      console.error(e);
      if (e instanceof Error && e.message === "REQUEST_TIMEOUT") {
        setErrorType("timeout");
      } else {
        setErrorType("generic");
      }
    } finally {
      setLoading(false);
      setLocalAIProgress(null);
    }
  }, [buildContext, costPerUnit, marginPct, mode, productInfo, profitPerUnit, sellingPrice, fmt2]);

  useEffect(() => {
    if (missingPricing || !productInfoComplete) return;
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    runAnalysis();
  }, [missingPricing, productInfoComplete, runAnalysis]);

  // Chat scroll to bottom
  useEffect(() => {
    if (chatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatTyping, chatOpen]);

  // Open chat and send welcome message
  const openChat = useCallback(async () => {
    setChatOpen(true);
    if (chatMessages.length > 0) return;
    setChatTyping(true);
    const ctx = buildContext();
    const welcomePrompt = `You are a friendly business mentor for kids aged 8-12 named "Biz Bot". A kid has just finished setting up their business plan. Here is their business data:\n\n${ctx}\n\nGreet them warmly, briefly compliment one specific thing about their product (use details from the data above), and ask what question they have about their business. Keep it short — 2-3 sentences max. No lists. Kid-friendly language.`;
    try {
      const result = await generateAI({
        messages: [{ role: "user", content: welcomePrompt }],
        template: () => `Hi! Great job setting up your business plan for **${productInfo.productName}**! I'm here to help you think through any questions. What would you like to know?`,
        maxTokens: 150,
        temperature: 0.4,
      });
      setChatMessages([{ role: "assistant", content: result.text }]);
    } catch {
      setChatMessages([{ role: "assistant", content: `Hi! Great job setting up your business plan for **${productInfo.productName}**! I'm here to help you think through any questions. What would you like to know?` }]);
    } finally {
      setChatTyping(false);
    }
  }, [chatMessages.length, buildContext, productInfo.productName]);

  const sendChatMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatTyping) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const next = [...chatMessages, userMsg];
    setChatMessages(next);
    setChatInput("");
    setChatTyping(true);
    const ctx = buildContext();
    try {
      const result = await generateAI({
        messages: [
          {
            role: "system",
            content: `You are Biz Bot, a friendly and encouraging business mentor for kids aged 8-12. The kid's business data:\n\n${ctx}\n\nAnswer questions about their business honestly and helpfully. Reference their specific product details whenever possible. Keep answers short (2-4 sentences), encouraging, and easy to understand. No jargon.`,
          },
          ...next.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        ],
        template: () => "That's a great question! Think about what your customers value most and use that to guide your decision.",
        maxTokens: 200,
        temperature: 0.5,
      });
      setChatMessages((prev) => [...prev, { role: "assistant", content: result.text }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "That's a great question! Think about what your customers value most and use that to guide your decision." },
      ]);
    } finally {
      setChatTyping(false);
    }
  }, [chatInput, chatMessages, chatTyping, buildContext]);

  if (missingPricing || !productInfoComplete) return null;

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
          <ProgressSteps currentStep={5} mode={mode} />

          <div className="mb-4 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2B2B2B]">
              {mode === "improve" ? "Your Improvement Plan" : "Your Results!"}
            </h1>
            <p className="mt-1 text-[#7B9EA3] text-sm">
              {mode === "improve" ? "Here's how the updated plan looks for " : "Here's what our AI business experts think of "}
              <strong>{productInfo.productName || "your product"}</strong>.
            </p>
          </div>

          {loading && <LoadingScreen progress={localAIProgress} />}
          {!loading && errorType !== "none" && <ErrorScreen onRetry={runAnalysis} isTimeout={errorType === "timeout"} />}

          {!loading && errorType === "none" && businessRating && (
            <div className="flex flex-col gap-4">
              {aiWarning && (
                <div className="rounded-xl border border-[#A9DDE3] bg-[#F0FAFB] px-4 py-3 text-sm text-[#2B2B2B]">
                  <p className="font-semibold">{aiWarning.message}</p>
                </div>
              )}

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

              {/* ── AI Feedback Summary ── */}
              {feedbackSummary && (
                <section className="rounded-3xl border border-[#E0EFF1] bg-white/95 px-4 py-4 shadow-sm">
                  <div className="mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#9BBFC3]">
                      AI Feedback
                    </p>
                    <h2 className="text-base font-extrabold text-[#2B2B2B]">
                      What's working & what to improve
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Praises */}
                    <div className="rounded-2xl border border-[#D1FAE5] bg-[#F0FFF4] px-4 py-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-[#22c55e] flex items-center justify-center flex-shrink-0">
                          <ThumbsUp className="h-3.5 w-3.5 text-white" />
                        </div>
                        <p className="text-sm font-extrabold text-[#16a34a]">What's going great 🎉</p>
                      </div>
                      <ul className="flex flex-col gap-2">
                        {feedbackSummary.praises.map((praise, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[#22c55e] font-bold text-sm mt-0.5 flex-shrink-0">✓</span>
                            <p className="text-xs text-[#166534] leading-relaxed">{praise}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Improvements */}
                    <div className="rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] px-4 py-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-[#F36C3D] flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="h-3.5 w-3.5 text-white" />
                        </div>
                        <p className="text-sm font-extrabold text-[#C2410C]">Ideas to level up 🚀</p>
                      </div>
                      <ul className="flex flex-col gap-2">
                        {feedbackSummary.improvements.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[#F36C3D] font-bold text-sm mt-0.5 flex-shrink-0">{i + 1}.</span>
                            <p className="text-xs text-[#7C2D12] leading-relaxed">{tip}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Chat with AI button */}
                  <div className="mt-3">
                    <button
                      onClick={chatOpen ? () => setChatOpen(false) : openChat}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-[#A9DDE3] bg-[#F0FAFB] hover:bg-[#E0F5F8] transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full border border-[#A9DDE3] bg-white flex items-center justify-center shadow-sm">
                          <Bot className="h-4 w-4 text-[#5DB7C4]" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-[#2B2B2B]">Chat with your AI mentor</p>
                          <p className="text-[11px] text-[#7B9EA3]">Ask questions about your business plan</p>
                        </div>
                      </div>
                      {chatOpen
                        ? <ChevronUp className="h-4 w-4 text-[#5DB7C4]" />
                        : <ChevronDown className="h-4 w-4 text-[#5DB7C4]" />
                      }
                    </button>

                    {/* Chat panel */}
                    {chatOpen && (
                      <div className="mt-2 rounded-2xl border border-[#E0EFF1] bg-white overflow-hidden priceit-fade-in">
                        {/* Messages */}
                        <div className="flex flex-col gap-3 px-4 py-4 max-h-80 overflow-y-auto">
                          {chatMessages.map((msg, i) => (
                            <ChatBubble key={i} msg={msg} />
                          ))}
                          {chatTyping && <ChatTypingIndicator />}
                          <div ref={chatBottomRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t border-[#E0EFF1] px-3 py-3 flex items-center gap-2 bg-[#F9FAFB]">
                          <input
                            ref={chatInputRef}
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendChatMessage();
                              }
                            }}
                            placeholder="Ask about your business..."
                            disabled={chatTyping}
                            className="flex-1 rounded-xl border border-[#D1E8EC] bg-white px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#A0B5BA] focus:outline-none focus:border-[#5DB7C4] disabled:opacity-50"
                          />
                          <button
                            onClick={sendChatMessage}
                            disabled={!chatInput.trim() || chatTyping}
                            className="h-9 w-9 rounded-xl bg-[#5DB7C4] flex items-center justify-center hover:bg-[#F36C3D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                            aria-label="Send message"
                          >
                            <Send className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

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
                    <p className="text-[11px] text-[#7B9EA3] mt-0.5">
                      AI-simulated reviews based on your product and pricing
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {reviews.map((r, i) => (
                      <ReviewCard key={i} review={r} />
                    ))}
                  </div>
                </section>
              )}

              {/* ── CTA ── */}
              <div className="flex flex-wrap justify-center gap-3 pt-1 pb-2">
                <ChronicleButton
                  text={mode === "improve" ? "Test the Improved Product →" : "Try the Business Simulator →"}
                  onClick={() => navigate("/simulate")}
                  hoverColor="#F36C3D"
                  customBackground="#5DB7C4"
                  customForeground="#ffffff"
                  hoverForeground="#ffffff"
                  width="260px"
                  borderRadius="10px"
                />
                <button
                  type="button"
                  onClick={() => navigate("/tracker")}
                  className="flex items-center gap-2 rounded-xl border-2 border-[#E0EFF1] bg-white px-5 py-2.5 text-sm font-bold text-[#7B9EA3] hover:border-[#5DB7C4] hover:text-[#5DB7C4] transition-colors"
                >
                  Track My Business
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

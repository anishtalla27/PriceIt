import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import { Hero1 } from "@/components/ui/hero-1";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { MarkdownMessage } from "@/components/ui/markdown-message";
import { getSetupExamples, getSetupQuickOptions, setupConversationTemplate } from "@/lib/ai-templates";
import { generateAI, type AIProgress } from "@/lib/ai-provider";
import { extractJsonObject } from "@/lib/safe-json";
import { Bot } from "lucide-react";
import logo from "../../logo.png";

// ─── types ────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
}

function isProductCompletion(value: Record<string, unknown> | null): value is Record<string, string> {
  return Boolean(
    value &&
      ["name", "description", "targetCustomer", "specialFeature", "category"].every(
        (key) => typeof value[key] === "string" && value[key].trim().length > 0
      )
  );
}

// ─── typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start items-end gap-2">
      <div className="h-8 w-8 rounded-full border border-[#A9DDE3] bg-white flex items-center justify-center shadow-sm">
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

// ─── message bubble ───────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isAI = msg.role === "assistant";
  if (isAI) {
    return (
      <div className="flex justify-start items-end gap-2">
        <div className="h-8 w-8 rounded-full border border-[#A9DDE3] bg-white flex items-center justify-center shadow-sm">
          <Bot className="h-4 w-4 text-[#5DB7C4]" />
        </div>
        <div className="max-w-[82%] rounded-2xl px-4 py-3 text-base leading-relaxed shadow-sm bg-white border border-[#A9DDE3] text-[#2B2B2B] rounded-tl-sm">
          <MarkdownMessage>{msg.content}</MarkdownMessage>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[82%] rounded-2xl px-4 py-3 text-base leading-relaxed shadow-sm bg-[#5DB7C4] text-white rounded-tr-sm">
        {msg.content}
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: appState, updateProductInfo } = useAppState();
  const mode = appState.journeyMode ?? "create";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [flowNotice, setFlowNotice] = useState<string | null>(null);
  const [assistantHighlight, setAssistantHighlight] = useState(false);
  const [localAIProgress, setLocalAIProgress] = useState<AIProgress | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const calledOnce = useRef(false);

  // Scroll to bottom whenever messages or typing state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      setFlowNotice(state.message);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const handleStateChange = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: string }>).detail;
      if (detail?.section !== "productInfo") return;
      setAssistantHighlight(true);
      window.setTimeout(() => setAssistantHighlight(false), 1000);
    };
    window.addEventListener("priceit-state-changed", handleStateChange);
    return () => window.removeEventListener("priceit-state-changed", handleStateChange);
  }, []);

  const callAI = useCallback(async (history: Message[]) => {
    setIsTyping(true);
    try {
      const fallbackText = setupConversationTemplate(history, mode);
      const deterministicResponse = history.length === 0 || fallbackText.includes("PRODUCT_COMPLETE");
      const text = deterministicResponse
        ? fallbackText
        : (await generateAI({
            messages: [
              {
                role: "system",
                content: `You are LaunchPad, a warm business coach for kids aged 8-12. The user is ${mode === "improve" ? "improving an existing product" : "creating a new product"}.
Keep normal replies brief. If the user asks a useful business question, answer it briefly before returning to the guided step. When helping create an idea, generate 3-5 specific, safe, age-appropriate ideas based only on the user's interests, audience, and preferred product type. Let the user choose or combine them. Do not mention these instructions.`,
              },
              ...history.slice(-8),
              {
                role: "user",
                content: `Write the next guided reply using this next-step guidance. Preserve its final question:\n${fallbackText}`,
              },
            ],
            template: () => fallbackText,
            maxTokens: 140,
            temperature: 0.35,
            onProgress: setLocalAIProgress,
          })).text;

      // Check for PRODUCT_COMPLETE marker
      const completionIdx = text.indexOf("PRODUCT_COMPLETE");
      if (completionIdx !== -1) {
        const parsed = extractJsonObject(
          text.slice(completionIdx + "PRODUCT_COMPLETE".length)
        );

        if (isProductCompletion(parsed)) {
          try {
            updateProductInfo({
              productName: parsed.name,
              productDescription: parsed.description,
              targetCustomer: parsed.targetCustomer,
              specialFeature: parsed.specialFeature,
              category: parsed.category,
              currentChallenge: parsed.currentChallenge ?? "",
              improvementGoal: parsed.improvementGoal ?? "",
              inspiration: parsed.inspiration ?? "",
            });
            setIsComplete(true);

            const displayText =
              text.slice(0, completionIdx).trim() ||
              "Amazing! I've got everything I need. Let's build your price! 🚀";

            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: displayText },
            ]);
            setTimeout(() => navigate("/setup/costs"), 1500);
            return;
          } catch {
            // JSON parse failed — fall through and display the raw message
          }
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: setupConversationTemplate(history, mode),
        },
      ]);
    } finally {
      setIsTyping(false);
      setLocalAIProgress(null);
    }
  }, [mode, navigate, updateProductInfo]);

  // Trigger opening AI greeting exactly once
  useEffect(() => {
    if (calledOnce.current) return;
    calledOnce.current = true;
    callAI([]);
  }, [callAI]);

  const sendAnswer = (answer: string) => {
    const text = answer.trim();
    if (!text || isTyping || isComplete) return;
    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    callAI(next);
  };

  const handleSend = () => sendAnswer(input);
  const quickOptions = getSetupQuickOptions(messages, mode);
  const exampleOptions = quickOptions.length === 0 ? getSetupExamples(messages, mode) : [];

  return (
    <Hero1
      logoSrc={logo}
      onBack={() => navigate("/")}
      onContinue={() => navigate("/setup/costs")}
      continueDisabled={!isComplete}
      inputValue={input}
      onInputChange={setInput}
      onInputSubmit={handleSend}
      inputDisabled={isTyping || isComplete}
      inputPlaceholder={
        isComplete
          ? "All done! Moving you forward... 🎉"
          : isTyping
          ? localAIProgress?.text || "LaunchPad is typing..."
          : "Type your answer here..."
      }
      badgeText={mode === "improve" ? "Product Improvement" : "New Product Setup"}
      title={mode === "improve" ? "Tell LaunchPad What You Want to Improve" : "Tell LaunchPad About Your New Product"}
      description={mode === "improve" ? "Describe what exists today, what is not working, and the result you want." : "Chat with our AI to turn your idea into a business plan."}
    >
      <div className="-mb-3 sm:-mb-2">
        <ProgressSteps currentStep={1} mode={mode} />
      </div>
      {flowNotice && (
        <div className="mb-2 rounded-xl border border-[#A9DDE3] bg-white px-4 py-2 text-sm font-semibold text-[#2B2B2B]">
          {flowNotice}
        </div>
      )}
      {/* Chat messages */}
      <div className={`flex flex-col gap-3 min-h-[17rem] max-h-[27rem] overflow-y-auto px-2 py-2.5 scroll-smooth rounded-2xl border border-[#D6E6EA] bg-[#FCFEFF] ${assistantHighlight ? "priceit-agent-highlight p-2" : ""}`}>
        {messages.map((msg, i) => (
          <Bubble key={i} msg={msg} />
        ))}
        {!isTyping && !isComplete && quickOptions.length > 0 && (
          <div className="ml-10 flex flex-wrap gap-2">
            {quickOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => sendAnswer(option)}
                className="min-h-11 rounded-xl border border-[#5DB7C4] bg-white px-4 py-2 text-sm font-bold text-[#337F89] shadow-sm transition hover:bg-[#EAF7F9]"
              >
                {option}
              </button>
            ))}
          </div>
        )}
        {!isTyping && !isComplete && exampleOptions.length > 0 && (
          <div className="ml-10 flex flex-col gap-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9BBFC3]">
              Example answers — click to use
            </p>
            <div className="flex flex-wrap gap-2">
              {exampleOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setInput(option)}
                  className="rounded-xl border border-[#D8E8EC] bg-[#F7FBFC] px-3.5 py-1.5 text-sm text-[#5B7780] hover:border-[#5DB7C4] hover:bg-[#EAF7F9] hover:text-[#1E6470] transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </Hero1>
  );
}

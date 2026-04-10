import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import { Hero1 } from "@/components/ui/hero-1";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import { Bot } from "lucide-react";
import logo from "../../logo.png";

// ─── types ────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
}

// ─── system prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a friendly and encouraging business assistant for kids aged 8-12. Your job is to learn about their product idea through a fun conversation.

Ask about one thing at a time in this order: product name, what it does and how it works, who would buy it, and any special features that make it unique. Keep your messages short, enthusiastic, and easy to understand. Use simple words and the occasional emoji.

If an answer is too vague, ask a follow-up question to get more detail before moving on. For example if they say "it's a toy" ask what kind of toy, what it does, how much it costs to make etc.

Once you have enough information about all four topics, determine the product category yourself (Physical Product, Digital Product, Service, Food & Beverage, or Other) and respond with a completion message followed immediately by a JSON block in this exact format:

PRODUCT_COMPLETE
{"name": "...", "description": "...", "targetCustomer": "...", "specialFeature": "...", "category": "..."}

Do not output the JSON until you genuinely have enough detail in all fields.`;

// ─── OpenRouter helper ────────────────────────────────────────────────────────

async function fetchAIResponse(history: Message[]): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
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
        max_tokens: 600,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.map((m) => ({ role: m.role, content: m.content })),
        ],
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
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Missing content in response");
  return content;
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
          {msg.content}
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
  const { updateProductInfo } = useAppState();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [retryHistory, setRetryHistory] = useState<Message[] | null>(null);
  const [flowNotice, setFlowNotice] = useState<string | null>(null);
  const [assistantHighlight, setAssistantHighlight] = useState(false);

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
    setRetryHistory(history);
    try {
      const text = await fetchAIResponse(history);

      // Check for PRODUCT_COMPLETE marker
      const completionIdx = text.indexOf("PRODUCT_COMPLETE");
      if (completionIdx !== -1) {
        const afterMarker = text.slice(completionIdx + "PRODUCT_COMPLETE".length);
        const jsonMatch =
          afterMarker.match(/```(?:json)?\s*([\s\S]*?)```/) ||
          afterMarker.match(/(\{[\s\S]*\})/);

        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            updateProductInfo({
              productName: parsed.name ?? "",
              productDescription: parsed.description ?? "",
              targetCustomer: parsed.targetCustomer ?? "",
              specialFeature: parsed.specialFeature ?? "",
              category: parsed.category ?? "",
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
          } catch (_) {
            // JSON parse failed — fall through and display the raw message
          }
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
      setRetryHistory(null);
    } catch (_) {
      const isTimeout = _ instanceof Error && _.message === "REQUEST_TIMEOUT";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isTimeout
            ? "That took too long. Tap retry and I'll try again."
            : "Oops! Something went wrong. Please check your connection and try again 😅",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [navigate, updateProductInfo]);

  // Trigger opening AI greeting exactly once
  useEffect(() => {
    if (calledOnce.current) return;
    calledOnce.current = true;
    callAI([]);
  }, [callAI]);

  const handleSend = () => {
    if (!input.trim() || isTyping || isComplete) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    callAI(next);
  };

  const handleRetry = () => {
    if (!retryHistory || isTyping || isComplete) return;
    callAI(retryHistory);
  };

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
          ? "PriceIt is typing..."
          : "Type your answer here..."
      }
    >
      <div className="-mb-3 sm:-mb-2">
        <ProgressSteps currentStep={1} />
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
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
      {retryHistory && !isTyping && !isComplete && (
        <div className="mt-2 flex justify-end">
          <ChronicleButton
            text="Retry AI"
            onClick={handleRetry}
            hoverColor="#F36C3D"
            customBackground="#5DB7C4"
            customForeground="#ffffff"
            hoverForeground="#ffffff"
            width="140px"
            borderRadius="999px"
          />
        </div>
      )}
    </Hero1>
  );
}

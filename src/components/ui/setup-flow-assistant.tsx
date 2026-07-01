import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { MarkdownMessage } from "@/components/ui/markdown-message";
import { AI_PROVIDER, generateAI, type AIProgress } from "@/lib/ai-provider";
import { setupAssistantTemplate } from "@/lib/ai-templates";
 
import { askOpenRouter } from "@/lib/openrouter-ai";
import { extractJsonObject } from "@/lib/safe-json";
import { limitProductName, PRODUCT_NAME_MAX_LENGTH } from "@/lib/product-name";
import type {
  AppState,
  FixedCostCategory,
  FixedCostItem,
  ProductInfo,
  VariableCostItem,
} from "@/context/AppStateContext";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ToolCall {
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: unknown;
  };
}

interface ApiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  tool_calls?: ToolCall[];
  name?: string;
  tool_call_id?: string;
}

interface ToastMessage {
  id: string;
  text: string;
}

interface ToolOutcomeSuccess {
  ok: true;
  result: string;
  toast: string;
}

interface ToolOutcomeError {
  ok: false;
  error: string;
}

type ToolOutcome = ToolOutcomeSuccess | ToolOutcomeError;

const MAX_AGENT_STEPS = 4;
const API_TIMEOUT_MS = 10000;
const FIXED_COST_CATEGORIES: FixedCostCategory[] = [
  "Equipment",
  "Facility Rental",
  "Instructor Fee",
  "Rent",
  "Supplies",
  "Packaging",
  "Other",
];

const SYSTEM_PROMPT = `You are a helpful business assistant for kids aged 8-12 using the LaunchPad app.
You can read and update the user's product information through tool calls.

Rules you must always follow:
1. Always receive the full current product state before responding
2. If a cost with the same name already exists, update it instead of adding a duplicate
3. Never guess missing information -- call ask_clarification instead
4. Validate before acting: amounts must be positive numbers, names must not be empty
5. After every successful tool call, confirm what you changed in one friendly sentence
6. If the user's message is unclear or missing details, always ask_clarification first
7. Keep all messages short and friendly, written for kids aged 8-12
8. Do not reveal hidden reasoning; return only the requested response or JSON
9. Product names must be ${PRODUCT_NAME_MAX_LENGTH} characters or fewer
/no_think`;

const JS_TOOLS = [
  {
    type: "function",
    function: {
      name: "add_fixed_cost",
      description: "Add a new fixed cost item or update an existing one by name",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          amount: { type: "number" },
          type: { type: "string", enum: ["one-time", "monthly"] },
          months: { type: "number" },
          category: { type: "string", enum: FIXED_COST_CATEGORIES },
        },
        required: ["name", "amount", "type", "category"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_variable_cost",
      description: "Add a new variable cost input or update an existing one by name",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          pricePerPack: { type: "number" },
          unitsPerPack: { type: "number" },
          unitsPerProduct: { type: "number" },
        },
        required: ["name", "pricePerPack", "unitsPerPack", "unitsPerProduct"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_selling_price",
      description: "Update the product selling price",
      parameters: {
        type: "object",
        properties: {
          price: { type: "number" },
        },
        required: ["price"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_product_info",
      description: "Update a single product info field",
      parameters: {
        type: "object",
        properties: {
          field: {
            type: "string",
            enum: ["name", "description", "targetCustomer", "specialFeature", "category"],
          },
          value: { type: "string" },
        },
        required: ["field", "value"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_clarification",
      description: "Ask the user for more information before making any changes",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string" },
        },
        required: ["question"],
        additionalProperties: false,
      },
    },
  },
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function parseArgs(input: unknown): Record<string, unknown> | null {
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input) as unknown;
      return asRecord(parsed);
    } catch {
      return null;
    }
  }
  return asRecord(input);
}

function getNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getPositiveNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function buildStateSystemNote(state: AppState): string {
  const visibleState = {
    journeyMode: state.journeyMode,
    productInfo: {
      name: state.productInfo.productName,
      description: state.productInfo.productDescription,
      targetCustomer: state.productInfo.targetCustomer,
      specialFeature: state.productInfo.specialFeature,
      category: state.productInfo.category,
      currentChallenge: state.productInfo.currentChallenge,
      improvementGoal: state.productInfo.improvementGoal,
      inspiration: state.productInfo.inspiration,
    },
    fixedCosts: state.fixedCosts.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.totalCost,
      type: item.type,
      months: item.monthsOfUse,
      category: item.category,
    })),
    variableCosts: state.variableCosts.map((item) => ({
      id: item.id,
      name: item.name,
      pricePerPack: item.pricePerPack,
      unitsPerPack: item.unitsPerPack,
      unitsPerProduct: item.unitsPerProduct,
      category: item.category,
    })),
    pricing: {
      sellingPrice: state.pricing.sellingPrice,
      unitsPerMonth: state.pricing.unitsPerMonth,
    },
  };

  return `Current product state (source of truth):\n${JSON.stringify(visibleState, null, 2)}`;
}

function extractToolCalls(message: {
  content?: string;
  tool_calls?: ToolCall[];
  function_call?: { name?: string; arguments?: unknown };
}): ToolCall[] {
  if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
    return message.tool_calls;
  }
  if (message.function_call) {
    return [{ id: `legacy-${Date.now()}`, type: "function", function: message.function_call }];
  }
  return [];
}

function emitStateHighlight(section: "productInfo" | "fixedCosts" | "variableCosts" | "pricing") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("priceit-state-changed", {
      detail: { section },
    })
  );
}

export function SetupFlowAssistant() {
  const location = useLocation();
  const {
    state,
    updateProductInfo,
    addFixedCost,
    updateFixedCost,
    addVariableCost,
    updateVariableCost,
    updatePricing,
  } = useAppState();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isResponding, setIsResponding] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [retryInput, setRetryInput] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [localAIProgress, setLocalAIProgress] = useState<AIProgress | null>(null);

  const stateRef = useRef(state);
  const conversationRef = useRef(conversation);
  const panelOpenRef = useRef(isOpen);
  const toastTimeoutsRef = useRef<number[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastInputRef = useRef("");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    panelOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, isResponding, isOpen]);

  useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      toastTimeoutsRef.current = [];
    };
  }, []);

  const isSetupRoute = location.pathname.startsWith("/setup");

  const addToast = (text: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, text }]);
    const timeoutId = window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      toastTimeoutsRef.current = toastTimeoutsRef.current.filter((activeId) => activeId !== timeoutId);
    }, 3200);
    toastTimeoutsRef.current.push(timeoutId);
  };

  const addAssistantMessage = (text: string) => {
    const content = text.trim();
    const fallback = "Can you tell me a little more so I can update that correctly?";
    const message: ChatMessage = { role: "assistant", content: content || fallback };
    setConversation((prev) => [...prev, message]);
    if (!panelOpenRef.current) setUnreadCount((prev) => prev + 1);
    return message;
  };

  const callApi = async (messages: ApiMessage[]) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
      const message = await askOpenRouter({
        messages,
        tools: JS_TOOLS,
        toolChoice: "auto",
        signal: controller.signal,
      });
      return {
        ...message,
        tool_calls: message.tool_calls as ToolCall[] | undefined,
      };
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const executeTool = (toolName: string, args: Record<string, unknown> | null): ToolOutcome => {
    if (!args) return { ok: false, error: "Invalid tool arguments JSON." };

    if (toolName === "add_fixed_cost") {
      const name = getNonEmptyString(args.name);
      const amount = getPositiveNumber(args.amount);
      const type = args.type;
      const category = args.category;

      if (!name) return { ok: false, error: "name must be a non-empty string." };
      if (!amount) return { ok: false, error: "amount must be a positive number." };
      if (type !== "one-time" && type !== "monthly") {
        return { ok: false, error: "type must be 'one-time' or 'monthly'." };
      }
      if (!FIXED_COST_CATEGORIES.includes(category as FixedCostCategory)) {
        return { ok: false, error: "category must be one of the supported fixed-cost categories." };
      }

      let monthsOfUse: number | "" = "";
      if (type === "one-time") {
        const months = getPositiveNumber(args.months);
        if (!months) {
          return { ok: false, error: "months must be a positive number when type is one-time." };
        }
        monthsOfUse = months;
      }

      const normalized = name.toLowerCase();
      const existing = stateRef.current.fixedCosts.find(
        (item) => item.name.trim().toLowerCase() === normalized
      );

      const updates: Partial<FixedCostItem> = {
        name,
        totalCost: amount,
        type,
        monthsOfUse,
        category: category as FixedCostCategory,
      };

      const action = existing ? "Updated" : "Added";
      if (existing) {
        updateFixedCost(existing.id, updates);
        stateRef.current = {
          ...stateRef.current,
          fixedCosts: stateRef.current.fixedCosts.map((item) =>
            item.id === existing.id ? { ...item, ...updates } : item
          ),
        };
      } else {
        const newId = addFixedCost();
        updateFixedCost(newId, updates);
        stateRef.current = {
          ...stateRef.current,
          fixedCosts: [
            ...stateRef.current.fixedCosts,
            {
              id: newId,
              name,
              totalCost: amount,
              type,
              monthsOfUse,
              category: category as FixedCostCategory,
            },
          ],
        };
      }
      emitStateHighlight("fixedCosts");

      const details =
        type === "one-time"
          ? `${action} ${name} - $${formatMoney(amount)} one-time over ${monthsOfUse} months.`
          : `${action} ${name} - $${formatMoney(amount)} per month.`;

      return {
        ok: true,
        result: details,
        toast: details,
      };
    }

    if (toolName === "add_variable_cost") {
      const name = getNonEmptyString(args.name);
      const pricePerPack = getPositiveNumber(args.pricePerPack);
      const unitsPerPack = getPositiveNumber(args.unitsPerPack);
      const unitsPerProduct = getPositiveNumber(args.unitsPerProduct);

      if (!name) return { ok: false, error: "name must be a non-empty string." };
      if (!pricePerPack) return { ok: false, error: "pricePerPack must be a positive number." };
      if (!unitsPerPack) return { ok: false, error: "unitsPerPack must be a positive number." };
      if (!unitsPerProduct) return { ok: false, error: "unitsPerProduct must be a positive number." };

      const normalized = name.toLowerCase();
      const existing = stateRef.current.variableCosts.find(
        (item) => item.name.trim().toLowerCase() === normalized
      );

      const updates: Partial<VariableCostItem> = {
        name,
        pricePerPack,
        unitsPerPack,
        unitsPerProduct,
      };

      const action = existing ? "Updated" : "Added";
      if (existing) {
        updateVariableCost(existing.id, updates);
        stateRef.current = {
          ...stateRef.current,
          variableCosts: stateRef.current.variableCosts.map((item) =>
            item.id === existing.id ? { ...item, ...updates } : item
          ),
        };
      } else {
        const newId = addVariableCost();
        updateVariableCost(newId, updates);
        stateRef.current = {
          ...stateRef.current,
          variableCosts: [
            ...stateRef.current.variableCosts,
            {
              id: newId,
              name,
              pricePerPack,
              unitsPerPack,
              unitsPerProduct,
              category: "Materials",
            },
          ],
        };
      }
      emitStateHighlight("variableCosts");

      const details = `${action} ${name} - $${formatMoney(pricePerPack)} for a pack of ${unitsPerPack}, uses ${unitsPerProduct} per product.`;
      return {
        ok: true,
        result: details,
        toast: details,
      };
    }

    if (toolName === "update_selling_price") {
      const price = getPositiveNumber(args.price);
      if (!price) return { ok: false, error: "price must be a positive number." };

      updatePricing({ sellingPrice: price });
      stateRef.current = {
        ...stateRef.current,
        pricing: {
          ...stateRef.current.pricing,
          sellingPrice: price,
        },
      };
      const details = `Updated selling price to $${formatMoney(price)}.`;
      emitStateHighlight("pricing");
      return {
        ok: true,
        result: details,
        toast: details,
      };
    }

    if (toolName === "set_product_info") {
      const fieldMap = {
        name: "productName",
        description: "productDescription",
        targetCustomer: "targetCustomer",
        specialFeature: "specialFeature",
        category: "category",
      } as const;

      const fieldLabels = {
        name: "product name",
        description: "description",
        targetCustomer: "target customer",
        specialFeature: "special feature",
        category: "category",
      } as const;

      const field = args.field;
      if (typeof field !== "string" || !(field in fieldMap)) {
        return { ok: false, error: "field must be one of: name, description, targetCustomer, specialFeature, category." };
      }

      const rawValue = getNonEmptyString(args.value);
      const value = field === "name" && rawValue ? limitProductName(rawValue) : rawValue;
      if (!value) return { ok: false, error: "value must be a non-empty string." };

      const mappedField = fieldMap[field as keyof typeof fieldMap];
      const updates: Partial<ProductInfo> = {
        [mappedField]: value,
      };
      updateProductInfo(updates);
      stateRef.current = {
        ...stateRef.current,
        productInfo: {
          ...stateRef.current.productInfo,
          [mappedField]: value,
        },
      };

      const details = `Updated ${fieldLabels[field as keyof typeof fieldLabels]} to "${value}".`;
      emitStateHighlight("productInfo");
      return {
        ok: true,
        result: details,
        toast: details,
      };
    }

    return { ok: false, error: `Unknown tool: ${toolName}` };
  };

  const runLocalOrTemplateTurn = async (userInput: string, priorHistory: ChatMessage[]) => {
    const fallback = setupAssistantTemplate(userInput);
    const prompt = `${SYSTEM_PROMPT}

Instead of calling tools directly, return ONLY one JSON object.
To make a change: {"tool":"tool_name","args":{...}}
To ask a question or explain: {"response":"short kid-friendly message"}
Allowed tools and arguments:
- update_selling_price: {"price": number}
- set_product_info: {"field":"name|description|targetCustomer|specialFeature|category","value": string}
- add_fixed_cost: {"name": string,"amount": number,"type":"one-time|monthly","months": number when one-time,"category":"Equipment|Rent|Supplies|Packaging|Other"}
- add_variable_cost: {"name": string,"pricePerPack": number,"unitsPerPack": number,"unitsPerProduct": number}

${buildStateSystemNote(stateRef.current)}
Recent conversation: ${JSON.stringify(priorHistory.slice(-6))}
User request: ${userInput}`;
    const result = await generateAI({
      messages: [{ role: "user", content: prompt }],
      template: () => JSON.stringify(fallback),
      maxTokens: 250,
      temperature: 0.2,
      jsonMode: true,
      onProgress: setLocalAIProgress,
    });
    setLocalAIProgress(null);

    const parsed: Record<string, unknown> =
      extractJsonObject(result.text) ?? (fallback as unknown as Record<string, unknown>);
    if (typeof parsed.response === "string" && parsed.response.trim()) {
      return parsed.response.trim();
    }
    const toolName = typeof parsed.tool === "string" ? parsed.tool : "";
    const args = parsed.args && typeof parsed.args === "object" && !Array.isArray(parsed.args)
      ? (parsed.args as Record<string, unknown>)
      : null;
    if (!toolName || !args) {
      return fallback && "response" in fallback
        ? fallback.response
        : "Tell me one change you want to make, and I'll help!";
    }
    const outcome = executeTool(toolName, args);
    if (!outcome.ok) {
      return `I couldn't make that change yet: ${outcome.error} Please add the missing detail and try again.`;
    }
    addToast(outcome.toast);
    return outcome.result;
  };

  const runAgentTurn = async (userInput: string, priorHistory: ChatMessage[]) => {
    if (AI_PROVIDER !== "openrouter") {
      return runLocalOrTemplateTurn(userInput, priorHistory);
    }

    let workingMessages: ApiMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...priorHistory.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: "system", content: buildStateSystemNote(stateRef.current) },
      { role: "user", content: userInput },
    ];

    for (let step = 0; step < MAX_AGENT_STEPS; step += 1) {
      const assistantMessage = await callApi(workingMessages);
      const toolCalls = extractToolCalls(assistantMessage);

      if (toolCalls.length === 0) {
        const content = assistantMessage.content?.trim();
        return content && content.length > 0
          ? content
          : "I can help update your product setup. Tell me what you want to change.";
      }

      const toolResults: ApiMessage[] = [];

      const clarificationCall = toolCalls.find((call) => call.function?.name === "ask_clarification");
      if (clarificationCall) {
        const clarificationArgs = parseArgs(clarificationCall.function?.arguments);
        const clarificationQuestion = getNonEmptyString(clarificationArgs?.question);
        return clarificationQuestion ?? "Can you share one more detail so I can update it correctly?";
      }

      for (const call of toolCalls) {
        const toolName = call.function?.name;
        const toolId = call.id ?? `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        if (!toolName) {
          toolResults.push({
            role: "tool",
            tool_call_id: toolId,
            name: "unknown",
            content: JSON.stringify({
              isError: true,
              error: "Tool call missing function name.",
            }),
          });
          continue;
        }

        const parsedArgs = parseArgs(call.function?.arguments);
        const outcome = executeTool(toolName, parsedArgs);

        if (outcome.ok) {
          addToast(outcome.toast);
          toolResults.push({
            role: "tool",
            tool_call_id: toolId,
            name: toolName,
            content: JSON.stringify({
              isError: false,
              result: outcome.result,
            }),
          });
        } else {
          toolResults.push({
            role: "tool",
            tool_call_id: toolId,
            name: toolName,
            content: JSON.stringify({
              isError: true,
              error: outcome.error,
            }),
          });
        }
      }

      workingMessages = [
        ...workingMessages,
        {
          role: "assistant",
          content: assistantMessage.content ?? "",
          tool_calls: toolCalls,
        },
        ...toolResults,
        { role: "system", content: buildStateSystemNote(stateRef.current) },
      ];
    }

    return "I need one more try. Please ask me again in one short sentence.";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isResponding) return;

    const text = inputValue.trim();
    if (!text) return;

    const priorHistory = conversationRef.current;
    const userMessage: ChatMessage = { role: "user", content: text };
    setConversation((prev) => [...prev, userMessage]);
    setInputValue("");
    lastInputRef.current = text;
    setRetryInput(null);
    setIsResponding(true);

    try {
      const assistantText = await runAgentTurn(text, priorHistory);
      addAssistantMessage(assistantText);
    } catch {
      addAssistantMessage("Error with AI. Please try again.");
      setRetryInput(text);
    } finally {
      setIsResponding(false);
    }
  };

  const handleRetry = async () => {
    if (!retryInput || isResponding) return;
    const priorHistory = conversationRef.current;
    setIsResponding(true);
    try {
      const assistantText = await runAgentTurn(retryInput, priorHistory);
      addAssistantMessage(assistantText);
      setRetryInput(null);
    } catch {
      addAssistantMessage("Error with AI. Please try again.");
    } finally {
      setIsResponding(false);
    }
  };

  if (!isSetupRoute) return null;

  return (
    <>
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="max-w-[320px] rounded-xl border border-[#9BD8E2] bg-white px-3 py-2 text-xs font-semibold text-[#2B2B2B] shadow-[0_6px_18px_rgba(43,43,43,0.18)]"
          >
            {toast.text}
          </div>
        ))}
      </div>

      <div
        className={`fixed bottom-24 right-2 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-[340px] max-w-[calc(100vw-1rem)] transition-all duration-200 ${
          isOpen ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-3 opacity-0 pointer-events-none"
        }`}
      >
        <div className="rounded-2xl border border-[#9BD8E2] bg-white shadow-[0_12px_28px_rgba(43,43,43,0.18)] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#CDEBF0] bg-[#EAF7FB]">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-[#0E92A3] text-white flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#2B2B2B] leading-tight">LaunchPad Helper</p>
                <p className="text-[11px] text-[#5C7F87] leading-tight">Ask me to update anything</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-full bg-[#E1603F] text-white hover:bg-[#C94E32] transition-colors flex items-center justify-center"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="h-[340px] overflow-y-auto px-3 py-3 bg-[#FBFEFF]">
            {localAIProgress && (
              <div className="mb-2 rounded-xl border border-[#9BD8E2] bg-[#EAF7FB] px-3 py-2 text-xs text-[#2B2B2B]">
                <p className="font-semibold">
                  {`${Math.round(localAIProgress.progress * 100)}% — ${localAIProgress.text}`}
                </p>
              </div>
            )}
            {conversation.length === 0 && (
              <div className="rounded-xl border border-[#D8E1E4] bg-white px-3 py-2.5 text-xs text-[#486B73]">
                Ask me to add costs, update price, or fix product details.
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {conversation.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                      message.role === "user"
                        ? "bg-[#0E92A3] text-white rounded-tr-sm"
                        : "bg-white border border-[#9BD8E2] text-[#2B2B2B] rounded-tl-sm"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <MarkdownMessage>{message.content}</MarkdownMessage>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}

              {isResponding && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#9BD8E2] rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#0E92A3] animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#0E92A3] animate-bounce"
                        style={{ animationDelay: "120ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#0E92A3] animate-bounce"
                        style={{ animationDelay: "240ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-[#CDEBF0] p-2.5 bg-white">
            <div className="flex items-center gap-2 rounded-full border border-[#9BD8E2] px-2 py-1.5">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isResponding ? "LaunchPad is thinking..." : "Type a message..."}
                disabled={isResponding}
                className="flex-1 bg-white outline-none text-sm text-[#2B2B2B] placeholder-[#5C7F87] px-2"
              />
              <button
                type="submit"
                disabled={isResponding || inputValue.trim().length === 0}
                className="h-11 w-11 rounded-full bg-[#0E92A3] text-white hover:bg-[#0A7685] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            {retryInput && !isResponding && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="min-h-11 rounded-full bg-[#E1603F] px-3 text-xs font-bold text-white hover:bg-[#C94E32] transition-colors"
                >
                  Retry Last Message
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#0E92A3] text-white shadow-[0_10px_22px_rgba(31,44,50,0.18)] hover:bg-[#0A7685] transition-colors flex items-center justify-center"
        aria-label="Open assistant chat"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-[#E1603F] border-2 border-white" />
        )}
      </button>
    </>
  );
}

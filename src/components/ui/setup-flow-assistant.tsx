import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
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

interface ApiResponse {
  choices?: Array<{
    message?: {
      content?: string;
      tool_calls?: ToolCall[];
      function_call?: {
        name?: string;
        arguments?: unknown;
      };
    };
  }>;
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

const MODEL_NAME = "google/gemini-2.0-flash-001";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_AGENT_STEPS = 4;
const API_TIMEOUT_MS = 10000;
const FIXED_COST_CATEGORIES: FixedCostCategory[] = [
  "Equipment",
  "Rent",
  "Supplies",
  "Packaging",
  "Other",
];

const SYSTEM_PROMPT = `You are a helpful business assistant for kids aged 8-12 using the PriceIt app.
You can read and update the user's product information through tool calls.

Rules you must always follow:
1. Always receive the full current product state before responding
2. If a cost with the same name already exists, update it instead of adding a duplicate
3. Never guess missing information -- call ask_clarification instead
4. Validate before acting: amounts must be positive numbers, names must not be empty
5. After every successful tool call, confirm what you changed in one friendly sentence
6. If the user's message is unclear or missing details, always ask_clarification first
7. Keep all messages short and friendly, written for kids aged 8-12`;

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
    productInfo: {
      name: state.productInfo.productName,
      description: state.productInfo.productDescription,
      targetCustomer: state.productInfo.targetCustomer,
      specialFeature: state.productInfo.specialFeature,
      category: state.productInfo.category,
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

  const stateRef = useRef(state);
  const conversationRef = useRef(conversation);
  const panelOpenRef = useRef(isOpen);
  const toastTimeoutsRef = useRef<number[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  const isSetupRoute = location.pathname.startsWith("/setup") || location.pathname === "/pricing";

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
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("Missing OpenRouter API key");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages,
          tools: JS_TOOLS,
          tool_choice: "auto",
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

    if (!response.ok) {
      throw new Error(`OpenRouter API error ${response.status}`);
    }

    const data = (await response.json()) as ApiResponse;
    const message = data.choices?.[0]?.message;
    if (!message) throw new Error("No assistant response from API");
    return message;
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

      const value = getNonEmptyString(args.value);
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

  const runAgentTurn = async (userInput: string, priorHistory: ChatMessage[]) => {
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
    setRetryInput(null);
    setIsResponding(true);

    try {
      const assistantText = await runAgentTurn(text, priorHistory);
      addAssistantMessage(assistantText);
    } catch (error) {
      if (error instanceof Error && error.message === "REQUEST_TIMEOUT") {
        addAssistantMessage("That took too long. Tap retry and I'll try again.");
        setRetryInput(text);
      } else {
        addAssistantMessage("I hit a connection issue. Please try again in a moment.");
      }
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
    } catch (error) {
      if (error instanceof Error && error.message === "REQUEST_TIMEOUT") {
        addAssistantMessage("Still timing out. Please check your connection and try again.");
      } else {
        addAssistantMessage("I still can't reach the AI right now. Please try again.");
      }
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
            className="max-w-[320px] rounded-xl border border-[#A9DDE3] bg-white px-3 py-2 text-xs font-semibold text-[#2B2B2B] shadow-[0_6px_18px_rgba(43,43,43,0.18)]"
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
        <div className="rounded-2xl border border-[#A9DDE3] bg-white shadow-[0_12px_28px_rgba(43,43,43,0.18)] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E0EFF1] bg-[#F0FAFB]">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-[#5DB7C4] text-white flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#2B2B2B] leading-tight">PriceIt Helper</p>
                <p className="text-[11px] text-[#7B9EA3] leading-tight">Ask me to update anything</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-full text-[#7B9EA3] hover:text-[#F36C3D] hover:bg-white transition-colors flex items-center justify-center"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="h-[340px] overflow-y-auto px-3 py-3 bg-[#FBFEFF]">
            {conversation.length === 0 && (
              <div className="rounded-xl border border-[#D9EDF0] bg-white px-3 py-2.5 text-xs text-[#5B7780]">
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
                        ? "bg-[#5DB7C4] text-white rounded-tr-sm"
                        : "bg-white border border-[#A9DDE3] text-[#2B2B2B] rounded-tl-sm"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {isResponding && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#A9DDE3] rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#5DB7C4] animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#5DB7C4] animate-bounce"
                        style={{ animationDelay: "120ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#5DB7C4] animate-bounce"
                        style={{ animationDelay: "240ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-[#E0EFF1] p-2.5 bg-white">
            <div className="flex items-center gap-2 rounded-full border border-[#A9DDE3] px-2 py-1.5">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isResponding ? "PriceIt is thinking..." : "Type a message..."}
                disabled={isResponding}
                className="flex-1 bg-transparent outline-none text-sm text-[#2B2B2B] placeholder-[#7B9EA3] px-2"
              />
              <button
                type="submit"
                disabled={isResponding || inputValue.trim().length === 0}
                className="h-11 w-11 rounded-full bg-[#5DB7C4] text-white hover:bg-[#4aa8b5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
                  className="min-h-11 rounded-full border border-[#F36C3D] px-3 text-xs font-bold text-[#F36C3D] hover:bg-[#FFF0EA] transition-colors"
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
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#5DB7C4] text-white shadow-[0_10px_24px_rgba(93,183,196,0.45)] hover:bg-[#4aa8b5] transition-colors flex items-center justify-center"
        aria-label="Open assistant chat"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-[#F36C3D] border-2 border-white" />
        )}
      </button>
    </>
  );
}

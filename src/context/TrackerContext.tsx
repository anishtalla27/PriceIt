import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  name: string;
  quantityMade: number;
  quantitySold: number;
  costPerItem: number | "";
  sellingPrice: number | "";
}

export type ExpenseCategory = "Materials" | "Packaging" | "Booth Fee" | "Marketing" | "Tools" | "Other";
export type GoalType = "money" | "units" | "custom";
export type FeedbackCategory = "Loved it" | "Too expensive" | "Wanted more options" | "Quality issue" | "Packaging" | "Other";

export interface SaleRecord {
  id: string;
  date: string;
  productName: string;
  inventoryItemId: string | null;
  quantity: number;
  pricePerUnit: number;
  note: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
}

export interface EventRecord {
  id: string;
  name: string;
  date: string;
  location: string;
  expectedCustomers: number | "";
  boothFee: number | "";
  eventGoal: string;
  completed: boolean;
  unitsSold: number | "";
  revenueActual: number | "";
  expensesActual: number | "";
  whatWentWell: string;
  improvements: string;
}

export interface GoalRecord {
  id: string;
  name: string;
  type: GoalType;
  target: number | "";
  deadline: string;
}

export interface FeedbackRecord {
  id: string;
  date: string;
  source: string;
  comment: string;
  category: FeedbackCategory;
}

export interface TrackerData {
  inventory: InventoryItem[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  events: EventRecord[];
  goals: GoalRecord[];
  feedback: FeedbackRecord[];
}

// ─── Context value ────────────────────────────────────────────────────────────

interface TrackerContextValue {
  data: TrackerData;
  // Inventory
  addInventoryItem: (item: Omit<InventoryItem, "id" | "quantitySold">) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  // Sales
  addSale: (sale: Omit<SaleRecord, "id">) => void;
  deleteSale: (id: string) => void;
  // Expenses
  addExpense: (expense: Omit<ExpenseRecord, "id">) => void;
  updateExpense: (id: string, updates: Partial<ExpenseRecord>) => void;
  deleteExpense: (id: string) => void;
  // Events
  addEvent: (event: Omit<EventRecord, "id">) => void;
  updateEvent: (id: string, updates: Partial<EventRecord>) => void;
  deleteEvent: (id: string) => void;
  // Goals
  addGoal: (goal: Omit<GoalRecord, "id">) => void;
  updateGoal: (id: string, updates: Partial<GoalRecord>) => void;
  deleteGoal: (id: string) => void;
  // Feedback
  addFeedback: (feedback: Omit<FeedbackRecord, "id">) => void;
  deleteFeedback: (id: string) => void;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "priceit_tracker_v1";

const defaultData: TrackerData = {
  inventory: [],
  sales: [],
  expenses: [],
  events: [],
  goals: [],
  feedback: [],
};

function loadData(): TrackerData {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as Partial<TrackerData>;
    return {
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      sales: Array.isArray(parsed.sales) ? parsed.sales : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
    };
  } catch {
    return defaultData;
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<TrackerData>(() => loadData());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // ── Inventory ──

  const addInventoryItem = useCallback((item: Omit<InventoryItem, "id" | "quantitySold">) => {
    setData((prev) => ({
      ...prev,
      inventory: [...prev.inventory, { ...item, id: uid("inv"), quantitySold: 0 }],
    }));
  }, []);

  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setData((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));
  }, []);

  const deleteInventoryItem = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((item) => item.id !== id),
    }));
  }, []);

  // ── Sales ──

  const addSale = useCallback((sale: Omit<SaleRecord, "id">) => {
    const newSale: SaleRecord = { ...sale, id: uid("sale") };
    setData((prev) => {
      const updatedInventory =
        sale.inventoryItemId
          ? prev.inventory.map((item) =>
              item.id === sale.inventoryItemId
                ? { ...item, quantitySold: item.quantitySold + sale.quantity }
                : item
            )
          : prev.inventory;
      return {
        ...prev,
        sales: [...prev.sales, newSale],
        inventory: updatedInventory,
      };
    });
  }, []);

  const deleteSale = useCallback((id: string) => {
    setData((prev) => {
      const sale = prev.sales.find((s) => s.id === id);
      const updatedInventory =
        sale?.inventoryItemId
          ? prev.inventory.map((item) =>
              item.id === sale.inventoryItemId
                ? { ...item, quantitySold: Math.max(0, item.quantitySold - sale.quantity) }
                : item
            )
          : prev.inventory;
      return {
        ...prev,
        sales: prev.sales.filter((s) => s.id !== id),
        inventory: updatedInventory,
      };
    });
  }, []);

  // ── Expenses ──

  const addExpense = useCallback((expense: Omit<ExpenseRecord, "id">) => {
    setData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, { ...expense, id: uid("exp") }],
    }));
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<ExpenseRecord>) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setData((prev) => ({ ...prev, expenses: prev.expenses.filter((e) => e.id !== id) }));
  }, []);

  // ── Events ──

  const addEvent = useCallback((event: Omit<EventRecord, "id">) => {
    setData((prev) => ({
      ...prev,
      events: [...prev.events, { ...event, id: uid("evt") }],
    }));
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<EventRecord>) => {
    setData((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setData((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }));
  }, []);

  // ── Goals ──

  const addGoal = useCallback((goal: Omit<GoalRecord, "id">) => {
    setData((prev) => ({
      ...prev,
      goals: [...prev.goals, { ...goal, id: uid("goal") }],
    }));
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<GoalRecord>) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setData((prev) => ({ ...prev, goals: prev.goals.filter((g) => g.id !== id) }));
  }, []);

  // ── Feedback ──

  const addFeedback = useCallback((feedback: Omit<FeedbackRecord, "id">) => {
    setData((prev) => ({
      ...prev,
      feedback: [...prev.feedback, { ...feedback, id: uid("fb") }],
    }));
  }, []);

  const deleteFeedback = useCallback((id: string) => {
    setData((prev) => ({ ...prev, feedback: prev.feedback.filter((f) => f.id !== id) }));
  }, []);

  return (
    <TrackerContext.Provider
      value={{
        data,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addSale,
        deleteSale,
        addExpense,
        updateExpense,
        deleteExpense,
        addEvent,
        updateEvent,
        deleteEvent,
        addGoal,
        updateGoal,
        deleteGoal,
        addFeedback,
        deleteFeedback,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
}

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error("useTracker must be used within TrackerProvider");
  return ctx;
}

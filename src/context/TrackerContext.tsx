import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  savedProductId?: string | null;
  name: string;
  quantityMade: number;
  quantitySold: number;
  costPerItem: number | "";
  sellingPrice: number | "";
  lowStockAt?: number | "";
}

export interface MaterialInventoryItem {
  id: string;
  name: string;
  quantityAvailable: number;
  unitType: string;
  cost: number | "";
  supplier: string;
  usedForProductId: string | null;
  usedForProductName: string;
  lowStockAt: number | "";
}

export type ExpenseCategory = "Materials" | "Packaging" | "Booth Fee" | "Marketing" | "Tools" | "Other";
export type GoalType = "money" | "units" | "custom";
export type FeedbackCategory = "Loved it" | "Too expensive" | "Wanted more options" | "Quality issue" | "Packaging" | "Other";

export interface SaleRecord {
  id: string;
  date: string;
  productName: string;
  savedProductId?: string | null;
  inventoryItemId: string | null;
  quantity: number;
  pricePerUnit: number;
  buyer?: string;
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
  materials: MaterialInventoryItem[];
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
  initializeProductInventory: (item: Omit<InventoryItem, "id" | "quantitySold">) => void;
  makeProduct: (input: MakeProductInput) => void;
  // Materials
  addMaterialItem: (item: Omit<MaterialInventoryItem, "id">) => void;
  updateMaterialItem: (id: string, updates: Partial<MaterialInventoryItem>) => void;
  deleteMaterialItem: (id: string) => void;
  buySupplies: (input: BuySuppliesInput) => void;
  // Sales
  addSale: (sale: Omit<SaleRecord, "id"> & { allowOversell?: boolean }) => void;
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
  materials: [],
  sales: [],
  expenses: [],
  events: [],
  goals: [],
  feedback: [],
};

export interface SupplyUsage {
  materialId: string;
  quantityUsed: number;
}

export interface MakeProductInput {
  inventoryItemId?: string | null;
  savedProductId?: string | null;
  productName: string;
  quantityMade: number;
  costPerItem?: number | "";
  sellingPrice?: number | "";
  suppliesUsed?: SupplyUsage[];
}

export interface BuySuppliesInput {
  date: string;
  materialId?: string | null;
  name: string;
  quantityAdded: number;
  unitType: string;
  cost: number;
  supplier: string;
  usedForProductId?: string | null;
  usedForProductName?: string;
}

function normalizeInventoryItem(item: Partial<InventoryItem>): InventoryItem {
  return {
    id: typeof item.id === "string" ? item.id : uid("inv"),
    savedProductId: typeof item.savedProductId === "string" ? item.savedProductId : null,
    name: typeof item.name === "string" ? item.name : "",
    quantityMade: Number(item.quantityMade) || 0,
    quantitySold: Number(item.quantitySold) || 0,
    costPerItem: item.costPerItem === "" ? "" : Number(item.costPerItem) || "",
    sellingPrice: item.sellingPrice === "" ? "" : Number(item.sellingPrice) || "",
    lowStockAt: item.lowStockAt === "" ? "" : Number(item.lowStockAt) || "",
  };
}

function normalizeMaterialItem(item: Partial<MaterialInventoryItem>): MaterialInventoryItem {
  return {
    id: typeof item.id === "string" ? item.id : uid("mat"),
    name: typeof item.name === "string" ? item.name : "",
    quantityAvailable: Number(item.quantityAvailable) || 0,
    unitType: typeof item.unitType === "string" && item.unitType.trim() ? item.unitType : "pieces",
    cost: item.cost === "" ? "" : Number(item.cost) || "",
    supplier: typeof item.supplier === "string" ? item.supplier : "",
    usedForProductId: typeof item.usedForProductId === "string" ? item.usedForProductId : null,
    usedForProductName: typeof item.usedForProductName === "string" ? item.usedForProductName : "",
    lowStockAt: item.lowStockAt === "" ? "" : Number(item.lowStockAt) || "",
  };
}

function loadData(): TrackerData {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as Partial<TrackerData>;
    return {
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory.map(normalizeInventoryItem) : [],
      materials: Array.isArray(parsed.materials) ? parsed.materials.map(normalizeMaterialItem) : [],
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

  const initializeProductInventory = useCallback((item: Omit<InventoryItem, "id" | "quantitySold">) => {
    setData((prev) => {
      const existing = item.savedProductId
        ? prev.inventory.find((inv) => inv.savedProductId === item.savedProductId)
        : prev.inventory.find((inv) => inv.name.toLowerCase() === item.name.toLowerCase());
      if (existing) return prev;
      return {
        ...prev,
        inventory: [...prev.inventory, { ...item, id: uid("inv"), quantitySold: 0 }],
      };
    });
  }, []);

  const makeProduct = useCallback((input: MakeProductInput) => {
    if (!input.productName.trim() || input.quantityMade <= 0) return;
    setData((prev) => {
      const existingIndex = input.inventoryItemId
        ? prev.inventory.findIndex((item) => item.id === input.inventoryItemId)
        : input.savedProductId
          ? prev.inventory.findIndex((item) => item.savedProductId === input.savedProductId)
          : prev.inventory.findIndex((item) => item.name.toLowerCase() === input.productName.trim().toLowerCase());

      const nextInventory = [...prev.inventory];
      if (existingIndex >= 0) {
        const existing = nextInventory[existingIndex];
        nextInventory[existingIndex] = {
          ...existing,
          savedProductId: existing.savedProductId ?? input.savedProductId ?? null,
          quantityMade: existing.quantityMade + input.quantityMade,
          costPerItem: existing.costPerItem !== "" ? existing.costPerItem : input.costPerItem ?? "",
          sellingPrice: existing.sellingPrice !== "" ? existing.sellingPrice : input.sellingPrice ?? "",
        };
      } else {
        nextInventory.push({
          id: uid("inv"),
          savedProductId: input.savedProductId ?? null,
          name: input.productName.trim(),
          quantityMade: input.quantityMade,
          quantitySold: 0,
          costPerItem: input.costPerItem ?? "",
          sellingPrice: input.sellingPrice ?? "",
          lowStockAt: "",
        });
      }

      const nextMaterials = prev.materials.map((material) => {
        const usage = input.suppliesUsed?.find((used) => used.materialId === material.id);
        if (!usage || usage.quantityUsed <= 0) return material;
        return {
          ...material,
          quantityAvailable: Math.max(0, material.quantityAvailable - usage.quantityUsed),
        };
      });

      return { ...prev, inventory: nextInventory, materials: nextMaterials };
    });
  }, []);

  // ── Materials ──

  const addMaterialItem = useCallback((item: Omit<MaterialInventoryItem, "id">) => {
    setData((prev) => ({
      ...prev,
      materials: [...prev.materials, { ...item, id: uid("mat") }],
    }));
  }, []);

  const updateMaterialItem = useCallback((id: string, updates: Partial<MaterialInventoryItem>) => {
    setData((prev) => ({
      ...prev,
      materials: prev.materials.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));
  }, []);

  const deleteMaterialItem = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      materials: prev.materials.filter((item) => item.id !== id),
    }));
  }, []);

  const buySupplies = useCallback((input: BuySuppliesInput) => {
    if (!input.name.trim() || input.quantityAdded <= 0 || input.cost < 0) return;
    const materialName = input.name.trim();
    const unitType = input.unitType.trim() || "pieces";
    setData((prev) => {
      const existingIndex = input.materialId
        ? prev.materials.findIndex((item) => item.id === input.materialId)
        : prev.materials.findIndex((item) => item.name.toLowerCase() === materialName.toLowerCase() && item.unitType.toLowerCase() === unitType.toLowerCase());
      const nextMaterials = [...prev.materials];

      if (existingIndex >= 0) {
        const existing = nextMaterials[existingIndex];
        nextMaterials[existingIndex] = {
          ...existing,
          quantityAvailable: existing.quantityAvailable + input.quantityAdded,
          cost: input.cost || existing.cost,
          supplier: input.supplier.trim() || existing.supplier,
          usedForProductId: input.usedForProductId ?? existing.usedForProductId,
          usedForProductName: input.usedForProductName?.trim() || existing.usedForProductName,
        };
      } else {
        nextMaterials.push({
          id: uid("mat"),
          name: materialName,
          quantityAvailable: input.quantityAdded,
          unitType,
          cost: input.cost,
          supplier: input.supplier.trim(),
          usedForProductId: input.usedForProductId ?? null,
          usedForProductName: input.usedForProductName?.trim() ?? "",
          lowStockAt: "",
        });
      }

      const expenseNote = `${input.quantityAdded} ${unitType}${input.supplier.trim() ? ` from ${input.supplier.trim()}` : ""}`;
      return {
        ...prev,
        materials: nextMaterials,
        expenses: [
          ...prev.expenses,
          {
            id: uid("exp"),
            date: input.date || new Date().toISOString().slice(0, 10),
            name: `Bought ${materialName}`,
            amount: input.cost,
            category: "Materials",
            note: expenseNote,
          },
        ],
      };
    });
  }, []);

  // ── Sales ──

  const addSale = useCallback((sale: Omit<SaleRecord, "id"> & { allowOversell?: boolean }) => {
    const newSale: SaleRecord = { ...sale, id: uid("sale") };
    setData((prev) => {
      const selectedItem = sale.inventoryItemId ? prev.inventory.find((item) => item.id === sale.inventoryItemId) : null;
      const remaining = selectedItem ? selectedItem.quantityMade - selectedItem.quantitySold : null;
      if (selectedItem && remaining !== null && sale.quantity > remaining && !sale.allowOversell) {
        return prev;
      }
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
        initializeProductInventory,
        makeProduct,
        addMaterialItem,
        updateMaterialItem,
        deleteMaterialItem,
        buySupplies,
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

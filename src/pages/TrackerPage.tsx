import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Flag,
  Lightbulb,
  MessageSquare,
  Package,
  Plus,
  Receipt,
  Star,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { useTracker } from "@/context/TrackerContext";
import type {
  InventoryItem,
  MaterialInventoryItem,
  GoalRecord,
  ExpenseCategory,
  GoalType,
  FeedbackCategory,
  SupplyUsage,
} from "@/context/TrackerContext";
import { readSavedProducts, type SavedProduct } from "@/lib/saved-products";
import logo from "../../logo.png";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmt$(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(day, 10)}, ${y}`;
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#D0EAF0] bg-white px-5 py-5 shadow-[0_14px_34px_rgba(50,50,93,0.08)] ${className}`}>
      {children}
    </div>
  );
}

function Btn({
  onClick,
  children,
  variant = "primary",
  disabled = false,
  size = "sm",
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger" | "outline";
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const base = "font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2.5" };
  const styles = {
    primary: "bg-[#0E92A3] text-white hover:bg-[#0A7685] active:scale-95",
    outline: "bg-[#E1603F] text-white hover:bg-[#C94E32] active:scale-95",
    ghost: "bg-[#0E92A3] text-white hover:bg-[#0A7685] active:scale-95",
    danger: "bg-[#D84A40] text-white hover:bg-red-600 active:scale-95",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-[#3C6872] mb-1">{children}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-[#DDE3E5] px-3 py-2.5 text-sm text-[#2B2B2B] placeholder:text-[#98B2BA] focus:outline-none focus:border-[#0E92A3] focus:ring-2 focus:ring-[#0E92A3]/15 transition bg-white";
const selectCls = `${inputCls} cursor-pointer`;

function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#4F747C]">$</span>
      <input
        type="number"
        min="0"
        step="0.01"
        className={`${inputCls} pl-7`}
        placeholder={placeholder ?? "0.00"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Badge({ label, color }: { label: string; color: "green" | "amber" | "gray" | "blue" | "teal" | "red" }) {
  const styles = {
    green: "bg-green-50 text-green-700 border border-green-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    gray: "bg-gray-100 text-gray-500 border border-gray-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    teal: "bg-[#EAF8FA] text-[#0E92A3] border border-[#B2E0E7]",
    red: "bg-red-50 text-red-600 border border-red-200",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[color]}`}>{label}</span>
  );
}

function EmptyState({
  icon,
  title,
  description,
  cta,
  onCta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-[#CFE8EE] bg-white px-5 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#B2E0E7] bg-[#EAF7FB] text-[#0E92A3]">
        {icon}
      </div>
      <div>
        <p className="text-lg font-extrabold text-[#2B2B2B]">{title}</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-[#4F747C]">{description}</p>
      </div>
      {cta && onCta && (
        <Btn onClick={onCta} variant="outline" size="md">{cta}</Btn>
      )}
    </div>
  );
}

function TabHero({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="mb-5 rounded-3xl border border-[#D0EAF0] bg-white px-5 py-5 shadow-[0_14px_34px_rgba(50,50,93,0.08)]">
      <div className="mb-2 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF7FB] text-[#0E92A3]">
          {icon}
        </span>
        <h1 className="text-2xl font-extrabold text-[#2B2B2B]">{title}</h1>
      </div>
      <p className="text-base leading-relaxed text-[#4F747C]">{description}</p>
    </div>
  );
}

function StatRow({ stats }: { stats: Array<{ label: string; value: string; sub?: string; accent?: "green" | "red" | "teal" | "default" }> }) {
  const accentMap = {
    green: { border: "border-l-green-400", value: "text-green-600" },
    red: { border: "border-l-red-400", value: "text-red-500" },
    teal: { border: "border-l-[#0E92A3]", value: "text-[#0E92A3]" },
    default: { border: "border-l-[#DDE3E5]", value: "text-[#2B2B2B]" },
  };
  return (
    <div className={`grid gap-3 ${stats.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {stats.map((s, i) => {
        const a = accentMap[s.accent ?? "default"];
        return (
          <div key={i} className={`rounded-2xl border border-[#D0EAF0] border-l-4 bg-white px-4 py-4 shadow-sm ${a.border}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C7F87]">{s.label}</p>
            <p className={`mt-0.5 text-2xl font-extrabold ${a.value}`}>{s.value}</p>
            {s.sub && <p className="text-[10px] text-[#71939B] mt-0.5">{s.sub}</p>}
          </div>
        );
      })}
    </div>
  );
}

function DeleteConfirm({ id, onConfirm, onCancel }: { id: string; onConfirm: (id: string) => void; onCancel: () => void }) {
  return (
    <div className="flex gap-1 flex-shrink-0 items-center">
      <Btn variant="danger" onClick={() => onConfirm(id)}>Delete?</Btn>
      <Btn variant="ghost" onClick={onCancel}>No</Btn>
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data } = useTracker();
  const [, setSearchParams] = useSearchParams();

  const totalRevenue = data.sales.reduce((s, sale) => s + sale.quantity * sale.pricePerUnit, 0);
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalUnitsSold = data.sales.reduce((s, sale) => s + sale.quantity, 0);
  const totalInventory = data.inventory.reduce((s, i) => s + Math.max(0, i.quantityMade - i.quantitySold), 0);

  const hasData =
    data.inventory.length > 0 || data.sales.length > 0 || data.expenses.length > 0 ||
    data.events.length > 0 || data.goals.length > 0;

  if (!hasData) {
    return (
      <div>
        <TabHero icon={<BarChart3 className="h-6 w-6" />} title="Overview" description="Your business dashboard. Once you add activity, this page shows revenue, profit, inventory, and the most important updates." />
        <div className="rounded-2xl border-2 border-dashed border-[#CFE8EE] bg-[#F3FBFC] px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#0E92A3] shadow-sm">
            <ClipboardList className="h-8 w-8" />
          </div>
          <p className="font-bold text-[#2B2B2B] text-lg mb-2">Your business tracker is set up!</p>
          <p className="text-sm text-[#4F747C] max-w-sm mx-auto leading-relaxed mb-6">
            Start by adding products to inventory, then record a sale. Your dashboard updates as you log real business activity.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Btn onClick={() => setSearchParams({ tab: "inventory" })} variant="primary" size="md">Add Inventory</Btn>
            <Btn onClick={() => setSearchParams({ tab: "sales" })} variant="outline" size="md">Record a Sale</Btn>
          </div>
        </div>
      </div>
    );
  }

  const salesByProduct: Record<string, number> = {};
  data.sales.forEach((s) => {
    salesByProduct[s.productName] = (salesByProduct[s.productName] ?? 0) + s.quantity;
  });
  const bestSeller = Object.entries(salesByProduct).sort((a, b) => b[1] - a[1])[0];
  const recentSales = [...data.sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const activeGoals = data.goals.slice(0, 2);
  const nextEvent = data.events
    .filter((e) => !e.completed && e.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;

  return (
    <div className="flex flex-col gap-5">
      <TabHero icon={<BarChart3 className="h-6 w-6" />} title="Overview" description="A quick read on how your business is performing right now." />

      <StatRow stats={[
        { label: "Revenue", value: fmt$(totalRevenue), accent: "teal" },
        { label: "Expenses", value: fmt$(totalExpenses), accent: "default" },
        { label: "Net Profit", value: fmt$(netProfit), accent: netProfit >= 0 ? "green" : "red", sub: netProfit >= 0 ? "Profitable so far" : "Expenses are ahead" },
      ]} />

      <StatRow stats={[
        { label: "Units Sold", value: String(totalUnitsSold), accent: "teal" },
        { label: "In Stock", value: String(totalInventory), accent: "default" },
      ]} />

      {(bestSeller || nextEvent) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {bestSeller && (
            <div className="rounded-2xl bg-[#E8F8FA] border border-[#B2E0E7] px-4 py-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0E92A3]"><Star className="h-3.5 w-3.5" /> Best Seller</p>
              <p className="font-bold text-[#2B2B2B]">{bestSeller[0]}</p>
              <p className="text-xs text-[#4F747C] mt-0.5">{bestSeller[1]} unit{bestSeller[1] !== 1 ? "s" : ""} sold</p>
            </div>
          )}
          {nextEvent && (
            <div className="rounded-2xl bg-[#FFF0E7] border border-[#F0C36F] px-4 py-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E1603F]"><CalendarDays className="h-3.5 w-3.5" /> Next Event</p>
              <p className="font-bold text-[#2B2B2B]">{nextEvent.name}</p>
              <p className="text-xs text-[#4F747C] mt-0.5">{fmtDate(nextEvent.date)}{nextEvent.location ? ` · ${nextEvent.location}` : ""}</p>
            </div>
          )}
        </div>
      )}

      {recentSales.length > 0 && (
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-[#5C7F87] mb-3">Recent Sales</p>
          <div className="flex flex-col divide-y divide-[#EDF7F9]">
            {recentSales.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2B2B2B] truncate">{s.productName}</p>
                  <p className="text-xs text-[#4F747C]">{s.quantity} × {fmt$(s.pricePerUnit)} · {fmtDate(s.date)}</p>
                </div>
                <p className="text-sm font-bold text-[#2B2B2B] flex-shrink-0">{fmt$(s.quantity * s.pricePerUnit)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeGoals.length > 0 && (
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-[#5C7F87] mb-4">Your Goals</p>
          <div className="flex flex-col gap-4">
            {activeGoals.map((g) => {
              const current = g.type === "money" ? totalRevenue : g.type === "units" ? totalUnitsSold : 0;
              const target = Number(g.target) || 0;
              const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold text-[#2B2B2B]">{g.name}</p>
                    <span className="text-xs font-bold text-[#0E92A3]">{pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#EAF8FA] overflow-hidden">
                    <div className="h-full rounded-full bg-[#0E92A3] transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  {pct >= 100 && <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> Goal reached</p>}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── INVENTORY TAB ────────────────────────────────────────────────────────────

interface InventoryFormState {
  savedProductId: string;
  name: string;
  quantityMade: string;
  costPerItem: string;
  sellingPrice: string;
  lowStockAt: string;
}

interface SupplyFormState {
  materialId: string;
  name: string;
  quantity: string;
  unitType: string;
  cost: string;
  supplier: string;
  usedForProductId: string;
  lowStockAt: string;
}

interface MakeProductFormState {
  productChoice: string;
  customProductName: string;
  quantityMade: string;
  supplyId: string;
  supplyQty: string;
}

const emptyInventoryForm = (): InventoryFormState => ({
  savedProductId: "",
  name: "",
  quantityMade: "",
  costPerItem: "",
  sellingPrice: "",
  lowStockAt: "",
});

const emptySupplyForm = (): SupplyFormState => ({
  materialId: "",
  name: "",
  quantity: "",
  unitType: "pieces",
  cost: "",
  supplier: "",
  usedForProductId: "",
  lowStockAt: "",
});

const emptyMakeProductForm = (): MakeProductFormState => ({
  productChoice: "",
  customProductName: "",
  quantityMade: "",
  supplyId: "",
  supplyQty: "",
});

function productInventoryFromSaved(product: SavedProduct): Omit<InventoryItem, "id" | "quantitySold"> {
  return {
    savedProductId: product.id,
    name: product.productInfo.productName || "Untitled product",
    quantityMade: 0,
    costPerItem: product.summary.costPerUnit || "",
    sellingPrice: product.summary.sellingPrice || "",
    lowStockAt: 3,
  };
}

function InventoryTab() {
  const {
    data,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    initializeProductInventory,
    makeProduct,
    updateMaterialItem,
    deleteMaterialItem,
    buySupplies,
  } = useTracker();
  const savedProducts = useMemo(() => readSavedProducts(), []);
  const [showAdd, setShowAdd] = useState<"product" | "supplies" | "make" | null>(null);
  const [form, setForm] = useState<InventoryFormState>(emptyInventoryForm());
  const [supplyForm, setSupplyForm] = useState<SupplyFormState>(emptySupplyForm());
  const [makeForm, setMakeForm] = useState<MakeProductFormState>(emptyMakeProductForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<InventoryFormState>(emptyInventoryForm());
  const [editMaterialId, setEditMaterialId] = useState<string | null>(null);
  const [editMaterialForm, setEditMaterialForm] = useState<SupplyFormState>(emptySupplyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmMaterialDeleteId, setConfirmMaterialDeleteId] = useState<string | null>(null);

  const totalRemaining = data.inventory.reduce((s, i) => s + Math.max(0, i.quantityMade - i.quantitySold), 0);
  const totalMaterials = data.materials.reduce((s, i) => s + Math.max(0, i.quantityAvailable), 0);
  const savedProductsNotInInventory = savedProducts.filter((product) => !data.inventory.some((item) => item.savedProductId === product.id));

  function handleAdd() {
    if (!form.name.trim()) return;
    addInventoryItem({
      savedProductId: form.savedProductId || null,
      name: form.name.trim(),
      quantityMade: parseInt(form.quantityMade) || 0,
      costPerItem: form.costPerItem !== "" ? parseFloat(form.costPerItem) : "",
      sellingPrice: form.sellingPrice !== "" ? parseFloat(form.sellingPrice) : "",
      lowStockAt: form.lowStockAt !== "" ? parseInt(form.lowStockAt) || "" : "",
    });
    setForm(emptyInventoryForm());
    setShowAdd(null);
  }

  function handleSavedProductSelect(savedProductId: string) {
    const product = savedProducts.find((saved) => saved.id === savedProductId);
    if (!product) {
      setForm((f) => ({ ...f, savedProductId, name: "" }));
      return;
    }
    setForm((f) => ({
      ...f,
      savedProductId,
      name: product.productInfo.productName || f.name,
      costPerItem: product.summary.costPerUnit ? String(product.summary.costPerUnit.toFixed(2)) : f.costPerItem,
      sellingPrice: product.summary.sellingPrice ? String(product.summary.sellingPrice.toFixed(2)) : f.sellingPrice,
    }));
  }

  function handleInitializeSavedProducts() {
    savedProductsNotInInventory.forEach((product) => initializeProductInventory(productInventoryFromSaved(product)));
  }

  function handleBuySupplies() {
    const existing = data.materials.find((item) => item.id === supplyForm.materialId);
    const name = supplyForm.materialId ? existing?.name ?? "" : supplyForm.name.trim();
    const qty = parseFloat(supplyForm.quantity) || 0;
    const cost = parseFloat(supplyForm.cost) || 0;
    if (!name || qty <= 0 || cost < 0) return;
    const linkedProduct = data.inventory.find((item) => item.id === supplyForm.usedForProductId);
    buySupplies({
      date: today(),
      materialId: supplyForm.materialId || null,
      name,
      quantityAdded: qty,
      unitType: existing?.unitType || supplyForm.unitType || "pieces",
      cost,
      supplier: supplyForm.supplier,
      usedForProductId: linkedProduct?.id ?? null,
      usedForProductName: linkedProduct?.name ?? "",
    });
    if (supplyForm.lowStockAt !== "" && existing) {
      updateMaterialItem(existing.id, { lowStockAt: parseFloat(supplyForm.lowStockAt) || "" });
    }
    setSupplyForm(emptySupplyForm());
    setShowAdd(null);
  }

  function handleMakeProduct() {
    const qty = parseInt(makeForm.quantityMade) || 0;
    if (qty <= 0) return;
    const selectedInventory = makeForm.productChoice.startsWith("inv:")
      ? data.inventory.find((item) => item.id === makeForm.productChoice.slice(4))
      : null;
    const selectedSaved = makeForm.productChoice.startsWith("saved:")
      ? savedProducts.find((product) => product.id === makeForm.productChoice.slice(6))
      : null;
    const productName = selectedInventory?.name || selectedSaved?.productInfo.productName || makeForm.customProductName.trim();
    if (!productName) return;
    const suppliesUsed: SupplyUsage[] = makeForm.supplyId && parseFloat(makeForm.supplyQty) > 0
      ? [{ materialId: makeForm.supplyId, quantityUsed: parseFloat(makeForm.supplyQty) }]
      : [];
    makeProduct({
      inventoryItemId: selectedInventory?.id ?? null,
      savedProductId: selectedSaved?.id ?? selectedInventory?.savedProductId ?? null,
      productName,
      quantityMade: qty,
      costPerItem: selectedInventory?.costPerItem ?? selectedSaved?.summary.costPerUnit ?? "",
      sellingPrice: selectedInventory?.sellingPrice ?? selectedSaved?.summary.sellingPrice ?? "",
      suppliesUsed,
    });
    setMakeForm(emptyMakeProductForm());
    setShowAdd(null);
  }

  function startEdit(item: InventoryItem) {
    setEditId(item.id);
    setEditForm({
      savedProductId: item.savedProductId ?? "",
      name: item.name,
      quantityMade: String(item.quantityMade),
      costPerItem: item.costPerItem !== "" ? String(item.costPerItem) : "",
      sellingPrice: item.sellingPrice !== "" ? String(item.sellingPrice) : "",
      lowStockAt: item.lowStockAt !== "" && item.lowStockAt !== undefined ? String(item.lowStockAt) : "",
    });
  }

  function startEditMaterial(item: MaterialInventoryItem) {
    setEditMaterialId(item.id);
    setEditMaterialForm({
      materialId: item.id,
      name: item.name,
      quantity: String(item.quantityAvailable),
      unitType: item.unitType,
      cost: item.cost !== "" ? String(item.cost) : "",
      supplier: item.supplier,
      usedForProductId: item.usedForProductId ?? "",
      lowStockAt: item.lowStockAt !== "" ? String(item.lowStockAt) : "",
    });
  }

  function handleSaveEdit(id: string) {
    if (!editForm.name.trim()) return;
    updateInventoryItem(id, {
      savedProductId: editForm.savedProductId || null,
      name: editForm.name.trim(),
      quantityMade: parseInt(editForm.quantityMade) || 0,
      costPerItem: editForm.costPerItem !== "" ? parseFloat(editForm.costPerItem) : "",
      sellingPrice: editForm.sellingPrice !== "" ? parseFloat(editForm.sellingPrice) : "",
      lowStockAt: editForm.lowStockAt !== "" ? parseInt(editForm.lowStockAt) || "" : "",
    });
    setEditId(null);
  }

  function handleSaveMaterialEdit(id: string) {
    if (!editMaterialForm.name.trim()) return;
    const linkedProduct = data.inventory.find((item) => item.id === editMaterialForm.usedForProductId);
    updateMaterialItem(id, {
      name: editMaterialForm.name.trim(),
      quantityAvailable: parseFloat(editMaterialForm.quantity) || 0,
      unitType: editMaterialForm.unitType || "pieces",
      cost: editMaterialForm.cost !== "" ? parseFloat(editMaterialForm.cost) : "",
      supplier: editMaterialForm.supplier.trim(),
      usedForProductId: linkedProduct?.id ?? null,
      usedForProductName: linkedProduct?.name ?? "",
      lowStockAt: editMaterialForm.lowStockAt !== "" ? parseFloat(editMaterialForm.lowStockAt) || "" : "",
    });
    setEditMaterialId(null);
  }

  function stockStatus(item: InventoryItem): { label: string; color: "green" | "amber" | "gray" } {
    const remaining = item.quantityMade - item.quantitySold;
    const lowStockAt = Number(item.lowStockAt) || 3;
    if (remaining <= 0) return { label: "Sold out", color: "gray" };
    if (remaining <= lowStockAt || (item.quantityMade > 0 && remaining / item.quantityMade <= 0.2)) return { label: "Low stock", color: "amber" };
    return { label: "In stock", color: "green" };
  }

  function materialStatus(item: MaterialInventoryItem): { label: string; color: "green" | "amber" | "gray" } {
    const lowStockAt = Number(item.lowStockAt) || 3;
    if (item.quantityAvailable <= 0) return { label: "Out", color: "gray" };
    if (item.quantityAvailable <= lowStockAt) return { label: "Low", color: "amber" };
    return { label: "Ready", color: "green" };
  }

  const AddForm = (
    <div className="rounded-2xl bg-[#F3FBFC] border border-[#B2E0E7] px-4 py-4 flex flex-col gap-3 mb-4">
      <p className="text-sm font-bold text-[#2B2B2B]">Add a Product You Sell</p>
      {savedProducts.length > 0 && (
        <Field label="Start from a saved product">
          <select className={selectCls} value={form.savedProductId} onChange={(e) => handleSavedProductSelect(e.target.value)}>
            <option value="">Choose saved product or type your own</option>
            {savedProducts.map((product) => (
              <option key={product.id} value={product.id}>{product.productInfo.productName || "Untitled product"}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Product name *">
        <input className={inputCls} placeholder="e.g. Friendship Bracelet" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </Field>
      <Field label="How many did you make?">
        <input type="number" min="0" className={inputCls} placeholder="e.g. 20" value={form.quantityMade} onChange={(e) => setForm((f) => ({ ...f, quantityMade: e.target.value }))} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cost to make (per item)">
          <MoneyInput value={form.costPerItem} onChange={(v) => setForm((f) => ({ ...f, costPerItem: v }))} placeholder="0.00" />
        </Field>
        <Field label="Selling price">
          <MoneyInput value={form.sellingPrice} onChange={(v) => setForm((f) => ({ ...f, sellingPrice: v }))} placeholder="0.00" />
        </Field>
      </div>
      <Field label="Low stock warning">
        <input type="number" min="0" className={inputCls} placeholder="e.g. 3" value={form.lowStockAt} onChange={(e) => setForm((f) => ({ ...f, lowStockAt: e.target.value }))} />
      </Field>
      <div className="flex gap-2">
        <Btn onClick={handleAdd} variant="primary" disabled={!form.name.trim()}>Save Product</Btn>
        <Btn onClick={() => { setShowAdd(null); setForm(emptyInventoryForm()); }} variant="ghost">Cancel</Btn>
      </div>
    </div>
  );

  const BuySuppliesForm = (
    <div className="rounded-2xl bg-[#FFF5E8] border border-[#F0C36F] px-4 py-4 flex flex-col gap-3 mb-4">
      <p className="text-sm font-bold text-[#2B2B2B]">Buy Supplies</p>
      <p className="text-xs text-[#4F747C]">This adds to Materials I Use and creates an expense automatically.</p>
      {data.materials.length > 0 && (
        <Field label="Add to existing material">
          <select className={selectCls} value={supplyForm.materialId} onChange={(e) => {
            const material = data.materials.find((item) => item.id === e.target.value);
            setSupplyForm((f) => ({
              ...f,
              materialId: e.target.value,
              name: material?.name ?? "",
              unitType: material?.unitType ?? f.unitType,
              supplier: material?.supplier ?? f.supplier,
              usedForProductId: material?.usedForProductId ?? "",
              lowStockAt: material?.lowStockAt !== "" && material?.lowStockAt !== undefined ? String(material.lowStockAt) : f.lowStockAt,
            }));
          }}>
            <option value="">New material or supply</option>
            {data.materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
          </select>
        </Field>
      )}
      {!supplyForm.materialId && (
        <Field label="Material or supply name *">
          <input className={inputCls} placeholder="e.g. Beads, paper bags, thread" value={supplyForm.name} onChange={(e) => setSupplyForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity added">
          <input type="number" min="0" className={inputCls} placeholder="e.g. 50" value={supplyForm.quantity} onChange={(e) => setSupplyForm((f) => ({ ...f, quantity: e.target.value }))} />
        </Field>
        <Field label="Unit type">
          <input className={inputCls} placeholder="pieces, packs, cups" value={supplyForm.unitType} onChange={(e) => setSupplyForm((f) => ({ ...f, unitType: e.target.value }))} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Total cost">
          <MoneyInput value={supplyForm.cost} onChange={(v) => setSupplyForm((f) => ({ ...f, cost: v }))} />
        </Field>
        <Field label="Store (optional)">
          <input className={inputCls} placeholder="e.g. Michaels" value={supplyForm.supplier} onChange={(e) => setSupplyForm((f) => ({ ...f, supplier: e.target.value }))} />
        </Field>
      </div>
      <Field label="Used for product (optional)">
        <select className={selectCls} value={supplyForm.usedForProductId} onChange={(e) => setSupplyForm((f) => ({ ...f, usedForProductId: e.target.value }))}>
          <option value="">Any product</option>
          {data.inventory.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </Field>
      <Field label="Low stock warning">
        <input type="number" min="0" className={inputCls} placeholder="e.g. 5" value={supplyForm.lowStockAt} onChange={(e) => setSupplyForm((f) => ({ ...f, lowStockAt: e.target.value }))} />
      </Field>
      <div className="flex gap-2">
        <Btn onClick={handleBuySupplies} variant="primary" disabled={!(supplyForm.materialId || supplyForm.name.trim()) || parseFloat(supplyForm.quantity) <= 0 || supplyForm.cost === ""}>Save Supplies</Btn>
        <Btn onClick={() => { setShowAdd(null); setSupplyForm(emptySupplyForm()); }} variant="ghost">Cancel</Btn>
      </div>
    </div>
  );

  const MakeProductForm = (
    <div className="rounded-2xl bg-[#F2FAE8] border border-[#A9DDB9] px-4 py-4 flex flex-col gap-3 mb-4">
      <p className="text-sm font-bold text-[#2B2B2B]">Make Product</p>
      <p className="text-xs text-[#4F747C]">Add finished products that are ready to sell. You can subtract one material if you want.</p>
      <Field label="Which product did you make?">
        <select className={selectCls} value={makeForm.productChoice} onChange={(e) => setMakeForm((f) => ({ ...f, productChoice: e.target.value }))}>
          <option value="">Choose product</option>
          {data.inventory.map((item) => <option key={item.id} value={`inv:${item.id}`}>{item.name}</option>)}
          {savedProductsNotInInventory.map((product) => <option key={product.id} value={`saved:${product.id}`}>{product.productInfo.productName || "Untitled product"} (saved)</option>)}
          <option value="custom">Something else</option>
        </select>
      </Field>
      {makeForm.productChoice === "custom" && (
        <Field label="Product name">
          <input className={inputCls} value={makeForm.customProductName} onChange={(e) => setMakeForm((f) => ({ ...f, customProductName: e.target.value }))} placeholder="e.g. Keychains" />
        </Field>
      )}
      <Field label="How many did you make?">
        <input type="number" min="1" className={inputCls} placeholder="e.g. 10" value={makeForm.quantityMade} onChange={(e) => setMakeForm((f) => ({ ...f, quantityMade: e.target.value }))} />
      </Field>
      {data.materials.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Material used (optional)">
            <select className={selectCls} value={makeForm.supplyId} onChange={(e) => setMakeForm((f) => ({ ...f, supplyId: e.target.value }))}>
              <option value="">Do not subtract supplies</option>
              {data.materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
            </select>
          </Field>
          <Field label="Amount used">
            <input type="number" min="0" className={inputCls} placeholder="e.g. 10" value={makeForm.supplyQty} onChange={(e) => setMakeForm((f) => ({ ...f, supplyQty: e.target.value }))} />
          </Field>
        </div>
      )}
      <div className="flex gap-2">
        <Btn onClick={handleMakeProduct} variant="primary" disabled={!makeForm.productChoice || parseInt(makeForm.quantityMade) <= 0 || (makeForm.productChoice === "custom" && !makeForm.customProductName.trim())}>Add Made Products</Btn>
        <Btn onClick={() => { setShowAdd(null); setMakeForm(emptyMakeProductForm()); }} variant="ghost">Cancel</Btn>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <TabHero icon={<Package className="h-6 w-6" />} title="Inventory" description="Products are things you sell. Materials are things you use to make your products." />

      <StatRow stats={[
        { label: "Products", value: String(data.inventory.length), accent: "teal" },
        { label: "Items Remaining", value: String(totalRemaining), accent: totalRemaining <= 5 ? "red" : "default" },
        { label: "Supplies", value: String(data.materials.length), sub: `${totalMaterials} total units`, accent: "default" },
      ]} />

      <div>
        {!showAdd && (
          <div className="mb-3 flex flex-wrap justify-end gap-2">
            {savedProductsNotInInventory.length > 0 && (
              <Btn onClick={handleInitializeSavedProducts} variant="outline" size="md">Add Saved Products</Btn>
            )}
            <Btn onClick={() => setShowAdd("supplies")} variant="outline" size="md">Buy Supplies</Btn>
            <Btn onClick={() => setShowAdd("make")} variant="primary" size="md">Make Product</Btn>
            <Btn onClick={() => setShowAdd("product")} variant="primary" size="md"><span className="inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Add Product</span></Btn>
          </div>
        )}
        {showAdd === "product" && AddForm}
        {showAdd === "supplies" && BuySuppliesForm}
        {showAdd === "make" && MakeProductForm}

        <div className="mb-6">
          <div className="mb-2">
            <p className="text-sm font-bold text-[#2B2B2B]">Products I Sell</p>
            <p className="text-xs text-[#4F747C]">Finished products that are ready to sell.</p>
          </div>
          {data.inventory.length === 0 && !showAdd ? (
            <EmptyState icon={<Package className="h-7 w-7" />} title="No products added yet" description="Add saved products or products you made. Inventory makes sales tracking easier and helps you know when to restock." cta="Add your first product" onCta={() => setShowAdd("product")} />
          ) : (
            <div className="flex flex-col gap-3">
            {data.inventory.map((item) => {
              const remaining = item.quantityMade - item.quantitySold;
              const status = stockStatus(item);
              const value = Math.max(0, remaining) * (Number(item.sellingPrice) || Number(item.costPerItem) || 0);

              if (editId === item.id) {
                return (
                  <Card key={item.id} className="border-[#0E92A3]">
                    <p className="text-sm font-bold text-[#2B2B2B] mb-3">Edit Product</p>
                    <div className="flex flex-col gap-3">
                      <Field label="Product name">
                        <input className={inputCls} value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                      </Field>
                      <div className="grid grid-cols-3 gap-2">
                        <Field label="Made">
                          <input type="number" min="0" className={inputCls} placeholder="0" value={editForm.quantityMade} onChange={(e) => setEditForm((f) => ({ ...f, quantityMade: e.target.value }))} />
                        </Field>
                        <Field label="Cost / item">
                          <MoneyInput value={editForm.costPerItem} onChange={(v) => setEditForm((f) => ({ ...f, costPerItem: v }))} />
                        </Field>
                        <Field label="Sell price">
                          <MoneyInput value={editForm.sellingPrice} onChange={(v) => setEditForm((f) => ({ ...f, sellingPrice: v }))} />
                        </Field>
                      </div>
                      <Field label="Low stock warning">
                        <input type="number" min="0" className={inputCls} placeholder="3" value={editForm.lowStockAt} onChange={(e) => setEditForm((f) => ({ ...f, lowStockAt: e.target.value }))} />
                      </Field>
                      <div className="flex gap-2">
                        <Btn onClick={() => handleSaveEdit(item.id)} variant="primary">Save Changes</Btn>
                        <Btn variant="ghost" onClick={() => setEditId(null)}>Cancel</Btn>
                      </div>
                    </div>
                  </Card>
                );
              }

              return (
                <Card key={item.id} className={status.color === "gray" ? "opacity-60" : ""}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-bold text-[#2B2B2B]">{item.name}</p>
                        <Badge label={status.label} color={status.color} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        <p className="text-xs text-[#4F747C]">Made: <strong className="text-[#2B2B2B]">{item.quantityMade}</strong></p>
                        <p className="text-xs text-[#4F747C]">Sold: <strong className="text-[#2B2B2B]">{item.quantitySold}</strong></p>
                        <p className="text-xs text-[#4F747C]">Left: <strong className={remaining <= 0 ? "text-red-500" : remaining <= 3 ? "text-amber-600" : "text-green-600"}>{Math.max(0, remaining)}</strong></p>
                        {item.costPerItem !== "" && <p className="text-xs text-[#4F747C]">Cost: <strong>{fmt$(Number(item.costPerItem))}</strong></p>}
                        {item.sellingPrice !== "" && <p className="text-xs text-[#4F747C]">Price: <strong>{fmt$(Number(item.sellingPrice))}</strong></p>}
                        <p className="text-xs text-[#4F747C]">Value: <strong>{fmt$(value)}</strong></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Btn variant="ghost" onClick={() => startEdit(item)}>Edit</Btn>
                      {confirmDeleteId === item.id ? (
                        <DeleteConfirm id={item.id} onConfirm={(id) => { deleteInventoryItem(id); setConfirmDeleteId(null); }} onCancel={() => setConfirmDeleteId(null)} />
                      ) : (
                        <Btn variant="danger" onClick={() => setConfirmDeleteId(item.id)}><X className="h-4 w-4" /></Btn>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2">
            <p className="text-sm font-bold text-[#2B2B2B]">Materials I Use</p>
            <p className="text-xs text-[#4F747C]">Supplies and materials you use to make products.</p>
          </div>
          {data.materials.length === 0 && !showAdd ? (
            <EmptyState icon={<Receipt className="h-7 w-7" />} title="No materials yet" description="Buy supplies like beads, bags, ingredients, or paper. The tracker will add them here and record the expense." cta="Buy supplies" onCta={() => setShowAdd("supplies")} />
          ) : (
            <div className="flex flex-col gap-3">
              {data.materials.map((item) => {
                const status = materialStatus(item);
                if (editMaterialId === item.id) {
                  return (
                    <Card key={item.id} className="border-[#0E92A3]">
                      <p className="text-sm font-bold text-[#2B2B2B] mb-3">Edit Material</p>
                      <div className="flex flex-col gap-3">
                        <Field label="Material name">
                          <input className={inputCls} value={editMaterialForm.name} onChange={(e) => setEditMaterialForm((f) => ({ ...f, name: e.target.value }))} />
                        </Field>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Available">
                            <input type="number" min="0" className={inputCls} value={editMaterialForm.quantity} onChange={(e) => setEditMaterialForm((f) => ({ ...f, quantity: e.target.value }))} />
                          </Field>
                          <Field label="Unit type">
                            <input className={inputCls} value={editMaterialForm.unitType} onChange={(e) => setEditMaterialForm((f) => ({ ...f, unitType: e.target.value }))} />
                          </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Cost">
                            <MoneyInput value={editMaterialForm.cost} onChange={(v) => setEditMaterialForm((f) => ({ ...f, cost: v }))} />
                          </Field>
                          <Field label="Store">
                            <input className={inputCls} value={editMaterialForm.supplier} onChange={(e) => setEditMaterialForm((f) => ({ ...f, supplier: e.target.value }))} />
                          </Field>
                        </div>
                        <Field label="Used for product">
                          <select className={selectCls} value={editMaterialForm.usedForProductId} onChange={(e) => setEditMaterialForm((f) => ({ ...f, usedForProductId: e.target.value }))}>
                            <option value="">Any product</option>
                            {data.inventory.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                          </select>
                        </Field>
                        <Field label="Low stock warning">
                          <input type="number" min="0" className={inputCls} value={editMaterialForm.lowStockAt} onChange={(e) => setEditMaterialForm((f) => ({ ...f, lowStockAt: e.target.value }))} />
                        </Field>
                        <div className="flex gap-2">
                          <Btn onClick={() => handleSaveMaterialEdit(item.id)} variant="primary">Save Changes</Btn>
                          <Btn variant="ghost" onClick={() => setEditMaterialId(null)}>Cancel</Btn>
                        </div>
                      </div>
                    </Card>
                  );
                }

                return (
                  <Card key={item.id} className={status.color === "gray" ? "opacity-60" : ""}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-bold text-[#2B2B2B]">{item.name}</p>
                          <Badge label={status.label} color={status.color} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                          <p className="text-xs text-[#4F747C]">Available: <strong className={item.quantityAvailable <= (Number(item.lowStockAt) || 3) ? "text-amber-600" : "text-[#2B2B2B]"}>{item.quantityAvailable} {item.unitType}</strong></p>
                          {item.cost !== "" && <p className="text-xs text-[#4F747C]">Cost: <strong>{fmt$(Number(item.cost))}</strong></p>}
                          {item.supplier && <p className="text-xs text-[#4F747C]">Store: <strong>{item.supplier}</strong></p>}
                          {item.usedForProductName && <p className="text-xs text-[#4F747C]">For: <strong>{item.usedForProductName}</strong></p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Btn variant="ghost" onClick={() => startEditMaterial(item)}>Edit</Btn>
                        {confirmMaterialDeleteId === item.id ? (
                          <DeleteConfirm id={item.id} onConfirm={(id) => { deleteMaterialItem(id); setConfirmMaterialDeleteId(null); }} onCancel={() => setConfirmMaterialDeleteId(null)} />
                        ) : (
                          <Btn variant="danger" onClick={() => setConfirmMaterialDeleteId(item.id)}><X className="h-4 w-4" /></Btn>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SALES TAB ────────────────────────────────────────────────────────────────

interface SaleFormState {
  date: string;
  productChoice: string;
  customProductName: string;
  quantity: string;
  pricePerUnit: string;
  buyer: string;
  note: string;
  allowOversell: boolean;
}

function SalesTab() {
  const { data, addSale, deleteSale } = useTracker();
  const savedProducts = useMemo(() => readSavedProducts(), []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SaleFormState>({
    date: today(),
    productChoice: "",
    customProductName: "",
    quantity: "",
    pricePerUnit: "",
    buyer: "",
    note: "",
    allowOversell: false,
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isOther = form.productChoice === "other";
  const selectedItem = form.productChoice.startsWith("inv:")
    ? data.inventory.find((i) => i.id === form.productChoice.slice(4))
    : null;
  const selectedSavedProduct = form.productChoice.startsWith("saved:")
    ? savedProducts.find((product) => product.id === form.productChoice.slice(6))
    : null;
  const qty = parseFloat(form.quantity) || 0;
  const price = parseFloat(form.pricePerUnit) || 0;
  const lineTotal = qty * price;
  const totalRevenue = data.sales.reduce((s, sale) => s + sale.quantity * sale.pricePerUnit, 0);
  const totalUnits = data.sales.reduce((s, sale) => s + sale.quantity, 0);
  const remaining = selectedItem ? selectedItem.quantityMade - selectedItem.quantitySold : null;
  const oversellWarning = selectedItem && qty > 0 && remaining !== null && qty > remaining
    ? `You only have ${Math.max(0, remaining)} ${selectedItem.name} left.`
    : "";
  const savedProductsNotInInventory = savedProducts.filter((product) => !data.inventory.some((item) => item.savedProductId === product.id));

  function handleItemSelect(choice: string) {
    const item = choice.startsWith("inv:") ? data.inventory.find((i) => i.id === choice.slice(4)) : null;
    const savedProduct = choice.startsWith("saved:") ? savedProducts.find((product) => product.id === choice.slice(6)) : null;
    setForm((f) => ({
      ...f,
      productChoice: choice,
      allowOversell: false,
      pricePerUnit:
        item && item.sellingPrice !== ""
          ? String(item.sellingPrice)
          : savedProduct?.summary.sellingPrice
            ? String(savedProduct.summary.sellingPrice)
            : f.pricePerUnit,
    }));
  }

  function handleAdd() {
    const productName = isOther
      ? form.customProductName.trim()
      : selectedItem?.name ?? selectedSavedProduct?.productInfo.productName ?? "";
    if (!productName || qty <= 0 || price <= 0) return;
    if (oversellWarning && !form.allowOversell) return;
    addSale({
      date: form.date || today(),
      productName,
      savedProductId: selectedSavedProduct?.id ?? selectedItem?.savedProductId ?? null,
      inventoryItemId: selectedItem?.id ?? null,
      quantity: qty,
      pricePerUnit: price,
      buyer: form.buyer.trim(),
      note: form.note.trim(),
      allowOversell: form.allowOversell,
    });
    setForm({ date: today(), productChoice: "", customProductName: "", quantity: "", pricePerUnit: "", buyer: "", note: "", allowOversell: false });
    setShowForm(false);
  }

  const sortedSales = [...data.sales].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-5">
      <TabHero icon={<DollarSign className="h-6 w-6" />} title="Sales" description="Record each sale here. Sales update revenue totals and can also reduce inventory automatically." />

      <StatRow stats={[
        { label: "Total Revenue", value: fmt$(totalRevenue), accent: "green" },
        { label: "Units Sold", value: String(totalUnits), accent: "teal" },
      ]} />

      <div>
        {!showForm && (
          <div className="flex justify-end mb-3">
            <Btn onClick={() => setShowForm(true)} variant="primary" size="md"><span className="inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Record a Sale</span></Btn>
          </div>
        )}

        {showForm && (
          <div className="rounded-2xl bg-[#F2FAE8] border border-[#A9DDB9] px-4 py-4 flex flex-col gap-3 mb-4">
            <p className="text-sm font-bold text-[#2B2B2B]">Record a Sale</p>
            <Field label="Date of sale">
              <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
            <Field label="What did you sell?">
              <select className={selectCls} value={form.productChoice} onChange={(e) => handleItemSelect(e.target.value)}>
                <option value="">— Choose a product —</option>
                {data.inventory.map((i) => <option key={i.id} value={`inv:${i.id}`}>{i.name}</option>)}
                {savedProductsNotInInventory.map((product) => <option key={product.id} value={`saved:${product.id}`}>{product.productInfo.productName || "Untitled product"} (saved)</option>)}
                <option value="other">Something else (type name)</option>
              </select>
            </Field>
            {isOther && (
              <Field label="Product name">
                <input className={inputCls} placeholder="e.g. Custom order" value={form.customProductName} onChange={(e) => setForm((f) => ({ ...f, customProductName: e.target.value }))} />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity sold">
                <input type="number" min="1" className={inputCls} placeholder="1" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
              </Field>
              <Field label="Price per item">
                <MoneyInput value={form.pricePerUnit} onChange={(v) => setForm((f) => ({ ...f, pricePerUnit: v }))} />
              </Field>
            </div>
            {oversellWarning && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-xs font-bold text-amber-700">{oversellWarning}</p>
                <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-amber-700">
                  <input
                    type="checkbox"
                    checked={form.allowOversell}
                    onChange={(e) => setForm((f) => ({ ...f, allowOversell: e.target.checked }))}
                  />
                  Record anyway
                </label>
              </div>
            )}
            {qty > 0 && price > 0 && (
              <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 flex items-center justify-between">
                <p className="text-xs font-semibold text-green-700">Sale total</p>
                <p className="text-sm font-extrabold text-green-700">{fmt$(lineTotal)}</p>
              </div>
            )}
            <Field label="Buyer (optional)">
              <input className={inputCls} placeholder="e.g. Maya, neighbor, school fair" value={form.buyer} onChange={(e) => setForm((f) => ({ ...f, buyer: e.target.value }))} />
            </Field>
            <Field label="Note (optional)">
              <input className={inputCls} placeholder="e.g. Sold at the school fair" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </Field>
            <div className="flex gap-2">
              <Btn onClick={handleAdd} variant="primary" disabled={!form.productChoice || (isOther && !form.customProductName.trim()) || qty <= 0 || price <= 0 || Boolean(oversellWarning && !form.allowOversell)}>Save Sale</Btn>
              <Btn onClick={() => setShowForm(false)} variant="ghost">Cancel</Btn>
            </div>
          </div>
        )}

        {sortedSales.length === 0 ? (
          <EmptyState icon={<DollarSign className="h-7 w-7" />} title="No sales yet" description="When you sell something, record it here. Revenue, units sold, and insights will update automatically." cta="Record your first sale" onCta={() => setShowForm(true)} />
        ) : (
          <Card>
            <p className="text-xs font-bold uppercase tracking-wider text-[#5C7F87] mb-3">Sale History</p>
            <div className="flex flex-col divide-y divide-[#EDF7F9]">
              {sortedSales.map((s) => (
                <div key={s.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#2B2B2B]">{s.productName}</p>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{fmt$(s.quantity * s.pricePerUnit)}</span>
                    </div>
                    <p className="text-xs text-[#4F747C] mt-0.5">{fmtDate(s.date)} · {s.quantity} × {fmt$(s.pricePerUnit)}</p>
                    {s.buyer && <p className="text-xs text-[#4F747C] mt-0.5">Buyer: {s.buyer}</p>}
                    {s.note && <p className="text-xs text-[#71939B] mt-0.5 italic">"{s.note}"</p>}
                  </div>
                  {confirmDeleteId === s.id ? (
                    <DeleteConfirm id={s.id} onConfirm={(id) => { deleteSale(id); setConfirmDeleteId(null); }} onCancel={() => setConfirmDeleteId(null)} />
                  ) : (
                    <Btn variant="danger" onClick={() => setConfirmDeleteId(s.id)}><X className="h-4 w-4" /></Btn>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── EXPENSES TAB ─────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES: ExpenseCategory[] = ["Materials", "Packaging", "Booth Fee", "Marketing", "Tools", "Other"];

interface ExpenseFormState { date: string; name: string; amount: string; category: ExpenseCategory; note: string; }

function ExpensesTab() {
  const { data, addExpense, deleteExpense } = useTracker();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>({ date: today(), name: "", amount: "", category: "Materials", note: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
  const sortedExpenses = [...data.expenses].sort((a, b) => b.date.localeCompare(a.date));

  function handleAdd() {
    if (!form.name.trim() || !form.amount) return;
    addExpense({ date: form.date || today(), name: form.name.trim(), amount: parseFloat(form.amount), category: form.category, note: form.note.trim() });
    setForm({ date: today(), name: "", amount: "", category: "Materials", note: "" });
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <TabHero icon={<Receipt className="h-6 w-6" />} title="Expenses" description="Log money you spend on supplies, packaging, events, and tools so your profit stays accurate." />

      <StatRow stats={[
        { label: "Total Spent", value: fmt$(totalExpenses), accent: totalExpenses > 0 ? "red" : "default" },
        { label: "Expense Records", value: String(data.expenses.length), accent: "default" },
      ]} />

      <div>
        {!showForm && (
          <div className="flex justify-end mb-3">
            <Btn onClick={() => setShowForm(true)} variant="primary" size="md"><span className="inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Add Expense</span></Btn>
          </div>
        )}

        {showForm && (
          <div className="rounded-2xl bg-[#FFF5E8] border border-[#F0C36F] px-4 py-4 flex flex-col gap-3 mb-4">
            <p className="text-sm font-bold text-[#2B2B2B]">Add an Expense</p>
            <Field label="Date">
              <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
            <Field label="What was it for?">
              <input className={inputCls} placeholder="e.g. Beads for bracelets" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount spent">
                <MoneyInput value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} />
              </Field>
              <Field label="Category">
                <select className={selectCls} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}>
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Note (optional)">
              <input className={inputCls} placeholder="Any extra details" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </Field>
            <div className="flex gap-2">
              <Btn onClick={handleAdd} variant="primary" disabled={!form.name.trim() || !form.amount}>Save Expense</Btn>
              <Btn onClick={() => setShowForm(false)} variant="ghost">Cancel</Btn>
            </div>
          </div>
        )}

        {sortedExpenses.length === 0 ? (
          <EmptyState icon={<Receipt className="h-7 w-7" />} title="No expenses logged" description="Add business purchases like materials, packaging, booth fees, or tools. Expenses help calculate real profit." cta="Add your first expense" onCta={() => setShowForm(true)} />
        ) : (
          <Card>
            <p className="text-xs font-bold uppercase tracking-wider text-[#5C7F87] mb-3">Expense Log</p>
            <div className="flex flex-col divide-y divide-[#EDF7F9]">
              {sortedExpenses.map((e) => (
                <div key={e.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#2B2B2B]">{e.name}</p>
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{fmt$(e.amount)}</span>
                    </div>
                    <p className="text-xs text-[#4F747C] mt-0.5">{fmtDate(e.date)} · {e.category}{e.note ? ` · ${e.note}` : ""}</p>
                  </div>
                  {confirmDeleteId === e.id ? (
                    <DeleteConfirm id={e.id} onConfirm={(id) => { deleteExpense(id); setConfirmDeleteId(null); }} onCancel={() => setConfirmDeleteId(null)} />
                  ) : (
                    <Btn variant="danger" onClick={() => setConfirmDeleteId(e.id)}><X className="h-4 w-4" /></Btn>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── EVENTS TAB ───────────────────────────────────────────────────────────────

interface EventFormState { name: string; date: string; location: string; boothFee: string; eventGoal: string; }
interface CompleteFormState { unitsSold: string; revenueActual: string; expensesActual: string; whatWentWell: string; improvements: string; }

function EventsTab() {
  const { data, addEvent, updateEvent, deleteEvent } = useTracker();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<EventFormState>({ name: "", date: "", location: "", boothFee: "", eventGoal: "" });
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState<CompleteFormState>({ unitsSold: "", revenueActual: "", expensesActual: "", whatWentWell: "", improvements: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleAdd() {
    if (!form.name.trim() || !form.date) return;
    addEvent({ name: form.name.trim(), date: form.date, location: form.location.trim(), expectedCustomers: "", boothFee: form.boothFee !== "" ? parseFloat(form.boothFee) : "", eventGoal: form.eventGoal.trim(), completed: false, unitsSold: "", revenueActual: "", expensesActual: "", whatWentWell: "", improvements: "" });
    setForm({ name: "", date: "", location: "", boothFee: "", eventGoal: "" });
    setShowAddForm(false);
  }

  function handleComplete(id: string) {
    updateEvent(id, { completed: true, unitsSold: completeForm.unitsSold !== "" ? parseFloat(completeForm.unitsSold) : "", revenueActual: completeForm.revenueActual !== "" ? parseFloat(completeForm.revenueActual) : "", expensesActual: completeForm.expensesActual !== "" ? parseFloat(completeForm.expensesActual) : "", whatWentWell: completeForm.whatWentWell.trim(), improvements: completeForm.improvements.trim() });
    setCompletingId(null);
    setCompleteForm({ unitsSold: "", revenueActual: "", expensesActual: "", whatWentWell: "", improvements: "" });
  }

  const upcoming = data.events.filter((e) => !e.completed).sort((a, b) => a.date.localeCompare(b.date));
  const past = data.events.filter((e) => e.completed).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-5">
      <TabHero icon={<CalendarDays className="h-6 w-6" />} title="Events" description="Plan markets, fairs, pop-ups, or school sales. After each event, record results so you can improve the next one." />

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[#2B2B2B]">Upcoming Events</p>
          <Btn onClick={() => setShowAddForm((v) => !v)} variant={showAddForm ? "ghost" : "primary"} size="md">
            {showAddForm ? "Cancel" : "New Event"}
          </Btn>
        </div>

        {showAddForm && (
          <div className="rounded-2xl bg-[#F3FBFC] border border-[#B2E0E7] px-4 py-4 flex flex-col gap-3 mb-4">
            <p className="text-sm font-bold text-[#2B2B2B]">Plan an Event</p>
            <Field label="Event name *">
              <input className={inputCls} placeholder="e.g. School Market, Neighborhood Sale" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date *">
                <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </Field>
              <Field label="Location">
                <input className={inputCls} placeholder="e.g. School gym" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Booth fee (if any)">
                <MoneyInput value={form.boothFee} onChange={(v) => setForm((f) => ({ ...f, boothFee: v }))} placeholder="0.00" />
              </Field>
              <Field label="Your goal for this event">
                <input className={inputCls} placeholder="e.g. Sell 15 items" value={form.eventGoal} onChange={(e) => setForm((f) => ({ ...f, eventGoal: e.target.value }))} />
              </Field>
            </div>
            <div className="flex gap-2">
              <Btn onClick={handleAdd} variant="primary" disabled={!form.name.trim() || !form.date}>Add Event</Btn>
              <Btn onClick={() => setShowAddForm(false)} variant="ghost">Cancel</Btn>
            </div>
          </div>
        )}

        {upcoming.length === 0 && !showAddForm ? (
          <EmptyState icon={<CalendarDays className="h-7 w-7" />} title="No upcoming events" description="Planning a market, fair, or pop-up? Add it here, set a goal, and record what happened afterward." cta="Plan an event" onCta={() => setShowAddForm(true)} />
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((evt) => {
              const daysUntil = Math.ceil((new Date(evt.date + "T00:00:00").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <Card key={evt.id}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <p className="text-base font-bold text-[#2B2B2B]">{evt.name}</p>
                      <p className="text-sm text-[#4F747C]">
                        {fmtDate(evt.date)}{evt.location ? ` · ${evt.location}` : ""}
                      </p>
                      {daysUntil >= 0 && daysUntil <= 7 && (
                        <span className="inline-block mt-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days away`}
                        </span>
                      )}
                      {evt.eventGoal && <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#0E92A3]"><Target className="h-3.5 w-3.5" /> Goal: {evt.eventGoal}</p>}
                      {evt.boothFee !== "" && <p className="text-xs text-[#4F747C]">Booth fee: {fmt$(Number(evt.boothFee))}</p>}
                    </div>
                    {confirmDeleteId === evt.id ? (
                      <DeleteConfirm id={evt.id} onConfirm={(id) => { deleteEvent(id); setConfirmDeleteId(null); }} onCancel={() => setConfirmDeleteId(null)} />
                    ) : (
                      <Btn variant="danger" onClick={() => setConfirmDeleteId(evt.id)}><X className="h-4 w-4" /></Btn>
                    )}
                  </div>

                  {completingId === evt.id ? (
                    <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 flex flex-col gap-3">
                      <p className="text-sm font-bold text-[#2B2B2B]">Event results</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Field label="Units sold">
                          <input type="number" min="0" className={inputCls} placeholder="0" value={completeForm.unitsSold} onChange={(e) => setCompleteForm((f) => ({ ...f, unitsSold: e.target.value }))} />
                        </Field>
                        <Field label="Revenue">
                          <MoneyInput value={completeForm.revenueActual} onChange={(v) => setCompleteForm((f) => ({ ...f, revenueActual: v }))} />
                        </Field>
                        <Field label="Expenses">
                          <MoneyInput value={completeForm.expensesActual} onChange={(v) => setCompleteForm((f) => ({ ...f, expensesActual: v }))} />
                        </Field>
                      </div>
                      <Field label="What went well?">
                        <input className={inputCls} placeholder="e.g. People loved the packaging" value={completeForm.whatWentWell} onChange={(e) => setCompleteForm((f) => ({ ...f, whatWentWell: e.target.value }))} />
                      </Field>
                      <Field label="What would you improve?">
                        <input className={inputCls} placeholder="e.g. Bring more change next time" value={completeForm.improvements} onChange={(e) => setCompleteForm((f) => ({ ...f, improvements: e.target.value }))} />
                      </Field>
                      <div className="flex gap-2">
                        <Btn onClick={() => handleComplete(evt.id)} variant="primary">Mark Complete</Btn>
                        <Btn variant="ghost" onClick={() => setCompletingId(null)}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <Btn onClick={() => { setCompletingId(evt.id); setCompleteForm({ unitsSold: "", revenueActual: "", expensesActual: "", whatWentWell: "", improvements: "" }); }} variant="outline">
                      Mark as Complete
                    </Btn>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <p className="text-sm font-bold text-[#2B2B2B] mb-3">Past Events</p>
          <div className="flex flex-col gap-3">
            {past.map((evt) => {
              const rev = Number(evt.revenueActual) || 0;
              const exp = Number(evt.expensesActual) || 0;
              const profit = rev - exp;
              return (
                <Card key={evt.id} className="opacity-90">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[#2B2B2B]">{evt.name}</p>
                        <Badge label="Completed" color="green" />
                      </div>
                      <p className="text-xs text-[#4F747C]">{fmtDate(evt.date)}{evt.location ? ` · ${evt.location}` : ""}</p>
                    </div>
                    {confirmDeleteId === evt.id ? (
                      <DeleteConfirm id={evt.id} onConfirm={(id) => { deleteEvent(id); setConfirmDeleteId(null); }} onCancel={() => setConfirmDeleteId(null)} />
                    ) : (
                      <Btn variant="danger" onClick={() => setConfirmDeleteId(evt.id)}><X className="h-4 w-4" /></Btn>
                    )}
                  </div>
                  {(rev > 0 || exp > 0) && (
                    <div className="flex flex-wrap gap-3 mt-2 rounded-xl bg-[#F9FCFD] border border-[#E3EEF2] px-3 py-2">
                      <p className="text-xs text-[#4F747C]">Revenue: <strong className="text-[#2B2B2B]">{fmt$(rev)}</strong></p>
                      <p className="text-xs text-[#4F747C]">Expenses: <strong className="text-[#2B2B2B]">{fmt$(exp)}</strong></p>
                      <p className="text-xs text-[#4F747C]">Profit: <strong className={profit >= 0 ? "text-green-600" : "text-red-500"}>{fmt$(profit)}</strong></p>
                      {evt.unitsSold !== "" && <p className="text-xs text-[#4F747C]">Sold: <strong className="text-[#2B2B2B]">{evt.unitsSold} units</strong></p>}
                    </div>
                  )}
                  {evt.whatWentWell && <p className="mt-2 flex gap-1.5 text-xs text-[#2B2B2B]"><CheckCircle2 className="h-3.5 w-3.5 flex-none text-green-600" /> {evt.whatWentWell}</p>}
                  {evt.improvements && <p className="mt-0.5 flex gap-1.5 text-xs text-[#4F747C]"><Lightbulb className="h-3.5 w-3.5 flex-none text-[#E1603F]" /> Next time: {evt.improvements}</p>}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GOALS TAB ────────────────────────────────────────────────────────────────

interface GoalFormState { name: string; type: GoalType; target: string; deadline: string; }

function GoalsTab() {
  const { data, addGoal, deleteGoal } = useTracker();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<GoalFormState>({ name: "", type: "money", target: "", deadline: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalRevenue = data.sales.reduce((s, sale) => s + sale.quantity * sale.pricePerUnit, 0);
  const totalUnits = data.sales.reduce((s, sale) => s + sale.quantity, 0);

  function handleAdd() {
    if (!form.name.trim()) return;
    addGoal({ name: form.name.trim(), type: form.type, target: form.target !== "" ? parseFloat(form.target) : "", deadline: form.deadline });
    setForm({ name: "", type: "money", target: "", deadline: "" });
    setShowForm(false);
  }

  function getProgress(g: GoalRecord): { pct: number; current: number | string } {
    const target = Number(g.target) || 0;
    if (target <= 0) return { pct: 0, current: 0 };
    const current = g.type === "money" ? totalRevenue : g.type === "units" ? totalUnits : 0;
    return { pct: Math.min(100, Math.round((current / target) * 100)), current };
  }

  function getMessage(pct: number): string {
    if (pct >= 100) return "Goal reached.";
    if (pct >= 75) return "Almost there. Keep the momentum going.";
    if (pct >= 50) return "Over halfway. Stay consistent.";
    if (pct >= 25) return "Good progress. Keep tracking.";
    if (pct > 0) return "Started. Every sale counts.";
    return "Set your target and start tracking.";
  }

  const goalTypeColors: Record<GoalType, { bar: string; bg: string; text: string }> = {
    money: { bar: "bg-green-500", bg: "bg-green-50", text: "text-green-700" },
    units: { bar: "bg-[#0E92A3]", bg: "bg-[#EAF8FA]", text: "text-[#0E92A3]" },
    custom: { bar: "bg-purple-400", bg: "bg-purple-50", text: "text-purple-700" },
  };

  return (
    <div className="flex flex-col gap-5">
      <TabHero icon={<Target className="h-6 w-6" />} title="Goals" description="Set targets for revenue, units sold, or your own custom goal. Progress updates as you log real activity." />

      <div>
        {!showForm && (
          <div className="flex justify-end mb-3">
            <Btn onClick={() => setShowForm(true)} variant="primary" size="md"><span className="inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Add Goal</span></Btn>
          </div>
        )}

        {showForm && (
          <div className="rounded-2xl bg-[#F7F6F9] border border-[#D8C9F3] px-4 py-4 flex flex-col gap-3 mb-4">
            <p className="text-sm font-bold text-[#2B2B2B]">Set a New Goal</p>
            <Field label="Goal name *">
              <input className={inputCls} placeholder='e.g. "Save up $100" or "Sell 50 bracelets"' value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="What type of goal?">
              <select className={selectCls} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as GoalType }))}>
                <option value="money">Money — track total revenue</option>
                <option value="units">Units sold — track how many items</option>
                <option value="custom">Custom — track manually</option>
              </select>
            </Field>
            {form.type !== "custom" && (
              <Field label={form.type === "money" ? "Target amount ($)" : "Target number of units"}>
                {form.type === "money" ? (
                  <MoneyInput value={form.target} onChange={(v) => setForm((f) => ({ ...f, target: v }))} placeholder="100.00" />
                ) : (
                  <input type="number" min="0" className={inputCls} placeholder="e.g. 50" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} />
                )}
              </Field>
            )}
            <Field label="Target date (optional)">
              <input type="date" className={inputCls} value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
            </Field>
            <div className="flex gap-2">
              <Btn onClick={handleAdd} variant="primary" disabled={!form.name.trim()}>Save Goal</Btn>
              <Btn onClick={() => setShowForm(false)} variant="ghost">Cancel</Btn>
            </div>
          </div>
        )}

        {data.goals.length === 0 ? (
          <EmptyState icon={<Target className="h-7 w-7" />} title="No goals yet" description="Set a target, like earning $50 or selling 20 items. Goals make it easier to decide what to do next." cta="Set your first goal" onCta={() => setShowForm(true)} />
        ) : (
          <div className="flex flex-col gap-4">
            {data.goals.map((g) => {
              const { pct, current } = getProgress(g);
              const text = getMessage(pct);
              const colors = goalTypeColors[g.type];
              const target = Number(g.target) || 0;
              const typeLabel = g.type === "money" ? "Revenue goal" : g.type === "units" ? "Units goal" : "Custom";
              return (
                <Card key={g.id}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-bold text-[#2B2B2B]">{g.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text}`}>{typeLabel}</span>
                      </div>
                      {target > 0 && (
                        <p className="text-xs text-[#4F747C] mt-0.5">
                          {g.type === "money"
                            ? `${fmt$(current as number)} of ${fmt$(target)}`
                            : g.type === "units"
                            ? `${current} of ${target} units`
                            : ""}
                          {g.deadline ? ` · By ${fmtDate(g.deadline)}` : ""}
                        </p>
                      )}
                    </div>
                    {confirmDeleteId === g.id ? (
                      <DeleteConfirm id={g.id} onConfirm={(id) => { deleteGoal(id); setConfirmDeleteId(null); }} onCancel={() => setConfirmDeleteId(null)} />
                    ) : (
                      <Btn variant="danger" onClick={() => setConfirmDeleteId(g.id)}><X className="h-4 w-4" /></Btn>
                    )}
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="flex items-center gap-1.5 text-xs text-[#4F747C]"><Flag className="h-3.5 w-3.5" /> {text}</p>
                      <span className={`text-sm font-extrabold ${pct >= 100 ? "text-green-600" : colors.text}`}>{pct}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-[#EDF7F9] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? "bg-green-500" : colors.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── INSIGHTS TAB ─────────────────────────────────────────────────────────────

const FEEDBACK_CATEGORIES: FeedbackCategory[] = ["Loved it", "Too expensive", "Wanted more options", "Quality issue", "Packaging", "Other"];

interface FeedbackFormState { date: string; source: string; comment: string; category: FeedbackCategory; }

type InsightType = "warning" | "success" | "info" | "tip";

const INSIGHT_STYLES: Record<InsightType, { card: string; label: string; dot: string }> = {
  warning: { card: "bg-amber-50 border-amber-200", label: "text-amber-700", dot: "bg-amber-400" },
  success: { card: "bg-green-50 border-green-200", label: "text-green-700", dot: "bg-green-500" },
  info:    { card: "bg-[#EAF8FA] border-[#B2E0E7]", label: "text-[#0E92A3]", dot: "bg-[#0E92A3]" },
  tip:     { card: "bg-purple-50 border-purple-200", label: "text-purple-700", dot: "bg-purple-400" },
};

function InsightsTab() {
  const { data, addFeedback, deleteFeedback } = useTracker();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [fbForm, setFbForm] = useState<FeedbackFormState>({ date: today(), source: "", comment: "", category: "Loved it" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalRevenue = data.sales.reduce((s, sale) => s + sale.quantity * sale.pricePerUnit, 0);
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalUnits = data.sales.reduce((s, sale) => s + sale.quantity, 0);

  const salesByProduct: Record<string, number> = {};
  data.sales.forEach((s) => { salesByProduct[s.productName] = (salesByProduct[s.productName] ?? 0) + s.quantity; });
  const bestSeller = Object.entries(salesByProduct).sort((a, b) => b[1] - a[1])[0];
  const outOfStock = data.inventory.filter((i) => i.quantityMade - i.quantitySold <= 0);
  const lowStock = data.inventory.filter((i) => { const rem = i.quantityMade - i.quantitySold; return rem > 0 && (rem <= 3 || (i.quantityMade > 0 && rem / i.quantityMade <= 0.2)); });
  const halfwayGoals = data.goals.filter((g) => { if (g.type !== "money") return false; const t = Number(g.target) || 0; return t > 0 && totalRevenue / t >= 0.5; });
  const sevenStr = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })();
  const soonEvent = data.events.find((e) => !e.completed && e.date >= today() && e.date <= sevenStr);
  const fbCatCount: Record<string, number> = {};
  data.feedback.forEach((f) => { fbCatCount[f.category] = (fbCatCount[f.category] ?? 0) + 1; });
  const topFbCat = Object.entries(fbCatCount).sort((a, b) => b[1] - a[1])[0];

  const insights: Array<{ type: InsightType; label: string; body: string }> = useMemo(() => {
    if (data.sales.length === 0) {
      return [{ type: "info", label: "Get started", body: "No sales recorded yet. Once you make your first sale, personalized insights will appear here." }];
    }
    const list: Array<{ type: InsightType; label: string; body: string }> = [];
    if (totalProfit < 0) list.push({ type: "warning", label: "Expenses exceed revenue", body: `You've spent ${fmt$(totalExpenses)} but only earned ${fmt$(totalRevenue)}. Look for ways to cut costs or increase sales.` });
    outOfStock.forEach((i) => list.push({ type: "warning", label: "Out of stock", body: `You're sold out of "${i.name}". Consider making more before your next event.` }));
    lowStock.forEach((i) => { const rem = i.quantityMade - i.quantitySold; list.push({ type: "tip", label: "Running low", body: `Only ${rem} of "${i.name}" left in stock. Restock soon if you have an event coming up.` }); });
    if (totalRevenue > 0 && bestSeller) list.push({ type: "success", label: "Best seller", body: `"${bestSeller[0]}" is your top product with ${bestSeller[1]} unit${bestSeller[1] !== 1 ? "s" : ""} sold. Consider promoting it more.` });
    if (totalProfit > 0) list.push({ type: "success", label: "Profitable so far", body: `Your business has earned ${fmt$(totalProfit)} in profit. Your costs are currently under control.` });
    halfwayGoals.forEach((g) => list.push({ type: "success", label: "Goal milestone", body: `You're over halfway to your goal: "${g.name}". Keep tracking your progress.` }));
    if (soonEvent) list.push({ type: "info", label: "Event coming up", body: `"${soonEvent.name}" is on ${fmtDate(soonEvent.date)}. Check inventory and supplies before you go.` });
    if (data.feedback.length > 0 && topFbCat && topFbCat[1] > 1) list.push({ type: "tip", label: "Customer trend", body: `Multiple people mentioned "${topFbCat[0]}". This may be useful feedback to act on.` });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, totalRevenue, totalProfit, totalExpenses, bestSeller, outOfStock, lowStock, halfwayGoals, soonEvent, topFbCat, totalUnits]);

  function handleAddFeedback() {
    if (!fbForm.comment.trim()) return;
    addFeedback({ date: fbForm.date || today(), source: fbForm.source.trim(), comment: fbForm.comment.trim(), category: fbForm.category });
    setFbForm({ date: today(), source: "", comment: "", category: "Loved it" });
    setShowFeedbackForm(false);
  }

  const fbBadgeColor = (cat: FeedbackCategory): "green" | "amber" | "teal" | "gray" | "blue" => {
    if (cat === "Loved it") return "green";
    if (cat === "Too expensive") return "amber";
    return "teal";
  };

  const sortedFeedback = [...data.feedback].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-5">
      <TabHero icon={<Lightbulb className="h-6 w-6" />} title="Insights" description="Signals based on your real business data. These update as you log sales, inventory, expenses, goals, and feedback." />

      <div className="flex flex-col gap-3">
        {insights.map((ins, i) => {
          const s = INSIGHT_STYLES[ins.type];
          const Icon = ins.type === "warning" ? AlertTriangle : ins.type === "success" ? CheckCircle2 : ins.type === "tip" ? Lightbulb : TrendingUp;
          return (
            <div key={i} className={`rounded-2xl border px-4 py-4 flex gap-3 ${s.card}`}>
              <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white ${s.label}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${s.label}`}>{ins.label}</p>
                <p className="text-sm text-[#2B2B2B] leading-relaxed">{ins.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-[#2B2B2B]">Customer Feedback</p>
            <p className="text-xs text-[#4F747C] mt-0.5">Notes from customers at events or in person</p>
          </div>
          <Btn onClick={() => setShowFeedbackForm((v) => !v)} variant={showFeedbackForm ? "ghost" : "outline"} size="md">
            {showFeedbackForm ? "Cancel" : "Add Note"}
          </Btn>
        </div>

        {showFeedbackForm && (
          <div className="rounded-2xl bg-[#F7F6F9] border border-[#D8C9F3] px-4 py-4 flex flex-col gap-3 mb-4">
            <p className="text-sm font-bold text-[#2B2B2B]">Log Customer Feedback</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input type="date" className={inputCls} value={fbForm.date} onChange={(e) => setFbForm((f) => ({ ...f, date: e.target.value }))} />
              </Field>
              <Field label="Where / who (optional)">
                <input className={inputCls} placeholder="e.g. School Market" value={fbForm.source} onChange={(e) => setFbForm((f) => ({ ...f, source: e.target.value }))} />
              </Field>
            </div>
            <Field label="What did they say? *">
              <textarea rows={2} className={`${inputCls} resize-none`} placeholder="e.g. &quot;I love the colors but it was a bit pricey&quot;" value={fbForm.comment} onChange={(e) => setFbForm((f) => ({ ...f, comment: e.target.value }))} />
            </Field>
            <Field label="Category">
              <select className={selectCls} value={fbForm.category} onChange={(e) => setFbForm((f) => ({ ...f, category: e.target.value as FeedbackCategory }))}>
                {FEEDBACK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <div className="flex gap-2">
              <Btn onClick={handleAddFeedback} variant="primary" disabled={!fbForm.comment.trim()}>Save Feedback</Btn>
              <Btn onClick={() => setShowFeedbackForm(false)} variant="ghost">Cancel</Btn>
            </div>
          </div>
        )}

        {sortedFeedback.length === 0 && !showFeedbackForm ? (
          <EmptyState icon={<MessageSquare className="h-7 w-7" />} title="No feedback yet" description='After selling at an event, write down what customers said. Notes like "loved it" or "too expensive" can help you improve.' cta="Add feedback note" onCta={() => setShowFeedbackForm(true)} />
        ) : (
          <div className="flex flex-col gap-3">
            {sortedFeedback.map((f) => (
              <Card key={f.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge label={f.category} color={fbBadgeColor(f.category)} />
                      {f.source && <p className="text-xs font-semibold text-[#2B2B2B]">{f.source}</p>}
                      <p className="text-xs text-[#71939B]">{fmtDate(f.date)}</p>
                    </div>
                    <p className="text-sm text-[#2B2B2B] leading-relaxed">"{f.comment}"</p>
                  </div>
                  {confirmDeleteId === f.id ? (
                    <DeleteConfirm id={f.id} onConfirm={(id) => { deleteFeedback(id); setConfirmDeleteId(null); }} onCancel={() => setConfirmDeleteId(null)} />
                  ) : (
                    <Btn variant="danger" onClick={() => setConfirmDeleteId(f.id)}><X className="h-4 w-4" /></Btn>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { key: "overview",  label: "Overview",  icon: BarChart3 },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "sales",     label: "Sales",     icon: DollarSign },
  { key: "expenses",  label: "Expenses",  icon: Receipt },
  { key: "events",    label: "Events",    icon: CalendarDays },
  { key: "goals",     label: "Goals",     icon: Target },
  { key: "insights",  label: "Insights",  icon: Lightbulb },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── TRACKER PAGE ─────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "overview";
  const activeTab: TabKey = TABS.some((t) => t.key === rawTab) ? (rawTab as TabKey) : "overview";

  function setTab(tab: TabKey) {
    setSearchParams({ tab });
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 28%, #eef8fa 58%, #ffe2d0 100%)" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center border-b border-[#D0EAF0] bg-white px-4 py-4 shadow-sm">
        <div className="flex min-w-[150px] gap-2">
          <button
            type="button"
            onClick={() => navigate("/results")}
            className="cursor-pointer rounded-xl bg-[#0E92A3] px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[#E1603F]"
          >
            Results
          </button>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="cursor-pointer rounded-xl bg-[#E1603F] px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[#C94E32]"
          >
            Products
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <img src={logo} alt="LaunchPad logo" className="h-12 w-auto" />
        </div>
        <p className="min-w-[80px] text-right text-[10px] font-medium leading-tight text-[#71939B]">
          Saved on<br />this device
        </p>
      </header>

      {/* Tab nav */}
      <div className="sticky top-[73px] z-10 border-b border-[#D0EAF0] bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-3">
          <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
            {TABS.map((tab) => {
              const isActive = tab.key === activeTab;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTab(tab.key)}
                  className={`flex min-w-[92px] flex-shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-3 py-2 transition-all ${
                    isActive
                      ? "border-[#E1603F] bg-[#E1603F] text-white shadow-sm"
                      : "border-[#0E92A3] bg-[#0E92A3] text-white hover:border-[#E1603F] hover:bg-[#E1603F]"
                  }`}
                >
                  <Icon className="h-4 w-4 text-white" />
                  <span className="text-xs font-extrabold leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {activeTab === "overview"  && <OverviewTab />}
          {activeTab === "inventory" && <InventoryTab />}
          {activeTab === "sales"     && <SalesTab />}
          {activeTab === "expenses"  && <ExpensesTab />}
          {activeTab === "events"    && <EventsTab />}
          {activeTab === "goals"     && <GoalsTab />}
          {activeTab === "insights"  && <InsightsTab />}
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

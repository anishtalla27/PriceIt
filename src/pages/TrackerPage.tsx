import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTracker } from "@/context/TrackerContext";
import type {
  InventoryItem,
  GoalRecord,
  ExpenseCategory,
  GoalType,
  FeedbackCategory,
} from "@/context/TrackerContext";
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
    <div className={`bg-white border border-[#E5E8EC] rounded-xl px-4 py-4 ${className}`}>
      {children}
    </div>
  );
}

function SmallBtn({
  onClick,
  children,
  variant = "primary",
  disabled = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const base = "text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer";
  const styles = {
    primary: "bg-[#EAF7F9] text-[#5DB7C4] hover:bg-[#5DB7C4] hover:text-white",
    ghost: "bg-transparent text-[#9BBFC3] hover:text-[#5DB7C4]",
    danger: "bg-transparent text-[#D1D5DB] hover:text-red-500",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  colorClass = "text-[#2B2B2B]",
}: {
  label: string;
  value: string;
  colorClass?: string;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#6F8A91]">{label}</p>
      <p className={`text-xl font-extrabold ${colorClass}`}>{value}</p>
    </Card>
  );
}

function Badge({ label, color }: { label: string; color: "green" | "amber" | "gray" | "blue" | "teal" }) {
  const styles = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    gray: "bg-gray-100 text-gray-500",
    blue: "bg-blue-50 text-blue-700",
    teal: "bg-[#EAF7F9] text-[#5DB7C4]",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[color]}`}>{label}</span>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h2 className="text-sm font-bold text-[#2B2B2B]">{title}</h2>
        {subtitle && <p className="text-xs text-[#6F8A91] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data } = useTracker();

  const totalRevenue = data.sales.reduce((s, sale) => s + sale.quantity * sale.pricePerUnit, 0);
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalUnitsSold = data.sales.reduce((s, sale) => s + sale.quantity, 0);
  const totalInventory = data.inventory.reduce((s, i) => s + Math.max(0, i.quantityMade - i.quantitySold), 0);

  const hasData =
    data.inventory.length > 0 ||
    data.sales.length > 0 ||
    data.expenses.length > 0 ||
    data.events.length > 0 ||
    data.goals.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-[#2B2B2B] font-bold text-base mb-1">Your tracker is ready.</p>
        <p className="text-[#6F8A91] text-sm max-w-xs">
          Add inventory, record a sale, or plan an event to get started.
        </p>
      </div>
    );
  }

  // Best seller
  const salesByProduct: Record<string, number> = {};
  data.sales.forEach((s) => {
    salesByProduct[s.productName] = (salesByProduct[s.productName] ?? 0) + s.quantity;
  });
  const bestSeller = Object.entries(salesByProduct).sort((a, b) => b[1] - a[1])[0];

  // Highlights
  const highlights: string[] = [];
  if (bestSeller) highlights.push(`Your best seller is ${bestSeller[0]}.`);
  if (totalInventory > 0) highlights.push(`You have ${totalInventory} item${totalInventory !== 1 ? "s" : ""} left in stock.`);
  if (netProfit > 0) highlights.push(`You've earned ${fmt$(netProfit)} in profit so far.`);

  // Recent sales (last 3)
  const recentSales = [...data.sales]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  // Active goals (first 2)
  const activeGoals = data.goals.slice(0, 2);

  // Next upcoming event
  const upcomingEvents = data.events
    .filter((e) => !e.completed && e.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextEvent = upcomingEvents[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row 1 */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Revenue" value={fmt$(totalRevenue)} />
        <StatCard label="Expenses" value={fmt$(totalExpenses)} />
        <StatCard
          label="Net Profit"
          value={fmt$(netProfit)}
          colorClass={netProfit >= 0 ? "text-green-600" : "text-red-500"}
        />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Units Sold" value={String(totalUnitsSold)} />
        <StatCard label="In Stock" value={String(totalInventory)} />
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <Card>
          <p className="text-xs font-bold text-[#6F8A91] uppercase tracking-wider mb-2">Highlights</p>
          <div className="flex flex-col gap-1">
            {highlights.map((h, i) => (
              <p key={i} className="text-sm text-[#2B2B2B]">{h}</p>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Sales */}
      {recentSales.length > 0 && (
        <Card>
          <p className="text-xs font-bold text-[#6F8A91] uppercase tracking-wider mb-2">Recent Sales</p>
          <div className="flex flex-col divide-y divide-[#F0F2F4]">
            {recentSales.map((s) => (
              <div key={s.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#2B2B2B]">{s.productName}</p>
                  <p className="text-xs text-[#6F8A91]">
                    {s.quantity} × {fmt$(s.pricePerUnit)} · {fmtDate(s.date)}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#2B2B2B]">
                  {fmt$(s.quantity * s.pricePerUnit)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Goals */}
      {activeGoals.length > 0 && (
        <Card>
          <p className="text-xs font-bold text-[#6F8A91] uppercase tracking-wider mb-3">Goals</p>
          <div className="flex flex-col gap-3">
            {activeGoals.map((g) => {
              const current =
                g.type === "money"
                  ? totalRevenue
                  : g.type === "units"
                  ? totalUnitsSold
                  : 0;
              const target = Number(g.target) || 0;
              const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-[#2B2B2B]">{g.name}</p>
                    <p className="text-xs text-[#6F8A91]">{pct}%</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F0F2F4] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#5DB7C4] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Next Event */}
      {nextEvent && (
        <Card>
          <p className="text-xs font-bold text-[#6F8A91] uppercase tracking-wider mb-2">Upcoming Event</p>
          <p className="text-sm font-bold text-[#2B2B2B]">{nextEvent.name}</p>
          <p className="text-xs text-[#6F8A91]">
            {fmtDate(nextEvent.date)}
            {nextEvent.location ? ` · ${nextEvent.location}` : ""}
          </p>
          {nextEvent.eventGoal && (
            <p className="text-xs text-[#2B2B2B] mt-1">Goal: {nextEvent.eventGoal}</p>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── INVENTORY TAB ────────────────────────────────────────────────────────────

interface InventoryFormState {
  name: string;
  quantityMade: string;
  costPerItem: string;
  sellingPrice: string;
}

const emptyInventoryForm = (): InventoryFormState => ({
  name: "",
  quantityMade: "",
  costPerItem: "",
  sellingPrice: "",
});

function InventoryTab() {
  const { data, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useTracker();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<InventoryFormState>(emptyInventoryForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<InventoryFormState>(emptyInventoryForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalItems = data.inventory.length;
  const totalRemaining = data.inventory.reduce(
    (s, i) => s + Math.max(0, i.quantityMade - i.quantitySold),
    0
  );

  function handleAdd() {
    if (!form.name.trim()) return;
    addInventoryItem({
      name: form.name.trim(),
      quantityMade: parseInt(form.quantityMade) || 0,
      costPerItem: form.costPerItem !== "" ? parseFloat(form.costPerItem) : "",
      sellingPrice: form.sellingPrice !== "" ? parseFloat(form.sellingPrice) : "",
    });
    setForm(emptyInventoryForm());
    setShowAdd(false);
  }

  function startEdit(item: InventoryItem) {
    setEditId(item.id);
    setEditForm({
      name: item.name,
      quantityMade: String(item.quantityMade),
      costPerItem: item.costPerItem !== "" ? String(item.costPerItem) : "",
      sellingPrice: item.sellingPrice !== "" ? String(item.sellingPrice) : "",
    });
  }

  function handleSaveEdit(id: string) {
    if (!editForm.name.trim()) return;
    updateInventoryItem(id, {
      name: editForm.name.trim(),
      quantityMade: parseInt(editForm.quantityMade) || 0,
      costPerItem: editForm.costPerItem !== "" ? parseFloat(editForm.costPerItem) : "",
      sellingPrice: editForm.sellingPrice !== "" ? parseFloat(editForm.sellingPrice) : "",
    });
    setEditId(null);
  }

  function stockStatus(item: InventoryItem): { label: string; color: "green" | "amber" | "gray" } {
    const remaining = item.quantityMade - item.quantitySold;
    if (remaining <= 0) return { label: "Sold out", color: "gray" };
    if (remaining <= 3 || (item.quantityMade > 0 && remaining / item.quantityMade <= 0.2)) {
      return { label: "Low stock", color: "amber" };
    }
    return { label: "In stock", color: "green" };
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Products" value={String(totalItems)} />
        <StatCard label="Items Remaining" value={String(totalRemaining)} />
      </div>

      {/* Add section */}
      <Card>
        <SectionHeader
          title="Products"
          action={
            <SmallBtn onClick={() => setShowAdd((v) => !v)}>
              {showAdd ? "Cancel" : "+ Add Item"}
            </SmallBtn>
          }
        />

        {showAdd && (
          <div className="mb-4 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E8EC] flex flex-col gap-2">
            <input
              className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
              placeholder="Product name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              type="number"
              min="0"
              className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
              placeholder="Quantity made"
              value={form.quantityMade}
              onChange={(e) => setForm((f) => ({ ...f, quantityMade: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6F8A91]">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-[#E5E8EC] pl-6 pr-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                  placeholder="Cost per item"
                  value={form.costPerItem}
                  onChange={(e) => setForm((f) => ({ ...f, costPerItem: e.target.value }))}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6F8A91]">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-[#E5E8EC] pl-6 pr-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                  placeholder="Selling price"
                  value={form.sellingPrice}
                  onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))}
                />
              </div>
            </div>
            <SmallBtn onClick={handleAdd} disabled={!form.name.trim()}>
              Save Item
            </SmallBtn>
          </div>
        )}

        {data.inventory.length === 0 && (
          <p className="text-sm text-[#6F8A91] text-center py-4">No products yet.</p>
        )}

        <div className="flex flex-col divide-y divide-[#F0F2F4]">
          {data.inventory.map((item) => {
            const remaining = item.quantityMade - item.quantitySold;
            const status = stockStatus(item);

            if (editId === item.id) {
              return (
                <div key={item.id} className="py-3 flex flex-col gap-2">
                  <input
                    className="w-full rounded-lg border border-[#E5E8EC] px-3 py-1.5 text-sm text-[#2B2B2B] focus:outline-none focus:border-[#5DB7C4]"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min="0"
                      className="rounded-lg border border-[#E5E8EC] px-2 py-1.5 text-sm text-[#2B2B2B] focus:outline-none focus:border-[#5DB7C4]"
                      placeholder="Made"
                      value={editForm.quantityMade}
                      onChange={(e) => setEditForm((f) => ({ ...f, quantityMade: e.target.value }))}
                    />
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#6F8A91]">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-[#E5E8EC] pl-5 pr-2 py-1.5 text-sm text-[#2B2B2B] focus:outline-none focus:border-[#5DB7C4]"
                        placeholder="Cost"
                        value={editForm.costPerItem}
                        onChange={(e) => setEditForm((f) => ({ ...f, costPerItem: e.target.value }))}
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#6F8A91]">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-[#E5E8EC] pl-5 pr-2 py-1.5 text-sm text-[#2B2B2B] focus:outline-none focus:border-[#5DB7C4]"
                        placeholder="Price"
                        value={editForm.sellingPrice}
                        onChange={(e) => setEditForm((f) => ({ ...f, sellingPrice: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <SmallBtn onClick={() => handleSaveEdit(item.id)}>Save</SmallBtn>
                    <SmallBtn variant="ghost" onClick={() => setEditId(null)}>Cancel</SmallBtn>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} className="py-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#2B2B2B] truncate">{item.name}</p>
                    <Badge label={status.label} color={status.color} />
                  </div>
                  <p className="text-xs text-[#6F8A91] mt-0.5">
                    Made: {item.quantityMade} · Sold: {item.quantitySold} · Left: {Math.max(0, remaining)}
                    {item.costPerItem !== "" ? ` · Cost: ${fmt$(Number(item.costPerItem))}` : ""}
                    {item.sellingPrice !== "" ? ` · Price: ${fmt$(Number(item.sellingPrice))}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <SmallBtn variant="ghost" onClick={() => startEdit(item)}>Edit</SmallBtn>
                  {confirmDeleteId === item.id ? (
                    <>
                      <SmallBtn variant="danger" onClick={() => { deleteInventoryItem(item.id); setConfirmDeleteId(null); }}>
                        Sure?
                      </SmallBtn>
                      <SmallBtn variant="ghost" onClick={() => setConfirmDeleteId(null)}>No</SmallBtn>
                    </>
                  ) : (
                    <SmallBtn variant="danger" onClick={() => setConfirmDeleteId(item.id)}>✕</SmallBtn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── SALES TAB ────────────────────────────────────────────────────────────────

interface SaleFormState {
  date: string;
  inventoryItemId: string;
  customProductName: string;
  quantity: string;
  pricePerUnit: string;
  note: string;
}

function SalesTab() {
  const { data, addSale, deleteSale } = useTracker();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SaleFormState>({
    date: today(),
    inventoryItemId: "",
    customProductName: "",
    quantity: "",
    pricePerUnit: "",
    note: "",
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isOther = form.inventoryItemId === "other";
  const selectedItem = data.inventory.find((i) => i.id === form.inventoryItemId);

  const qty = parseFloat(form.quantity) || 0;
  const price = parseFloat(form.pricePerUnit) || 0;
  const lineTotal = qty * price;

  const totalRevenue = data.sales.reduce((s, sale) => s + sale.quantity * sale.pricePerUnit, 0);

  function handleItemSelect(id: string) {
    const item = data.inventory.find((i) => i.id === id);
    setForm((f) => ({
      ...f,
      inventoryItemId: id,
      pricePerUnit: item && item.sellingPrice !== "" ? String(item.sellingPrice) : f.pricePerUnit,
    }));
  }

  function handleAdd() {
    const productName = isOther
      ? form.customProductName.trim()
      : selectedItem?.name ?? "";
    if (!productName || qty <= 0 || price <= 0) return;
    addSale({
      date: form.date || today(),
      productName,
      inventoryItemId: isOther ? null : (form.inventoryItemId || null),
      quantity: qty,
      pricePerUnit: price,
      note: form.note.trim(),
    });
    setForm({ date: today(), inventoryItemId: "", customProductName: "", quantity: "", pricePerUnit: "", note: "" });
    setShowForm(false);
  }

  const sortedSales = [...data.sales].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <StatCard label="Total Revenue" value={fmt$(totalRevenue)} />
      </div>

      <Card>
        <SectionHeader
          title="Sales"
          action={
            <SmallBtn onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancel" : "+ Record Sale"}
            </SmallBtn>
          }
        />

        {showForm && (
          <div className="mb-4 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E8EC] flex flex-col gap-2">
            <input
              type="date"
              className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] focus:outline-none focus:border-[#5DB7C4]"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            <select
              className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] focus:outline-none focus:border-[#5DB7C4] bg-white"
              value={form.inventoryItemId}
              onChange={(e) => handleItemSelect(e.target.value)}
            >
              <option value="">-- Select product --</option>
              {data.inventory.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
              <option value="other">Other (type name)</option>
            </select>
            {isOther && (
              <input
                className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                placeholder="Product name *"
                value={form.customProductName}
                onChange={(e) => setForm((f) => ({ ...f, customProductName: e.target.value }))}
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="1"
                className="rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6F8A91]">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-[#E5E8EC] pl-6 pr-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                  placeholder="Price per unit"
                  value={form.pricePerUnit}
                  onChange={(e) => setForm((f) => ({ ...f, pricePerUnit: e.target.value }))}
                />
              </div>
            </div>
            {qty > 0 && price > 0 && (
              <p className="text-xs text-[#5DB7C4] font-semibold">
                Total: {qty} × {fmt$(price)} = {fmt$(lineTotal)}
              </p>
            )}
            <input
              className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
              placeholder="Note (optional)"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
            <SmallBtn
              onClick={handleAdd}
              disabled={(!form.inventoryItemId) || (isOther && !form.customProductName.trim()) || qty <= 0 || price <= 0}
            >
              Record Sale
            </SmallBtn>
          </div>
        )}

        {sortedSales.length === 0 && (
          <p className="text-sm text-[#6F8A91] text-center py-4">No sales recorded yet.</p>
        )}

        <div className="flex flex-col divide-y divide-[#F0F2F4]">
          {sortedSales.map((s) => (
            <div key={s.id} className="py-2.5 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2B2B2B] truncate">{s.productName}</p>
                <p className="text-xs text-[#6F8A91]">
                  {fmtDate(s.date)} · {s.quantity} × {fmt$(s.pricePerUnit)} = {fmt$(s.quantity * s.pricePerUnit)}
                </p>
                {s.note && <p className="text-xs text-[#9BBFC3] mt-0.5">{s.note}</p>}
              </div>
              {confirmDeleteId === s.id ? (
                <div className="flex gap-1 flex-shrink-0">
                  <SmallBtn variant="danger" onClick={() => { deleteSale(s.id); setConfirmDeleteId(null); }}>Sure?</SmallBtn>
                  <SmallBtn variant="ghost" onClick={() => setConfirmDeleteId(null)}>No</SmallBtn>
                </div>
              ) : (
                <SmallBtn variant="danger" onClick={() => setConfirmDeleteId(s.id)}>✕</SmallBtn>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── EXPENSES TAB ─────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES: ExpenseCategory[] = ["Materials", "Packaging", "Booth Fee", "Marketing", "Tools", "Other"];

interface ExpenseFormState {
  date: string;
  name: string;
  amount: string;
  category: ExpenseCategory;
  note: string;
}

function ExpensesTab() {
  const { data, addExpense, deleteExpense } = useTracker();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>({
    date: today(),
    name: "",
    amount: "",
    category: "Materials",
    note: "",
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);

  function handleAdd() {
    if (!form.name.trim() || !form.amount) return;
    addExpense({
      date: form.date || today(),
      name: form.name.trim(),
      amount: parseFloat(form.amount),
      category: form.category,
      note: form.note.trim(),
    });
    setForm({ date: today(), name: "", amount: "", category: "Materials", note: "" });
    setShowForm(false);
  }

  const sortedExpenses = [...data.expenses].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-4">
      <StatCard label="Total Expenses" value={fmt$(totalExpenses)} />

      <Card>
        <SectionHeader
          title="Expenses"
          action={
            <SmallBtn onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancel" : "+ Add Expense"}
            </SmallBtn>
          }
        />

        {showForm && (
          <div className="mb-4 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E8EC] flex flex-col gap-2">
            <input
              type="date"
              className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] focus:outline-none focus:border-[#5DB7C4]"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            <input
              className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
              placeholder="Expense name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6F8A91]">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-[#E5E8EC] pl-6 pr-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <select
              className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] focus:outline-none focus:border-[#5DB7C4] bg-white"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
              placeholder="Note (optional)"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
            <SmallBtn onClick={handleAdd} disabled={!form.name.trim() || !form.amount}>
              Add Expense
            </SmallBtn>
          </div>
        )}

        {sortedExpenses.length === 0 && (
          <p className="text-sm text-[#6F8A91] text-center py-4">No expenses recorded yet.</p>
        )}

        <div className="flex flex-col divide-y divide-[#F0F2F4]">
          {sortedExpenses.map((e) => (
            <div key={e.id} className="py-2.5 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[#2B2B2B]">{e.name}</p>
                  <Badge label={e.category} color="teal" />
                </div>
                <p className="text-xs text-[#6F8A91]">
                  {fmtDate(e.date)} · {fmt$(e.amount)}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </div>
              {confirmDeleteId === e.id ? (
                <div className="flex gap-1 flex-shrink-0">
                  <SmallBtn variant="danger" onClick={() => { deleteExpense(e.id); setConfirmDeleteId(null); }}>Sure?</SmallBtn>
                  <SmallBtn variant="ghost" onClick={() => setConfirmDeleteId(null)}>No</SmallBtn>
                </div>
              ) : (
                <SmallBtn variant="danger" onClick={() => setConfirmDeleteId(e.id)}>✕</SmallBtn>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── EVENTS TAB ───────────────────────────────────────────────────────────────

interface EventFormState {
  name: string;
  date: string;
  location: string;
  boothFee: string;
  eventGoal: string;
}

interface CompleteFormState {
  unitsSold: string;
  revenueActual: string;
  expensesActual: string;
  whatWentWell: string;
  improvements: string;
}

function EventsTab() {
  const { data, addEvent, updateEvent, deleteEvent } = useTracker();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<EventFormState>({
    name: "",
    date: "",
    location: "",
    boothFee: "",
    eventGoal: "",
  });
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState<CompleteFormState>({
    unitsSold: "",
    revenueActual: "",
    expensesActual: "",
    whatWentWell: "",
    improvements: "",
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleAdd() {
    if (!form.name.trim() || !form.date) return;
    addEvent({
      name: form.name.trim(),
      date: form.date,
      location: form.location.trim(),
      expectedCustomers: "",
      boothFee: form.boothFee !== "" ? parseFloat(form.boothFee) : "",
      eventGoal: form.eventGoal.trim(),
      completed: false,
      unitsSold: "",
      revenueActual: "",
      expensesActual: "",
      whatWentWell: "",
      improvements: "",
    });
    setForm({ name: "", date: "", location: "", boothFee: "", eventGoal: "" });
    setShowAddForm(false);
  }

  function handleComplete(id: string) {
    updateEvent(id, {
      completed: true,
      unitsSold: completeForm.unitsSold !== "" ? parseFloat(completeForm.unitsSold) : "",
      revenueActual: completeForm.revenueActual !== "" ? parseFloat(completeForm.revenueActual) : "",
      expensesActual: completeForm.expensesActual !== "" ? parseFloat(completeForm.expensesActual) : "",
      whatWentWell: completeForm.whatWentWell.trim(),
      improvements: completeForm.improvements.trim(),
    });
    setCompletingId(null);
    setCompleteForm({ unitsSold: "", revenueActual: "", expensesActual: "", whatWentWell: "", improvements: "" });
  }

  const upcoming = data.events
    .filter((e) => !e.completed)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = data.events
    .filter((e) => e.completed)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-5">
      {/* Upcoming */}
      <div>
        <SectionHeader
          title="Upcoming Events"
          action={
            <SmallBtn onClick={() => setShowAddForm((v) => !v)}>
              {showAddForm ? "Cancel" : "+ New Event"}
            </SmallBtn>
          }
        />

        {showAddForm && (
          <Card className="mb-3">
            <div className="flex flex-col gap-2">
              <input
                className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                placeholder="Event name *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                type="date"
                className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] focus:outline-none focus:border-[#5DB7C4]"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6F8A91]">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-[#E5E8EC] pl-6 pr-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                  placeholder="Booth fee (optional)"
                  value={form.boothFee}
                  onChange={(e) => setForm((f) => ({ ...f, boothFee: e.target.value }))}
                />
              </div>
              <input
                className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                placeholder="Goal for this event"
                value={form.eventGoal}
                onChange={(e) => setForm((f) => ({ ...f, eventGoal: e.target.value }))}
              />
              <SmallBtn onClick={handleAdd} disabled={!form.name.trim() || !form.date}>
                Add Event
              </SmallBtn>
            </div>
          </Card>
        )}

        {upcoming.length === 0 && !showAddForm && (
          <p className="text-sm text-[#6F8A91] py-2">No upcoming events.</p>
        )}

        <div className="flex flex-col gap-3">
          {upcoming.map((evt) => (
            <Card key={evt.id}>
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#2B2B2B]">{evt.name}</p>
                  <p className="text-xs text-[#6F8A91]">
                    {fmtDate(evt.date)}
                    {evt.location ? ` · ${evt.location}` : ""}
                    {evt.boothFee !== "" ? ` · Booth: ${fmt$(Number(evt.boothFee))}` : ""}
                  </p>
                  {evt.eventGoal && (
                    <p className="text-xs text-[#2B2B2B] mt-1">Goal: {evt.eventGoal}</p>
                  )}
                </div>
                {confirmDeleteId === evt.id ? (
                  <div className="flex gap-1">
                    <SmallBtn variant="danger" onClick={() => { deleteEvent(evt.id); setConfirmDeleteId(null); }}>Sure?</SmallBtn>
                    <SmallBtn variant="ghost" onClick={() => setConfirmDeleteId(null)}>No</SmallBtn>
                  </div>
                ) : (
                  <SmallBtn variant="danger" onClick={() => setConfirmDeleteId(evt.id)}>✕</SmallBtn>
                )}
              </div>

              {completingId === evt.id ? (
                <div className="mt-3 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E8EC] flex flex-col gap-2">
                  <p className="text-xs font-bold text-[#2B2B2B]">How did it go?</p>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min="0"
                      className="rounded-lg border border-[#E5E8EC] px-2 py-1.5 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                      placeholder="Units sold"
                      value={completeForm.unitsSold}
                      onChange={(e) => setCompleteForm((f) => ({ ...f, unitsSold: e.target.value }))}
                    />
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#6F8A91]">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-[#E5E8EC] pl-5 pr-2 py-1.5 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                        placeholder="Revenue"
                        value={completeForm.revenueActual}
                        onChange={(e) => setCompleteForm((f) => ({ ...f, revenueActual: e.target.value }))}
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#6F8A91]">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-[#E5E8EC] pl-5 pr-2 py-1.5 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                        placeholder="Expenses"
                        value={completeForm.expensesActual}
                        onChange={(e) => setCompleteForm((f) => ({ ...f, expensesActual: e.target.value }))}
                      />
                    </div>
                  </div>
                  <input
                    className="w-full rounded-lg border border-[#E5E8EC] px-3 py-1.5 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                    placeholder="What went well"
                    value={completeForm.whatWentWell}
                    onChange={(e) => setCompleteForm((f) => ({ ...f, whatWentWell: e.target.value }))}
                  />
                  <input
                    className="w-full rounded-lg border border-[#E5E8EC] px-3 py-1.5 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                    placeholder="What to improve next time"
                    value={completeForm.improvements}
                    onChange={(e) => setCompleteForm((f) => ({ ...f, improvements: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <SmallBtn onClick={() => handleComplete(evt.id)}>Mark Complete</SmallBtn>
                    <SmallBtn variant="ghost" onClick={() => setCompletingId(null)}>Cancel</SmallBtn>
                  </div>
                </div>
              ) : (
                <SmallBtn
                  onClick={() => {
                    setCompletingId(evt.id);
                    setCompleteForm({ unitsSold: "", revenueActual: "", expensesActual: "", whatWentWell: "", improvements: "" });
                  }}
                >
                  Mark Complete
                </SmallBtn>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#2B2B2B] mb-3">Past &amp; Completed</h2>
          <div className="flex flex-col gap-3">
            {past.map((evt) => {
              const rev = Number(evt.revenueActual) || 0;
              const exp = Number(evt.expensesActual) || 0;
              const profit = rev - exp;
              return (
                <Card key={evt.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#2B2B2B]">{evt.name}</p>
                        <Badge label="Completed" color="green" />
                      </div>
                      <p className="text-xs text-[#6F8A91]">
                        {fmtDate(evt.date)}
                        {evt.location ? ` · ${evt.location}` : ""}
                      </p>
                      {(rev > 0 || exp > 0) && (
                        <p className="text-xs text-[#2B2B2B] mt-1">
                          Revenue: {fmt$(rev)} · Expenses: {fmt$(exp)} ·{" "}
                          <span className={profit >= 0 ? "text-green-600" : "text-red-500"}>
                            Profit: {fmt$(profit)}
                          </span>
                        </p>
                      )}
                      {evt.unitsSold !== "" && (
                        <p className="text-xs text-[#6F8A91]">Units sold: {evt.unitsSold}</p>
                      )}
                      {evt.whatWentWell && (
                        <p className="text-xs text-[#2B2B2B] mt-1">Went well: {evt.whatWentWell}</p>
                      )}
                      {evt.improvements && (
                        <p className="text-xs text-[#6F8A91]">Improve: {evt.improvements}</p>
                      )}
                    </div>
                    {confirmDeleteId === evt.id ? (
                      <div className="flex gap-1">
                        <SmallBtn variant="danger" onClick={() => { deleteEvent(evt.id); setConfirmDeleteId(null); }}>Sure?</SmallBtn>
                        <SmallBtn variant="ghost" onClick={() => setConfirmDeleteId(null)}>No</SmallBtn>
                      </div>
                    ) : (
                      <SmallBtn variant="danger" onClick={() => setConfirmDeleteId(evt.id)}>✕</SmallBtn>
                    )}
                  </div>
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

interface GoalFormState {
  name: string;
  type: GoalType;
  target: string;
  deadline: string;
}

function GoalsTab() {
  const { data, addGoal, deleteGoal } = useTracker();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<GoalFormState>({
    name: "",
    type: "money",
    target: "",
    deadline: "",
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalRevenue = data.sales.reduce((s, sale) => s + sale.quantity * sale.pricePerUnit, 0);
  const totalUnits = data.sales.reduce((s, sale) => s + sale.quantity, 0);

  function handleAdd() {
    if (!form.name.trim()) return;
    addGoal({
      name: form.name.trim(),
      type: form.type,
      target: form.target !== "" ? parseFloat(form.target) : "",
      deadline: form.deadline,
    });
    setForm({ name: "", type: "money", target: "", deadline: "" });
    setShowForm(false);
  }

  function getProgress(g: GoalRecord): number {
    const target = Number(g.target) || 0;
    if (target <= 0) return 0;
    const current =
      g.type === "money" ? totalRevenue : g.type === "units" ? totalUnits : 0;
    return Math.min(100, Math.round((current / target) * 100));
  }

  function getMessage(pct: number): string {
    if (pct >= 100) return "Goal reached!";
    if (pct >= 75) return "Almost there, keep going!";
    if (pct >= 50) return `You're ${pct}% of the way there — great work!`;
    if (pct >= 25) return `You're ${pct}% of the way there!`;
    return "Just getting started — every step counts!";
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHeader
          title="Goals"
          action={
            <SmallBtn onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancel" : "+ Add Goal"}
            </SmallBtn>
          }
        />

        {showForm && (
          <div className="mb-4 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E8EC] flex flex-col gap-2">
            <input
              className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
              placeholder="Goal name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <select
              className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] focus:outline-none focus:border-[#5DB7C4] bg-white"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as GoalType }))}
            >
              <option value="money">Money ($)</option>
              <option value="units">Units sold</option>
              <option value="custom">Custom</option>
            </select>
            {form.type !== "custom" && (
              <div className="relative">
                {form.type === "money" && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6F8A91]">$</span>
                )}
                <input
                  type="number"
                  min="0"
                  step={form.type === "money" ? "0.01" : "1"}
                  className={`w-full rounded-lg border border-[#E5E8EC] ${form.type === "money" ? "pl-6" : "pl-3"} pr-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]`}
                  placeholder={form.type === "money" ? "Target amount" : "Target units"}
                  value={form.target}
                  onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                />
              </div>
            )}
            <input
              type="date"
              className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] focus:outline-none focus:border-[#5DB7C4]"
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              placeholder="Deadline (optional)"
            />
            <SmallBtn onClick={handleAdd} disabled={!form.name.trim()}>
              Save Goal
            </SmallBtn>
          </div>
        )}

        {data.goals.length === 0 && (
          <p className="text-sm text-[#6F8A91] text-center py-4">No goals yet.</p>
        )}

        <div className="flex flex-col gap-4">
          {data.goals.map((g) => {
            const pct = getProgress(g);
            const typeLabel = g.type === "money" ? "Revenue goal" : g.type === "units" ? "Units goal" : "Custom goal";
            return (
              <div key={g.id} className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#2B2B2B]">{g.name}</p>
                      <Badge label={typeLabel} color="teal" />
                    </div>
                    {g.target !== "" && (
                      <p className="text-xs text-[#6F8A91]">
                        Target: {g.type === "money" ? fmt$(Number(g.target)) : `${g.target} units`}
                        {g.deadline ? ` · By ${fmtDate(g.deadline)}` : ""}
                      </p>
                    )}
                  </div>
                  {confirmDeleteId === g.id ? (
                    <div className="flex gap-1 flex-shrink-0">
                      <SmallBtn variant="danger" onClick={() => { deleteGoal(g.id); setConfirmDeleteId(null); }}>Sure?</SmallBtn>
                      <SmallBtn variant="ghost" onClick={() => setConfirmDeleteId(null)}>No</SmallBtn>
                    </div>
                  ) : (
                    <SmallBtn variant="danger" onClick={() => setConfirmDeleteId(g.id)}>✕</SmallBtn>
                  )}
                </div>
                <div className="h-2 rounded-full bg-[#F0F2F4] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#5DB7C4] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-[#6F8A91]">{getMessage(pct)}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── INSIGHTS TAB ─────────────────────────────────────────────────────────────

const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  "Loved it",
  "Too expensive",
  "Wanted more options",
  "Quality issue",
  "Packaging",
  "Other",
];

interface FeedbackFormState {
  date: string;
  source: string;
  comment: string;
  category: FeedbackCategory;
}

function InsightsTab() {
  const { data, addFeedback, deleteFeedback } = useTracker();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [fbForm, setFbForm] = useState<FeedbackFormState>({
    date: today(),
    source: "",
    comment: "",
    category: "Loved it",
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalRevenue = data.sales.reduce((s, sale) => s + sale.quantity * sale.pricePerUnit, 0);
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalUnits = data.sales.reduce((s, sale) => s + sale.quantity, 0);

  // Best seller
  const salesByProduct: Record<string, number> = {};
  data.sales.forEach((s) => {
    salesByProduct[s.productName] = (salesByProduct[s.productName] ?? 0) + s.quantity;
  });
  const bestSeller = Object.entries(salesByProduct).sort((a, b) => b[1] - a[1])[0];

  // Out of stock / low stock items
  const outOfStock = data.inventory.filter((i) => i.quantityMade - i.quantitySold <= 0);
  const lowStock = data.inventory.filter((i) => {
    const rem = i.quantityMade - i.quantitySold;
    return rem > 0 && (rem <= 3 || (i.quantityMade > 0 && rem / i.quantityMade <= 0.2));
  });

  // Money goals >= 50%
  const halfwayGoals = data.goals.filter((g) => {
    if (g.type !== "money") return false;
    const target = Number(g.target) || 0;
    if (target <= 0) return false;
    return totalRevenue / target >= 0.5;
  });

  // Upcoming event within 7 days
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenStr = sevenDaysFromNow.toISOString().slice(0, 10);
  const soonEvent = data.events.find(
    (e) => !e.completed && e.date >= today() && e.date <= sevenStr
  );

  // Most common feedback category
  const fbCatCount: Record<string, number> = {};
  data.feedback.forEach((f) => {
    fbCatCount[f.category] = (fbCatCount[f.category] ?? 0) + 1;
  });
  const topFbCat = Object.entries(fbCatCount).sort((a, b) => b[1] - a[1])[0];

  // Build insights
  const insights: Array<{ label: string; body: string }> = useMemo(() => {
    const list: Array<{ label: string; body: string }> = [];

    if (data.sales.length === 0) {
      return [
        {
          label: "No sales yet",
          body: "No sales recorded yet. Once you make your first sale, insights will appear here.",
        },
      ];
    }

    if (totalProfit < 0) {
      list.push({
        label: "Costs exceed revenue",
        body: "Your expenses are higher than your revenue. Review your costs or try to increase sales.",
      });
    }

    outOfStock.forEach((i) => {
      list.push({
        label: "Out of stock",
        body: `You're out of stock on ${i.name}. Consider making more before your next event.`,
      });
    });

    lowStock.forEach((i) => {
      const rem = i.quantityMade - i.quantitySold;
      list.push({
        label: "Low stock",
        body: `Running low on ${i.name} (${rem} left). You may want to restock soon.`,
      });
    });

    if (totalRevenue > 0 && bestSeller) {
      list.push({
        label: "Best seller",
        body: `Your best-selling product is ${bestSeller[0]} with ${bestSeller[1]} unit${bestSeller[1] !== 1 ? "s" : ""} sold.`,
      });
    }

    halfwayGoals.forEach((g) => {
      list.push({
        label: "Goal milestone",
        body: `You're over halfway to your goal: ${g.name}. Keep going!`,
      });
    });

    if (soonEvent) {
      list.push({
        label: "Upcoming event",
        body: `Your event "${soonEvent.name}" is coming up on ${fmtDate(soonEvent.date)}. Make sure your inventory is ready.`,
      });
    }

    if (data.feedback.length > 0 && topFbCat && topFbCat[1] > 1) {
      list.push({
        label: "Customer feedback trend",
        body: `Multiple customers mentioned "${topFbCat[0]}". Consider looking into this.`,
      });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, totalRevenue, totalProfit, bestSeller, outOfStock, lowStock, halfwayGoals, soonEvent, topFbCat, totalUnits]);

  function handleAddFeedback() {
    if (!fbForm.comment.trim()) return;
    addFeedback({
      date: fbForm.date || today(),
      source: fbForm.source.trim(),
      comment: fbForm.comment.trim(),
      category: fbForm.category,
    });
    setFbForm({ date: today(), source: "", comment: "", category: "Loved it" });
    setShowFeedbackForm(false);
  }

  const sortedFeedback = [...data.feedback].sort((a, b) => b.date.localeCompare(a.date));

  const fbBadgeColor = (cat: FeedbackCategory): "green" | "amber" | "teal" | "gray" | "blue" => {
    if (cat === "Loved it") return "green";
    if (cat === "Too expensive") return "amber";
    return "teal";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Insights */}
      <div className="flex flex-col gap-3">
        {insights.map((insight, i) => (
          <Card key={i}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5DB7C4] mb-1">
              {insight.label}
            </p>
            <p className="text-sm text-[#2B2B2B]">{insight.body}</p>
          </Card>
        ))}
      </div>

      {/* Customer Feedback */}
      <div className="mt-2">
        <SectionHeader
          title="Customer Feedback"
          subtitle="Notes from real customers or events"
          action={
            <SmallBtn onClick={() => setShowFeedbackForm((v) => !v)}>
              {showFeedbackForm ? "Cancel" : "+ Add Note"}
            </SmallBtn>
          }
        />

        {showFeedbackForm && (
          <Card className="mb-3">
            <div className="flex flex-col gap-2">
              <input
                type="date"
                className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] focus:outline-none focus:border-[#5DB7C4]"
                value={fbForm.date}
                onChange={(e) => setFbForm((f) => ({ ...f, date: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4]"
                placeholder="Source or event name"
                value={fbForm.source}
                onChange={(e) => setFbForm((f) => ({ ...f, source: e.target.value }))}
              />
              <textarea
                rows={2}
                className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B0C4C8] focus:outline-none focus:border-[#5DB7C4] resize-none"
                placeholder="What did they say? *"
                value={fbForm.comment}
                onChange={(e) => setFbForm((f) => ({ ...f, comment: e.target.value }))}
              />
              <select
                className="w-full rounded-lg border border-[#E5E8EC] px-3 py-2 text-sm text-[#2B2B2B] focus:outline-none focus:border-[#5DB7C4] bg-white"
                value={fbForm.category}
                onChange={(e) => setFbForm((f) => ({ ...f, category: e.target.value as FeedbackCategory }))}
              >
                {FEEDBACK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <SmallBtn onClick={handleAddFeedback} disabled={!fbForm.comment.trim()}>
                Save Note
              </SmallBtn>
            </div>
          </Card>
        )}

        {sortedFeedback.length === 0 && (
          <p className="text-sm text-[#6F8A91] py-2">No feedback recorded yet.</p>
        )}

        <div className="flex flex-col gap-2">
          {sortedFeedback.map((f) => (
            <Card key={f.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {f.source && (
                      <p className="text-xs font-semibold text-[#2B2B2B]">{f.source}</p>
                    )}
                    <Badge label={f.category} color={fbBadgeColor(f.category)} />
                    <p className="text-xs text-[#6F8A91]">{fmtDate(f.date)}</p>
                  </div>
                  <p className="text-sm text-[#2B2B2B]">{f.comment}</p>
                </div>
                {confirmDeleteId === f.id ? (
                  <div className="flex gap-1 flex-shrink-0">
                    <SmallBtn variant="danger" onClick={() => { deleteFeedback(f.id); setConfirmDeleteId(null); }}>Sure?</SmallBtn>
                    <SmallBtn variant="ghost" onClick={() => setConfirmDeleteId(null)}>No</SmallBtn>
                  </div>
                ) : (
                  <SmallBtn variant="danger" onClick={() => setConfirmDeleteId(f.id)}>✕</SmallBtn>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "inventory", label: "Inventory" },
  { key: "sales", label: "Sales" },
  { key: "expenses", label: "Expenses" },
  { key: "events", label: "Events" },
  { key: "goals", label: "Goals" },
  { key: "insights", label: "Insights" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── TRACKER PAGE ─────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "overview";
  const activeTab: TabKey = TABS.some((t) => t.key === rawTab)
    ? (rawTab as TabKey)
    : "overview";

  function setTab(tab: TabKey) {
    setSearchParams({ tab });
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#E5E8EC] flex items-center px-4 py-3">
        <button
          type="button"
          onClick={() => navigate("/results")}
          className="text-sm font-semibold text-[#5DB7C4] hover:text-[#F36C3D] transition-colors min-w-[80px] text-left cursor-pointer"
        >
          ← Results
        </button>
        <div className="flex-1 flex justify-center">
          <img src={logo} alt="LaunchPad logo" className="h-8 w-auto" />
        </div>
        <p className="text-[10px] text-[#9BBFC3] font-medium min-w-[80px] text-right">
          Saved on this device
        </p>
      </header>

      {/* Tab nav */}
      <div className="sticky top-[57px] z-10 bg-white border-b border-[#E5E8EC]">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-0 no-scrollbar">
            {TABS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTab(tab.key)}
                  className={`
                    flex-shrink-0 px-4 py-3 text-sm relative transition-colors cursor-pointer
                    ${isActive
                      ? "font-bold text-[#2B2B2B]"
                      : "font-medium text-[#7B9EA3] hover:text-[#2B2B2B]"
                    }
                  `}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5DB7C4] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-5">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "inventory" && <InventoryTab />}
          {activeTab === "sales" && <SalesTab />}
          {activeTab === "expenses" && <ExpensesTab />}
          {activeTab === "events" && <EventsTab />}
          {activeTab === "goals" && <GoalsTab />}
          {activeTab === "insights" && <InsightsTab />}
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

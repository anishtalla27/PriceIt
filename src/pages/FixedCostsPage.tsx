import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import type { FixedCostItem, FixedCostCategory } from "@/context/AppStateContext";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { injectBauhausCardStyles } from "@/components/ui/bauhaus-card";
import { injectFieldCardStyles } from "@/components/ui/field-card";
import { SaveStatus } from "@/components/ui/save-status";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import logo from "../../logo.png";

// ─── constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: FixedCostCategory; emoji: string; label: string }[] = [
  { value: "Equipment",       emoji: "🔧", label: "Equipment" },
  { value: "Facility Rental", emoji: "🏟️", label: "Facility Rental" },
  { value: "Instructor Fee",  emoji: "🧑‍🏫", label: "Instructor Fee" },
  { value: "Rent",            emoji: "🏠", label: "Rent" },
  { value: "Supplies",        emoji: "📦", label: "Supplies" },
  { value: "Packaging",       emoji: "📫", label: "Packaging" },
  { value: "Other",           emoji: "✨", label: "Other" },
];

function categoryEmoji(cat: FixedCostCategory) {
  return CATEGORY_OPTIONS.find((c) => c.value === cat)?.emoji ?? "✨";
}

// ─── math ─────────────────────────────────────────────────────────────────────

function monthlyPortion(item: FixedCostItem): number {
  if (item.totalCost === "" || Number(item.totalCost) <= 0) return 0;
  if (item.type === "monthly") return Number(item.totalCost);
  if (item.monthsOfUse === "" || Number(item.monthsOfUse) <= 0) return 0;
  return Number(item.totalCost) / Number(item.monthsOfUse);
}

function isRowComplete(item: FixedCostItem): boolean {
  if (item.name.trim() === "") return false;
  if (item.totalCost === "" || Number(item.totalCost) <= 0) return false;
  if (item.type === "one-time" && (item.monthsOfUse === "" || Number(item.monthsOfUse) <= 0))
    return false;
  return true;
}

// ─── shared card container with bauhaus gradient border + mouse tracking ──────

function CardShell({
  accentColor = "#0E92A3",
  compact = false,
  children,
}: {
  accentColor?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectBauhausCardStyles();
    injectFieldCardStyles();
    const card = ref.current;
    const onMove = (e: MouseEvent) => {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.setProperty("--rotation", Math.atan2(-x, y) + "rad");
    };
    card?.addEventListener("mousemove", onMove);
    return () => card?.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      className="bauhaus-field-card"
      style={{
        "--card-bg": "#ffffff",
        "--card-accent": accentColor,
        "--card-radius": "1rem",
        "--card-border-width": "2px",
        padding: compact ? "0.75rem 1rem" : "1.1rem 1.4rem 1.35rem",
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// ─── compact summary card ─────────────────────────────────────────────────────

function CompactCard({
  item,
  onEdit,
  onDelete,
}: {
  item: FixedCostItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const monthly = monthlyPortion(item);

  return (
    <CardShell accentColor="#0E92A3" compact>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 sm:gap-3 items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl select-none leading-none">{categoryEmoji(item.category)}</span>
            <p className={`font-bold text-sm leading-tight truncate ${item.name ? "text-[#2B2B2B]" : "text-[#8CA5AB]"}`}>
              {item.name || "Unnamed item"}
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded-full bg-[#0E92A3] text-white">{item.category}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#F0A92E] text-white">
              {item.type === "monthly" ? "Monthly" : "One-Time"}
            </span>
            {item.type === "one-time" && item.monthsOfUse && (
              <span className="px-2 py-0.5 rounded-full bg-[#E1603F] text-white">
                {item.monthsOfUse} mo
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="font-extrabold text-[#0E92A3] text-base leading-tight">
            {monthly > 0 ? `$${monthly.toFixed(2)}` : "—"}
          </p>
          <p className="text-[10px] text-[#71939B] font-semibold">monthly portion</p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="min-h-10 rounded-lg px-3 py-1.5 text-xs font-bold bg-[#0E92A3] text-white hover:bg-[#E1603F] transition-colors"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="min-h-10 flex items-center justify-center rounded-lg bg-[#E1603F] text-white hover:bg-[#C94E32] transition-colors text-xs font-bold px-3"
          aria-label="Delete"
        >
          Delete
        </button>
        </div>
      </div>
    </CardShell>
  );
}

// ─── expanded edit card ───────────────────────────────────────────────────────

function EditCard({
  item,
  onUpdate,
  onDelete,
  onDone,
}: {
  item: FixedCostItem;
  onUpdate: (updates: Partial<FixedCostItem>) => void;
  onDelete: () => void;
  onDone: () => void;
}) {
  const [touched, setTouched] = useState({
    name: false,
    totalCost: false,
    monthsOfUse: false,
  });
  const monthly = monthlyPortion(item);
  const nameError = touched.name && item.name.trim() === "";
  const totalCostError = touched.totalCost && (item.totalCost === "" || Number(item.totalCost) <= 0);
  const monthsError =
    item.type === "one-time" &&
    touched.monthsOfUse &&
    (item.monthsOfUse === "" || Number(item.monthsOfUse) <= 0);
  const monthsSliderMin = 1;
  const monthsSliderMax = Math.min(120, Math.max(36, Number(item.monthsOfUse) || 0));
  const monthsSliderValue =
    item.monthsOfUse === ""
      ? monthsSliderMin
      : Math.min(monthsSliderMax, Math.max(monthsSliderMin, Math.round(Number(item.monthsOfUse))));

  return (
    <CardShell accentColor="#0E92A3">
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_11rem_auto] gap-2 items-end mb-2.5">
        <div className="min-w-0">
          <label className="bauhaus-field-label">Cost item name</label>
          <input
            className="bauhaus-field-input"
            type="text"
            value={item.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            placeholder="e.g. Sewing Machine"
            autoFocus
            style={nameError ? { borderColor: "#E1603F", background: "#FFF0E7" } : undefined}
          />
          {nameError && (
            <p className="mt-1 text-xs font-semibold text-[#E1603F]">
              Add a name so we know what this cost is.
            </p>
          )}
        </div>
        <div className="w-full">
          <label className="bauhaus-field-label">Category</label>
          <select
            className="bauhaus-field-input"
            value={item.category}
            onChange={(e) => onUpdate({ category: e.target.value as FixedCostCategory })}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%230E92A3' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              appearance: "none",
              paddingRight: "2rem",
            }}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="sm:mb-[1px] min-h-10 shrink-0 flex items-center justify-center rounded-lg bg-[#E1603F] text-white hover:bg-[#C94E32] transition-colors text-xs font-bold px-3"
          aria-label="Delete cost item"
        >
          Delete
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end mb-2.5">
        <div className="flex-1">
          <label className="bauhaus-field-label">Total cost</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C7F87] font-semibold select-none pointer-events-none">
              $
            </span>
            <input
              className="bauhaus-field-input"
              type="number"
              min="0"
              step="0.01"
              value={item.totalCost}
              onChange={(e) => {
                if (e.target.value === "") {
                  onUpdate({ totalCost: "" });
                  return;
                }
                const parsed = Number(e.target.value);
                if (!Number.isFinite(parsed)) return;
                onUpdate({ totalCost: Math.max(0, parsed) });
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, totalCost: true }));
                if (item.totalCost !== "") {
                  onUpdate({ totalCost: Number(Number(item.totalCost).toFixed(2)) });
                }
              }}
              placeholder="0.00"
              style={{
                paddingLeft: "1.75rem",
                ...(totalCostError ? { borderColor: "#E1603F", background: "#FFF0E7" } : {}),
              }}
            />
          </div>
          {totalCostError && (
            <p className="mt-1 text-xs font-semibold text-[#E1603F]">
              Enter a cost bigger than $0.00.
            </p>
          )}
        </div>

        <div className="w-full">
          <label className="bauhaus-field-label">Type</label>
          <div className="flex rounded-xl overflow-hidden border-2 border-[#CDEBF0] min-h-10">
            <button
              type="button"
              onClick={() => onUpdate({ type: "one-time" })}
              className={`flex-1 min-h-10 text-xs font-bold transition-colors ${
                item.type === "one-time"
                  ? "bg-[#0E92A3] text-white"
                  : "bg-[#E1603F] text-white hover:bg-[#C94E32]"
              }`}
            >
              One-Time
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ type: "monthly" })}
              className={`flex-1 min-h-10 text-xs font-bold transition-colors ${
                item.type === "monthly"
                  ? "bg-[#0E92A3] text-white"
                  : "bg-[#E1603F] text-white hover:bg-[#C94E32]"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {item.type === "one-time" && (
        <div className="grid grid-cols-1 sm:grid-cols-[12rem_minmax(0,1fr)] gap-2.5 items-end mb-2.5">
          <div className="w-full">
            <label className="bauhaus-field-label">Months of use</label>
            <input
              className="bauhaus-field-input"
              type="number"
              min="1"
              step="1"
              value={item.monthsOfUse}
              onChange={(e) => {
                if (e.target.value === "") {
                  onUpdate({ monthsOfUse: "" });
                  return;
                }
                const parsed = Number(e.target.value);
                if (!Number.isFinite(parsed)) return;
                onUpdate({ monthsOfUse: Math.max(0, parsed) });
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, monthsOfUse: true }));
                if (item.monthsOfUse !== "") {
                  onUpdate({ monthsOfUse: Math.round(Number(item.monthsOfUse)) });
                }
              }}
              placeholder="12"
              style={monthsError ? { borderColor: "#E1603F", background: "#FFF0E7" } : undefined}
            />
            <input
              type="range"
              className="priceit-range mt-2"
              min={monthsSliderMin}
              max={monthsSliderMax}
              step={1}
              value={monthsSliderValue}
              onChange={(e) => {
                setTouched((prev) => ({ ...prev, monthsOfUse: true }));
                onUpdate({ monthsOfUse: Number(e.target.value) });
              }}
              aria-label="Months of use slider"
              style={{
                "--range-accent": "#E1603F",
              } as React.CSSProperties}
            />
            <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-[#71939B]">
              <span>{monthsSliderMin} mo</span>
              <span>{monthsSliderMax} mo</span>
            </div>
            {monthsError && (
              <p className="mt-1 text-xs font-semibold text-[#E1603F]">
                Enter at least 1 month.
              </p>
            )}
            {!monthsError && (
              <p className="mt-1 text-[11px] text-[#5C7F87] leading-relaxed">
                How long will you use this item? The cost gets spread across those months.{" "}
                <span className="font-semibold text-[#E1603F]">
                  Example: a $24 tool used for 12 months = $2/month.
                </span>
              </p>
            )}
          </div>
          {monthly > 0 && (
            <div className="rounded-xl bg-[#FFEDE3] border border-[#E1603F]/20 px-3 py-2">
              <p className="text-xs font-bold text-[#E1603F] leading-snug">
                ${Number(item.totalCost).toFixed(2)} over {item.monthsOfUse}{" "}
                month{Number(item.monthsOfUse) !== 1 ? "s" : ""}
              </p>
              <p className="text-sm sm:text-base font-extrabold text-[#E1603F]">
                = ${monthly.toFixed(2)}/month
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-1 pt-2 border-t border-[#CDEBF0] flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#71939B]">
          {monthly > 0 ? `Monthly portion: $${monthly.toFixed(2)}/mo` : "Monthly portion: —"}
        </span>
        <button
          type="button"
          onClick={onDone}
          className="min-h-10 rounded-xl px-4 py-1.5 text-xs font-extrabold bg-[#0E92A3] text-white hover:bg-[#0A7685] transition-colors"
        >
          ✓ Done
        </button>
      </div>
    </CardShell>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function FixedCostsPage() {
  const navigate = useNavigate();
  const { state, addFixedCost, updateFixedCost, deleteFixedCost } = useAppState();
  const mode = state.journeyMode ?? "create";
  const { fixedCosts } = state;

  // IDs of cards currently open in edit mode
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [assistantHighlight, setAssistantHighlight] = useState(false);
  const addedRowTimersRef = useRef<number[]>([]);

  const expand = (id: string) =>
    setExpandedIds((prev) => new Set([...prev, id]));
  const collapse = (id: string) =>
    setExpandedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });

  const handleAdd = () => {
    const id = addFixedCost();
    expand(id);
    setNewlyAddedIds((prev) => new Set([...prev, id]));
    const timer = window.setTimeout(() => {
      setNewlyAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 450);
    addedRowTimersRef.current.push(timer);
  };

  const handleDelete = (id: string) => {
    collapse(id);
    deleteFixedCost(id);
  };

  const handleDeletePress = (id: string) => setDeleteCandidateId(id);
  const deleteCandidate = fixedCosts.find((item) => item.id === deleteCandidateId) ?? null;

  useEffect(() => {
    const handleStateChange = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: string }>).detail;
      if (detail?.section !== "fixedCosts") return;
      setAssistantHighlight(true);
      window.setTimeout(() => setAssistantHighlight(false), 1000);
    };
    window.addEventListener("priceit-state-changed", handleStateChange);
    return () => window.removeEventListener("priceit-state-changed", handleStateChange);
  }, []);

  useEffect(() => {
    return () => {
      addedRowTimersRef.current.forEach((id) => window.clearTimeout(id));
      addedRowTimersRef.current = [];
    };
  }, []);

  const total = fixedCosts.reduce((sum, item) => sum + monthlyPortion(item), 0);
  const canProceed = fixedCosts.every(isRowComplete);

  return (
    <div className="priceit-cost-page min-h-screen flex flex-col priceit-fade-in" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#CDEBF0] bg-white sticky top-0 z-20">
        <button
          onClick={() => navigate("/setup")}
          className="min-h-11 rounded-xl bg-[#0E92A3] px-4 flex items-center gap-2 text-white font-semibold text-sm hover:bg-[#E1603F] transition-colors"
        >
          Back
        </button>
        <img src={logo} alt="LaunchPad logo" className="h-14 w-auto" />
        <div className="w-16" />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-4 sm:py-5">
        <div className="priceit-cost-inner w-full max-w-lg">
          <ProgressSteps currentStep={2} mode={mode} />

          {/* Page title */}
          <div className="mb-4 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2B2B2B]">
              {mode === "improve" ? "Review your current fixed costs" : "What are your fixed costs?"}
              <HelpTooltip term="Fixed costs" />
            </h1>
            <p className="mt-1 text-[#5C7F87] text-sm">
              {mode === "improve"
                ? "Use what you pay today so the improvement plan starts from real numbers."
                : "These are costs you pay no matter how many you sell — like rent, equipment, or subscriptions. Service businesses with no overhead can skip this step."}
            </p>
          </div>

          {/* Cost item cards */}
          <div className={`flex flex-col gap-2.5 rounded-2xl ${assistantHighlight ? "priceit-agent-highlight p-1" : ""}`}>
            {fixedCosts.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-[#AEDBE3] bg-white py-8 px-5 text-center flex flex-col items-center gap-3">
                <p className="text-3xl">🏷️</p>
                <div>
                  <p className="text-[#5C7F87] font-semibold text-sm">No fixed costs added yet.</p>
                  <p className="text-[#8CA5AB] text-xs mt-0.5">
                    Add things like rent, equipment, or supplies — or skip if your business has none.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/setup/variable-costs")}
                  className="mt-1 rounded-xl bg-[#0E92A3] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#E1603F] transition-colors"
                >
                  I have no fixed costs — skip this step →
                </button>
              </div>
            )}

            {fixedCosts.map((item) =>
              <div key={item.id} className={newlyAddedIds.has(item.id) ? "priceit-row-enter" : ""}>
                {expandedIds.has(item.id) ? (
                  <EditCard
                    item={item}
                    onUpdate={(updates) => updateFixedCost(item.id, updates)}
                    onDelete={() => handleDeletePress(item.id)}
                    onDone={() => collapse(item.id)}
                  />
                ) : (
                  <CompactCard
                    item={item}
                    onEdit={() => expand(item.id)}
                    onDelete={() => handleDeletePress(item.id)}
                  />
                )}
              </div>
            )}

            {/* Add button */}
            <div className="flex justify-center">
              <ChronicleButton
                text="+ Add Fixed Cost"
                onClick={handleAdd}
                hoverColor="#E1603F"
                customBackground="#0E92A3"
                customForeground="#ffffff"
                hoverForeground="#ffffff"
                width="100%"
                borderRadius="14px"
              />
            </div>
          </div>

          {/* Running total */}
          {fixedCosts.length > 0 && (
            <div className="mt-3 rounded-2xl bg-white border border-[#CDEBF0] px-4 py-3 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#5C7F87]">
                  Total Monthly Fixed Costs
                </p>
                <p className="text-xs text-[#8CA5AB] mt-0.5">
                  Sum of all monthly portions above
                </p>
              </div>
              <p className="text-2xl font-extrabold text-[#0E92A3]">
                ${total.toFixed(2)}
                <span className="text-sm font-bold text-[#71939B]">/mo</span>
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <ChronicleButton
              text="Back"
              onClick={() => navigate("/setup")}
              hoverColor="#0E92A3"
              customBackground="#0E92A3"
              customForeground="#ffffff"
              hoverForeground="#ffffff"
              width="140px"
              borderRadius="10px"
            />
            <ChronicleButton
              text="Next"
              onClick={() => { if (canProceed) navigate("/setup/variable-costs"); }}
              hoverColor="#E1603F"
              customBackground="#0E92A3"
              customForeground="#ffffff"
              hoverForeground="#ffffff"
              width="160px"
              borderRadius="10px"
              disabled={!canProceed}
            />
          </div>
          <SaveStatus />
        </div>
      </main>
      {deleteCandidate && (
        <DeleteConfirmDialog
          itemName={deleteCandidate.name}
          itemType="fixed cost"
          onCancel={() => setDeleteCandidateId(null)}
          onConfirm={() => {
            const id = deleteCandidate.id;
            setDeleteCandidateId(null);
            handleDelete(id);
          }}
        />
      )}
    </div>
  );
}

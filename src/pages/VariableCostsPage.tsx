import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import type { VariableCostItem, VariableCostCategory } from "@/context/AppStateContext";
import { ChronicleButton } from "@/components/ui/chronicle-button";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { injectBauhausCardStyles } from "@/components/ui/bauhaus-card";
import { injectFieldCardStyles } from "@/components/ui/field-card";
import { SaveStatus } from "@/components/ui/save-status";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { StepHelp } from "@/components/ui/step-help";
import logo from "../../logo.png";

// ─── constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: VariableCostCategory; emoji: string; label: string }[] = [
  { value: "Materials",    emoji: "🪡", label: "Materials" },
  { value: "Ingredients",  emoji: "🧂", label: "Ingredients" },
  { value: "Packaging",    emoji: "📫", label: "Packaging" },
  { value: "Labor",        emoji: "🙌", label: "Labor" },
  { value: "Other",        emoji: "✨", label: "Other" },
];

function categoryEmoji(cat: VariableCostCategory) {
  return CATEGORY_OPTIONS.find((c) => c.value === cat)?.emoji ?? "✨";
}

// ─── math ─────────────────────────────────────────────────────────────────────

function costPerProduct(item: VariableCostItem): number {
  const price = Number(item.pricePerPack);
  const perPack = Number(item.unitsPerPack);
  const used = Number(item.unitsPerProduct);
  if (!price || !perPack || !used) return 0;
  return (price / perPack) * used;
}

function isRowComplete(item: VariableCostItem): boolean {
  return (
    item.name.trim() !== "" &&
    item.pricePerPack !== "" && Number(item.pricePerPack) > 0 &&
    item.unitsPerPack !== "" && Number(item.unitsPerPack) > 0 &&
    item.unitsPerProduct !== "" && Number(item.unitsPerProduct) > 0
  );
}

// ─── small tooltip helper ─────────────────────────────────────────────────────

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border border-[#5DB7C4] bg-white text-[9px] font-bold text-[#5DB7C4] hover:border-[#F36C3D] hover:text-[#F36C3D] transition-colors"
        aria-label="Help"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-6 top-1/2 z-30 w-56 -translate-y-1/2 rounded-xl border border-[#A9DDE3] bg-white px-3 py-2 text-[11px] font-medium text-[#2B2B2B] shadow-lg leading-relaxed normal-case tracking-normal">
          {text}
        </span>
      )}
    </span>
  );
}

// ─── number input helper ──────────────────────────────────────────────────────

function NumInput({
  value,
  onChange,
  onBlur,
  placeholder,
  prefix,
  min = 0,
  step = "any",
  showStepper = false,
  stepAmount = 1,
  invalid = false,
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  onBlur?: () => void;
  placeholder?: string;
  prefix?: string;
  min?: number;
  step?: number | "any";
  showStepper?: boolean;
  stepAmount?: number;
  invalid?: boolean;
}) {
  const numericValue = value === "" ? 0 : Number(value);
  const currentValueRef = useRef(numericValue);
  const repeatTimeoutRef = useRef<number | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    currentValueRef.current = numericValue;
  }, [numericValue]);

  const applyStep = (delta: number) => {
    const next = Math.max(min, Number((currentValueRef.current + delta).toFixed(4)));
    currentValueRef.current = next;
    onChange(next);
  };

  const stopPress = () => {
    if (repeatTimeoutRef.current !== null) {
      window.clearTimeout(repeatTimeoutRef.current);
      repeatTimeoutRef.current = null;
    }
    if (repeatIntervalRef.current !== null) {
      window.clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  };

  const startPress = (delta: number) => {
    stopPress();
    applyStep(delta);
    repeatTimeoutRef.current = window.setTimeout(() => {
      repeatIntervalRef.current = window.setInterval(() => applyStep(delta), 90);
    }, 350);
  };

  useEffect(() => {
    return () => {
      if (repeatTimeoutRef.current !== null) {
        window.clearTimeout(repeatTimeoutRef.current);
      }
      if (repeatIntervalRef.current !== null) {
        window.clearInterval(repeatIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7B9EA3] font-semibold select-none pointer-events-none text-sm">
          {prefix}
        </span>
      )}
      <input
        className={`bauhaus-field-input ${showStepper ? "pr-[5.25rem]" : ""}`}
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => {
          if (e.target.value === "") {
            onChange("");
            return;
          }
          onChange(Number(e.target.value));
        }}
        onBlur={onBlur}
        placeholder={placeholder ?? "0"}
        style={{
          ...(prefix ? { paddingLeft: "1.75rem" } : {}),
          ...(invalid ? { borderColor: "#F36C3D", background: "#FFF5F0" } : {}),
        }}
      />
      {showStepper && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              startPress(-stepAmount);
            }}
            onPointerUp={stopPress}
            onPointerCancel={stopPress}
            onPointerLeave={stopPress}
            onBlur={stopPress}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                applyStep(-stepAmount);
              }
            }}
            className="h-8 w-8 rounded-lg border border-[#D5E3E6] bg-white text-[#7B9EA3] text-base font-extrabold hover:border-[#5DB7C4] hover:text-[#5DB7C4] transition-colors"
            aria-label={`Decrease value by ${stepAmount}`}
          >
            −
          </button>
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              startPress(stepAmount);
            }}
            onPointerUp={stopPress}
            onPointerCancel={stopPress}
            onPointerLeave={stopPress}
            onBlur={stopPress}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                applyStep(stepAmount);
              }
            }}
            className="h-8 w-8 rounded-lg border border-[#D5E3E6] bg-white text-[#7B9EA3] text-base font-extrabold hover:border-[#5DB7C4] hover:text-[#5DB7C4] transition-colors"
            aria-label={`Increase value by ${stepAmount}`}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

// ─── card shell (bauhaus gradient border + mouse tracking) ────────────────────

function CardShell({
  accentColor = "#5DB7C4",
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
  item: VariableCostItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cpp = costPerProduct(item);

  return (
    <CardShell compact>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 sm:gap-3 items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl select-none leading-none">{categoryEmoji(item.category)}</span>
            <p className={`font-bold text-sm leading-tight truncate ${item.name ? "text-[#2B2B2B]" : "text-[#B0C4C7]"}`}>
              {item.name || "Unnamed input"}
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded-full bg-[#EEF6F8] text-[#5DB7C4]">{item.category}</span>
            {item.unitsPerProduct !== "" && (
              <span className="px-2 py-0.5 rounded-full bg-[#FFF5F0] text-[#F36C3D]">
                {item.unitsPerProduct} used/product
              </span>
            )}
            {item.unitsPerPack !== "" && (
              <span className="px-2 py-0.5 rounded-full bg-[#F7F9FA] text-[#7B9EA3]">
                {item.unitsPerPack} per pack
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="font-extrabold text-[#F36C3D] text-base leading-tight">
            {cpp > 0 ? `$${cpp.toFixed(2)}` : "—"}
          </p>
          <p className="text-[10px] text-[#9BBFC3] font-semibold">cost per product</p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="min-h-10 rounded-lg px-3 py-1.5 text-xs font-bold bg-[#EEF6F8] text-[#5DB7C4] hover:bg-[#5DB7C4] hover:text-white transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="min-h-10 flex items-center justify-center rounded-lg bg-[#FFF0EA] text-[#F36C3D] hover:bg-[#F36C3D] hover:text-white transition-colors text-xs font-bold px-3"
            aria-label="Delete"
          >
            Delete
          </button>
        </div>
      </div>
    </CardShell>
  );
}

function SectionTitle({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-[#E7EFF1] bg-[#F9FCFC] px-3 py-1.5 mb-2">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6F8A91]">{title}</p>
      <p className="text-[11px] text-[#8EA8AE]">{hint}</p>
    </div>
  );
}

// ─── expanded edit card ───────────────────────────────────────────────────────

function EditCard({
  item,
  onUpdate,
  onDelete,
  onDone,
}: {
  item: VariableCostItem;
  onUpdate: (updates: Partial<VariableCostItem>) => void;
  onDelete: () => void;
  onDone: () => void;
}) {
  const [touched, setTouched] = useState({
    name: false,
    pricePerPack: false,
    unitsPerPack: false,
    unitsPerProduct: false,
  });
  const cpp = costPerProduct(item);
  const nameError = touched.name && item.name.trim() === "";
  const priceError = touched.pricePerPack && (item.pricePerPack === "" || Number(item.pricePerPack) <= 0);
  const perPackError = touched.unitsPerPack && (item.unitsPerPack === "" || Number(item.unitsPerPack) <= 0);
  const unitsPerProductError =
    touched.unitsPerProduct &&
    (item.unitsPerProduct === "" || Number(item.unitsPerProduct) <= 0);

  return (
    <CardShell accentColor={cpp > 0 ? "#F36C3D" : "#5DB7C4"}>
      <SectionTitle
        title="What This Item Is"
        hint="Name the input and choose a category."
      />

      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_11rem_auto] gap-2 items-end mb-2.5">
        <div className="min-w-0">
          <label className="bauhaus-field-label">Input name</label>
          <input
            className="bauhaus-field-input"
            type="text"
            value={item.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            placeholder="e.g. Batteries, Fabric, Flour"
            autoFocus
            style={nameError ? { borderColor: "#F36C3D", background: "#FFF5F0" } : undefined}
          />
          {nameError && (
            <p className="mt-1 text-xs font-semibold text-[#F36C3D]">
              Add a name so you can track this input.
            </p>
          )}
        </div>
        <div className="w-full">
          <label className="bauhaus-field-label">Category</label>
          <select
            className="bauhaus-field-input"
            value={item.category}
            onChange={(e) => onUpdate({ category: e.target.value as VariableCostCategory })}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%235DB7C4' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
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
          className="sm:mb-[1px] min-h-10 shrink-0 flex items-center justify-center rounded-lg bg-[#FFF0EA] text-[#F36C3D] hover:bg-[#F36C3D] hover:text-white transition-colors text-xs font-bold px-3"
          aria-label="Delete"
        >
          Delete
        </button>
      </div>

      <SectionTitle
        title="Pack Math"
        hint="Fill these three values to calculate cost per product."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2.5">
        <div>
          <label className="bauhaus-field-label flex items-center">
            Price per pack
            <Tip text="How much did you pay for one pack or bundle? e.g. $3.99 for a pack of batteries." />
          </label>
          <NumInput
            value={item.pricePerPack}
            onChange={(v) => onUpdate({ pricePerPack: v === "" ? "" : Math.max(0, Number(v)) })}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, pricePerPack: true }));
              if (item.pricePerPack !== "") {
                onUpdate({ pricePerPack: Number(Number(item.pricePerPack).toFixed(2)) });
              }
            }}
            placeholder="3.99"
            prefix="$"
            step="any"
            invalid={priceError}
          />
          {priceError && (
            <p className="mt-1 text-xs font-semibold text-[#F36C3D]">
              Enter a pack price bigger than $0.00.
            </p>
          )}
        </div>

        <div>
          <label className="bauhaus-field-label flex items-center">
            Units in pack
            <Tip text="How many pieces come in that pack? e.g. 4 batteries in one pack." />
          </label>
          <NumInput
            value={item.unitsPerPack}
            onChange={(v) => onUpdate({ unitsPerPack: v === "" ? "" : Math.max(0, Number(v)) })}
            onBlur={() => setTouched((prev) => ({ ...prev, unitsPerPack: true }))}
            placeholder="4"
            step="any"
            showStepper
            stepAmount={10}
            invalid={perPackError}
          />
          {perPackError && (
            <p className="mt-1 text-xs font-semibold text-[#F36C3D]">
              Enter how many units are in one pack.
            </p>
          )}
        </div>

        <div>
          <label className="bauhaus-field-label">
            <div className="inline-flex items-center gap-1">
              <span className="whitespace-nowrap">Used per product</span>
              <Tip text="How many of this do you use to make one finished product? e.g. 2 batteries per toy." />
            </div>
          </label>
          <NumInput
            value={item.unitsPerProduct}
            onChange={(v) => onUpdate({ unitsPerProduct: v === "" ? "" : Math.max(0, Number(v)) })}
            onBlur={() => setTouched((prev) => ({ ...prev, unitsPerProduct: true }))}
            placeholder="2"
            step="any"
            showStepper
            stepAmount={1}
            invalid={unitsPerProductError}
          />
          {unitsPerProductError && (
            <p className="mt-1 text-xs font-semibold text-[#F36C3D]">
              Enter how many units you use per product.
            </p>
          )}
        </div>
      </div>

      <div
        className={`rounded-xl px-3 py-2.5 mb-2.5 transition-colors ${
          cpp > 0
            ? "bg-[#FFF0EA] border border-[#F36C3D]/25"
            : "bg-[#F7F9FA] border border-[#E0EFF1]"
        }`}
      >
        {cpp > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            <p className="text-xs text-[#F36C3D] font-semibold">
              (${Number(item.pricePerPack).toFixed(2)} ÷ {item.unitsPerPack}) × {item.unitsPerProduct}
            </p>
            <p className="text-base sm:text-lg font-extrabold text-[#F36C3D]">
              ${cpp.toFixed(2)} per product
            </p>
          </div>
        ) : (
          <p className="text-xs text-[#B0C4C7] font-semibold text-center">
            Fill all three pack math fields to see the cost per product.
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-[#E0EFF1] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#9BBFC3]">
          {categoryEmoji(item.category)} {item.category}
        </span>
        <button
          type="button"
          onClick={onDone}
          className="min-h-10 rounded-xl px-4 py-1.5 text-xs font-extrabold bg-[#5DB7C4] text-white hover:bg-[#4aa8b5] transition-colors"
        >
          ✓ Done
        </button>
      </div>
    </CardShell>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function VariableCostsPage() {
  const navigate = useNavigate();
  const { state, addVariableCost, updateVariableCost, deleteVariableCost } = useAppState();
  const mode = state.journeyMode ?? "create";
  const { variableCosts } = state;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [assistantHighlight, setAssistantHighlight] = useState(false);
  const addRowTimersRef = useRef<number[]>([]);

  const expand  = (id: string) => setExpandedIds((p) => new Set([...p, id]));
  const collapse = (id: string) => setExpandedIds((p) => { const n = new Set(p); n.delete(id); return n; });

  const handleAdd = () => {
    const id = addVariableCost();
    expand(id);
    setNewlyAddedIds((prev) => new Set([...prev, id]));
    const timer = window.setTimeout(() => {
      setNewlyAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 450);
    addRowTimersRef.current.push(timer);
  };

  const handleDelete = (id: string) => {
    collapse(id);
    deleteVariableCost(id);
  };

  const handleDeletePress = (id: string) => setDeleteCandidateId(id);
  const deleteCandidate = variableCosts.find((item) => item.id === deleteCandidateId) ?? null;

  useEffect(() => {
    const handleStateChange = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: string }>).detail;
      if (detail?.section !== "variableCosts") return;
      setAssistantHighlight(true);
      window.setTimeout(() => setAssistantHighlight(false), 1000);
    };
    window.addEventListener("priceit-state-changed", handleStateChange);
    return () => window.removeEventListener("priceit-state-changed", handleStateChange);
  }, []);

  useEffect(() => {
    return () => {
      addRowTimersRef.current.forEach((id) => window.clearTimeout(id));
      addRowTimersRef.current = [];
    };
  }, []);

  const total = variableCosts.reduce((sum, item) => sum + costPerProduct(item), 0);
  const canProceed = variableCosts.every(isRowComplete);

  return (
    <div className="min-h-screen flex flex-col priceit-fade-in" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#E0EFF1] bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <button
          onClick={() => navigate("/setup/costs")}
          className="min-h-11 px-3 flex items-center gap-2 text-[#5DB7C4] font-semibold text-sm hover:text-[#F36C3D] transition-colors"
        >
          Back
        </button>
        <img src={logo} alt="LaunchPad logo" className="h-14 w-auto" />
        <div className="w-16" />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-4 sm:py-5">
        <div className="w-full max-w-lg">
          <ProgressSteps currentStep={3} mode={mode} />

          <div className="mb-4 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2B2B2B]">
              {mode === "improve" ? "Review what goes into each product or session" : "What goes into each product or session?"}
            </h1>
            <p className="mt-1 text-[#7B9EA3] text-sm">
              {mode === "improve"
                ? "Enter today's inputs so LaunchPad can spot where changes may help."
                : "Add every material, ingredient, or supply you use per product or service session. Pure service businesses (tutoring, consulting, etc.) with no per-session costs can skip this step."}
            </p>
          </div>

          <StepHelp
            storageKey="priceit_help_variable_costs_v1"
            title="Variable cost basics"
            items={[
              {
                term: "Variable cost",
                description: "Money you spend each time you make one product or run one session, like materials, packaging, or labor.",
              },
              {
                term: "Cost per product",
                description: "LaunchPad divides pack price by pack size, then multiplies by how much you use.",
              },
            ]}
          />

          {/* Item cards */}
          <div className={`flex flex-col gap-2.5 rounded-2xl ${assistantHighlight ? "priceit-agent-highlight p-1" : ""}`}>
            {variableCosts.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-[#C8E0E4] bg-white/60 py-8 px-5 text-center flex flex-col items-center gap-3">
                <p className="text-3xl">🧩</p>
                <div>
                  <p className="text-[#7B9EA3] font-semibold text-sm">No variable costs added yet.</p>
                  <p className="text-[#B0C4C7] text-xs mt-0.5">
                    Add materials or supplies per product — or skip if you're a service business with no per-session costs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/setup/pricing")}
                  className="mt-1 rounded-xl border-2 border-[#C8E0E4] bg-white px-5 py-2.5 text-sm font-bold text-[#5DB7C4] hover:border-[#5DB7C4] hover:bg-[#EAF7F9] transition-colors"
                >
                  I have no variable costs — skip this step →
                </button>
              </div>
            )}

            {variableCosts.map((item) =>
              <div key={item.id} className={newlyAddedIds.has(item.id) ? "priceit-row-enter" : ""}>
                {expandedIds.has(item.id) ? (
                  <EditCard
                    item={item}
                    onUpdate={(u) => updateVariableCost(item.id, u)}
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

            <div className="flex justify-center">
              <ChronicleButton
                text="+ Add Input"
                onClick={handleAdd}
                hoverColor="#F36C3D"
                customBackground="#EAF7F9"
                customForeground="#5DB7C4"
                hoverForeground="#ffffff"
                width="100%"
                borderRadius="14px"
              />
            </div>
          </div>

          {/* Running total */}
          {variableCosts.length > 0 && (
            <div className="mt-3 rounded-2xl bg-white border border-[#E0EFF1] px-4 py-3 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#7B9EA3]">
                  Total Variable Cost
                </p>
                <p className="text-xs text-[#B0C4C7] mt-0.5">
                  Cost of materials per product made
                </p>
              </div>
              <p className="text-2xl font-extrabold text-[#F36C3D]">
                ${total.toFixed(2)}
                <span className="text-sm font-bold text-[#9BBFC3]">/product</span>
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <ChronicleButton
              text="Back"
              onClick={() => navigate("/setup/costs")}
              hoverColor="#5DB7C4"
              customBackground="#E8ECEE"
              customForeground="#5DB7C4"
              hoverForeground="#ffffff"
              width="140px"
              borderRadius="10px"
            />
            <ChronicleButton
              text="Next"
              onClick={() => { if (canProceed) navigate("/setup/pricing"); }}
              hoverColor="#F36C3D"
              customBackground="#5DB7C4"
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
          itemType="variable cost"
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

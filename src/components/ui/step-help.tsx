import { useState } from "react";
import { CircleHelp, X } from "lucide-react";

interface StepHelpItem {
  term: string;
  description: string;
}

interface StepHelpProps {
  storageKey: string;
  title: string;
  items: StepHelpItem[];
}

export function StepHelp({ storageKey, title, items }: StepHelpProps) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(storageKey) !== "seen";
  });

  const dismiss = () => {
    setOpen(false);
    window.localStorage.setItem(storageKey, "seen");
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#A9DDE3] bg-white px-3 py-2 text-sm font-bold text-[#5DB7C4] shadow-sm transition hover:bg-[#EAF7F9]"
      >
        <CircleHelp className="h-4 w-4" />
        Help
      </button>
    );
  }

  return (
    <section className="mb-4 rounded-2xl border border-[#A9DDE3] bg-white px-4 py-4 text-left shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF7F9] text-[#5DB7C4]">
            <CircleHelp className="h-4 w-4" />
          </span>
          <h2 className="text-base font-extrabold text-[#2B2B2B]">{title}</h2>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#9BBFC3] transition hover:bg-[#F7F9FA] hover:text-[#F36C3D]"
          aria-label="Close help"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <p key={item.term} className="rounded-xl bg-[#F7FCFD] px-3 py-2 text-sm leading-relaxed text-[#5B7780]">
            <strong className="text-[#2B2B2B]">{item.term}:</strong> {item.description}
          </p>
        ))}
      </div>
    </section>
  );
}

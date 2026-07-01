import { useState } from "react";

const DEFINITIONS: Record<string, string> = {
  "Profit per unit": "How much money you make on each sale after paying all your costs.",
  "Cost per unit": "About how much it costs to make or deliver one item or session.",
  "Fixed costs": "Costs you pay even if you do not sell anything this month.",
  "Variable costs": "Costs that happen each time you make a product or run a session.",
  "Pricing": "Choosing what customers pay, then checking whether that price covers costs and leaves profit.",
  "Price test": "A pretend scenario where you change price and sales to see what might happen.",
  "Monthly revenue": "All the money you earn from sales in one month.",
  "Monthly costs": "Everything you spend in a month — fixed costs plus what it costs to make products.",
  "Monthly profit": "The money left over after paying all costs. This is what you keep!",
  "Profit margin": "What percent of each sale price turns into profit. Higher is better!",
  "Break-even point": "How many products you need to sell each month to cover all your costs.",
  "Customer satisfaction": "How happy your customers are. Happy customers come back and bring friends!",
  "Inventory": "Items you made but haven't sold yet. Too many can mean you're making more than customers want.",
  "Demand": "How many customers actually want to buy your product this week.",
};

export function HelpTooltip({ term }: { term: string }) {
  const [open, setOpen] = useState(false);
  const definition = DEFINITIONS[term];
  if (!definition) return null;

  return (
    <span className="relative inline-flex items-center ml-1 align-middle">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-[#B9C9CE] bg-[#EFF4F5] text-[9px] font-bold text-[#2F6F7A] hover:border-[#2F6F7A] hover:bg-[#2F6F7A] hover:text-white transition-colors"
        aria-label={`What is ${term}?`}
      >
        ?
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 rounded-xl border border-[#B9C9CE] bg-white px-3 py-2 text-[11px] font-medium text-[#2B2B2B] shadow-lg leading-relaxed pointer-events-none whitespace-normal">
          <strong className="font-bold text-[#295E66]">{term}: </strong>
          {definition}
        </span>
      )}
    </span>
  );
}

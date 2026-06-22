import type { UpgradeDefinition, UpgradeId } from "./types";

// ─── XP thresholds (crossing each unlocks one upgrade slot) ──────────────────

export const XP_THRESHOLDS = [50, 120, 220, 350, 500];

// ─── Upgrade catalogue ────────────────────────────────────────────────────────

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  // Operations
  {
    id: "bulk_discount",
    name: "Bulk Deal",
    description: "Negotiate volume pricing with your supplier.",
    effect: "−10% variable cost per unit",
    xpCost: 50,
    category: "operations",
  },
  {
    id: "fast_production",
    name: "Faster Production",
    description: "Better tools, leaner process, more output per week.",
    effect: "+25% max weekly units (stacks with helper)",
    xpCost: 50,
    category: "operations",
  },
  {
    id: "second_helper",
    name: "Second Helper",
    description: "Hire two assistants at once for serious scale.",
    effect: "Hire 2 helpers simultaneously (+100% cap, $40 total)",
    xpCost: 120,
    category: "operations",
  },
  // Marketing
  {
    id: "email_list",
    name: "Email List",
    description: "Build a mailing list of loyal repeat buyers.",
    effect: "+12% demand when active · costs $8/week",
    xpCost: 120,
    category: "marketing",
  },
  {
    id: "wom_boost",
    name: "WOM Amplifier",
    description: "Referral cards make word-of-mouth last longer.",
    effect: "WOM channel cap raised from 6 → 10 weeks",
    xpCost: 220,
    category: "marketing",
  },
  {
    id: "local_ad",
    name: "Local Ad",
    description: "A small ad in the neighborhood paper or board.",
    effect: "+18% demand when active · costs $20/week",
    xpCost: 220,
    category: "marketing",
  },
  {
    id: "sponsored_post",
    name: "Sponsored Post",
    description: "Pay a local creator to feature your product.",
    effect: "+25% demand when active · costs $30/week",
    xpCost: 350,
    category: "marketing",
  },
  // Product
  {
    id: "artisan_quality",
    name: "Artisan Tier",
    description: "Unlock a handcrafted premium quality level.",
    effect: "New 'Artisan' quality: demand ×1.45 · cost ×1.6",
    xpCost: 350,
    category: "product",
  },
  {
    id: "signature_feature",
    name: "Signature Feature",
    description: "Add a unique twist only your product has.",
    effect: "+8% baseline demand every week, permanently",
    xpCost: 500,
    category: "product",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getAvailableXP(totalXP: number, unlocked: UpgradeId[]): number {
  const spent = unlocked.reduce((sum, id) => {
    const def = UPGRADE_DEFINITIONS.find((d) => d.id === id);
    return sum + (def?.xpCost ?? 0);
  }, 0);
  return totalXP - spent;
}

export function computeXPGain(profitable: boolean, revenue: number, totalCost: number): number {
  const marginPct = revenue > 0 ? Math.max(0, ((revenue - totalCost) / revenue) * 100) : 0;
  return 10 + (profitable ? 5 : 0) + Math.floor(marginPct);
}

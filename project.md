# PriceIt Project Guide

## 1) What this project is

**PriceIt** is a kid-friendly business planning app (target age ~8–12) built with React + TypeScript.

The landing page offers two related journeys:
- **Create a new product** — turn a new idea into a cost, pricing, feedback, and simulation plan.
- **Improve a current product** — document the current product, identify its main challenge and improvement goal, then rebuild and test its economics.

Both journeys share the same financial engine while adapting onboarding questions, progress labels, page guidance, AI context, and results framing.

It helps a user:
1. Describe a product with AI
2. Enter fixed costs and variable costs
3. Set price + estimated monthly units
4. See profitability metrics and AI-generated feedback/reviews
5. Run a 12-week business simulation game

The app is designed to feel playful while teaching core business concepts:
- cost structure
- break-even thinking
- margin
- demand vs inventory
- customer satisfaction

---

## 2) Tech stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build tool:** Vite
- **Routing:** react-router-dom
- **Styling:** Tailwind CSS + custom CSS
- **Charts:** Recharts
- **Animation:** Framer Motion
- **Icons:** lucide-react
- **Markdown rendering:** react-markdown
- **State management:** React Context (`AppStateContext`)
- **Persistence:** `localStorage`
- **AI providers:** OpenRouter (default), built-in templates (fallback)
- **OpenRouter model:** `google/gemini-3.1-flash-lite`

Path alias is configured:
- `@` → `src`

---

## 3) Project structure (high-level)

- `src/App.tsx` — route map and app shell
- `src/context/AppStateContext.tsx` — global app state + mutation helpers + persistence
- `src/pages/`
  - `SetupPage.tsx` — AI product-info chat
  - `FixedCostsPage.tsx` — fixed-cost input
  - `VariableCostsPage.tsx` — variable-cost input
  - `PricingPage.tsx` — pricing + profitability dashboard
  - `ResultsPage.tsx` — AI rating/reviews + charts
  - `SimulateSetupPage.tsx` — simulation configuration
  - `SimulateGamePage.tsx` — 12-week simulation gameplay
  - `SimulateGameOverPage.tsx` — fail-end summary
  - `SimulateResultsPage.tsx` — success-end summary
- `src/components/ui/`
  - visual/interactive UI primitives and page shells
  - includes global assistant: `setup-flow-assistant.tsx`
- `src/lib/ai-service-error.ts` — normalized AI error handling
- `src/lib/ai-provider.ts` — unified local/OpenRouter/template provider routing
- `src/lib/ai-templates.ts` — no-AI fallbacks for every AI-powered flow
- `src/lib/openrouter-ai.ts` — preserved reusable OpenRouter integration
- `src/lib/safe-json.ts` — safe extraction for imperfect model JSON
- `src/pages/simulate/types.ts`, `src/pages/simulate/upgrades.ts` — simulation upgrade scaffolding (currently not wired into gameplay)
- `DESIGN.md` — visual system guidance

---

## 4) Routing map

Defined in `src/App.tsx`:

- `/` → landing hero
- `/setup` → AI product setup chat
- `/setup/costs` → fixed costs
- `/setup/variable-costs` → variable costs
- `/setup/pricing` and `/pricing` → pricing
- `/results` → AI business results
- `/simulate` → simulator setup
- `/simulate/game` → simulator gameplay
- `/simulate/gameover` → game-over report
- `/simulate/results` → successful simulation report

A floating **Setup Flow Assistant** renders globally but is visible only on `/setup*` routes.

---

## 5) Data model (global app state)

From `AppStateContext`:

### `productInfo`
- `productName`
- `productDescription`
- `targetCustomer`
- `specialFeature`
- `category`
- `currentChallenge` (improvement journey)
- `improvementGoal` (improvement journey)
- `inspiration` (new-product journey)

### `journeyMode`
- `create`
- `improve`

### `fixedCosts[]`
Each item:
- `name`
- `totalCost`
- `type`: `one-time` or `monthly`
- `monthsOfUse` (for one-time allocation)
- `category`: Equipment/Rent/Supplies/Packaging/Other

### `variableCosts[]`
Each item:
- `name`
- `pricePerPack`
- `unitsPerPack`
- `unitsPerProduct`
- `category`: Materials/Ingredients/Packaging/Labor/Other

### `pricing`
- `sellingPrice`
- `unitsPerMonth`

### `simConfig`
- `startingCash`
- `maxWeeklyUnits`
- `startingQuality`: Standard/Premium/Deluxe

---

## 6) Persistence keys

- App setup/pricing state:
  - `priceit_app_state_v1`
- Simulation in-progress snapshot:
  - `priceit_sim_game_v1`

If these keys are deleted, users lose saved progress for that area.

---

## 7) Core business math (app)

### Fixed monthly amount
- Monthly fixed item: use value directly
- One-time fixed item: spread over months of use

$$\text{fixedMonthly} = \begin{cases}
\text{totalCost} & \text{if monthly} \\
\frac{\text{totalCost}}{\text{monthsOfUse}} & \text{if one-time}
\end{cases}$$

### Variable cost per product input
$$\text{costPerInput} = \frac{\text{pricePerPack}}{\text{unitsPerPack}} \times \text{unitsPerProduct}$$

### Pricing page
- `totalMonthlyFixed = sum(fixedMonthly)`
- `totalVariablePerUnit = sum(costPerInput)`
- `fixedPerUnit = totalMonthlyFixed / unitsPerMonth`
- `costPerUnit = totalVariablePerUnit + fixedPerUnit`
- `profitPerUnit = sellingPrice - costPerUnit`
- `monthlyRevenue = sellingPrice * unitsPerMonth`
- `monthlyCosts = costPerUnit * unitsPerMonth`
- `monthlyProfit = monthlyRevenue - monthlyCosts`
- `marginPct = profitPerUnit / sellingPrice * 100`
- `breakEvenUnits = ceil(totalMonthlyFixed / profitPerUnit)` when profitable

---

## 8) End-user flow

### Step 1: Product setup (`/setup`)
- New-product setup first asks whether the user already has an idea or wants help creating one
- Users who need help share interests, audience, and product type; AI proposes ideas before gathering the final product details
- Users with an idea continue through name, problem, customer, differentiation, and inspiration questions
- Improvement setup retains its existing product, customer, challenge, and one-month goal questions
- On completion, AI returns structured `PRODUCT_COMPLETE` JSON
- App parses JSON and writes to `productInfo`

### Step 2: Fixed costs (`/setup/costs`)
- Add/edit/delete cost rows
- one-time or monthly mode
- one-time costs can be amortized over months with slider
- running monthly fixed total shown

### Step 3: Variable costs (`/setup/variable-costs`)
- Add material/ingredient inputs
- computes per-product variable cost
- running total variable cost per product shown

### Step 4: Pricing (`/setup/pricing`)
- user sets selling price and monthly unit estimate
- sliders + inputs
- live metrics for profit, margin, break-even, monthly totals

### Step 5: Results (`/results`)
- AI generates:
  - business rating (0–5 in 0.5 increments)
  - verdict text
  - 10 synthetic customer reviews
- charts show fixed vs variable costs and monthly revenue/cost/profit

### Step 6: Simulation setup (`/simulate`)
- choose starting cash, max weekly units, starting quality

### Step 7: Simulation gameplay (`/simulate/game`)
- 12-week run
- each week user chooses:
  - units to produce
  - selling price
  - quality
  - optional promotion/deal
- random + AI-generated weekly events modify demand/cost behavior
- weekly result updates cash, inventory, satisfaction
- ends in:
  - game over if cash <= 0
  - success after week 12

### Step 8: Simulation ending
- `/simulate/gameover` for failure summary + lessons
- `/simulate/results` for final grade, badges, takeaways

---

## 9) Simulation mechanics (important)

In `SimulateGamePage`:

- Total weeks: **12**
- Demand influenced by:
  - event modifier
  - price relative to original price
  - quality demand multiplier
  - satisfaction factor
  - promotion/deal multiplier
- Promotions:
  - none
  - tell friends (free)
  - posters (`$5`)
  - social post (`$10`)
  - deal mode:
    - bundle
    - dollar-off
    - free extra
- Week demand gets random variance (~`0.9` to `1.1`) before finalizing
- If projected production cost exceeds current cash, user can’t run the week
- Satisfaction updates from quality, stockouts/sell-through, and promotion

---

## 10) AI integrations and where they are used

All text-generation call sites use OpenRouter and fall back to built-in templates if the remote request fails.

### A) Setup conversation (`SetupPage`)
- Purpose: gather product details via a validated guided chat
- Uses a deterministic state machine so greetings and unrelated questions cannot become product fields
- Completion protocol: produces a validated `PRODUCT_COMPLETE` marker + JSON payload

### B) Results analysis (`ResultsPage`)
- Calls AI twice:
  1. business rating + verdict JSON
  2. 10 customer reviews JSON
- strict JSON extraction/parsing

### C) Weekly event generation (`SimulateGamePage`)
- each week requests one short event JSON
- fallback to local random events if request fails

### D) Floating setup assistant (`SetupFlowAssistant`)
- tool-call based mini-agent that can directly mutate app state
- supported actions:
  - add/update fixed costs
  - add/update variable costs
  - update selling price
  - update product-info fields
  - ask clarification
- includes validation + dedupe-by-name behavior

---

## 11) Environment variables

Optional:

- `VITE_AI_PROVIDER=openrouter|template` (defaults to `openrouter`)
- `VITE_WEBLLM_MODEL=Qwen2.5-0.5B-Instruct-q4f32_1-MLC`
- `VITE_OPENROUTER_API_KEY=...` (required only in OpenRouter mode)
- `VITE_OPENROUTER_MODEL=google/gemini-3.1-flash-lite`

The app completes its full flow without an API key. Devices without WebGPU automatically use built-in feedback.

---

## 12) Running the project

### Install
- `npm install`

### Development
- `npm run dev`

### Type-check + build
- `npm run build`

### Lint
- `npm run lint`

### Preview production build
- `npm run preview`

---

## 13) Styling and design system notes

- Tailwind utility-first styling + custom component CSS
- Main brand colors:
  - teal `#5DB7C4`
  - orange `#F36C3D`
- shared motion/feedback classes in `src/index.css`
  - fade-in, row-enter, agent highlight pulse, range slider styles
- Extended visual guidelines documented in `DESIGN.md`

---

## 14) Error handling behavior

`src/lib/ai-service-error.ts` maps API/network failures to kid-friendly UI messages:
- missing key
- auth failure
- model unavailable
- rate limited
- service unavailable
- timeout
- network error
- no response

Most AI calls use request timeouts and show retry paths.

---

## 15) Current limitations / known gaps

1. `src/pages/simulate/types.ts` and `src/pages/simulate/upgrades.ts` define richer upgrade/XP systems, but these are not currently integrated into the live simulation page.
2. Local model quality is intentionally modest to keep the download and device requirements smaller; strict JSON failures fall back to templates.
3. Route guarding is mostly done inside pages via redirects; no centralized guard layer.
4. No backend persistence (all state is browser-local).

---

## 16) Good next improvements

- Add backend save/auth so projects sync across devices
- Add export/import for business plans
- Add test coverage for pricing math + simulation engine
- Add analytics events for onboarding drop-off and sim decisions
- Add model fallback + retry/backoff for AI robustness
- Wire upgrade/XP system into simulation gameplay loop

---

## 17) Quick “new contributor” checklist

1. Copy `.env.example` to `.env`; no key is required for the default local provider
2. Run install + dev server
3. Read these files first:
   - `src/App.tsx`
   - `src/context/AppStateContext.tsx`
   - `src/pages/SetupPage.tsx`
   - `src/pages/PricingPage.tsx`
   - `src/pages/ResultsPage.tsx`
   - `src/pages/SimulateGamePage.tsx`
4. Keep business formulas consistent across pages (shared helper extraction is a good refactor)
5. Preserve kid-friendly copy tone in UX and prompts

---

## 18) TL;DR

PriceIt is a polished React + TypeScript educational business app where kids create a product idea, model costs/pricing, get AI feedback, and then run a 12-week simulation to learn entrepreneurship by doing.

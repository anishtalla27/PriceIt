# LaunchPad Project Guide

## 1) What this project is

**LaunchPad** is a kid-friendly business planning app (target age ~8–12) built with React + TypeScript.

The landing page offers two related journeys:
- **Create a new product** — turn a new idea into a cost, pricing, feedback, and action plan.
- **Improve a current product** — document the current product, identify its main challenge and improvement goal, then rebuild and test its economics.

Both journeys share the same financial engine while adapting onboarding questions, progress labels, page guidance, AI context, and results framing.

It helps a user:
1. Describe a product with AI
2. Enter fixed costs and variable costs
3. Set price + estimated monthly units
4. Explore pricing strategies in Pricing Lab
5. See profitability metrics and AI-generated feedback/reviews
6. Use the results to plan next steps

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
  - `PricingLabPage.tsx` — initial pricing lab with current-price analysis and quick test
  - `PricingStrategiesPage.tsx` — second lab screen for choosing a deeper pricing method
  - `PricingStrategyPage.tsx` — focused lessons for cost-plus, market-based, and value-based pricing
  - `ResultsPage.tsx` — AI rating/reviews + charts + action plan
- `src/components/ui/`
  - visual/interactive UI primitives and page shells
  - includes global assistant: `setup-flow-assistant.tsx`
- `src/lib/ai-service-error.ts` — normalized AI error handling
- `src/lib/ai-provider.ts` — unified OpenRouter/template provider routing
- `src/lib/ai-templates.ts` — no-AI fallbacks for every AI-powered flow
- `src/lib/openrouter-ai.ts` — preserved reusable OpenRouter integration
- `src/lib/safe-json.ts` — safe extraction for imperfect model JSON
- `DESIGN.md` — visual system guidance

---

## 4) Routing map

Defined in `src/App.tsx`:

- `/` → landing hero
- `/setup` → AI product setup chat
- `/setup/costs` → fixed costs
- `/setup/variable-costs` → variable costs
- `/setup/pricing` and `/pricing` → pricing
- `/setup/pricing-lab` and `/pricing-lab` → initial Pricing Lab
- `/setup/pricing-lab/strategies` and `/pricing-lab/strategies` → pricing method picker
- `/setup/pricing-lab/:strategy` and `/pricing-lab/:strategy` → focused pricing strategy lesson
- `/results` → AI business results

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

---

## 6) Persistence keys

- App setup/pricing state:
  - `priceit_app_state_v1`

If this key is deleted, users lose saved setup and pricing progress.

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

### Step 5: Pricing Lab (`/setup/pricing-lab`)
- first screen checks the current price, explains cost/profit/margin/break-even, and runs a quick price/sales experiment
- live current-pricing snapshot includes selling price, cost per product, profit per product, margin, monthly revenue, monthly profit, break-even, and fixed costs/month
- quick test shows monthly revenue, monthly profit, break-even, and profit-per-sale feedback
- second screen (`/setup/pricing-lab/strategies`) lets users choose a deeper pricing method
- focused strategy pages for:
  - cost-plus pricing (`/setup/pricing-lab/cost-plus`)
  - market-based pricing (`/setup/pricing-lab/market`)
  - value-based pricing (`/setup/pricing-lab/value`)
- each strategy page includes kid-friendly explanation, inputs, suggested price/range, and a button to save the tested price

### Step 6: Results (`/results`)
- AI generates:
  - business rating (0–5 in 0.5 increments)
  - verdict text
  - 10 synthetic customer reviews
- charts show fixed vs variable costs and monthly revenue/cost/profit

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

### C) Pricing Lab (`PricingLabPage`)
- Uses existing saved business data and deterministic rules to generate instant coaching
- No remote AI call is required for the lab, so slider experiments stay immediate
- Pricing method choice is split into `PricingStrategiesPage`
- Deeper strategy education is split into `PricingStrategyPage` routes to keep the initial lab screen focused

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
- `VITE_OPENROUTER_API_KEY=...` (required only in OpenRouter mode)
- `VITE_OPENROUTER_MODEL=google/gemini-3.1-flash-lite`

The app completes its full flow without an API key by using built-in template feedback.

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

1. Route guarding is mostly done inside pages via redirects; no centralized guard layer.
2. No backend persistence (all state is browser-local).

---

## 16) Good next improvements

- Add backend save/auth so projects sync across devices
- Add export/import for business plans
- Add test coverage for pricing math
- Extract shared pricing formulas for Pricing, Pricing Lab, and Results
- Add analytics events for onboarding drop-off
- Add model fallback + retry/backoff for AI robustness

---

## 17) Quick “new contributor” checklist

1. Copy `.env.example` to `.env`; no key is required for the default local provider
2. Run install + dev server
3. Read these files first:
   - `src/App.tsx`
   - `src/context/AppStateContext.tsx`
   - `src/pages/SetupPage.tsx`
   - `src/pages/PricingPage.tsx`
   - `src/pages/PricingLabPage.tsx`
   - `src/pages/PricingStrategiesPage.tsx`
   - `src/pages/PricingStrategyPage.tsx`
   - `src/pages/ResultsPage.tsx`
4. Keep business formulas consistent across pages (shared helper extraction is a good refactor)
5. Preserve kid-friendly copy tone in UX and prompts

---

## 18) TL;DR

LaunchPad is a polished React + TypeScript educational business app where kids create a product idea, model costs/pricing, get AI feedback, and leave with a simple business action plan.

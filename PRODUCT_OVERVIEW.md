# PriceIt Advisor — Experience Blueprint

## 1. Product Principles

| Principle | Details |
| --- | --- |
| **Purpose** | Help teams set fair, profitable, market-aligned prices through a transparent dashboard that unifies costs, market benchmarks, sentiment, and simulated outcomes. |
| **Audience** | Small business owners, product leads, pricing analysts who need explainable guidance they can share with finance and go-to-market partners. |
| **Core Value** | One narrative chain from “What is the product?” → “What should we charge?” → “What happens if we change it?”, reinforced by confidence and rationale at each step. |
| **Tone** | Advisory, brief, human. Uses plainer language (“Here’s why this range works”) and avoids heavy jargon. |
| **Design Language** | Card-based modules with a title, hero metric, short rationale, and a minimalist visual (sparkline, band, dial). Consistent spacing, clear hierarchy, color to signal confidence/risk. |
| **Accessibility** | High contrast palette, predictable navigation, descriptive labels/tooltips, conceptual keyboard focus order, explicit error messaging. |
| **Success Criteria** | 1) Users always see a recommended price range plus rationale. 2) Users can explore trade-offs (models, market, simulator). 3) Users can save/export a decision summary. |

---

## 2. Information Architecture

- **Persistent Elements**
  - Header with product selector, quick stats, confidence chip.
  - Sidebar (or collapsible panel) containing live inputs (positioning, cost totals, sentiment, elasticity).
  - Advisor shortcut accessible on every view.
- **Primary Sections (tabbed navigation, Dashboard default)**
  1. Dashboard Home (system snapshot)
  2. Pricing Models
  3. Market Playground
  4. Sales Simulator
  5. Insights & Advisor
  6. Review & Save
- **Key Relationships**
  - Inputs → Pricing Models → Recommendation.
  - Market positioning impacts Market Playground + simulator acceptance curves.
  - Confidence reflects completeness and data freshness from costs + market + sentiment.
  - Advisor riffs on the same data, linking back to cards for evidence.

---

## 3. Screens & Components

Each card lists structure, defaults, states, behaviors, and example copy.

### 3.1 Dashboard Home (responsive card grid)

| Card | Content | Default / States | Behaviors |
| --- | --- | --- | --- |
| **Executive Summary** | Title + paragraph + 3 bullets (“Market aligned at $129”, “Cost floor $78”, “Confidence High”). | Empty: prompt “Enter product basics to unlock summary.” Partial: dims unresolved bullets. Complete: shows narrative + link badges. | Click anywhere opens Advisor view; each bullet badge scrolls to relevant deep dive (models, market, simulator). |
| **Recommended Price Range** | Hero price + range + rationale snippet + banner (confidence level). | Hidden until cost + market inputs. Low confidence shows amber caution (“Needs market data”). High confidence uses green banner. | Hover reveals factor list (“Cost floor $78, Competitor median $126, Sentiment 4.3/5”). Click navigates to Pricing Models view. |
| **Confidence Indicator** | Level (Low/Med/High), progress bar, checklist (“Add competitor anchors”, “Update elasticity”). | Default Low with checklist. Completion ticks items. | Checklist items are tappable links to required inputs. |
| **Cost Foundation** | Materials/Labor/Overhead totals + calculated floor badge. | Placeholder amounts + CTA “Add totals”. | Clicking opens Product Basics/Cost entry panel. |
| **Market Price** | Competitor band with low/mid/high anchors, median, positioning tag. | Empty state: “Pick market + positioning to see band.” | Click opens Market Playground. |
| **Pricing Models** | Mini table (Cost-plus, Market-aligned, Value-based) with price + 1-line rationale. | Disabled rows until required inputs; show “Data needed” tags. | Click opens full Pricing Models comparison. |
| **Results Graph** | Simple price vs. expected revenue/acceptance graph with optimal zone highlight. | Hidden until Sales Simulator run; shows prompt. | Click opens Sales Simulator view. |
| **Advisor Highlights** | 2–3 insights (“Price slightly above median; emphasize premium value.”). | Shows high-level prompts to open Advisor if data thin. | Click opens Insights & Advisor view. |
| **Notes & Save** | Chosen price, notes textarea, save timestamp recap. | Prompt to record decision; shows history snippet if saved. | Save button jumps to Review & Save. |

### 3.2 Pricing Models View

- **Header**: Product name, positioning tag, confidence chip.
- **Model Comparison Strip**: Cards for Cost-plus, Market-aligned, Value-based (and optional Custom). Each shows Suggested Price, min/target/max, short reason. Missing inputs show “Data needed” tags.
- **Recommendation Panel**: Hero range, 3 rationale bullets, sensitivity callout (“Driven by cost floor + competitor median”). Buttons: “See demand curve” (opens Simulator), “Adjust positioning” (opens Market).
- **Rationale Details**: Factors list referencing cost floor, competitor medians, perceived value proof points. Include micro visualization (range bars with recommended zone overlay).
- **Interactions**: Selecting a model highlights it on Dashboard card; editing inputs reflows values instantly.

### 3.3 Market Playground View

- **Header**: Product basics summary, positioning selector (Budget/Mid/Premium/Niche) with info tooltip.
- **Competitor Band**: Horizontal band chart showing low/mid/high anchors, your marker, and recommended sweet spot. If data missing, placeholder band with “Add at least two competitor anchors.”
- **Positioning Impact**: Copy block describing effect (“Premium shifts perceived value +8%, enabling top-of-band pricing.”).
- **Market Notes**: Freeform area for context (seasonality, promos). Save retains text per product.
- **Interactions**: Changing positioning updates band + sends toast (“Positioning updated → Models recalculated”). Also triggers recalculations in Pricing Models and Sales Simulator.

### 3.4 Sales Simulator View

- **Header**: Selected price + quick nudge buttons (-$10, +$10) and presets (Budget, Baseline, Premium).
- **Customer Response Narrative**: Labels for Acceptance/Hesitation/Rejection, each with short rationale (“Price exceeds perceived value for mid-market buyers.”).
- **Projected Outcomes**: Revenue + volume at current price, mini chart with optimal zone marker.
- **Scenario Explorer**: Cards comparing baseline vs. preset scenarios with quick stats.
- **Interactions**: Price slider updates narrative and outcomes immediately; warning if slider dips below cost floor (“Price under cost basis; adjust.”).

### 3.5 Insights & Advisor View

- **Header**: Confidence level + main recommendation sentence.
- **Key Takeaways**: 3 bullets covering cost, market, sentiment.
- **Risks & Watchouts**: 2–3 bullets calling out thin data or external threats.
- **Action Plan**: Ordered steps linking back to relevant cards (“Validate cost inputs” → Cost Foundation; “Confirm positioning with 2 competitors” → Market Playground; “Launch at $129” → Review & Save).
- **Interactions**: Each bullet clickable to open evidence cards; ability to copy plan or export summary.

### 3.6 Review & Save View

- **Header**: Selected price + date/time + editable confidence note.
- **Decision Summary**: Paragraph covering cost basis, market alignment, expected outcome.
- **Notes**: Text area showing last edited metadata.
- **Saved Records**: List/table of prior decisions (price, confidence, rationale snippet).
- **Export Panel**: Checkboxes for including Executive Summary, Market Evidence, Simulator Snapshot; download/share actions.
- **Interactions**: Save button validates required fields; success toast with link to export; empty history shows “No saved decisions yet.”

---

## 4. Inputs & Editing (Conceptual)

- **Product Basics**: Name, category, positioning intent (Budget/Mid/Premium/Niche), attribute tags.
- **Cost Totals**: Materials, labor, overhead. Validation ensures each >0 before calculating cost floor.
- **Market Data**: Competitor low/mid/high anchors, median, optional manual notes. Positioning selector applies deltas to models and simulator.
- **Sentiment & Confidence Inputs**: Average review score, data freshness timestamp, manual confidence override.
- **Simulator Controls**: Slider/presets for price, toggles for promotion/bundle scenarios.

---

## 5. States & Error Handling

- **Empty State**: Cards show prompts/checklists (“Add costs to unlock recommendation”).
- **Partial State**: Muted visuals + “Data needed” chips; low confidence banner.
- **Complete State**: Full visuals, range badge, Advisor insights.
- **Low Confidence**: Amber banner + checklist (“Need market anchors”, “Update sentiment”). Confidence card also surfaces missing items.
- **High Confidence**: Green banner text (“Inputs complete and consistent”).
- **Validation Messaging**: Friendly, specific (“Cost floor needs materials + labor + overhead totals.”).
- **Conflicts**: Price below cost floor -> red warning inline + link to cost card.
- **Unavailable Market Data**: Placeholder band with note to add competitor anchors; Market Playground shows disabled scatter until data exists.

---

## 6. Copy & Microcopy Examples

- **Executive Summary**: “Recommended launch at $129 (range $115–$139). Aligns with competitor median and cost floor; supports mid-market positioning with high confidence.”
- **Confidence Banner**: “Confidence: High — inputs complete and consistent.”
- **Prompts**: “Add your cost totals to unlock a recommendation.”
- **Simulator Narrative**: “At $139, some hesitation expected; consider Premium positioning to sustain perceived value.”
- **Warnings**: “Price under cost basis; adjust or revisit costs.”

---

## 7. Data Semantics & Relationships

- **Entities**: Product, Costs (materials/labor/overhead), Market (competitor band + positioning), Models (Cost-plus, Market-aligned, Value-based), Recommendation, Confidence, Simulation, Saved Decision.
- **Relationships**: Product ties to Costs + Market inputs. Models consume those inputs to produce Recommendation. Simulator uses Recommendation + Market elasticity. Confidence reflects completeness of data across entities. Saved Decisions store Recommendation + Notes.

---

## 8. Scenarios & Presets

| Scenario | Description | Effect |
| --- | --- | --- |
| **Baseline** | Mid-market item, competitor band $110–$140, positioning Mid. | Recommendation near $126–$134, medium confidence. |
| **Premium** | Higher perceived value, strong sentiment. | Range nudges to top of band ($135–$149); simulator warns about volume trade-offs. |
| **Budget** | Lower positioning, thin sentiment. | Range narrows near cost floor with margin caution; confidence medium-low. |
| **Stress Test** | Missing market data. | Recommendation leans on cost foundation, prompts user to add competitor anchors before saving. |

---

## 9. Metrics & Outputs

- **Recommended Price Range**: Primary price + bounds + contextual badge (confidence level, factors).
- **Decision Rationale**: Short paragraph + bullets summarizing cost, market, expected outcome.
- **Confidence Indicator**: Level, progress bar, checklist completion.
- **Projected Outcomes**: Revenue/volume estimate and acceptance likelihood per selected price.
- **Saved Decisions**: Table with price, confidence, rationale snippet, timestamp.
- **Export Deliverables**: PDF/share link containing Executive Summary, Market Evidence, Simulator snapshot, Notes.

---

## 10. Next Steps

1. Validate this blueprint with target users; capture any missing copy/states.
2. Produce wireframes/storyboard per screen (numbered frames with example content).
3. Create a content pack (labels, sample values, advisor scripts) to accelerate UI build.
4. Instrument prototype to capture key success metrics (range viewed, simulator used, decision saved).

_Need a deeper storyboard or content pack? I can break each screen into numbered frames with exact labels and sample copy to make replication push-button._ 

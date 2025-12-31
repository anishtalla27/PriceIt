const positioningPremiums = {
  budget: -12,
  balanced: 0,
  premium: 18,
  niche: 10,
};

const positioningImpactCopy = {
  budget: "Budget positioning narrows your ceiling; rely on cost discipline and promotions.",
  balanced: "Balanced positioning keeps you near market median, with flexibility to nudge either way.",
  premium: "Premium positioning boosts perceived value by ~8% and defends top-of-band pricing.",
  niche: "Niche positioning benefits from differentiation but watch market awareness.",
};

const marketSignalsData = {
  premium: [
    { title: "Remote studios +12% QoQ", detail: "Raises the ceiling by ~$18 for premium kits." },
    { title: "FocusPro rumor", detail: "Possible drop next month; keep $15 buffer." },
  ],
  balanced: [
    { title: "Procurement tightening", detail: "Mid-market buyers cap spend near $360." },
    { title: "Availability", detail: "Ship time beats peers by 1.3 weeks—message this." },
  ],
  budget: [
    { title: "New entrant @ $299", detail: "Undercuts by 20%; highlight warranty value." },
    { title: "Promo season", detail: "Expect coupons—plan bundle guardrails." },
  ],
  niche: [
    { title: "Design blogs highlight color accuracy", detail: "Support willingness to pay among boutique studios." },
    { title: "Awareness gap", detail: "Need two more reference customers to justify price premium." },
  ],
};

const scenarioPresets = [
  { label: "Budget Guardrail", delta: -20 },
  { label: "Recommendation", delta: 0 },
  { label: "Premium Push", delta: 20 },
];

const tabs = document.querySelectorAll(".tab");
const screens = document.querySelectorAll(".screen");
const navCards = document.querySelectorAll("[data-nav-target]");

const positioningSelect = document.getElementById("positioningSelect");
const elasticityInput = document.getElementById("elasticityInput");
const sentimentInput = document.getElementById("sentimentInput");
const materialsInput = document.getElementById("materialsInput");
const laborInput = document.getElementById("laborInput");
const overheadInput = document.getElementById("overheadInput");
const marketLowInput = document.getElementById("marketLowInput");
const marketMedianInput = document.getElementById("marketMedianInput");
const marketHighInput = document.getElementById("marketHighInput");
const marketToggle = document.getElementById("marketToggle");
const refreshButton = document.getElementById("refreshInsights");
const priceSlider = document.getElementById("priceSlider");
const priceValue = document.getElementById("priceValue");
const chipButtons = document.querySelectorAll(".chip[data-adjust]");
const nudgeButtons = document.querySelectorAll(".chip[data-nudge]");
const scenarioList = document.getElementById("scenarioList");
const notesField = document.getElementById("notesField");
const notesCardButton = document.querySelector("#notesCard button");
const saveDecision = document.getElementById("saveDecision");
const toast = document.getElementById("toast");
const advisorTakeaways = document.getElementById("advisorTakeaways");
const advisorRisks = document.getElementById("advisorRisks");
const advisorPlan = document.getElementById("advisorPlan");
const advisorHighlights = document.getElementById("advisorHighlights");
const summaryText = document.getElementById("summaryText");
const summaryBullets = document.getElementById("summaryBullets");
const summaryBadge = document.getElementById("summaryBadge");
const rangeConfidence = document.getElementById("rangeConfidence");
const rangePrimary = document.getElementById("rangePrimary");
const rangeBounds = document.getElementById("rangeBounds");
const rangeRationale = document.getElementById("rangeRationale");
const rangeFactors = document.getElementById("rangeFactors");
const confidenceLevel = document.getElementById("confidenceLevel");
const confidenceBar = document.getElementById("confidenceBar");
const confidenceChecklist = document.getElementById("confidenceChecklist");
const costStatus = document.getElementById("costStatus");
const costBreakdownList = document.getElementById("costBreakdownList");
const costFloorLabel = document.getElementById("costFloorLabel");
const marketStatus = document.getElementById("marketStatus");
const marketMedianLabel = document.getElementById("marketMedianLabel");
const marketBandLabel = document.getElementById("marketBandLabel");
const bandLow = document.getElementById("bandLow");
const bandMid = document.getElementById("bandMid");
const bandHigh = document.getElementById("bandHigh");
const marketPositioning = document.getElementById("marketPositioning");
const marketBandCopy = document.getElementById("marketBandCopy");
const marketLowCopy = document.getElementById("marketLowCopy");
const marketMedianCopy = document.getElementById("marketMedianCopy");
const marketHighCopy = document.getElementById("marketHighCopy");
const positioningImpact = document.getElementById("positioningImpact");
const modelsStatus = document.getElementById("modelsStatus");
const modelsSummary = document.getElementById("modelsSummary");
const modelsTableBody = document.getElementById("modelsTableBody");
const rangeDisplays = document.querySelectorAll(".range-pill strong");
const modelsRangeSlider = document.getElementById("rangeSelector");
const resultsStatus = document.getElementById("resultsStatus");
const resultsBand = document.getElementById("resultsBand");
const resultsCopy = document.getElementById("resultsCopy");
const resultsCanvas = document.getElementById("resultsCanvas");
const resultsCtx = resultsCanvas.getContext("2d");
const simulatorCanvas = document.getElementById("simulatorChart");
const simulatorCtx = simulatorCanvas.getContext("2d");
const responseNarrative = document.getElementById("responseNarrative");
const acceptanceStat = document.getElementById("acceptanceStat");
const hesitationStat = document.getElementById("hesitationStat");
const rejectionStat = document.getElementById("rejectionStat");
const volumeStat = document.getElementById("volumeStat");
const recordsList = document.getElementById("recordsList");
const notesStatus = document.getElementById("notesStatus");
const notesPreview = document.getElementById("notesPreview");
const marketNotesField = document.getElementById("marketNotesField");
const youMarker = document.getElementById("youMarker");
const chosenPrice = document.getElementById("chosenPrice");
const reviewConfidence = document.getElementById("reviewConfidence");

const state = {
  productName: "Studio Display Pro",
  positioning: positioningSelect.value,
  elasticity: parseFloat(elasticityInput.value) || -1.2,
  sentiment: parseFloat(sentimentInput.value) || 0,
  costs: {
    materials: parseFloat(materialsInput.value) || 0,
    labor: parseFloat(laborInput.value) || 0,
    overhead: parseFloat(overheadInput.value) || 0,
  },
  market: {
    low: parseFloat(marketLowInput.value) || 0,
    median: parseFloat(marketMedianInput.value) || 0,
    high: parseFloat(marketHighInput.value) || 0,
  },
  marketNotes: "",
  savedDecisions: [],
  simulatorAdjustment: 0,
  sliderPrice: Number(priceSlider.value) || 0,
  baseRecommendation: null,
  manualRecommendation: null,
};

function parseNumber(input) {
  return parseFloat(input) || 0;
}

function updateStateFromInputs() {
  state.positioning = positioningSelect.value;
  state.elasticity = parseNumber(elasticityInput.value);
  state.sentiment = parseNumber(sentimentInput.value);
  state.costs = {
    materials: parseNumber(materialsInput.value),
    labor: parseNumber(laborInput.value),
    overhead: parseNumber(overheadInput.value),
  };
  state.market = {
    low: parseNumber(marketLowInput.value),
    median: parseNumber(marketMedianInput.value),
    high: parseNumber(marketHighInput.value),
  };
}

function hasCostData() {
  return state.costs.materials > 0 && state.costs.labor > 0 && state.costs.overhead > 0;
}

function hasMarketData() {
  return state.market.low > 0 && state.market.median > 0 && state.market.high > 0;
}

function getCostFloor() {
  if (!hasCostData()) return 0;
  return state.costs.materials + state.costs.labor + state.costs.overhead;
}

function computeRecommendation() {
  const hasCosts = hasCostData();
  const hasMarket = hasMarketData();
  if (!hasCosts && !hasMarket) return null;

  const costFloor = getCostFloor();
  const baseCostPlus = hasCosts ? costFloor * 1.18 : 0;
  const marketMedian = hasMarket ? state.market.median : baseCostPlus;

  let price = hasCosts && hasMarket ? baseCostPlus * 0.45 + marketMedian * 0.55 : hasCosts ? baseCostPlus : marketMedian;

  const positioningDelta = positioningPremiums[state.positioning] || 0;
  const sentimentLift = (state.sentiment - 4) * 8;
  const elasticityDrag = (Math.abs(state.elasticity || 1) - 1) * 6;

  price += positioningDelta + sentimentLift - elasticityDrag;
  if (hasCosts) {
    price = Math.max(price, costFloor + 5);
  }

  const span = hasMarket
    ? Math.max(8, Math.round((state.market.high - state.market.low) * 0.2))
    : Math.max(8, Math.round(price * 0.05));

  const low = hasCosts ? Math.max(costFloor, Math.round(price - span)) : Math.round(price - span);
  const high = Math.round(price + span);

  return {
    mid: Math.round(price),
    low,
    high,
    source: hasMarket && hasCosts ? "cost + market" : hasCosts ? "cost foundation" : "market anchors",
    costFloor,
    marketMedian,
  };
}

function getActiveRecommendation() {
  if (!state.baseRecommendation) return null;
  if (state.manualRecommendation === null) return state.baseRecommendation;
  const rec = { ...state.baseRecommendation };
  const delta = state.manualRecommendation - state.baseRecommendation.mid;
  rec.mid = state.manualRecommendation;
  rec.low = Math.max(rec.costFloor || rec.low, Math.round(rec.low + delta));
  rec.high = Math.round(rec.high + delta);
  rec.source = "manual override";
  return rec;
}

function getConfidenceInfo() {
  let score = 0;
  const missing = [];
  if (hasCostData()) score += 0.35;
  else missing.push("Add cost totals");

  if (hasMarketData()) score += 0.35;
  else missing.push("Add competitor anchors");

  if (state.sentiment > 0) score += 0.15;
  else missing.push("Provide sentiment score");

  if (state.elasticity !== 0) score += 0.15;
  else missing.push("Estimate elasticity");

  let level = "Low";
  if (score >= 0.75) level = "High";
  else if (score >= 0.45) level = "Medium";

  return { score, level, missing };
}

function updateSummary(rec, confidence) {
  if (!rec) {
    summaryText.textContent = "Enter product basics, costs, and competitor anchors to unlock a recommendation.";
    summaryBullets.innerHTML = "";
    summaryBadge.textContent = "Draft";
    summaryBadge.className = "status-badge info";
    return;
  }

  const diff = rec.marketMedian ? rec.mid - rec.marketMedian : 0;
  summaryText.textContent = `Recommended launch at $${rec.mid} (range $${rec.low}–$${rec.high}).`;
  summaryBullets.innerHTML = `
    <li>Cost floor $${rec.costFloor || "—"} with contribution intact.</li>
    <li>${rec.marketMedian ? `Sits ${diff >= 0 ? "+" : ""}${diff} vs. competitor median.` : "Anchored to cost foundation."}</li>
    <li>Confidence: ${confidence.level}.</li>
  `;
  summaryBadge.textContent = `${confidence.level} confidence`;
  summaryBadge.className = `status-badge ${confidence.level === "High" ? "good" : confidence.level === "Medium" ? "info" : "warn"}`;
}

function updateRangeCard(rec, confidence) {
  const confidenceClass = confidence.level === "High" ? "good" : confidence.level === "Medium" ? "info" : "warn";
  rangeConfidence.className = `status-badge ${confidenceClass}`;
  rangeConfidence.textContent = `Confidence: ${confidence.level}`;

  if (!rec) {
    rangePrimary.textContent = "$—";
    rangeBounds.textContent = "Need cost + market inputs";
    rangeRationale.textContent = "Provide foundational inputs to unlock a recommended range.";
    rangeFactors.innerHTML = "";
    rangeDisplays.forEach((node) => (node.textContent = "$—"));
    resultsBand.textContent = "Run simulator";
    return;
  }

  rangePrimary.textContent = `$${rec.mid}`;
  const boundsText = `$${rec.low} – $${rec.high}`;
  rangeBounds.textContent = boundsText;
  rangeDisplays.forEach((node) => (node.textContent = boundsText));
  resultsBand.textContent = boundsText;
  rangeRationale.textContent =
    rec.source === "manual override"
      ? "Manual override applied. Ensure stakeholders review rationale."
      : rec.source === "cost + market"
      ? "Balances cost foundation with current competitor band."
      : rec.source === "cost foundation"
      ? "Anchored to cost floor with margin guardrails."
      : "Anchored to market band with positioning adjustments.";

  const factors = [
    rec.costFloor ? `Cost floor $${rec.costFloor}` : null,
    rec.marketMedian ? `Competitor median $${rec.marketMedian}` : null,
    state.sentiment ? `Sentiment ${state.sentiment.toFixed(1)}/5` : null,
    `Positioning ${state.positioning}`,
  ].filter(Boolean);
  rangeFactors.innerHTML = factors.map((factor) => `<li>${factor}</li>`).join("");
}

function updateConfidenceCard(confidence) {
  confidenceLevel.textContent = confidence.level;
  confidenceBar.style.width = `${Math.round(confidence.score * 100)}%`;
  if (!confidence.missing.length) {
    confidenceChecklist.innerHTML = `<li>Inputs complete and consistent.</li>`;
  } else {
    confidenceChecklist.innerHTML = confidence.missing.map((item) => `<li>${item}</li>`).join("");
  }
}

function updateCostCard(rec) {
  const entries = [
    { label: "Materials", value: state.costs.materials },
    { label: "Labor", value: state.costs.labor },
    { label: "Overhead", value: state.costs.overhead },
  ];
  costBreakdownList.innerHTML = entries
    .map(
      (entry) => `
      <div>
        <dt>${entry.label}</dt>
        <dd>${entry.value ? `$${entry.value}` : "—"}</dd>
      </div>`
    )
    .join("");
  if (hasCostData()) {
    costStatus.textContent = "Ready";
    costStatus.className = "status-pill";
    costFloorLabel.textContent = `Cost floor: $${getCostFloor()}`;
  } else {
    costStatus.textContent = "Missing";
    costStatus.className = "status-pill";
    costFloorLabel.textContent = "Add materials, labor, and overhead totals.";
  }
}

function updateMarketCard(rec) {
  if (hasMarketData()) {
    marketStatus.className = "status-pill";
    marketStatus.textContent = "Ready";
    marketMedianLabel.textContent = `$${state.market.median}`;
    marketBandLabel.textContent = `Band $${state.market.low} – $${state.market.high}`;
    bandLow.textContent = `$${state.market.low}`;
    bandMid.textContent = `$${state.market.median}`;
    bandHigh.textContent = `$${state.market.high}`;
    marketPositioning.textContent = `Positioning: ${state.positioning}`;
    marketBandCopy.textContent = `Anchored by ${state.market.low} (low), ${state.market.median} (median), ${state.market.high} (high).`;
    marketLowCopy.textContent = `$${state.market.low}`;
    marketMedianCopy.textContent = `$${state.market.median}`;
    marketHighCopy.textContent = `$${state.market.high}`;
  } else {
    marketStatus.className = "status-pill";
    marketStatus.textContent = "Need data";
    marketMedianLabel.textContent = "$—";
    marketBandLabel.textContent = "Add competitor anchors.";
    bandLow.textContent = "$—";
    bandMid.textContent = "$—";
    bandHigh.textContent = "$—";
    marketBandCopy.textContent = "Need at least two anchors to plot the band.";
    marketPositioning.textContent = `Positioning: ${state.positioning}`;
  }
  positioningImpact.textContent = positioningImpactCopy[state.positioning];

  const bandWidth = Math.max(1, state.market.high - state.market.low);
  const chartWidthPercent = hasMarketData() ? ((rec?.mid || state.market.median) - state.market.low) / bandWidth : 0.5;
  const clampedX = Math.min(90, Math.max(10, chartWidthPercent * 100));
  const positioningLift = { budget: 65, balanced: 75, premium: 90, niche: 80 }[state.positioning] || 70;
  youMarker.style.setProperty("--x", clampedX);
  youMarker.style.setProperty("--y", positioningLift);
  youMarker.querySelector("span").textContent = rec ? `You @ $${rec.mid}` : "Add inputs";
}

function buildModelRows(rec, confidence) {
  const costFloor = getCostFloor();
  const rows = [
    {
      name: "Cost-plus",
      price: hasCostData() ? Math.round(costFloor * 1.18) : null,
      rationale: hasCostData() ? "Covers raw + labor with 18% margin." : "Needs cost floor.",
      readiness: hasCostData(),
    },
    {
      name: "Market-aligned",
      price: hasMarketData() ? Math.round(state.market.median + (positioningPremiums[state.positioning] || 0)) : null,
      rationale: hasMarketData() ? "Sits near competitor median adjusted for positioning." : "Need competitor band.",
      readiness: hasMarketData(),
    },
    {
      name: "Value-based",
      price: rec ? rec.mid : null,
      rationale: rec ? "Blends ROI story with sentiment lift." : "Add inputs to model perceived value.",
      readiness: Boolean(rec),
    },
  ];

  return rows.map((row) => ({
    ...row,
    confidence: row.readiness ? Math.max(0.5, confidence.score) : 0.2,
  }));
}

function renderModelsTable(rec, confidence) {
  const rows = buildModelRows(rec, confidence);
  modelsSummary.innerHTML = rows
    .map(
      (row) => `
      <div class="model-row">
        <span>${row.name}</span>
        <strong>${row.price ? `$${row.price}` : "—"}</strong>
      </div>`
    )
    .join("");

  const tableBody = document.getElementById("modelsTableBody");
  tableBody.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td>${row.name}</td>
        <td>${row.rationale}</td>
        <td>${row.price ? `$${row.price}` : "Data needed"}</td>
        <td>${row.readiness ? "Inputs satisfied" : "Awaiting data"}</td>
        <td>
          <div class="confidence-bar">
            <span style="width:${Math.round(row.confidence * 100)}%"></span>
          </div>
          ${Math.round(row.confidence * 100)}%
        </td>
      </tr>`
    )
    .join("");

  const readyCount = rows.filter((row) => row.readiness).length;
  modelsStatus.textContent = readyCount === rows.length ? "Ready" : "Awaiting inputs";
}

function drawResultsPreview(rec) {
  resultsCtx.clearRect(0, 0, resultsCanvas.width, resultsCanvas.height);
  if (!rec) {
    resultsStatus.textContent = "Simulator";
    resultsCopy.textContent = "Run the sales simulator to plot revenue vs. price.";
    return;
  }
  const width = resultsCanvas.width;
  const height = resultsCanvas.height;
  resultsCtx.strokeStyle = "rgba(255,255,255,0.1)";
  resultsCtx.beginPath();
  resultsCtx.moveTo(0, height - 10);
  resultsCtx.lineTo(width, height - 10);
  resultsCtx.stroke();

  resultsCtx.beginPath();
  const span = rec.high - rec.low;
  for (let i = 0; i <= 40; i++) {
    const price = rec.low + (span * i) / 40;
    const normalized = (price - rec.mid) / Math.max(1, span / 2);
    const y = height - 20 - (1 - normalized ** 2) * (height - 40);
    const x = (i / 40) * width;
    if (i === 0) resultsCtx.moveTo(x, y);
    else resultsCtx.lineTo(x, y);
  }
  resultsCtx.strokeStyle = "#9EF0FF";
  resultsCtx.lineWidth = 2;
  resultsCtx.stroke();

  resultsCopy.textContent = `Revenue peaks near $${rec.mid}; explore +/- adjustments in the simulator.`;
  resultsStatus.textContent = "Ready";
}

function computeStats(price, adjustment = state.simulatorAdjustment) {
  const rec = getActiveRecommendation();
  const anchor = rec ? rec.mid : price;
  const spread = rec ? Math.max(10, rec.high - rec.low) : 40;
  const normalized = (price - anchor) / spread;
  const elasticity = Math.abs(state.elasticity || 1.1);
  const sentiment = state.sentiment || 4;

  let acceptance = 0.72 - normalized * 0.28 * elasticity + (sentiment - 4) * 0.05 + adjustment * 0.4;
  acceptance = Math.min(0.9, Math.max(0.25, acceptance));

  let hesitation = 0.15 + Math.abs(normalized) * 0.2;
  hesitation = Math.min(0.4, hesitation);

  let rejection = 1 - acceptance - hesitation;
  rejection = Math.max(0.05, Math.min(0.6, rejection));

  const total = acceptance + hesitation + rejection;
  acceptance /= total;
  hesitation /= total;
  rejection /= total;

  const baseVolume = 3200;
  const volume = Math.max(600, baseVolume - normalized * 400 - rejection * 500 + adjustment * 200);
  const revenue = (price * acceptance * volume) / 1_000_000;

  return { acceptance, hesitation, rejection, revenue, volume };
}

function drawSimulatorSeries() {
  simulatorCtx.clearRect(0, 0, simulatorCanvas.width, simulatorCanvas.height);
  const rec = getActiveRecommendation();
  const min = parseInt(priceSlider.min, 10);
  const max = parseInt(priceSlider.max, 10);
  const steps = Math.max(1, Math.floor((max - min) / 10));
  const points = [];
  for (let price = min; price <= max; price += steps) {
    const stats = computeStats(price);
    points.push({ price, revenue: stats.revenue });
  }

  const maxRevenue = Math.max(...points.map((p) => p.revenue), 0.1);
  simulatorCtx.strokeStyle = "#9EF0FF";
  simulatorCtx.lineWidth = 2;
  simulatorCtx.beginPath();
  points.forEach((point, index) => {
    const x = ((point.price - min) / (max - min)) * simulatorCanvas.width;
    const y = simulatorCanvas.height - (point.revenue / maxRevenue) * (simulatorCanvas.height - 30) - 10;
    if (index === 0) simulatorCtx.moveTo(x, y);
    else simulatorCtx.lineTo(x, y);
  });
  simulatorCtx.stroke();

  if (rec) {
    simulatorCtx.fillStyle = "rgba(48, 209, 88, 0.15)";
    const lowX = ((rec.low - min) / (max - min)) * simulatorCanvas.width;
    const highX = ((rec.high - min) / (max - min)) * simulatorCanvas.width;
    simulatorCtx.fillRect(lowX, 10, highX - lowX, simulatorCanvas.height - 20);
  }
}

function updateSimulator(price = state.sliderPrice) {
  const rec = getActiveRecommendation();
  const min = parseInt(priceSlider.min, 10);
  const max = parseInt(priceSlider.max, 10);
  state.sliderPrice = Math.max(min, Math.min(max, price));
  priceSlider.value = state.sliderPrice;
  priceValue.textContent = `$${state.sliderPrice}`;
  chosenPrice.textContent = `$${state.sliderPrice}`;

  const stats = computeStats(state.sliderPrice);
  acceptanceStat.textContent = `${Math.round(stats.acceptance * 100)}%`;
  hesitationStat.textContent = `${Math.round(stats.hesitation * 100)}%`;
  rejectionStat.textContent = `${Math.round(stats.rejection * 100)}%`;
  volumeStat.textContent = `${Math.round(stats.volume)}`;

  const narrative =
    !rec
      ? "Enter foundational inputs to narrate customer response."
      : state.sliderPrice > rec.high
      ? `At $${state.sliderPrice}, expect hesitation as price exceeds the optimal band. Highlight premium differentiators.`
      : state.sliderPrice < rec.low
      ? `At $${state.sliderPrice}, acceptance rises but margin thins. Use volume guardrails.`
      : `At $${state.sliderPrice}, adoption looks balanced with revenue near peak. Reinforce ROI narrative.`;
  responseNarrative.textContent = narrative;

  const scenarios = scenarioPresets.map((preset) => {
    const target = rec ? Math.max(parseInt(priceSlider.min, 10), Math.min(parseInt(priceSlider.max, 10), rec.mid + preset.delta)) : state.sliderPrice;
    const scenarioStats = computeStats(target);
    return `
      <div class="scenario-card">
        <strong>${preset.label}</strong>
        <p class="muted">$${target}</p>
        <small>${Math.round(scenarioStats.acceptance * 100)}% accept • Revenue $${scenarioStats.revenue.toFixed(2)}M</small>
      </div>`;
  });
  scenarioList.innerHTML = scenarios.join("");
  reviewConfidence.textContent = `Confidence: ${getConfidenceInfo().level} • Notes auto-attached.`;

  drawSimulatorSeries();
}

function updateAdvisor(rec, confidence) {
  const takeaways = [];
  if (rec) {
    takeaways.push(`Cost floor $${rec.costFloor || "—"} with guardrails at $${rec.low}–$${rec.high}.`);
    if (rec.marketMedian) {
      const diff = rec.mid - rec.marketMedian;
      takeaways.push(`Recommended price ${diff >= 0 ? "+" : ""}${diff} vs. competitor median.`);
    }
    takeaways.push(`Confidence ${confidence.level}.`);
  } else {
    takeaways.push("Add foundational inputs to unlock a recommendation.");
  }

  advisorTakeaways.innerHTML = takeaways.map((item) => `<li>${item}</li>`).join("");

  const risks = [];
  if (!hasMarketData()) risks.push("Source data thin for competitor band. Add two anchors.");
  if (!hasCostData()) risks.push("Cost foundation incomplete; update materials/labor/overhead.");
  if (state.sentiment < 4) risks.push("Sentiment modest; validate willingness to pay.");
  advisorRisks.innerHTML = risks.length ? risks.map((item) => `<li>${item}</li>`).join("") : "<li>No major risks flagged.</li>";

  const plan = [
    "Validate cost inputs",
    "Confirm positioning with 2 competitors",
    rec ? `Launch at $${rec.mid} with ${confidence.level.toLowerCase()} confidence` : "Add inputs to set launch price",
  ];
  advisorPlan.innerHTML = plan.map((step) => `<li>${step}</li>`).join("");

  advisorHighlights.innerHTML = takeaways.slice(0, 3).map((item) => `<li>${item}</li>`).join("");
}

function updateNotesPreview() {
  const note = notesField.value.trim();
  if (note) {
    notesPreview.textContent = note.length > 90 ? `${note.slice(0, 90)}…` : note;
    notesStatus.textContent = "In progress";
  } else if (state.savedDecisions.length) {
    const last = state.savedDecisions[0];
    notesPreview.textContent = `Last saved: $${last.price} • ${last.confidence} confidence.`;
    notesStatus.textContent = "Saved";
  } else {
    notesPreview.textContent = "Record a rationale before sharing.";
    notesStatus.textContent = "Waiting";
  }
}

function updateRecordsList() {
  if (!state.savedDecisions.length) {
    recordsList.innerHTML = "<li>No saved decisions yet.</li>";
    return;
  }
  recordsList.innerHTML = state.savedDecisions
    .map(
      (record) => `
      <li>
        <strong>$${record.price}</strong> • ${record.confidence} confidence<br />
        <span>${record.rationale}</span>
      </li>`
    )
    .join("");
}

function renderMarketSignals(view = state.positioning) {
  const entries = marketSignalsData[view] || [];
  const container = document.getElementById("marketSignals");
  container.innerHTML = entries
    .map(
      (entry) => `
      <article class="signal-card">
        <strong>${entry.title}</strong>
        <p class="muted">${entry.detail}</p>
      </article>`
    )
    .join("");
}

function syncSliders(rec) {
  const fallbackMin = rec ? Math.max(50, rec.low - 40) : 100;
  const fallbackMax = rec ? rec.high + 40 : 500;
  priceSlider.min = fallbackMin;
  priceSlider.max = fallbackMax;
  modelsRangeSlider.min = fallbackMin;
  modelsRangeSlider.max = fallbackMax;

  if (!state.sliderPrice || state.sliderPrice < fallbackMin || state.sliderPrice > fallbackMax) {
    state.sliderPrice = rec ? rec.mid : fallbackMin;
  }
  priceSlider.value = state.sliderPrice;
  modelsRangeSlider.value = rec ? rec.mid : fallbackMin;
}

function setActiveTab(targetId) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.target === targetId));
  screens.forEach((screen) => screen.classList.toggle("active", screen.id === targetId));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

function handleSaveDecision() {
  const note = notesField.value.trim();
  if (!note) {
    showToast("Add context before saving");
    return;
  }
  const confidence = getConfidenceInfo().level;
  state.savedDecisions.unshift({
    price: state.sliderPrice,
    confidence,
    rationale: note.slice(0, 80),
  });
  updateRecordsList();
  updateNotesPreview();
  showToast("Decision saved");
}

function handleRangeOverride(value) {
  state.manualRecommendation = Number(value);
  updateAll(false);
  showToast("Range adjusted");
}

function handleDataChange() {
  updateStateFromInputs();
  state.manualRecommendation = null;
  updateAll(true);
}

function updateAll(resetSlider) {
  state.baseRecommendation = computeRecommendation();
  if (!state.baseRecommendation) {
    state.manualRecommendation = null;
  }
  const rec = getActiveRecommendation();
  const confidence = getConfidenceInfo();
  if (resetSlider) {
    syncSliders(rec);
  }
  updateSummary(rec, confidence);
  updateRangeCard(rec, confidence);
  updateConfidenceCard(confidence);
  updateCostCard(rec);
  updateMarketCard(rec);
  renderModelsTable(rec, confidence);
  drawResultsPreview(rec);
  updateAdvisor(rec, confidence);
  updateNotesPreview();
  renderMarketSignals();
  updateSimulator(state.sliderPrice);
}

tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    setActiveTab(tab.dataset.target);
  })
);

navCards.forEach((card) =>
  card.addEventListener("click", () => {
    const target = card.dataset.navTarget;
    if (target) setActiveTab(target);
  })
);

[positioningSelect, marketToggle].forEach((select) =>
  select.addEventListener("change", (event) => {
    positioningSelect.value = event.target.value;
    marketToggle.value = event.target.value;
    handleDataChange();
    showToast("Positioning updated");
  })
);

[elasticityInput, sentimentInput, materialsInput, laborInput, overheadInput, marketLowInput, marketMedianInput, marketHighInput].forEach((input) =>
  input.addEventListener("input", () => handleDataChange())
);

marketNotesField.addEventListener("input", (event) => {
  state.marketNotes = event.target.value;
});

notesField.addEventListener("input", updateNotesPreview);
notesCardButton.addEventListener("click", (event) => {
  event.stopPropagation();
  setActiveTab("review");
});

refreshButton.addEventListener("click", () => {
  handleDataChange();
  showToast("Insights refreshed");
});

priceSlider.addEventListener("input", (event) => {
  updateSimulator(Number(event.target.value));
});

chipButtons.forEach((chip) => {
  chip.addEventListener("click", () => {
    chipButtons.forEach((btn) => btn.classList.remove("active"));
    chip.classList.add("active");
    state.simulatorAdjustment = parseFloat(chip.dataset.adjust) || 0;
    updateSimulator(state.sliderPrice);
  });
});

nudgeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nudge = parseFloat(button.dataset.nudge) || 0;
    updateSimulator(state.sliderPrice + nudge);
  });
});

saveDecision.addEventListener("click", handleSaveDecision);
modelsRangeSlider.addEventListener("input", (event) => handleRangeOverride(Number(event.target.value)));

marketToggle.value = positioningSelect.value;
updateAll(true);
chipButtons[1]?.classList.add("active");
updateRecordsList();

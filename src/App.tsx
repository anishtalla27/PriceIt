import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { DemoBackgroundPaths } from "@/components/ui/demo";
import SetupPage from "@/pages/SetupPage";
import FixedCostsPage from "@/pages/FixedCostsPage";
import VariableCostsPage from "@/pages/VariableCostsPage";
import PricingPage from "@/pages/PricingPage";
import PricingLabPage from "@/pages/PricingLabPage";
import PricingStrategiesPage from "@/pages/PricingStrategiesPage";
import PricingStrategyPage from "@/pages/PricingStrategyPage";
import ResultsPage from "@/pages/ResultsPage";
import TrackerPage from "@/pages/TrackerPage";
import ProductsPage from "@/pages/ProductsPage";
import { AppStateProvider, useAppState } from "@/context/AppStateContext";
import { TrackerProvider } from "@/context/TrackerContext";
import type { JourneyMode } from "@/context/AppStateContext";
import { SetupFlowAssistant } from "@/components/ui/setup-flow-assistant";

function JourneyEntry({ mode }: { mode: JourneyMode }) {
  const navigate = useNavigate();
  const { beginJourney } = useAppState();

  useEffect(() => {
    beginJourney(mode);
    navigate("/setup", { replace: true });
  }, [beginJourney, mode, navigate]);

  return null;
}

function App() {
  return (
    <AppStateProvider>
      <TrackerProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DemoBackgroundPaths />} />
            <Route path="/create" element={<JourneyEntry mode="create" />} />
            <Route path="/improve" element={<JourneyEntry mode="improve" />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/setup/costs" element={<FixedCostsPage />} />
            <Route path="/setup/variable-costs" element={<VariableCostsPage />} />
            <Route path="/setup/pricing" element={<PricingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/setup/pricing-lab" element={<PricingLabPage />} />
            <Route path="/pricing-lab" element={<PricingLabPage />} />
            <Route path="/setup/pricing-lab/strategies" element={<PricingStrategiesPage />} />
            <Route path="/pricing-lab/strategies" element={<PricingStrategiesPage />} />
            <Route path="/setup/pricing-lab/:strategy" element={<PricingStrategyPage />} />
            <Route path="/pricing-lab/:strategy" element={<PricingStrategyPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/tracker" element={<TrackerPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/my-products" element={<ProductsPage />} />
          </Routes>
          <SetupFlowAssistant />
        </BrowserRouter>
      </TrackerProvider>
    </AppStateProvider>
  );
}

export default App;

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { DemoBackgroundPaths } from "@/components/ui/demo";
import SetupPage from "@/pages/SetupPage";
import FixedCostsPage from "@/pages/FixedCostsPage";
import VariableCostsPage from "@/pages/VariableCostsPage";
import PricingPage from "@/pages/PricingPage";
import ResultsPage from "@/pages/ResultsPage";
import SimulateSetupPage from "@/pages/SimulateSetupPage";
import SimulateGamePage from "@/pages/SimulateGamePage";
import SimulateGameOverPage from "@/pages/SimulateGameOverPage";
import SimulateResultsPage from "@/pages/SimulateResultsPage";
import { AppStateProvider, useAppState } from "@/context/AppStateContext";
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
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/simulate" element={<SimulateSetupPage />} />
          <Route path="/simulate/game" element={<SimulateGamePage />} />
          <Route path="/simulate/gameover" element={<SimulateGameOverPage />} />
          <Route path="/simulate/results" element={<SimulateResultsPage />} />
        </Routes>
        <SetupFlowAssistant />
      </BrowserRouter>
    </AppStateProvider>
  );
}

export default App;

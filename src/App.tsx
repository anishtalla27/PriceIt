import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { AppStateProvider } from "@/context/AppStateContext";
import { SetupFlowAssistant } from "@/components/ui/setup-flow-assistant";

function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DemoBackgroundPaths />} />
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

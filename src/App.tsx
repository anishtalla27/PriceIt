import { Routes, Route, useLocation } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import ProductStudio from './pages/ProductStudio'
import CostWorkshop from './pages/CostWorkshop'
import MarketStreet from './pages/MarketStreet'
import ValueLab from './pages/ValueLab'
import CelebrationStage from './pages/CelebrationStage'
import PriceItLandingPage from './pages/priceit/LandingPage'
import PriceItProductStudio from './pages/priceit/ProductStudio'
import PriceItVariableCosts from './pages/priceit/VariableCosts'
import PriceItFixedCosts from './pages/priceit/FixedCosts'
import PriceItMarketStreet from './pages/priceit/MarketStreet'
import PriceItValueLab from './pages/priceit/ValueLab'
import PriceItCelebrationStage from './pages/priceit/CelebrationStage'
import PriceItAIChat from './components/priceit/PriceItAIChat'

function App() {
  const location = useLocation()
  const isPriceItRoute = location.pathname.startsWith('/priceit')

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/product-studio" element={<ProductStudio />} />
        <Route path="/cost-workshop" element={<CostWorkshop />} />
        <Route path="/market-street" element={<MarketStreet />} />
        <Route path="/value-lab" element={<ValueLab />} />
        <Route path="/celebration" element={<CelebrationStage />} />
        {/* PriceIt module routes */}
        <Route path="/priceit" element={<PriceItLandingPage />} />
        <Route path="/priceit/product" element={<PriceItProductStudio />} />
        <Route path="/priceit/cost" element={<PriceItVariableCosts />} />
        <Route path="/priceit/variable-costs" element={<PriceItVariableCosts />} />
        <Route path="/priceit/fixed-costs" element={<PriceItFixedCosts />} />
        <Route path="/priceit/market" element={<PriceItMarketStreet />} />
        <Route path="/priceit/value" element={<PriceItValueLab />} />
        <Route path="/priceit/celebrate" element={<PriceItCelebrationStage />} />
      </Routes>
      {/* Show AI chat only on PriceIt routes */}
      {isPriceItRoute && <PriceItAIChat />}
    </div>
  )
}

export default App


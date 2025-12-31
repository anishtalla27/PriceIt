import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import ProductStudio from './pages/ProductStudio'
import CostWorkshop from './pages/CostWorkshop'
import MarketStreet from './pages/MarketStreet'
import ValueLab from './pages/ValueLab'
import CelebrationStage from './pages/CelebrationStage'
import PriceItLandingPage from './pages/priceit/LandingPage'
import PriceItProductStudio from './pages/priceit/ProductStudio'
import PriceItCostWorkshop from './pages/priceit/CostWorkshop'
import PriceItMarketStreet from './pages/priceit/MarketStreet'
import PriceItValueLab from './pages/priceit/ValueLab'
import PriceItCelebrationStage from './pages/priceit/CelebrationStage'

function App() {
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
        <Route path="/priceit/cost" element={<PriceItCostWorkshop />} />
        <Route path="/priceit/market" element={<PriceItMarketStreet />} />
        <Route path="/priceit/value" element={<PriceItValueLab />} />
        <Route path="/priceit/celebrate" element={<PriceItCelebrationStage />} />
      </Routes>
    </div>
  )
}

export default App


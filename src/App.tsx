import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import ProductStudio from './pages/ProductStudio'
import CostWorkshop from './pages/CostWorkshop'
import MarketStreet from './pages/MarketStreet'
import ValueLab from './pages/ValueLab'
import CelebrationStage from './pages/CelebrationStage'

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
      </Routes>
    </div>
  )
}

export default App


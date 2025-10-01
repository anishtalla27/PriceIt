import { DollarSign, TrendingUp, Calculator, Target, Wallet } from 'lucide-react';

interface FinancialReportCardProps {
  finalPrice: number;
  totalMaterialCost: number;
  costPlusPrice: number;
  marketPrice: number;
  valuePrice: number;
  productName: string;
}

export function FinancialReportCard({ 
  finalPrice, 
  totalMaterialCost, 
  productName 
}: FinancialReportCardProps) {
  
  const profitMargin = ((finalPrice - totalMaterialCost) / finalPrice) * 100;
  const profitPerUnit = finalPrice - totalMaterialCost;
  
  // Simple projected sales scenarios
  const scenarios = [
    {
      name: "Conservative 🐌",
      units: 20,
      revenue: 20 * finalPrice,
      profit: 20 * profitPerUnit,
      color: "from-blue-400 to-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      name: "Optimistic 🚀", 
      units: 50,
      revenue: 50 * finalPrice,
      profit: 50 * profitPerUnit,
      color: "from-green-400 to-green-500",
      bgColor: "bg-green-50"
    },
    {
      name: "Super Success 🌟",
      units: 100,
      revenue: 100 * finalPrice,
      profit: 100 * profitPerUnit,
      color: "from-purple-400 to-pink-500",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-green-300">
      <div className="text-center mb-6">
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-4 rounded-full w-fit mx-auto mb-4">
          <Calculator className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          📊 Your Business Financial Report
        </h3>
        <p className="text-gray-600">Here's how your {productName} business could perform!</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-300 rounded-2xl p-4 text-center">
          <div className="bg-gradient-to-r from-blue-400 to-cyan-500 p-2 rounded-full w-fit mx-auto mb-2">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-bold text-gray-800 mb-1">Final Price</h4>
          <div className="text-2xl font-bold text-blue-600">${finalPrice.toFixed(2)}</div>
        </div>

        <div className="bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-300 rounded-2xl p-4 text-center">
          <div className="bg-gradient-to-r from-red-400 to-orange-500 p-2 rounded-full w-fit mx-auto mb-2">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-bold text-gray-800 mb-1">Cost Per Unit</h4>
          <div className="text-2xl font-bold text-red-600">${totalMaterialCost.toFixed(2)}</div>
        </div>

        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-2xl p-4 text-center">
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-2 rounded-full w-fit mx-auto mb-2">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-bold text-gray-800 mb-1">Profit Per Unit</h4>
          <div className="text-2xl font-bold text-green-600">${profitPerUnit.toFixed(2)}</div>
        </div>
      </div>

      {/* Profit Margin */}
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-2xl p-4 mb-6 text-center">
        <h4 className="text-lg font-bold text-gray-800 mb-2">Profit Margin</h4>
        <div className="text-3xl font-bold text-yellow-600 mb-2">{profitMargin.toFixed(1)}%</div>
        <p className="text-gray-700">
          {profitMargin > 50 ? "Excellent! 🎉" : profitMargin > 30 ? "Good! 👍" : "Okay! 📈"}
          {" "}This means for every dollar you earn, you keep ${(profitMargin/100).toFixed(2)} as profit!
        </p>
      </div>

      {/* Sales Projections */}
      <div className="mb-6">
        <h4 className="text-xl font-bold text-gray-800 mb-4 text-center">
          🔮 What If You Sold...
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((scenario, index) => (
            <div key={index} className={`${scenario.bgColor} border-2 border-gray-300 rounded-2xl p-4 text-center`}>
              <h5 className="font-bold text-gray-800 mb-2">{scenario.name}</h5>
              <div className="space-y-2">
                <div className="text-lg font-bold text-gray-700">{scenario.units} units</div>
                <div className="text-sm text-gray-600">
                  Revenue: <span className="font-bold text-blue-600">${scenario.revenue.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Profit: <span className="font-bold text-green-600">${scenario.profit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Break-even Analysis */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-2xl p-4 text-center">
        <h4 className="text-lg font-bold text-gray-800 mb-2">🎯 Break-Even Point</h4>
        <p className="text-gray-700">
          You need to sell at least <span className="font-bold text-purple-600">1 unit</span> to start making profit!
          {profitPerUnit > 0 && (
            <span> Each sale after that puts <strong>${profitPerUnit.toFixed(2)}</strong> in your pocket! 💰</span>
          )}
        </p>
      </div>
    </div>
  );
}
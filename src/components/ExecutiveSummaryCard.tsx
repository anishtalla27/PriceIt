import { Crown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ExecutiveSummaryCardProps {
  productName: string;
  productDescription: string;
  finalPrice: number;
  totalMaterialCost: number;
  profitMargin: number;
  averageCompetitorPrice: number;
  competitorCount: number;
  targetAge: string;
  spendingRange: string;
}

export function ExecutiveSummaryCard({ 
  productName,
  productDescription,
  finalPrice, 
  totalMaterialCost,
  profitMargin,
  averageCompetitorPrice,
  competitorCount,
  targetAge,
  spendingRange
}: ExecutiveSummaryCardProps) {
  
  const profitPerUnit = finalPrice - totalMaterialCost;
  const isCompetitivePrice = averageCompetitorPrice > 0 ? finalPrice <= averageCompetitorPrice * 1.2 : true;
  
  // Simple strengths and weaknesses analysis
  const strengths = [];
  const weaknesses = [];
  
  if (profitMargin > 40) {
    strengths.push("Excellent profit margins - you'll make great money!");
  } else if (profitMargin > 25) {
    strengths.push("Good profit margins for a growing business");
  } else {
    weaknesses.push("Consider reducing costs or increasing price");
  }
  
  if (isCompetitivePrice) {
    strengths.push("Competitive pricing that kids and parents will love");
  } else {
    weaknesses.push("Price might be too high compared to similar products");
  }
  
  if (competitorCount <= 2) {
    strengths.push("Low competition - great opportunity to stand out!");
  } else {
    weaknesses.push("High competition - need strong marketing");
  }
  
  if (finalPrice <= 20) {
    strengths.push("Affordable price point perfect for kids' budgets");
  }
  
  // Add defaults if needed
  if (strengths.length < 3) {
    strengths.push("Creative and innovative product idea");
  }
  
  if (weaknesses.length === 0) {
    weaknesses.push("Consider getting feedback from potential customers");
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-purple-300">
      <div className="text-center mb-6">
        <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-4 rounded-full w-fit mx-auto mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          👑 Executive Summary
        </h3>
        <p className="text-gray-600">Your business plan at a glance!</p>
      </div>

      {/* Product Overview */}
      <div className="bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300 rounded-2xl p-4 mb-6">
        <h4 className="text-lg font-bold text-gray-800 mb-3">📋 Product Overview</h4>
        <div className="space-y-2 text-gray-700">
          <p><strong>Product:</strong> {productName}</p>
          <p><strong>Description:</strong> {productDescription || "An amazing product for kids!"}</p>
          <p><strong>Target Market:</strong> Kids aged {targetAge}</p>
          <p><strong>Price Range:</strong> {spendingRange}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-600">${finalPrice.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Final Price</div>
        </div>
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{profitMargin.toFixed(0)}%</div>
          <div className="text-sm text-gray-600">Profit Margin</div>
        </div>
        <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">${profitPerUnit.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Profit/Unit</div>
        </div>
      </div>

      {/* Strengths */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <CheckCircle2 className="w-6 h-6 text-green-500 mr-2" />
          💪 Strengths
        </h4>
        <div className="space-y-2">
          {strengths.slice(0, 3).map((strength, index) => (
            <div key={index} className="flex items-start space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">{strength}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Areas for Improvement */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <AlertCircle className="w-6 h-6 text-orange-500 mr-2" />
          🎯 Areas to Improve
        </h4>
        <div className="space-y-2">
          {weaknesses.slice(0, 2).map((weakness, index) => (
            <div key={index} className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">{weakness}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Business Recommendation */}
      <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-2xl p-4">
        <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
          🚀 Business Recommendation
        </h4>
        <div className="text-gray-700">
          {profitMargin > 40 && isCompetitivePrice ? (
            <p className="font-medium text-green-700">
              🌟 <strong>GO FOR IT!</strong> Your {productName} has excellent potential with great profits and competitive pricing!
            </p>
          ) : profitMargin > 25 ? (
            <p className="font-medium text-blue-700">
              👍 <strong>GOOD OPPORTUNITY!</strong> Your business idea is solid. Start small and test the market!
            </p>
          ) : (
            <p className="font-medium text-orange-700">
              💡 <strong>NEEDS REFINEMENT!</strong> Great idea, but work on improving your profit margins first!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
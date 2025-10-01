import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ResultsCardProps {
  totalCost: number;
  suggestedPrice: number;
  costBreakdown: {
    materials: number;
    labor: number;
    equipment: number;
    monthly: number;
    selling: number;
  };
  monthlyExpenses: number;
}

export function ResultsCard({ totalCost, suggestedPrice, costBreakdown, monthlyExpenses }: ResultsCardProps) {
  const pieData = [
    { name: 'Materials & Packaging', value: costBreakdown.materials, color: '#8B5CF6' },
    { name: 'Labor & Production', value: costBreakdown.labor, color: '#10B981' },
    { name: 'Equipment', value: costBreakdown.equipment, color: '#F59E0B' },
    { name: 'Monthly Costs', value: costBreakdown.monthly, color: '#3B82F6' },
    { name: 'Selling & Shipping', value: costBreakdown.selling, color: '#EF4444' }
  ].filter(item => item.value > 0);

  const breakEvenProducts = monthlyExpenses > 0 ? Math.ceil(monthlyExpenses / (suggestedPrice - totalCost)) : 0;

  const getCompetitiveStatus = () => {
    // Mock AI analysis based on price range
    if (suggestedPrice < 20) return { emoji: '🟢', status: 'Competitive', message: 'Your price is very competitive for this market!' };
    if (suggestedPrice < 50) return { emoji: '🟡', status: 'Okay', message: 'Your price is reasonable. Consider highlighting your unique features!' };
    return { emoji: '🔴', status: 'Premium', message: 'You\'re pricing at a premium. Make sure your quality and marketing justify the price!' };
  };

  const competitive = getCompetitiveStatus();

  return (
    <div className="space-y-6">
      {/* Cost Breakdown Chart */}
      <Card className="border-2 border-violet-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Detailed Breakdown</h4>
              {pieData.map((item) => (
                <div key={item.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${item.value.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {((item.value / totalCost) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Break-Even Calculator */}
      <Card className="border-2 border-emerald-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Break-Even Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center p-6 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-lg">
              You need to sell <span className="text-2xl font-bold text-emerald-600">{breakEvenProducts}</span> products 
              to cover all your monthly costs
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Monthly profit per product: ${(suggestedPrice - totalCost).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Feedback */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{competitive.emoji}</span>
              <span className="font-medium">
                Based on similar products, your price is: {competitive.status}
              </span>
            </div>
            
            <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
              {competitive.message}
            </p>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>💡 <strong>Tip:</strong> Consider seasonal demand and adjust your inventory accordingly.</p>
              <p>📈 <strong>Growth:</strong> As you scale, your per-unit costs may decrease due to bulk purchasing.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
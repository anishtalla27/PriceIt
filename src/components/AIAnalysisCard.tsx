import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Competitor {
  id: string;
  name: string;
  price: number;
  comparison: string;
}

interface AIAnalysisCardProps {
  costBreakdown: {
    materials: number;
    variable: number;
    production: number;
  };
  pricingModels: {
    costPlus: number;
    marketBased: number;
    valueBased: number;
  };
  competitors: Competitor[];
}

export function AIAnalysisCard({ costBreakdown, pricingModels, competitors }: AIAnalysisCardProps) {
  const [customerOpinions, setCustomerOpinions] = useState(100);
  const [analysisGenerated, setAnalysisGenerated] = useState(false);

  const generateAnalysis = () => {
    setAnalysisGenerated(true);
  };

  // Mock customer sentiment data
  const sentimentData = [
    { name: 'Very Positive', value: 35, color: '#10B981' },
    { name: 'Positive', value: 28, color: '#34D399' },
    { name: 'Neutral', value: 22, color: '#FCD34D' },
    { name: 'Negative', value: 10, color: '#F87171' },
    { name: 'Very Negative', value: 5, color: '#EF4444' }
  ];

  // Cost breakdown pie chart data
  const costPieData = [
    { name: 'Materials', value: costBreakdown.materials, color: '#8B5CF6' },
    { name: 'Variable Costs', value: costBreakdown.variable, color: '#10B981' },
    { name: 'Production', value: costBreakdown.production, color: '#F59E0B' }
  ].filter(item => item.value > 0);

  // Pricing comparison bar chart data
  const pricingBarData = [
    { name: 'Cost-Plus', price: pricingModels.costPlus, color: '#10B981' },
    { name: 'Market-Based', price: pricingModels.marketBased, color: '#3B82F6' },
    { name: 'Value-Based', price: pricingModels.valueBased, color: '#8B5CF6' }
  ].filter(item => item.price > 0);

  const getAICommentary = () => {
    const avgPrice = (pricingModels.costPlus + pricingModels.marketBased + pricingModels.valueBased) / 3;
    const totalCosts = costBreakdown.materials + costBreakdown.variable + costBreakdown.production;
    const profitMargin = ((avgPrice - totalCosts) / totalCosts * 100).toFixed(0);

    return [
      `🎯 **Pricing Analysis**: Your suggested price range indicates a ${profitMargin}% profit margin, which is ${profitMargin > 50 ? 'healthy' : profitMargin > 25 ? 'moderate' : 'conservative'} for most businesses.`,
      
      `📊 **Cost Structure**: ${costBreakdown.materials > totalCosts * 0.5 ? 'Materials dominate your costs' : costBreakdown.production > totalCosts * 0.4 ? 'Production costs are significant' : 'You have a balanced cost structure'} - consider bulk purchasing or process optimization opportunities.`,
      
      `🏆 **Market Position**: ${competitors.length > 2 ? 'With multiple competitors identified' : competitors.length > 0 ? 'Based on your competitor analysis' : 'Without competitor data'}, ${pricingModels.marketBased > pricingModels.costPlus ? 'the market can support premium pricing' : 'focus on cost efficiency and value communication'}.`,
      
      `💡 **Recommendations**: Start with A/B testing at ${(avgPrice * 0.9).toFixed(2)} and ${(avgPrice * 1.1).toFixed(2)} to find your optimal price point. Monitor customer feedback closely and adjust based on actual market response.`
    ];
  };

  return (
    <Card className="border-2 border-slate-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          AI Commercial Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="customerOpinions">Number of Simulated Customer Opinions</Label>
            <Input
              id="customerOpinions"
              type="number"
              value={customerOpinions}
              onChange={(e) => setCustomerOpinions(parseInt(e.target.value) || 100)}
              className="border-slate-200 focus:border-slate-400"
            />
          </div>
          <Button 
            onClick={generateAnalysis}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            Generate Analysis
          </Button>
        </div>

        {analysisGenerated && (
          <div className="space-y-6">
            {/* Cost Breakdown Pie Chart */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-medium mb-4">💰 Cost Breakdown</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {costPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pricing Comparison Bar Chart */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-medium mb-4">📊 Pricing Comparison</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pricingBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']} />
                    <Bar dataKey="price" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Customer Sentiment Chart */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-medium mb-4">😊 Customer Sentiment ({customerOpinions} opinions)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Commentary */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-4">🧠 AI Text Commentary</h4>
              <div className="space-y-3">
                {getAICommentary().map((comment, index) => (
                  <p key={index} className="text-sm text-blue-700 leading-relaxed">
                    {comment}
                  </p>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                <p className="text-xs text-blue-600">
                  💡 <strong>Next Steps:</strong> Consider testing your pricing with a small group of target customers before full launch. 
                  Track conversion rates at different price points to optimize your pricing strategy.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface PricingCardProps {
  data: {
    profitMargin: number;
  };
  updateData: (updates: any) => void;
  totalCost: number;
  suggestedPrice: number;
}

export function PricingCard({ data, updateData, totalCost, suggestedPrice }: PricingCardProps) {
  const getMarginLabel = (margin: number) => {
    if (margin <= 25) return { text: "Small Profit 😊", color: "text-yellow-600" };
    if (margin <= 50) return { text: "Good Profit 💰", color: "text-green-600" };
    if (margin <= 75) return { text: "Great Profit 🎯", color: "text-blue-600" };
    return { text: "Big Profit 🚀", color: "text-purple-600" };
  };

  const marginLabel = getMarginLabel(data.profitMargin);

  return (
    <Card className="border-2 border-yellow-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          Pricing & Profit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4">
          <Label>Profit Margin</Label>
          <div className="space-y-3">
            <Slider
              value={[data.profitMargin]}
              onValueChange={(values) => updateData({ profitMargin: values[0] })}
              max={100}
              min={10}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10%</span>
              <span className={`font-medium ${marginLabel.color}`}>
                {data.profitMargin}% - {marginLabel.text}
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Your suggested selling price:</p>
            <div className="text-4xl font-bold text-green-600">
              ${suggestedPrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Total cost: ${totalCost.toFixed(2)}</p>
              <p>Profit: ${(suggestedPrice - totalCost).toFixed(2)} ({data.profitMargin}%)</p>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          size="lg"
        >
          Lock in my price! 🔒
        </Button>
      </CardContent>
    </Card>
  );
}
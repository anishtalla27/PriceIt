import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface VariableCostsCardProps {
  data: {
    shippingCost: number;
    otherVariableCosts: number;
  };
  updateData: (updates: any) => void;
  total: number;
}

export function VariableCostsCard({ data, updateData, total }: VariableCostsCardProps) {
  return (
    <Card className="border-2 border-purple-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📦</span>
          Variable Costs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="shippingCost">Shipping/Delivery per Unit ($)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="shippingCost"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={data.shippingCost || ''}
              onChange={(e) => updateData({ shippingCost: parseFloat(e.target.value) || 0 })}
              className="pl-8 border-purple-200 focus:border-purple-400"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="otherVariableCosts">Other Variable Costs ($)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="otherVariableCosts"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={data.otherVariableCosts || ''}
              onChange={(e) => updateData({ otherVariableCosts: parseFloat(e.target.value) || 0 })}
              className="pl-8 border-purple-200 focus:border-purple-400"
            />
          </div>
          <p className="text-xs text-gray-500">Transaction fees, payment processing, etc.</p>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-purple-800">Variable Costs Subtotal:</span>
            <span className="text-xl font-bold text-purple-700">${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
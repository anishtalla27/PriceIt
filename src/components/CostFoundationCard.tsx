import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface CostFoundationCardProps {
  data: {
    totalProductionCost: number;
    minimumProfitablePrice: number;
  };
  updateData: (updates: any) => void;
  totalCOGS: number;
}

export function CostFoundationCard({ data, updateData, totalCOGS }: CostFoundationCardProps) {
  return (
    <Card className="border-2 border-teal-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          Cost Foundation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="totalProductionCost">Total Production Cost per Unit ($)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="totalProductionCost"
              type="number"
              step="0.01"
              placeholder={totalCOGS.toFixed(2)}
              value={data.totalProductionCost || totalCOGS}
              onChange={(e) => updateData({ totalProductionCost: parseFloat(e.target.value) || 0 })}
              className="pl-8 border-teal-200 focus:border-teal-400"
            />
          </div>
          <p className="text-xs text-gray-500">
            Auto-filled from your cost inputs above (${totalCOGS.toFixed(2)}), but editable
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="minimumProfitablePrice">Minimum Profitable Price ($)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="minimumProfitablePrice"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={data.minimumProfitablePrice || ''}
              onChange={(e) => updateData({ minimumProfitablePrice: parseFloat(e.target.value) || 0 })}
              className="pl-8 border-teal-200 focus:border-teal-400"
            />
          </div>
          <p className="text-xs text-gray-500">
            The lowest price you can sell at and still make a profit
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
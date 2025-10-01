import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ProductionCardProps {
  data: {
    hourlyWage: number;
    otherProductionCosts: number;
    timeToMake: number;
  };
  updateData: (updates: any) => void;
  laborCost: number;
}

export function ProductionCard({ data, updateData, laborCost }: ProductionCardProps) {
  return (
    <Card className="border-2 border-green-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          Production
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="hourlyWage">Desired hourly wage</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="hourlyWage"
              type="number"
              step="0.01"
              placeholder="25.00"
              value={data.hourlyWage}
              onChange={(e) => updateData({ hourlyWage: parseFloat(e.target.value) || 0 })}
              className="pl-8 border-green-200 focus:border-green-400"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">/hr</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="otherProductionCosts">Other production costs per product</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="otherProductionCosts"
              type="number"
              step="0.01"
              placeholder="2.00"
              value={data.otherProductionCosts}
              onChange={(e) => updateData({ otherProductionCosts: parseFloat(e.target.value) || 0 })}
              className="pl-8 border-green-200 focus:border-green-400"
            />
          </div>
          <p className="text-xs text-gray-500">electricity, internet, etc.</p>
        </div>
        
        {data.timeToMake > 0 && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="space-y-2">
              <p className="text-sm text-green-800">
                <span className="font-medium">Time per product:</span> {data.timeToMake} minutes ({(data.timeToMake / 60).toFixed(1)} hours)
              </p>
              <p className="text-sm text-green-800">
                <span className="font-medium">Labor cost per product:</span> <span className="font-bold">${laborCost.toFixed(2)}</span>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
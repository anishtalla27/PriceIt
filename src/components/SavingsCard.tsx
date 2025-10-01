import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface SavingsCardProps {
  data: {
    typicalWillingnessToPay: number;
    maximumPrice: number;
    minimumPrice: number;
  };
  updateData: (updates: any) => void;
}

export function SavingsCard({ data, updateData }: SavingsCardProps) {
  return (
    <Card className="border-2 border-emerald-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">💸</span>
          Savings & Willingness to Pay
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="typicalWillingnessToPay">Typical Willingness to Pay ($)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="typicalWillingnessToPay"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={data.typicalWillingnessToPay || ''}
              onChange={(e) => updateData({ typicalWillingnessToPay: parseFloat(e.target.value) || 0 })}
              className="pl-8 border-emerald-200 focus:border-emerald-400"
            />
          </div>
          <p className="text-xs text-gray-500">What customers typically pay for this type of solution</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="maximumPrice">Maximum Price Customers Might Accept ($)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="maximumPrice"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={data.maximumPrice || ''}
              onChange={(e) => updateData({ maximumPrice: parseFloat(e.target.value) || 0 })}
              className="pl-8 border-emerald-200 focus:border-emerald-400"
            />
          </div>
          <p className="text-xs text-gray-500">The highest price point before customers walk away</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="minimumPrice">Minimum Price Customers Expect ($)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="minimumPrice"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={data.minimumPrice || ''}
              onChange={(e) => updateData({ minimumPrice: parseFloat(e.target.value) || 0 })}
              className="pl-8 border-emerald-200 focus:border-emerald-400"
            />
          </div>
          <p className="text-xs text-gray-500">Below this price, customers might question quality</p>
        </div>
        
        {data.maximumPrice > 0 && data.minimumPrice > 0 && (
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm font-medium text-emerald-800">
              Price Range: ${data.minimumPrice.toFixed(2)} - ${data.maximumPrice.toFixed(2)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              Sweet spot: ${data.typicalWillingnessToPay.toFixed(2)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
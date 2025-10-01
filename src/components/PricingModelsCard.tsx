import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

interface PricingModelsCardProps {
  costPlusPrice: number;
  marketBasedPrice: number;
  valueBasedPrice: number;
  totalCOGS: number;
}

export function PricingModelsCard({ 
  costPlusPrice, 
  marketBasedPrice, 
  valueBasedPrice, 
  totalCOGS 
}: PricingModelsCardProps) {
  const suggestedMin = Math.min(costPlusPrice, marketBasedPrice, valueBasedPrice);
  const suggestedMax = Math.max(costPlusPrice, marketBasedPrice, valueBasedPrice);

  return (
    <Card className="border-2 border-cyan-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Pricing Models Table
          <Badge variant="secondary" className="ml-2">AI-generated + editable</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4">
          {/* Cost-plus Price */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex justify-between items-center mb-2">
              <Label className="font-medium text-green-800">Cost-plus Price</Label>
              <Badge variant="outline" className="text-green-700 border-green-300">
                Cost + 50% markup
              </Badge>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                step="0.01"
                value={costPlusPrice.toFixed(2)}
                readOnly
                className="pl-8 bg-green-50 border-green-200 text-green-800 font-medium"
              />
            </div>
            <p className="text-xs text-green-600 mt-1">
              Based on total costs (${totalCOGS.toFixed(2)}) + profit margin
            </p>
          </div>

          {/* Market-based Price */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <Label className="font-medium text-blue-800">Market-based Price</Label>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                Competitor average
              </Badge>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                step="0.01"
                value={marketBasedPrice > 0 ? marketBasedPrice.toFixed(2) : '0.00'}
                readOnly
                className="pl-8 bg-blue-50 border-blue-200 text-blue-800 font-medium"
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {marketBasedPrice > 0 
                ? "Average of competitor prices you entered" 
                : "Add competitor prices above to calculate"
              }
            </p>
          </div>

          {/* Value-based Price */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex justify-between items-center mb-2">
              <Label className="font-medium text-purple-800">Value-based Price</Label>
              <Badge variant="outline" className="text-purple-700 border-purple-300">
                Customer willingness
              </Badge>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                step="0.01"
                value={valueBasedPrice > 0 ? valueBasedPrice.toFixed(2) : '0.00'}
                readOnly
                className="pl-8 bg-purple-50 border-purple-200 text-purple-800 font-medium"
              />
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {valueBasedPrice > 0 
                ? "Based on customer willingness to pay" 
                : "Enter willingness to pay above to calculate"
              }
            </p>
          </div>
        </div>

        {/* Suggested Final Range */}
        {suggestedMin > 0 && suggestedMax > 0 && (
          <div className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200">
            <h4 className="font-medium text-orange-800 mb-3">🎯 Suggested Final Range</h4>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                ${suggestedMin.toFixed(2)} - ${suggestedMax.toFixed(2)}
              </div>
              <p className="text-sm text-orange-700">
                Consider starting at ${((suggestedMin + suggestedMax) / 2).toFixed(2)} and test market response
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
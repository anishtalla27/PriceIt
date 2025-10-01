import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Info } from 'lucide-react';

interface MonthlyCardProps {
  data: {
    monthlyExpenses: number;
    monthlyProductsSold: number;
  };
  updateData: (updates: any) => void;
  monthlyCostPerProduct: number;
}

export function MonthlyCard({ data, updateData, monthlyCostPerProduct }: MonthlyCardProps) {
  return (
    <Card className="border-2 border-indigo-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📅</span>
          Monthly Costs
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>We'll spread monthly costs across your expected sales.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="monthlyExpenses">Total monthly business expenses</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="monthlyExpenses"
              type="number"
              step="0.01"
              placeholder="200.00"
              value={data.monthlyExpenses}
              onChange={(e) => updateData({ monthlyExpenses: parseFloat(e.target.value) || 0 })}
              className="pl-8 border-indigo-200 focus:border-indigo-400"
            />
          </div>
          <p className="text-xs text-gray-500">rent, utilities, subscriptions, insurance, etc.</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="monthlyProductsSold">Average products sold per month</Label>
          <Input
            id="monthlyProductsSold"
            type="number"
            placeholder="50"
            value={data.monthlyProductsSold || ''}
            onChange={(e) => updateData({ monthlyProductsSold: parseInt(e.target.value) || 0 })}
            className="border-indigo-200 focus:border-indigo-400"
          />
        </div>
        
        {monthlyCostPerProduct > 0 && (
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-sm font-medium text-indigo-800">
              Monthly cost per product: <span className="font-bold">${monthlyCostPerProduct.toFixed(2)}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
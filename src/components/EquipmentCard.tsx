import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Info } from 'lucide-react';

interface EquipmentCardProps {
  data: {
    equipmentName: string;
    equipmentCost: number;
    productsFromEquipment: number;
    purchaseDate: string;
  };
  updateData: (updates: any) => void;
}

export function EquipmentCard({ data, updateData }: EquipmentCardProps) {
  const costPerProduct = data.productsFromEquipment > 0 ? data.equipmentCost / data.productsFromEquipment : 0;

  return (
    <Card className="border-2 border-orange-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🔧</span>
          Equipment Cost Spread
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>We'll spread this cost across the number of products.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="equipmentName">Equipment Name</Label>
          <Input
            id="equipmentName"
            placeholder="e.g. Jewelry Making Kit"
            value={data.equipmentName}
            onChange={(e) => updateData({ equipmentName: e.target.value })}
            className="border-orange-200 focus:border-orange-400"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="equipmentCost">Total Cost</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="equipmentCost"
              type="number"
              step="0.01"
              placeholder="500.00"
              value={data.equipmentCost || ''}
              onChange={(e) => updateData({ equipmentCost: parseFloat(e.target.value) || 0 })}
              className="pl-8 border-orange-200 focus:border-orange-400"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="productsFromEquipment">Number of products this equipment can make</Label>
          <Input
            id="productsFromEquipment"
            type="number"
            placeholder="1000"
            value={data.productsFromEquipment || ''}
            onChange={(e) => updateData({ productsFromEquipment: parseInt(e.target.value) || 0 })}
            className="border-orange-200 focus:border-orange-400"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={data.purchaseDate}
            onChange={(e) => updateData({ purchaseDate: e.target.value })}
            className="border-orange-200 focus:border-orange-400"
          />
        </div>
        
        {costPerProduct > 0 && (
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm font-medium text-orange-800">
              Equipment cost per product: <span className="font-bold">${costPerProduct.toFixed(2)}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
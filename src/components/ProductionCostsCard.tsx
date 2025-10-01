import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ProductionCostsCardProps {
  data: {
    packagingCost: number;
    equipment: {
      name: string;
      totalCost: number;
      productsItCanMake: number;
    };
  };
  updateData: (updates: any) => void;
  equipmentCostPerUnit: number;
  total: number;
}

export function ProductionCostsCard({ 
  data, 
  updateData, 
  equipmentCostPerUnit, 
  total 
}: ProductionCostsCardProps) {
  const [isEquipmentOpen, setIsEquipmentOpen] = useState(false);

  const updateEquipment = (updates: Partial<typeof data.equipment>) => {
    updateData({ equipment: { ...data.equipment, ...updates } });
  };

  return (
    <Card className="border-2 border-orange-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🏭</span>
          Production
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="packagingCost">Packaging cost per unit ($)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="packagingCost"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={data.packagingCost || ''}
              onChange={(e) => updateData({ packagingCost: parseFloat(e.target.value) || 0 })}
              className="pl-8 border-orange-200 focus:border-orange-400"
            />
          </div>
        </div>
        
        <Collapsible open={isEquipmentOpen} onOpenChange={setIsEquipmentOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 p-3 w-full bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
            {isEquipmentOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="font-medium">Equipment Section</span>
            {equipmentCostPerUnit > 0 && (
              <span className="ml-auto text-sm text-orange-600">
                ${equipmentCostPerUnit.toFixed(2)} per unit
              </span>
            )}
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="space-y-2">
                <Label htmlFor="equipmentName">Equipment name</Label>
                <Input
                  id="equipmentName"
                  placeholder="e.g., 3D Printer, Sewing Machine, Kiln..."
                  value={data.equipment.name}
                  onChange={(e) => updateEquipment({ name: e.target.value })}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="equipmentTotalCost">Total cost ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="equipmentTotalCost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={data.equipment.totalCost || ''}
                    onChange={(e) => updateEquipment({ totalCost: parseFloat(e.target.value) || 0 })}
                    className="pl-8 border-orange-200 focus:border-orange-400"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="productsItCanMake">Products it can make total</Label>
                <Input
                  id="productsItCanMake"
                  type="number"
                  placeholder="1000"
                  value={data.equipment.productsItCanMake || ''}
                  onChange={(e) => updateEquipment({ productsItCanMake: parseInt(e.target.value) || 0 })}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
              
              {equipmentCostPerUnit > 0 && (
                <div className="p-3 bg-white rounded border border-orange-200">
                  <p className="text-sm font-medium text-orange-800">
                    Cost per unit: <span className="font-bold">${equipmentCostPerUnit.toFixed(2)}</span>
                  </p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Packaging:</span>
              <span>${data.packagingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Equipment cost per unit:</span>
              <span>${equipmentCostPerUnit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-orange-200">
              <span className="font-medium text-orange-800">Production Costs Total:</span>
              <span className="text-xl font-bold text-orange-700">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
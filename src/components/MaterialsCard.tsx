import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  costPerUnit: number;
}

interface MaterialsCardProps {
  materials: Material[];
  onAddMaterial: () => void;
  onUpdateMaterial: (id: string, updates: Partial<Material>) => void;
  onRemoveMaterial: (id: string) => void;
  totalCost: number;
}

export function MaterialsCard({ 
  materials, 
  onAddMaterial, 
  onUpdateMaterial, 
  onRemoveMaterial, 
  totalCost 
}: MaterialsCardProps) {
  return (
    <Card className="border-2 border-green-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🧱</span>
          Materials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4">
          {materials.map((material, index) => (
            <div key={material.id} className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`material-name-${material.id}`}>
                  Material Name {index + 1}
                </Label>
                <Input
                  id={`material-name-${material.id}`}
                  placeholder="e.g., Cotton fabric, Sterling silver wire..."
                  value={material.name}
                  onChange={(e) => onUpdateMaterial(material.id, { name: e.target.value })}
                  className="border-green-200 focus:border-green-400"
                />
              </div>
              
              <div className="w-32 space-y-2">
                <Label htmlFor={`material-cost-${material.id}`}>Cost per Unit ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id={`material-cost-${material.id}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={material.costPerUnit || ''}
                    onChange={(e) => onUpdateMaterial(material.id, { costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="pl-8 border-green-200 focus:border-green-400"
                  />
                </div>
              </div>
              
              {materials.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveMaterial(material.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        <Button
          onClick={onAddMaterial}
          variant="outline"
          className="w-full border-green-300 text-green-700 hover:bg-green-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add another material
        </Button>
        
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-green-800">Materials Subtotal:</span>
            <span className="text-xl font-bold text-green-700">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';

interface CostEstimationCardProps {
  data: {
    rawMaterials: number;
    packaging: number;
    manualEdit: boolean;
  };
  updateData: (updates: any) => void;
}

export function CostEstimationCard({ data, updateData }: CostEstimationCardProps) {
  return (
    <Card className="border-2 border-blue-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          AI Product Cost Suggestion
        </CardTitle>
        <p className="text-sm text-gray-600">
          We estimated your costs for you based on your product type. Review and edit if needed.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="manualEdit">Edit manually</Label>
          <Switch
            id="manualEdit"
            checked={data.manualEdit}
            onCheckedChange={(checked) => updateData({ manualEdit: checked })}
          />
        </div>
        
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium">Estimated Cost Breakdown</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rawMaterials" className="flex items-center gap-2">
                Raw materials per product
                {!data.manualEdit && <Badge variant="secondary" className="text-xs">AI Suggested</Badge>}
              </Label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="rawMaterials"
                type="number"
                step="0.01"
                value={data.rawMaterials}
                onChange={(e) => updateData({ rawMaterials: parseFloat(e.target.value) || 0 })}
                disabled={!data.manualEdit}
                className={`pl-8 ${!data.manualEdit ? 'bg-blue-50 border-blue-200' : 'border-blue-200 focus:border-blue-400'}`}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="packaging" className="flex items-center gap-2">
                Packaging per product
                {!data.manualEdit && <Badge variant="secondary" className="text-xs">AI Suggested</Badge>}
              </Label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="packaging"
                type="number"
                step="0.01"
                value={data.packaging}
                onChange={(e) => updateData({ packaging: parseFloat(e.target.value) || 0 })}
                disabled={!data.manualEdit}
                className={`pl-8 ${!data.manualEdit ? 'bg-blue-50 border-blue-200' : 'border-blue-200 focus:border-blue-400'}`}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
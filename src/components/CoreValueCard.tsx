import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface Alternative {
  id: string;
  name: string;
  cost: number;
}

interface CoreValueCardProps {
  data: {
    mainProblem: string;
    mainBenefit: string;
  };
  updateData: (updates: any) => void;
  alternatives: Alternative[];
  onAddAlternative: () => void;
  onUpdateAlternative: (id: string, updates: Partial<Alternative>) => void;
  onRemoveAlternative: (id: string) => void;
}

export function CoreValueCard({ 
  data, 
  updateData, 
  alternatives, 
  onAddAlternative, 
  onUpdateAlternative, 
  onRemoveAlternative 
}: CoreValueCardProps) {
  return (
    <Card className="border-2 border-yellow-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">💡</span>
          Core Value
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="mainProblem">Main Problem the Product Solves</Label>
          <Textarea
            id="mainProblem"
            placeholder="What specific problem or pain point does your product address?"
            value={data.mainProblem}
            onChange={(e) => updateData({ mainProblem: e.target.value })}
            className="border-yellow-200 focus:border-yellow-400 min-h-20"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mainBenefit">Main Customer Benefit</Label>
          <Textarea
            id="mainBenefit"
            placeholder="What's the main benefit or value your customers get?"
            value={data.mainBenefit}
            onChange={(e) => updateData({ mainBenefit: e.target.value })}
            className="border-yellow-200 focus:border-yellow-400 min-h-20"
          />
        </div>
        
        <div className="space-y-4">
          <Label>Alternatives Customers Use Today</Label>
          
          {alternatives.map((alternative, index) => (
            <div key={alternative.id} className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`alternative-name-${alternative.id}`}>
                  Alternative {index + 1}
                </Label>
                <Input
                  id={`alternative-name-${alternative.id}`}
                  placeholder="e.g., DIY solution, competitor product, doing nothing..."
                  value={alternative.name}
                  onChange={(e) => onUpdateAlternative(alternative.id, { name: e.target.value })}
                  className="border-yellow-200 focus:border-yellow-400"
                />
              </div>
              
              <div className="w-32 space-y-2">
                <Label htmlFor={`alternative-cost-${alternative.id}`}>Cost ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id={`alternative-cost-${alternative.id}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={alternative.cost || ''}
                    onChange={(e) => onUpdateAlternative(alternative.id, { cost: parseFloat(e.target.value) || 0 })}
                    className="pl-8 border-yellow-200 focus:border-yellow-400"
                  />
                </div>
              </div>
              
              {alternatives.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveAlternative(alternative.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          
          <Button
            onClick={onAddAlternative}
            variant="outline"
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add alternative
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
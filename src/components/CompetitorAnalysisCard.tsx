import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  price: number;
  comparison: string;
}

interface CompetitorAnalysisCardProps {
  competitors: Competitor[];
  onAddCompetitor: () => void;
  onUpdateCompetitor: (id: string, updates: Partial<Competitor>) => void;
  onRemoveCompetitor: (id: string) => void;
}

export function CompetitorAnalysisCard({ 
  competitors, 
  onAddCompetitor, 
  onUpdateCompetitor, 
  onRemoveCompetitor 
}: CompetitorAnalysisCardProps) {
  return (
    <Card className="border-2 border-red-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          Competitor Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-6">
          {competitors.map((competitor, index) => (
            <div key={competitor.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`competitor-name-${competitor.id}`}>
                      Competitor Name
                    </Label>
                    <Input
                      id={`competitor-name-${competitor.id}`}
                      placeholder={`Competitor ${index + 1}`}
                      value={competitor.name}
                      onChange={(e) => onUpdateCompetitor(competitor.id, { name: e.target.value })}
                      className="border-red-200 focus:border-red-400"
                    />
                  </div>
                  
                  <div className="w-32 space-y-2">
                    <Label htmlFor={`competitor-price-${competitor.id}`}>Price ($)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        id={`competitor-price-${competitor.id}`}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={competitor.price || ''}
                        onChange={(e) => onUpdateCompetitor(competitor.id, { price: parseFloat(e.target.value) || 0 })}
                        className="pl-8 border-red-200 focus:border-red-400"
                      />
                    </div>
                  </div>
                  
                  {competitors.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveCompetitor(competitor.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`competitor-comparison-${competitor.id}`}>
                    Compare strengths & weaknesses
                  </Label>
                  <Textarea
                    id={`competitor-comparison-${competitor.id}`}
                    placeholder="How does your product compare? What are their strengths and weaknesses?"
                    value={competitor.comparison}
                    onChange={(e) => onUpdateCompetitor(competitor.id, { comparison: e.target.value })}
                    className="border-red-200 focus:border-red-400 min-h-16"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Button
          onClick={onAddCompetitor}
          variant="outline"
          className="w-full border-red-300 text-red-700 hover:bg-red-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add competitor
        </Button>
      </CardContent>
    </Card>
  );
}
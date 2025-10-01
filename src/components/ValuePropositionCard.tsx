import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Slider } from './ui/slider';

interface ValuePropositionCardProps {
  data: {
    specialAdvantages: string;
    benefitStrength: number;
    additionalNotes: string;
  };
  updateData: (updates: any) => void;
}

export function ValuePropositionCard({ data, updateData }: ValuePropositionCardProps) {
  const getStrengthLabel = (strength: number) => {
    if (strength <= 1) return "Weak";
    if (strength <= 2) return "Fair";
    if (strength <= 3) return "Good";
    if (strength <= 4) return "Strong";
    return "Very Strong";
  };

  return (
    <Card className="border-2 border-violet-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🎁</span>
          Unique Value Proposition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="specialAdvantages">Special Advantages Over Alternatives</Label>
          <Textarea
            id="specialAdvantages"
            placeholder="What specific advantages does your product have over the alternatives customers use today?"
            value={data.specialAdvantages}
            onChange={(e) => updateData({ specialAdvantages: e.target.value })}
            className="border-violet-200 focus:border-violet-400 min-h-20"
          />
        </div>
        
        <div className="space-y-4">
          <Label>Strength of Main Benefit (1-5)</Label>
          <div className="space-y-3">
            <Slider
              value={[data.benefitStrength]}
              onValueChange={(values) => updateData({ benefitStrength: values[0] })}
              max={5}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 - Weak</span>
              <span className="font-medium text-violet-600">
                {data.benefitStrength} - {getStrengthLabel(data.benefitStrength)}
              </span>
              <span>5 - Very Strong</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="additionalNotes">Additional Notes (optional)</Label>
          <Textarea
            id="additionalNotes"
            placeholder="Any other important information about your product's value..."
            value={data.additionalNotes}
            onChange={(e) => updateData({ additionalNotes: e.target.value })}
            className="border-violet-200 focus:border-violet-400 min-h-16"
          />
        </div>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ProductPositioningCardProps {
  data: {
    qualityLevel: 'Budget' | 'Standard' | 'Premium';
    uniqueSellingPoints: string;
    specialFeatures: string;
  };
  updateData: (updates: any) => void;
}

export function ProductPositioningCard({ data, updateData }: ProductPositioningCardProps) {
  return (
    <Card className="border-2 border-pink-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">⭐</span>
          Product Positioning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="qualityLevel">Quality Level</Label>
          <Select 
            value={data.qualityLevel} 
            onValueChange={(value: 'Budget' | 'Standard' | 'Premium') => updateData({ qualityLevel: value })}
          >
            <SelectTrigger className="border-pink-200 focus:border-pink-400">
              <SelectValue placeholder="Select quality level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Budget">Budget - Good value for money</SelectItem>
              <SelectItem value="Standard">Standard - Good quality, fair price</SelectItem>
              <SelectItem value="Premium">Premium - High quality, premium materials</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="uniqueSellingPoints">Unique Selling Points</Label>
          <Textarea
            id="uniqueSellingPoints"
            placeholder="What makes your product special? What sets it apart from competitors?"
            value={data.uniqueSellingPoints}
            onChange={(e) => updateData({ uniqueSellingPoints: e.target.value })}
            className="border-pink-200 focus:border-pink-400 min-h-20"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="specialFeatures">Special Features or Benefits</Label>
          <Textarea
            id="specialFeatures"
            placeholder="Specific features, benefits, or advantages your product offers..."
            value={data.specialFeatures}
            onChange={(e) => updateData({ specialFeatures: e.target.value })}
            className="border-pink-200 focus:border-pink-400 min-h-20"
          />
        </div>
      </CardContent>
    </Card>
  );
}
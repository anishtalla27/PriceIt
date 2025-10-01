import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Lightbulb } from 'lucide-react';

interface ProductBasicsCardProps {
  data: {
    productName: string;
    description: string;
    timeToMake: number;
    specialFeature: string;
  };
  updateData: (updates: any) => void;
}

export function ProductBasicsCard({ data, updateData }: ProductBasicsCardProps) {
  return (
    <Card className="border-2 border-purple-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Product Basics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="productName">Product Name</Label>
          <Input
            id="productName"
            placeholder="e.g. Sparkle Bracelet"
            value={data.productName}
            onChange={(e) => updateData({ productName: e.target.value })}
            className="border-purple-200 focus:border-purple-400"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Short Description</Label>
          <Textarea
            id="description"
            placeholder="Tell us about your product..."
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            className="border-purple-200 focus:border-purple-400 min-h-20"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="timeToMake">Time to make one product (minutes)</Label>
          <Input
            id="timeToMake"
            type="number"
            placeholder="60"
            value={data.timeToMake || ''}
            onChange={(e) => updateData({ timeToMake: parseInt(e.target.value) || 0 })}
            className="border-purple-200 focus:border-purple-400"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="specialFeature" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            How is your product special or different?
          </Label>
          <Textarea
            id="specialFeature"
            placeholder="What makes your product unique?"
            value={data.specialFeature}
            onChange={(e) => updateData({ specialFeature: e.target.value })}
            className="border-purple-200 focus:border-purple-400 min-h-16"
          />
        </div>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface ProductDefinitionCardProps {
  data: {
    productName: string;
    description: string;
    targetAudience: string;
    additionalInfo: string;
    location: string;
  };
  updateData: (updates: any) => void;
}

export function ProductDefinitionCard({ data, updateData }: ProductDefinitionCardProps) {
  return (
    <Card className="border-2 border-blue-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Product Basics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="productName">Product Name</Label>
          <Input
            id="productName"
            placeholder="Enter your product name..."
            value={data.productName}
            onChange={(e) => updateData({ productName: e.target.value })}
            className="border-blue-200 focus:border-blue-400"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Detailed Product Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your product in detail, including features, materials, size, etc..."
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            className="border-blue-200 focus:border-blue-400 min-h-24"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Input
            id="targetAudience"
            placeholder="e.g., Young professionals, Parents with toddlers, Fitness enthusiasts..."
            value={data.targetAudience}
            onChange={(e) => updateData({ targetAudience: e.target.value })}
            className="border-blue-200 focus:border-blue-400"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="additionalInfo">Additional Information</Label>
          <Textarea
            id="additionalInfo"
            placeholder="Constraints, objectives, differentiators, or other important details..."
            value={data.additionalInfo}
            onChange={(e) => updateData({ additionalInfo: e.target.value })}
            className="border-blue-200 focus:border-blue-400 min-h-20"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="City, State/Region"
            value={data.location}
            onChange={(e) => updateData({ location: e.target.value })}
            className="border-blue-200 focus:border-blue-400"
          />
        </div>
      </CardContent>
    </Card>
  );
}
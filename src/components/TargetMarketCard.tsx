import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface TargetMarketCardProps {
  data: {
    customerDemographic: string;
    typicalSpendingRange: string;
    competitionLevel: 'Low' | 'Medium' | 'High';
  };
  updateData: (updates: any) => void;
}

export function TargetMarketCard({ data, updateData }: TargetMarketCardProps) {
  return (
    <Card className="border-2 border-indigo-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Target Market
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="customerDemographic">Customer Demographic</Label>
          <Input
            id="customerDemographic"
            placeholder="e.g., 25-35 year old professionals, Parents with children 5-12..."
            value={data.customerDemographic}
            onChange={(e) => updateData({ customerDemographic: e.target.value })}
            className="border-indigo-200 focus:border-indigo-400"
          />
          <p className="text-xs text-gray-500">Age group, relationship to seller, lifestyle, etc.</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="typicalSpendingRange">Typical Spending Range ($)</Label>
          <Input
            id="typicalSpendingRange"
            placeholder="e.g., $20-50, $100-300, Under $25..."
            value={data.typicalSpendingRange}
            onChange={(e) => updateData({ typicalSpendingRange: e.target.value })}
            className="border-indigo-200 focus:border-indigo-400"
          />
          <p className="text-xs text-gray-500">What this customer segment typically spends on similar products</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="competitionLevel">Competition Level</Label>
          <Select 
            value={data.competitionLevel} 
            onValueChange={(value: 'Low' | 'Medium' | 'High') => updateData({ competitionLevel: value })}
          >
            <SelectTrigger className="border-indigo-200 focus:border-indigo-400">
              <SelectValue placeholder="Select competition level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low - Few similar products</SelectItem>
              <SelectItem value="Medium">Medium - Some competition</SelectItem>
              <SelectItem value="High">High - Lots of competitors</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
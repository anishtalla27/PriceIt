import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface SellingCardProps {
  data: {
    shippingCost: number;
    platformFees: number;
  };
  updateData: (updates: any) => void;
}

export function SellingCard({ data, updateData }: SellingCardProps) {
  const platformPresets = {
    etsy: { name: 'Etsy', fee: 6.5 },
    ebay: { name: 'eBay', fee: 12.9 },
    amazon: { name: 'Amazon', fee: 15 },
    shopify: { name: 'Shopify', fee: 2.9 },
    custom: { name: 'Custom', fee: data.platformFees }
  };

  return (
    <Card className="border-2 border-pink-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📦</span>
          Selling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="shippingCost">Shipping/delivery cost per product</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="shippingCost"
              type="number"
              step="0.01"
              placeholder="8.00"
              value={data.shippingCost}
              onChange={(e) => updateData({ shippingCost: parseFloat(e.target.value) || 0 })}
              className="pl-8 border-pink-200 focus:border-pink-400"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="platformFees">Platform fees per sale</Label>
          <Select onValueChange={(value) => {
            if (value !== 'custom') {
              updateData({ platformFees: platformPresets[value as keyof typeof platformPresets].fee });
            }
          }}>
            <SelectTrigger className="border-pink-200 focus:border-pink-400">
              <SelectValue placeholder="Select platform or custom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="etsy">Etsy (6.5%)</SelectItem>
              <SelectItem value="ebay">eBay (12.9%)</SelectItem>
              <SelectItem value="amazon">Amazon (15%)</SelectItem>
              <SelectItem value="shopify">Shopify (2.9%)</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              placeholder="5.0"
              value={data.platformFees}
              onChange={(e) => updateData({ platformFees: parseFloat(e.target.value) || 0 })}
              className="border-pink-200 focus:border-pink-400"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
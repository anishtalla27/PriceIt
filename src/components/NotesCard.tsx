import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface NotesCardProps {
  data: {
    notes: string;
  };
  updateData: (updates: any) => void;
}

export function NotesCard({ data, updateData }: NotesCardProps) {
  return (
    <Card className="border-2 border-gray-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          Additional Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="notes">Free text box for any extra costs or special circumstances</Label>
          <Textarea
            id="notes"
            placeholder="Any additional costs, seasonal variations, bulk discounts, or other important factors..."
            value={data.notes}
            onChange={(e) => updateData({ notes: e.target.value })}
            className="border-gray-200 focus:border-gray-400 min-h-24"
          />
        </div>
      </CardContent>
    </Card>
  );
}
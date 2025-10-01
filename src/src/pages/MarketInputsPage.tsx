import { Plus, Trash2, Trophy, TrendingUp, ArrowRight, ArrowLeft, Users, Target, Bot } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { generateCompetitorAnalysis } from '../services/ai';
import { Competitor } from '../types';

interface MarketInputsPageProps {
  data: any; // Accept the full data object
  updateData: (updates: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MarketInputsPage({ data, updateData, onNext, onBack }: MarketInputsPageProps) {
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // AI Competition Generation
  const generateAICompetitors = async () => {
    if (!data.productName || !data.productDescription) {
      toast.error("Please fill out product information first!");
      return;
    }

    setIsLoadingAI(true);
    try {
      const aiCompetitors = await generateCompetitorAnalysis({
        name: data.productName,
        description: data.productDescription,
        targetAge: data.targetAge,
        spendingRange: data.spendingRange
      });

      const newCompetitors: Competitor[] = aiCompetitors.competitors.map((comp, index) => ({
        id: `ai-competitor-${Date.now()}-${index}`,
        name: comp.name,
        price: Number(comp.price.toFixed(2)),
        strengths: comp.strengths,
        weaknesses: comp.weaknesses,
        website: comp.website || ''
      }));

      updateData({ competitors: newCompetitors });
      toast.success("🤖 AI has generated competitor analysis for your market!");
    } catch (error) {
      console.error('AI competitor generation failed:', error);
      toast.error("AI competitor generation failed, but you can still add competitors manually!");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const addCompetitor = () => {
    const newCompetitor: Competitor = {
      id: Date.now().toString(),
      name: '',
      price: 10.00,
      strengths: '',
      weaknesses: '',
      website: ''
    };
    updateData({ competitors: [...(data.competitors || []), newCompetitor] });
  };

  const updateCompetitor = (id: string, updates: Partial<Competitor>) => {
    const updatedCompetitors = (data.competitors || []).map((comp: Competitor) => 
      comp.id === id ? { ...comp, ...updates } : comp
    );
    updateData({ competitors: updatedCompetitors });
  };

  const removeCompetitor = (id: string) => {
    updateData({ competitors: (data.competitors || []).filter((c: Competitor) => c.id !== id) });
  };

  const ageGroups = [
    '3-5 years', '6-8 years', '8-12 years', '13-16 years', '17+ years'
  ];

  const spendingRanges = [
    '$1-5', '$5-10', '$10-20', '$20-50', '$50+'
  ];

  const competitionLevels = [
    { value: 'Low', label: 'Low - Few competitors', color: 'text-green-600' },
    { value: 'Medium', label: 'Medium - Some competition', color: 'text-yellow-600' },
    { value: 'High', label: 'High - Lots of competition', color: 'text-red-600' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-full w-fit mx-auto">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800">Market Research</h1>
        <p className="text-xl text-gray-600">Know your competition and target customers! 🎯</p>
      </div>

      {/* Market Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Target Age */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Target Age</h3>
              <p className="text-gray-600">Who will buy this?</p>
            </div>
          </div>
          <Select
            value={data.targetAge}
            onValueChange={(value) => updateData({ targetAge: value })}
          >
            <SelectTrigger className="border-2 border-blue-200 text-lg p-4">
              <SelectValue placeholder="Select age group..." />
            </SelectTrigger>
            <SelectContent>
              {ageGroups.map((age) => (
                <SelectItem key={age} value={age}>
                  {age}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Spending Range */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Spending Range</h3>
              <p className="text-gray-600">How much they spend</p>
            </div>
          </div>
          <Select
            value={data.spendingRange}
            onValueChange={(value) => updateData({ spendingRange: value })}
          >
            <SelectTrigger className="border-2 border-green-200 text-lg p-4">
              <SelectValue placeholder="Select spending range..." />
            </SelectTrigger>
            <SelectContent>
              {spendingRanges.map((range) => (
                <SelectItem key={range} value={range}>
                  {range}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Competition Level */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-purple-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Competition</h3>
              <p className="text-gray-600">How many competitors?</p>
            </div>
          </div>
          <Select
            value={data.competitionLevel}
            onValueChange={(value) => updateData({ competitionLevel: value })}
          >
            <SelectTrigger className="border-2 border-purple-200 text-lg p-4">
              <SelectValue placeholder="Select competition level..." />
            </SelectTrigger>
            <SelectContent>
              {competitionLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  <span className={level.color}>{level.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Competitor Analysis Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">🏆 Competitor Analysis</h2>
          <p className="text-gray-600 mb-6">Research your competition to price competitively!</p>
          
          {/* AI Generate Button */}
          <Button
            onClick={generateAICompetitors}
            disabled={isLoadingAI}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg rounded-2xl shadow-lg hover:scale-105 transition-all disabled:opacity-50"
          >
            <Bot className="w-6 h-6 mr-3" />
            {isLoadingAI ? '🤖 Analyzing Market...' : '🤖 AI Generate Competitors'}
          </Button>
          <p className="text-sm text-gray-600 mt-2">
            Let AI research competitors for "{data.productName}" in your market!
          </p>
        </div>

        {/* Competitors Grid */}
        <div className="space-y-4">
          {(data.competitors || []).map((competitor: Competitor) => (
            <div key={competitor.id} className="bg-white rounded-3xl p-6 shadow-xl border-4 border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">🏪</span>
                  <h4 className="text-xl font-bold text-gray-800">Competitor</h4>
                </div>
                <Button
                  onClick={() => removeCompetitor(competitor.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Competitor Name</label>
                    <Input
                      value={competitor.name}
                      onChange={(e) => updateCompetitor(competitor.id, { name: e.target.value })}
                      placeholder="e.g., Amazing Products Co."
                      className="border-2 border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Their Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={competitor.price}
                        onChange={(e) => updateCompetitor(competitor.id, { price: parseFloat(e.target.value) || 0 })}
                        className="pl-8 border-2 border-orange-200 focus:border-orange-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website (Optional)</label>
                    <Input
                      value={competitor.website || ''}
                      onChange={(e) => updateCompetitor(competitor.id, { website: e.target.value })}
                      placeholder="e.g., www.competitor.com"
                      className="border-2 border-orange-200 focus:border-orange-400"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Their Strengths</label>
                    <Textarea
                      value={competitor.strengths}
                      onChange={(e) => updateCompetitor(competitor.id, { strengths: e.target.value })}
                      placeholder="What they do well..."
                      className="border-2 border-green-200 focus:border-green-400 min-h-[60px]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Their Weaknesses</label>
                    <Textarea
                      value={competitor.weaknesses}
                      onChange={(e) => updateCompetitor(competitor.id, { weaknesses: e.target.value })}
                      placeholder="What they could improve..."
                      className="border-2 border-red-200 focus:border-red-400 min-h-[60px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Competitor Button */}
        <div className="text-center">
          <Button
            onClick={addCompetitor}
            variant="outline"
            className="border-orange-300 text-orange-600 hover:bg-orange-50 px-8 py-3 text-lg rounded-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Another Competitor
          </Button>
        </div>
      </div>

      {/* Market Summary */}
      {(data.competitors || []).length > 0 && (
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-4 border-yellow-300 rounded-3xl p-6 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">📊 Market Summary</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border-2 border-yellow-300">
              <div className="text-2xl font-bold text-blue-600">
                ${((data.competitors || []).reduce((sum: number, comp: Competitor) => sum + comp.price, 0) / (data.competitors || []).length).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Average Competitor Price</div>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-yellow-300">
              <div className="text-2xl font-bold text-green-600">
                ${Math.min(...(data.competitors || []).map((comp: Competitor) => comp.price)).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Lowest Price</div>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-yellow-300">
              <div className="text-2xl font-bold text-red-600">
                ${Math.max(...(data.competitors || []).map((comp: Competitor) => comp.price)).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Highest Price</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-8 py-3 text-lg rounded-xl border-2 border-gray-300 hover:border-gray-400"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        <Button
          onClick={onNext}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg rounded-xl shadow-lg hover:scale-105 transition-all"
        >
          Next Step
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Tip */}
      <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-4 text-center">
        <p className="text-blue-800">
          <span className="text-2xl mr-2">💡</span>
          <strong>Pro Tip:</strong> Research real competitors online or visit stores to find accurate pricing!
        </p>
      </div>
    </div>
  );
}
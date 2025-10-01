import { Plus, Trash2, Heart, Lightbulb, ArrowRight, ArrowLeft, Zap, Bot } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { generateValueAnalysis } from '../services/ai';
import { Alternative } from '../types';

interface ValueInputsPageProps {
  data: {
    productName: string;
    productDescription: string;
    uniqueFeature: string;
    problemSolved: string;
    specialBenefit: string;
    alternatives: Alternative[];
  };
  updateData: (updates: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ValueInputsPage({ data, updateData, onNext, onBack }: ValueInputsPageProps) {
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // AI Value Analysis Generation
  const generateAIValue = async () => {
    if (!data.productName || !data.productDescription || !data.uniqueFeature) {
      toast.error("Please complete product information first!");
      return;
    }

    setIsLoadingAI(true);
    try {
      const aiValue = await generateValueAnalysis({
        name: data.productName,
        description: data.productDescription,
        uniqueFeature: data.uniqueFeature
      });

      const newAlternatives: Alternative[] = aiValue.alternatives.map((alt, index) => ({
        id: `ai-alternative-${Date.now()}-${index}`,
        name: alt.name,
        cost: Number(alt.cost.toFixed(2))
      }));

      updateData({
        problemSolved: aiValue.problemSolved,
        specialBenefit: aiValue.specialBenefit,
        alternatives: newAlternatives
      });

      toast.success("🤖 AI has analyzed your product's value proposition!");
    } catch (error) {
      console.error('AI value analysis failed:', error);
      toast.error("AI value analysis failed, but you can still fill this out manually!");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const addAlternative = () => {
    const newAlternative: Alternative = {
      id: Date.now().toString(),
      name: '',
      cost: 5
    };
    updateData({ alternatives: [...data.alternatives, newAlternative] });
  };

  const updateAlternative = (id: string, updates: Partial<Alternative>) => {
    const updatedAlternatives = data.alternatives.map(alternative =>
      alternative.id === id ? { ...alternative, ...updates } : alternative
    );
    updateData({ alternatives: updatedAlternatives });
  };

  const removeAlternative = (id: string) => {
    if (data.alternatives.length > 1) {
      updateData({ alternatives: data.alternatives.filter(a => a.id !== id) });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 rounded-full w-fit mx-auto">
          <Heart className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800">Customer Value</h1>
        <p className="text-xl text-gray-600">Why will people love your product? What makes it worth buying?</p>
      </div>

      {/* AI Generate Button */}
      <div className="text-center">
        <Button
          onClick={generateAIValue}
          disabled={isLoadingAI}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg rounded-2xl shadow-lg hover:scale-105 transition-all disabled:opacity-50"
        >
          <Bot className="w-6 h-6 mr-3" />
          {isLoadingAI ? '🤖 Analyzing Value...' : '🤖 AI Generate Value Analysis'}
        </Button>
        <p className="text-sm text-gray-600 mt-2">
          Let AI analyze the value proposition for "{data.productName}"!
        </p>
      </div>

      {/* Value Cards */}
      <div className="space-y-6">
        {/* Problem Solved */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-red-200 hover:border-red-400 transition-colors">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Zap className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Core Problem Solved</h3>
              <p className="text-gray-600">What problem does your product fix or what need does it meet?</p>
            </div>
          </div>
          <Textarea
            value={data.problemSolved}
            onChange={(e) => updateData({ problemSolved: e.target.value })}
            placeholder="e.g., Kids get bored and need something fun to do with their hands..."
            className="text-lg p-4 rounded-xl border-2 border-red-200 focus:border-red-400 min-h-[120px]"
          />
        </div>

        {/* Special Benefit */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-yellow-200 hover:border-yellow-400 transition-colors">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Lightbulb className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Special Benefits</h3>
              <p className="text-gray-600">What unique benefits do customers get from YOUR product specifically?</p>
            </div>
          </div>
          <Textarea
            value={data.specialBenefit}
            onChange={(e) => updateData({ specialBenefit: e.target.value })}
            placeholder="e.g., My slime helps kids relax, develops creativity, and glows in the dark which no other slime does..."
            className="text-lg p-4 rounded-xl border-2 border-yellow-200 focus:border-yellow-400 min-h-[120px]"
          />
        </div>

        {/* Alternatives Section */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-purple-200">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-purple-100 p-3 rounded-full">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Alternative Options</h3>
              <p className="text-gray-600">What other options do customers have instead of your product?</p>
            </div>
          </div>

          <div className="space-y-4">
            {data.alternatives.map((alternative) => (
              <div key={alternative.id} className="bg-purple-50 rounded-2xl p-4 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">🔄</span>
                  {data.alternatives.length > 1 && (
                    <Button
                      onClick={() => removeAlternative(alternative.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alternative Name</label>
                    <Input
                      value={alternative.name}
                      onChange={(e) => updateAlternative(alternative.id, { name: e.target.value })}
                      placeholder="e.g., Making it themselves, buying from store..."
                      className="border-2 border-purple-200 focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Their Cost</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={alternative.cost}
                        onChange={(e) => updateAlternative(alternative.id, { cost: parseFloat(e.target.value) || 0 })}
                        className="pl-8 border-2 border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <Button
              onClick={addAlternative}
              variant="outline"
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Alternative
            </Button>
          </div>
        </div>
      </div>

      {/* Value Summary */}
      {data.alternatives.length > 0 && (
        <div className="bg-gradient-to-r from-green-100 to-blue-100 border-4 border-green-300 rounded-3xl p-6 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">💰 Value Comparison</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border-2 border-green-300">
              <div className="text-2xl font-bold text-green-600">
                ${(data.alternatives.reduce((sum, alt) => sum + alt.cost, 0) / data.alternatives.length).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Average Alternative Cost</div>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-blue-300">
              <div className="text-2xl font-bold text-blue-600">
                {data.alternatives.length}
              </div>
              <div className="text-sm text-gray-600">Alternative Options</div>
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
          See Results!
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-pink-100 border-2 border-pink-300 rounded-2xl p-4 text-center">
          <p className="text-pink-800">
            <span className="text-2xl mr-2">💡</span>
            <strong>Tip:</strong> Think about what makes your product special and different!
          </p>
        </div>
        <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-4 text-center">
          <p className="text-blue-800">
            <span className="text-2xl mr-2">🎯</span>
            <strong>Value Tip:</strong> If your product solves a big problem, people will pay more!
          </p>
        </div>
      </div>
    </div>
  );
}
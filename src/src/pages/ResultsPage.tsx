import { DollarSign, TrendingUp, Heart, Star, ArrowLeft, RefreshCw, Edit, Crown, Bot } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import { callAI } from '../services/ai';
import { AppData, AIPricingStrategies } from '../types';

interface ResultsPageProps {
  costPlusPrice: number;
  marketPrice: number;
  valuePrice: number;
  totalMaterialCost: number;
  data: AppData;
  onBack: () => void;
  onRestart: () => void;
}

export function ResultsPage({ costPlusPrice, marketPrice, valuePrice, totalMaterialCost, data, onBack, onRestart }: ResultsPageProps) {
  const [finalPrice, setFinalPrice] = useState(Math.max(costPlusPrice, marketPrice, valuePrice));
  const [selectedPricing, setSelectedPricing] = useState<'cost' | 'market' | 'value' | null>(null);
  const [aiPricingStrategies, setAiPricingStrategies] = useState<AIPricingStrategies | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  // Calculate additional metrics
  const profitMargin = ((finalPrice - totalMaterialCost) / finalPrice) * 100;
  const averageCompetitorPrice = data.competitors.length > 0
    ? data.competitors.reduce((sum, comp) => sum + comp.price, 0) / data.competitors.length
    : 0;

  // Generate AI pricing analysis on component mount
  useEffect(() => {
    generateAIPricingAnalysis();
  }, []);

  const generateAIPricingAnalysis = async () => {
    setIsLoadingAI(true);
    try {
      const currentMaterialCost = data.directCosts.reduce((sum, cost) => {
        return sum + (cost.unitsProduced > 0 ? cost.costPerUnit / cost.unitsProduced : cost.costPerUnit);
      }, 0);
      
      const currentEquipmentCost = data.indirectCosts.reduce((sum, cost) => {
        return sum + (cost.unitsBeforeReplacement > 0 ? cost.totalCost / cost.unitsBeforeReplacement : 0);
      }, 0);
      
      const currentExtraCost = data.extraCosts.reduce((sum, cost) => sum + cost.costPerUnit, 0);

      const aiInput = {
        productName: data.productName,
        productDescription: data.productDescription,
        uniqueFeature: data.uniqueFeature,
        targetAge: data.targetAge,
        spendingRange: data.spendingRange,
        competitionLevel: data.competitionLevel,
        currentCosts: {
          materials: currentMaterialCost,
          equipment: currentEquipmentCost,
          extra: currentExtraCost
        }
      };

      const aiResponse = await callAI(aiInput);
      setAiPricingStrategies(aiResponse.pricingStrategies);
      toast.success("🤖 AI has analyzed your pricing strategies!");
    } catch (error) {
      console.error('AI pricing analysis failed:', error);
      // Use fallback pricing strategies
      setAiPricingStrategies({
        costPlus: {
          price: costPlusPrice,
          markup: 50,
          explanation: "This pricing adds a 50% markup to your total costs, ensuring you make a profit on each sale."
        },
        market: {
          price: marketPrice,
          explanation: "This price is competitive with similar products in the market while maintaining good profit margins."
        },
        value: {
          price: valuePrice,
          explanation: "This price reflects the unique value your product provides compared to alternatives."
        }
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const pricingOptions = [
    {
      id: 'cost',
      title: 'Cost-Plus Price',
      price: aiPricingStrategies?.costPlus.price || costPlusPrice,
      icon: DollarSign,
      color: 'from-green-400 to-emerald-500',
      borderColor: 'border-green-300',
      bgColor: 'bg-green-50',
      explanation: aiPricingStrategies?.costPlus.explanation || 'This covers your costs and gives you a nice profit!',
      pros: ['Guaranteed profit', 'Easy to calculate', 'Safe choice'],
      emoji: '💰'
    },
    {
      id: 'market',
      title: 'Market Price',
      price: aiPricingStrategies?.market.price || marketPrice,
      icon: TrendingUp,
      color: 'from-blue-400 to-cyan-500',
      borderColor: 'border-blue-300',
      bgColor: 'bg-blue-50',
      explanation: aiPricingStrategies?.market.explanation || 'This matches what your competitors are charging.',
      pros: ['Competitive pricing', 'Market tested', 'Easy to sell'],
      emoji: '📈'
    },
    {
      id: 'value',
      title: 'Value Price',
      price: aiPricingStrategies?.value.price || valuePrice,
      icon: Heart,
      color: 'from-purple-400 to-pink-500',
      borderColor: 'border-purple-300',
      bgColor: 'bg-purple-50',
      explanation: aiPricingStrategies?.value.explanation || 'This reflects how much value you provide to customers.',
      pros: ['Higher profits', 'Rewards quality', 'Premium positioning'],
      emoji: '⭐'
    }
  ];

  const bestPrice = Math.max(...pricingOptions.map(option => option.price));
  const recommendedOption = pricingOptions.find(option => option.price === bestPrice);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full w-fit mx-auto">
          <Crown className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800">🎉 Your Pricing Results! 🎉</h1>
        <p className="text-xl text-gray-600">Here are three smart pricing strategies for your awesome product!</p>
        
        {isLoadingAI && (
          <div className="flex items-center justify-center space-x-2 text-purple-600">
            <Bot className="w-5 h-5 animate-spin" />
            <span>AI is analyzing your pricing strategies...</span>
          </div>
        )}
      </div>

      {/* AI Regenerate Button */}
      <div className="text-center">
        <Button
          onClick={generateAIPricingAnalysis}
          disabled={isLoadingAI}
          variant="outline"
          className="border-purple-300 text-purple-600 hover:bg-purple-50"
        >
          <Bot className="w-5 h-5 mr-2" />
          {isLoadingAI ? 'Analyzing...' : '🤖 Regenerate AI Analysis'}
        </Button>
      </div>

      {/* Pricing Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {pricingOptions.map((option) => (
          <div 
            key={option.id}
            className={`relative bg-white rounded-3xl p-6 shadow-xl border-4 ${option.borderColor} hover:scale-105 transition-all cursor-pointer ${
              selectedPricing === option.id ? 'ring-4 ring-yellow-400' : ''
            }`}
            onClick={() => {
              setSelectedPricing(option.id as any);
              setFinalPrice(option.price);
            }}
          >
            {/* Recommended Badge */}
            {option.price === bestPrice && (
              <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                🏆 Recommended
              </div>
            )}

            <div className={`${option.bgColor} rounded-2xl p-4 mb-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`bg-gradient-to-r ${option.color} p-3 rounded-full`}>
                  <option.icon className="w-8 h-8 text-white" />
                </div>
                <span className="text-3xl">{option.emoji}</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{option.title}</h3>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                ${option.price.toFixed(2)}
              </div>
              
              <p className="text-gray-600 text-sm mb-3">{option.explanation}</p>
              
              <div className="space-y-1">
                {option.pros.map((pro, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <span className="text-green-500 mr-2">✓</span>
                    {pro}
                  </div>
                ))}
              </div>
            </div>

            {/* Profit Margin for this price */}
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-sm text-gray-600">Profit Margin</div>
              <div className="text-lg font-bold text-green-600">
                {(((option.price - totalMaterialCost) / option.price) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Price Summary */}
      {selectedPricing && (
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-4 border-yellow-400 rounded-3xl p-6 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            🎯 Your Selected Price: ${finalPrice.toFixed(2)}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-3 border-2 border-yellow-300">
              <div className="text-lg font-bold text-green-600">${totalMaterialCost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Costs</div>
            </div>
            <div className="bg-white rounded-xl p-3 border-2 border-yellow-300">
              <div className="text-lg font-bold text-blue-600">${(finalPrice - totalMaterialCost).toFixed(2)}</div>
              <div className="text-sm text-gray-600">Profit per Unit</div>
            </div>
            <div className="bg-white rounded-xl p-3 border-2 border-yellow-300">
              <div className="text-lg font-bold text-purple-600">{profitMargin.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Profit Margin</div>
            </div>
            <div className="bg-white rounded-xl p-3 border-2 border-yellow-300">
              <div className="text-lg font-bold text-orange-600">
                {averageCompetitorPrice > 0 ? 
                  `${((finalPrice / averageCompetitorPrice - 1) * 100).toFixed(1)}%` : 
                  'N/A'
                }
              </div>
              <div className="text-sm text-gray-600">vs Competition</div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Price Input */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Edit className="w-6 h-6 mr-3" />
          Set Your Own Price
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl">$</span>
              <Input
                type="number"
                step="0.01"
                value={finalPrice}
                onChange={(e) => {
                  setFinalPrice(parseFloat(e.target.value) || 0);
                  setSelectedPricing(null);
                }}
                className="pl-8 text-2xl py-4 border-2 border-gray-300 rounded-xl"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Profit Margin</div>
            <div className={`text-lg font-bold ${profitMargin > 20 ? 'text-green-600' : profitMargin > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(1)}%
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          💡 <strong>Tip:</strong> A healthy profit margin is usually 20-50% for products like yours!
        </p>
      </div>

      {/* Market Analysis */}
      {data.competitors.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-blue-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Market Comparison</h3>
          <div className="space-y-3">
            {data.competitors.map((competitor) => (
              <div key={competitor.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-800">{competitor.name}</div>
                  <div className="text-sm text-gray-600">{competitor.strengths}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">${competitor.price.toFixed(2)}</div>
                  <div className={`text-sm ${finalPrice > competitor.price ? 'text-red-600' : finalPrice < competitor.price ? 'text-green-600' : 'text-gray-600'}`}>
                    {finalPrice > competitor.price ? `+$${(finalPrice - competitor.price).toFixed(2)}` :
                     finalPrice < competitor.price ? `-$${(competitor.price - finalPrice).toFixed(2)}` :
                     'Same price'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Value Analysis */}
      {data.alternatives.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-purple-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💎 Value Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-purple-600 mb-2">Problem You Solve</h4>
              <p className="text-gray-700 text-sm">{data.problemSolved}</p>
            </div>
            <div>
              <h4 className="font-bold text-purple-600 mb-2">Your Special Benefits</h4>
              <p className="text-gray-700 text-sm">{data.specialBenefit}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-bold text-purple-600 mb-3">Alternatives Comparison</h4>
            <div className="space-y-2">
              {data.alternatives.map((alternative) => (
                <div key={alternative.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                  <span className="text-gray-700">{alternative.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">${alternative.cost.toFixed(2)}</span>
                    <span className={`text-sm ${finalPrice > alternative.cost ? 'text-red-600' : 'text-green-600'}`}>
                      ({finalPrice > alternative.cost ? `+$${(finalPrice - alternative.cost).toFixed(2)}` : `-$${(alternative.cost - finalPrice).toFixed(2)}`})
                    </span>
                  </div>
                </div>
              ))}
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
          onClick={onRestart}
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 text-lg rounded-xl shadow-lg hover:scale-105 transition-all"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Start New Product
        </Button>
      </div>

      {/* Success Message */}
      <div className="bg-gradient-to-r from-green-100 to-blue-100 border-4 border-green-300 rounded-3xl p-6 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">🎉 Congratulations!</h3>
        <p className="text-gray-700">
          You've successfully analyzed your product pricing! Remember to test your price with real customers and adjust as needed. 
          Good luck with your business venture! 🚀
        </p>
      </div>
    </div>
  );
}
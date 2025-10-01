import { Plus, Trash2, DollarSign, ArrowRight, ArrowLeft, Edit, Package, Wrench, Truck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { generateCostSuggestions } from '../services/ai';
import { DirectCost, IndirectCost, ExtraCost } from '../types';

interface CostInputsPageProps {
  data: {
    productName: string;
    productDescription: string;
    directCosts: DirectCost[];
    indirectCosts: IndirectCost[];
    extraCosts: ExtraCost[];
  };
  updateData: (updates: any) => void;
  onNext: () => void;
  onBack: () => void;
  totalCost: number;
}

const materialIcons = {
  materials: ['🧱', '🪵', '🎨', '📄', '🧵', '⚡', '🔧', '💎', '🍯', '🌿', '🔮', '⭐'],
  packaging: ['📦', '🏷️', '🎁', '📄', '🛍️', '🗃️', '📋', '🎀', '🏺', '🥤', '📘', '🍱'],
  equipment: ['🔧', '⚙️', '🖥️', '📱', '🖨️', '⚡', '🔌', '🛠️', '📡', '🎛️', '⚗️', '🧪'],
  overhead: ['🏢', '💡', '🌐', '📞', '🚗', '📊', '💼', '🗂️', '📋', '🏦', '📈', '💰'],
  shipping: ['📦', '🚚', '✈️', '🚢', '📫', '🎯', '🏷️', '📍', '🌍', '⏰', '🔄', '📮'],
  marketing: ['📢', '🎯', '📱', '🌟', '📺', '📰', '🎨', '💬', '📧', '🔊', '🎪', '🚀'],
  other: ['❓', '⭐', '🎯', '🔮', '💡', '🎪', '🎭', '🎨', '🎵', '🎸', '🎲', '🎳']
};

const extraCostOptions = [
  { value: 'shipping', label: 'Shipping & Delivery', icon: '📦' },
  { value: 'marketing', label: 'Marketing & Ads', icon: '📢' },
  { value: 'other', label: 'Other Costs', icon: '❓' }
];

export function CostInputsPage({ data, updateData, onNext, onBack, totalCost }: CostInputsPageProps) {
  const [activeTab, setActiveTab] = useState<'direct' | 'indirect' | 'extra'>('direct');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  // AI Cost Generation using the AI service
  const generateAICosts = async () => {
    if (!data.productName || !data.productDescription) {
      toast.error("Please fill out product name and description first!");
      return;
    }

    setIsLoadingAI(true);
    try {
      const aiCosts = await generateCostSuggestions({
        name: data.productName,
        description: data.productDescription,
        category: 'general'
      });

      // Convert AI suggestions to our format
      const newDirectCosts: DirectCost[] = [
        ...aiCosts.materials.map((item, index) => ({
          id: `ai-material-${Date.now()}-${index}`,
          name: item.name,
          icon: materialIcons.materials[index % materialIcons.materials.length],
          costPerUnit: Number(item.costPerUnit.toFixed(2)),
          unitsProduced: item.unitsProduced,
          category: 'materials' as const
        })),
        ...aiCosts.packaging.map((item, index) => ({
          id: `ai-packaging-${Date.now()}-${index}`,
          name: item.name,
          icon: materialIcons.packaging[index % materialIcons.packaging.length],
          costPerUnit: Number(item.costPerUnit.toFixed(2)),
          unitsProduced: item.unitsProduced,
          category: 'packaging' as const
        }))
      ];

      const newIndirectCosts: IndirectCost[] = aiCosts.equipment.map((item, index) => ({
        id: `ai-equipment-${Date.now()}-${index}`,
        name: item.name,
        icon: materialIcons.equipment[index % materialIcons.equipment.length],
        totalCost: Number(item.totalCost.toFixed(2)),
        unitsBeforeReplacement: item.unitsBeforeReplacement,
        category: 'equipment' as const
      }));

      const newExtraCosts: ExtraCost[] = aiCosts.extra.map((item, index) => ({
        id: `ai-extra-${Date.now()}-${index}`,
        name: item.name,
        icon: materialIcons[item.category as keyof typeof materialIcons]?.[0] || '❓',
        costPerUnit: Number(item.costPerUnit.toFixed(2)),
        category: item.category as 'shipping' | 'marketing' | 'other'
      }));

      updateData({
        directCosts: newDirectCosts,
        indirectCosts: newIndirectCosts,
        extraCosts: newExtraCosts
      });

      toast.success("🤖 AI has generated cost suggestions for your product!");
    } catch (error) {
      console.error('AI cost generation failed:', error);
      toast.error("AI cost generation failed, but you can still add costs manually!");
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Direct Costs Functions
  const addDirectCost = (category: 'materials' | 'packaging') => {
    const newCost: DirectCost = {
      id: Date.now().toString(),
      name: '',
      icon: materialIcons[category][Math.floor(Math.random() * materialIcons[category].length)],
      costPerUnit: 1.00,
      unitsProduced: 1,
      category
    };
    updateData({ directCosts: [...data.directCosts, newCost] });
  };

  const updateDirectCost = (id: string, updates: Partial<DirectCost>) => {
    const updated = data.directCosts.map(cost => 
      cost.id === id ? { ...cost, ...updates } : cost
    );
    updateData({ directCosts: updated });
  };

  const removeDirectCost = (id: string) => {
    updateData({ directCosts: data.directCosts.filter(c => c.id !== id) });
  };

  // Indirect Costs Functions
  const addIndirectCost = (category: 'equipment' | 'startup') => {
    const newCost: IndirectCost = {
      id: Date.now().toString(),
      name: '',
      icon: materialIcons[category === 'equipment' ? 'equipment' : 'overhead'][Math.floor(Math.random() * materialIcons[category === 'equipment' ? 'equipment' : 'overhead'].length)],
      totalCost: category === 'equipment' ? 100 : 50,
      unitsBeforeReplacement: category === 'equipment' ? 200 : 500,
      category
    };
    updateData({ indirectCosts: [...data.indirectCosts, newCost] });
  };

  const updateIndirectCost = (id: string, updates: Partial<IndirectCost>) => {
    const updated = data.indirectCosts.map(cost => 
      cost.id === id ? { ...cost, ...updates } : cost
    );
    updateData({ indirectCosts: updated });
  };

  const removeIndirectCost = (id: string) => {
    updateData({ indirectCosts: data.indirectCosts.filter(c => c.id !== id) });
  };

  // Extra Costs Functions
  const addExtraCost = () => {
    const newCost: ExtraCost = {
      id: Date.now().toString(),
      name: '',
      icon: '❓',
      costPerUnit: 0.50,
      category: 'other'
    };
    updateData({ extraCosts: [...data.extraCosts, newCost] });
  };

  const updateExtraCost = (id: string, updates: Partial<ExtraCost>) => {
    const updated = data.extraCosts.map(cost => 
      cost.id === id ? { ...cost, ...updates } : cost
    );
    updateData({ extraCosts: updated });
  };

  const removeExtraCost = (id: string) => {
    updateData({ extraCosts: data.extraCosts.filter(c => c.id !== id) });
  };

  const tabs = [
    { id: 'direct', label: 'Direct Costs', icon: Package, color: 'from-green-400 to-green-500' },
    { id: 'indirect', label: 'Equipment & Startup', icon: Wrench, color: 'from-blue-400 to-blue-500' },
    { id: 'extra', label: 'Extra Costs', icon: Truck, color: 'from-orange-400 to-orange-500' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 rounded-full w-fit mx-auto">
          <DollarSign className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800">Enhanced Cost Analysis</h1>
        <p className="text-xl text-gray-600">Let's break down ALL your costs like a pro! 🎯</p>
      </div>

      {/* AI Generate Button */}
      <div className="text-center">
        <Button
          onClick={generateAICosts}
          disabled={isLoadingAI}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg rounded-2xl shadow-lg hover:scale-105 transition-all disabled:opacity-50"
        >
          <Edit className="w-6 h-6 mr-3" />
          {isLoadingAI ? '🤖 Generating...' : '🤖 AI Generate All Costs'}
        </Button>
        <p className="text-sm text-gray-600 mt-2">
          Let AI analyze "{data.productName}" and suggest realistic costs for everything!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-4 rounded-2xl transition-all ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-6 h-6 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Direct Costs Tab */}
      {activeTab === 'direct' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">💰 Direct Costs</h3>
            <p className="text-gray-600">Costs tied directly to making each product</p>
          </div>
          
          {/* Materials Section */}
          <div className="bg-green-50 rounded-3xl p-6 border-2 border-green-200">
            <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Package className="w-6 h-6 mr-2 text-green-600" />
              Materials & Ingredients
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {data.directCosts.filter(c => c.category === 'materials').map((cost) => (
                <div key={cost.id} className="bg-white rounded-2xl p-4 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{cost.icon}</span>
                    <Button
                      onClick={() => removeDirectCost(cost.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <Input
                      value={cost.name}
                      onChange={(e) => updateDirectCost(cost.id, { name: e.target.value })}
                      placeholder="Material name..."
                      className="border-2 border-green-200"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Cost per Unit</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={cost.costPerUnit}
                            onChange={(e) => updateDirectCost(cost.id, { costPerUnit: parseFloat(e.target.value) || 0 })}
                            className="pl-8 border-2 border-green-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Units Made</label>
                        <Input
                          type="number"
                          value={cost.unitsProduced}
                          onChange={(e) => updateDirectCost(cost.id, { unitsProduced: parseInt(e.target.value) || 1 })}
                          className="border-2 border-green-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => addDirectCost('materials')}
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Material
            </Button>
          </div>

          {/* Packaging Section */}
          <div className="bg-blue-50 rounded-3xl p-6 border-2 border-blue-200">
            <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Package className="w-6 h-6 mr-2 text-blue-600" />
              Packaging & Labels
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {data.directCosts.filter(c => c.category === 'packaging').map((cost) => (
                <div key={cost.id} className="bg-white rounded-2xl p-4 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{cost.icon}</span>
                    <Button
                      onClick={() => removeDirectCost(cost.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <Input
                      value={cost.name}
                      onChange={(e) => updateDirectCost(cost.id, { name: e.target.value })}
                      placeholder="Packaging item..."
                      className="border-2 border-blue-200"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Cost per Unit</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={cost.costPerUnit}
                            onChange={(e) => updateDirectCost(cost.id, { costPerUnit: parseFloat(e.target.value) || 0 })}
                            className="pl-8 border-2 border-blue-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Units Made</label>
                        <Input
                          type="number"
                          value={cost.unitsProduced}
                          onChange={(e) => updateDirectCost(cost.id, { unitsProduced: parseInt(e.target.value) || 1 })}
                          className="border-2 border-blue-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => addDirectCost('packaging')}
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Packaging
            </Button>
          </div>
        </div>
      )}

      {/* Indirect Costs Tab */}
      {activeTab === 'indirect' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">🏭 Equipment & Startup Costs</h3>
            <p className="text-gray-600">One-time costs spread over multiple units</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.indirectCosts.map((cost) => (
              <div key={cost.id} className="bg-white rounded-3xl p-6 border-4 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{cost.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-800">{cost.category === 'equipment' ? 'Equipment' : 'Startup'}</h4>
                      <p className="text-sm text-gray-600">
                        ${(cost.unitsBeforeReplacement > 0 ? cost.totalCost / cost.unitsBeforeReplacement : 0).toFixed(2)}/unit
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeIndirectCost(cost.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <Input
                    value={cost.name}
                    onChange={(e) => updateIndirectCost(cost.id, { name: e.target.value })}
                    placeholder="Cost name..."
                    className="border-2 border-blue-200"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          type="number"
                          value={cost.totalCost}
                          onChange={(e) => updateIndirectCost(cost.id, { totalCost: parseFloat(e.target.value) || 0 })}
                          className="pl-8 border-2 border-blue-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Units Before Replacement</label>
                      <Input
                        type="number"
                        value={cost.unitsBeforeReplacement}
                        onChange={(e) => updateIndirectCost(cost.id, { unitsBeforeReplacement: parseInt(e.target.value) || 0 })}
                        className="border-2 border-blue-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => addIndirectCost('equipment')}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Equipment Cost
            </Button>
            <Button
              onClick={() => addIndirectCost('startup')}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Startup Cost
            </Button>
          </div>
        </div>
      )}

      {/* Extra Costs Tab */}
      {activeTab === 'extra' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">📦 Extra Costs</h3>
            <p className="text-gray-600">Additional costs like shipping, marketing, etc.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.extraCosts.map((cost) => (
              <div key={cost.id} className="bg-white rounded-3xl p-6 border-4 border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{cost.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-800 capitalize">{cost.category} Cost</h4>
                      <p className="text-sm text-gray-600">${cost.costPerUnit.toFixed(2)} per unit</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeExtraCost(cost.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <Input
                    value={cost.name}
                    onChange={(e) => updateExtraCost(cost.id, { name: e.target.value })}
                    placeholder="Cost name..."
                    className="border-2 border-orange-200"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <Select
                        value={cost.category}
                        onValueChange={(value) => updateExtraCost(cost.id, { 
                          category: value as 'shipping' | 'marketing' | 'other',
                          icon: materialIcons[value as keyof typeof materialIcons][0]
                        })}
                      >
                        <SelectTrigger className="border-2 border-orange-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {extraCostOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="flex items-center">
                                <span className="mr-2">{option.icon}</span>
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={cost.costPerUnit}
                          onChange={(e) => updateExtraCost(cost.id, { costPerUnit: parseFloat(e.target.value) || 0 })}
                          className="pl-8 border-2 border-orange-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button
              onClick={addExtraCost}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Extra Cost
            </Button>
          </div>
        </div>
      )}

      {/* Total Cost Display */}
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-4 border-yellow-300 rounded-3xl p-6 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Total Cost Breakdown</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="bg-white rounded-xl p-3 border-2 border-green-300">
            <div className="text-lg font-bold text-green-600">
              ${data.directCosts.reduce((sum, c) => sum + (c.unitsProduced > 0 ? c.costPerUnit / c.unitsProduced : c.costPerUnit), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Direct</div>
          </div>
          <div className="bg-white rounded-xl p-3 border-2 border-blue-300">
            <div className="text-lg font-bold text-blue-600">
              ${data.indirectCosts.reduce((sum, c) => sum + (c.unitsBeforeReplacement > 0 ? c.totalCost / c.unitsBeforeReplacement : 0), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Equipment & Startup</div>
          </div>
          <div className="bg-white rounded-xl p-3 border-2 border-orange-300">
            <div className="text-lg font-bold text-orange-600">
              ${data.extraCosts.reduce((sum, c) => sum + c.costPerUnit, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Extra</div>
          </div>
        </div>
        <div className="text-5xl font-bold text-green-600 mt-4">${totalCost.toFixed(2)}</div>
        <p className="text-gray-600 mt-2">Total cost to make one unit</p>
      </div>

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

      {/* Enhanced Tip */}
      <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-6 text-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-blue-800">
              <span className="text-2xl mr-2">🤖</span>
              <strong>AI Tip:</strong> Use "AI Generate All Costs" to get realistic estimates based on your product!
            </p>
          </div>
          <div>
            <p className="text-blue-800">
              <span className="text-2xl mr-2">📊</span>
              <strong>Pro Tip:</strong> Include ALL costs for accurate pricing - even small ones add up!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
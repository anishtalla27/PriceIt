import { Package, Lightbulb, Target, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

interface ProductInfoPageProps {
  data: {
    productName: string;
    productDescription: string;
    uniqueFeature: string;
  };
  updateData: (updates: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ProductInfoPage({ data, updateData, onNext, onBack }: ProductInfoPageProps) {
  const isComplete = data.productName && data.productDescription && data.uniqueFeature;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full w-fit mx-auto">
          <Package className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800">Tell us about your product!</h1>
        <p className="text-xl text-gray-600">Let's start with the basics - what are you making?</p>
      </div>

      {/* Product Cards */}
      <div className="space-y-6">
        {/* Product Name */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-blue-200 hover:border-blue-400 transition-colors">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Product Name</h3>
              <p className="text-gray-600">What do you call your awesome product?</p>
            </div>
          </div>
          <Input
            value={data.productName}
            onChange={(e) => updateData({ productName: e.target.value })}
            placeholder="e.g., Super Cool Slime, Friendship Bracelets..."
            className="text-lg p-4 rounded-xl border-2 border-blue-200 focus:border-blue-400"
          />
        </div>

        {/* Product Description */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-green-200 hover:border-green-400 transition-colors">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">What does it do?</h3>
              <p className="text-gray-600">Try to be as descriptive as possible. The more detail the better!</p>
            </div>
          </div>
          <Textarea
            value={data.productDescription}
            onChange={(e) => updateData({ productDescription: e.target.value })}
            placeholder="e.g., Colorful, stretchy slime that glows in the dark and smells like strawberries!"
            className="text-lg p-4 rounded-xl border-2 border-green-200 focus:border-green-400 min-h-[100px]"
          />
        </div>

        {/* Unique Feature */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-purple-200 hover:border-purple-400 transition-colors">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <Lightbulb className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">What makes it special?</h3>
              <p className="text-gray-600">How is your product different from others?</p>
            </div>
          </div>
          <Textarea
            value={data.uniqueFeature}
            onChange={(e) => updateData({ uniqueFeature: e.target.value })}
            placeholder="e.g., It's the only slime that changes colors when you play with it!"
            className="text-lg p-4 rounded-xl border-2 border-purple-200 focus:border-purple-400 min-h-[100px]"
          />
        </div>
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

        <div className="text-center">
          {!isComplete && (
            <p className="text-gray-500 mb-2">Fill out all fields to continue</p>
          )}
        </div>

        <Button
          onClick={onNext}
          disabled={!isComplete}
          className={`px-8 py-3 text-lg rounded-xl transition-all ${
            isComplete
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next Step
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Encouragement */}
      {isComplete && (
        <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-4 text-center">
          <p className="text-green-800">
            <span className="text-2xl mr-2">🎉</span>
            Great job! Your product sounds amazing!
          </p>
        </div>
      )}
    </div>
  );
}
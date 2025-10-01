import { Star, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-center space-y-8 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback 
          src="https://images.unsplash.com/photo-1631061184412-b18f5fb1dc70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwYnVzaW5lc3MlMjBmYWlyJTIwY29sb3JmdWwlMjBpbGx1c3RyYXRpb258ZW58MXx8fHwxNzU4NTkwMzE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Kids business fair"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 via-purple-100/80 to-pink-100/80" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-20 animate-bounce">
        <Star className="w-8 h-8 text-yellow-400 fill-current" />
      </div>
      <div className="absolute top-32 right-32 animate-pulse">
        <Sparkles className="w-6 h-6 text-pink-400 fill-current" />
      </div>
      <div className="absolute bottom-32 left-16 animate-bounce delay-300">
        <TrendingUp className="w-10 h-10 text-green-400" />
      </div>

      {/* Main content */}
      <div className="relative z-10 space-y-8">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-full shadow-xl">
            <TrendingUp className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Priceit! AI Business Helper
          </h1>
          <p className="text-2xl text-gray-700 max-w-2xl mx-auto">
            Figure out the best price for your product and become a young entrepreneur! 🚀
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/90 p-6 rounded-2xl shadow-lg border-2 border-purple-200 hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">🧮</div>
            <h3 className="font-bold text-purple-600 mb-2">Calculate Costs</h3>
            <p className="text-gray-600">Add up all your materials and costs easily!</p>
          </div>
          
          <div className="bg-white/90 p-6 rounded-2xl shadow-lg border-2 border-blue-200 hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="font-bold text-blue-600 mb-2">Beat Competition</h3>
            <p className="text-gray-600">See what others are charging and stay competitive!</p>
          </div>
          
          <div className="bg-white/90 p-6 rounded-2xl shadow-lg border-2 border-green-200 hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold text-green-600 mb-2">Perfect Price</h3>
            <p className="text-gray-600">Get three smart pricing suggestions!</p>
          </div>
        </div>

        {/* Start button */}
        <div className="pt-8">
          <Button 
            onClick={onStart}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-12 py-4 text-2xl rounded-2xl shadow-xl hover:scale-110 transition-all duration-200 border-4 border-white"
          >
            <Star className="w-6 h-6 mr-3 fill-current" />
            Start Your Journey!
            <Sparkles className="w-6 h-6 ml-3 fill-current" />
          </Button>
        </div>

        {/* Fun fact */}
        <div className="bg-yellow-100 border-2 border-yellow-300 rounded-2xl p-4 max-w-lg mx-auto">
          <p className="text-yellow-800">
            <span className="text-2xl mr-2">💡</span>
            <strong>Fun Fact:</strong> Many successful businesses started when their founders were kids!
          </p>
        </div>
      </div>
    </div>
  );
}
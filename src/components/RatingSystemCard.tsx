import { Star, Award, TrendingUp, Heart, CheckCircle } from 'lucide-react';

interface RatingSystemCardProps {
  productName: string;
  finalPrice: number;
  profitMargin: number;
  competitorCount: number;
}

export function RatingSystemCard({ 
  productName, 
  finalPrice, 
  profitMargin, 
  competitorCount 
}: RatingSystemCardProps) {
  
  // Simplified rating calculations
  const priceRating = finalPrice <= 15 ? 5 : finalPrice <= 25 ? 4 : 3;
  const profitRating = profitMargin >= 45 ? 5 : profitMargin >= 30 ? 4 : 3;
  const competitionRating = competitorCount <= 2 ? 5 : competitorCount <= 3 ? 4 : 3;
  const innovationRating = 4;
  const marketRating = 4;

  const overallRating = Math.round((priceRating + profitRating + competitionRating + innovationRating + marketRating) / 5);

  const categories = [
    {
      name: "Price Point",
      rating: priceRating,
      description: priceRating >= 4 ? "Great price for kids!" : "Fair pricing",
      icon: Star,
      color: "from-yellow-400 to-orange-500"
    },
    {
      name: "Profit Potential", 
      rating: profitRating,
      description: profitRating >= 4 ? "Excellent profits!" : "Good profit margin",
      icon: TrendingUp,
      color: "from-green-400 to-emerald-500"
    },
    {
      name: "Competition",
      rating: competitionRating,
      description: competitionRating >= 4 ? "Low competition!" : "Moderate competition",
      icon: Award,
      color: "from-blue-400 to-cyan-500"
    }
  ];

  const getRatingMessage = (rating: number) => {
    if (rating === 5) return { text: "AMAZING! 🌟", color: "text-yellow-500" };
    if (rating === 4) return { text: "GREAT! 🎉", color: "text-green-500" };
    return { text: "GOOD! 👍", color: "text-blue-500" };
  };

  const overallMessage = getRatingMessage(overallRating);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-yellow-300">
      <div className="text-center mb-6">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full w-fit mx-auto mb-4">
          <Award className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          ⭐ Business Rating Report
        </h3>
        <p className="text-gray-600">How does your {productName} business score?</p>
      </div>

      {/* Overall Rating */}
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-4 border-yellow-300 rounded-3xl p-6 mb-6 text-center">
        <h4 className="text-xl font-bold text-gray-800 mb-3">Overall Business Rating</h4>
        <div className="flex items-center justify-center space-x-3 mb-3">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-8 h-8 ${
                  star <= overallRating 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-3xl font-bold text-gray-800">{overallRating}/5</span>
        </div>
        <div className={`text-2xl font-bold ${overallMessage.color} mb-2`}>
          {overallMessage.text}
        </div>
        <p className="text-gray-700">
          Your {productName} business has a great foundation!
        </p>
      </div>

      {/* Individual Categories */}
      <div className="space-y-4">
        <h4 className="text-lg font-bold text-gray-800 text-center mb-4">📊 Category Breakdown</h4>
        {categories.map((category, index) => (
          <div key={index} className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`bg-gradient-to-r ${category.color} p-2 rounded-full`}>
                  <category.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h5 className="font-bold text-gray-800">{category.name}</h5>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= category.rating 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm font-bold text-gray-700 mt-1">
                  {category.rating}/5
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Improvement Tips */}
      <div className="mt-6 bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300 rounded-2xl p-4">
        <h4 className="text-lg font-bold text-gray-800 mb-3 text-center">💡 Tips to Improve</h4>
        <p className="text-center text-gray-700">
          {overallRating >= 4 
            ? "🎉 You're doing great! Keep up the excellent work!" 
            : "Keep being creative and listening to what kids want!"}
        </p>
      </div>
    </div>
  );
}
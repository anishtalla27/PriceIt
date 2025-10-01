import { Star, User, ThumbsUp, MessageCircle } from 'lucide-react';

interface CustomerReviewsCardProps {
  productName: string;
  averageRating: number;
}

export function CustomerReviewsCard({ productName, averageRating }: CustomerReviewsCardProps) {
  const reviews = [
    {
      id: 1,
      name: "Emma K. (Age 10)",
      rating: 5,
      comment: `I love my ${productName}! It's so cool and all my friends want one too! 😍`,
      likes: 12
    },
    {
      id: 2,
      name: "Alex M. (Age 9)",
      rating: 5,
      comment: `This is the best thing ever! I use it every day and it makes me so happy! 🌟`,
      likes: 8
    },
    {
      id: 3,
      name: "Sophie L. (Age 11)",
      rating: 4,
      comment: `Really fun to use! My little brother wants one too. Maybe make it in more colors? 🌈`,
      likes: 15
    },
    {
      id: 4,
      name: "Jordan T. (Age 8)",
      rating: 5,
      comment: `OMG this is amazing! I saved up my allowance to buy it and it was totally worth it! 💰`,
      likes: 6
    },
    {
      id: 5,
      name: "Maya P. (Age 12)",
      rating: 4,
      comment: `Super fun and works exactly like described! All my friends are jealous hehe 😎`,
      likes: 10
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-blue-300">
      <div className="text-center mb-6">
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-4 rounded-full w-fit mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          💬 What Kids Are Saying!
        </h3>
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.floor(averageRating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-lg font-bold text-gray-700">
            {averageRating.toFixed(1)} out of 5 stars
          </span>
        </div>
        <p className="text-gray-600">Based on {reviews.length} imaginary reviews from happy customers!</p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {reviews.map((review) => (
          <div key={review.id} className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-2 rounded-full flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-800">{review.name}</h4>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{review.comment}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{review.likes} kids found this helpful</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gradient-to-r from-green-100 to-blue-100 border-2 border-green-300 rounded-2xl p-4 text-center">
        <div className="text-2xl mb-2">🎯</div>
        <p className="text-gray-700 font-medium">
          Looks like kids love your {productName}! Keep up the amazing work! 🌟
        </p>
      </div>
    </div>
  );
}
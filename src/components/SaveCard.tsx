import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { motion } from 'motion/react';

interface SaveCardProps {
  productName: string;
}

export function SaveCard({ productName }: SaveCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setShowConfetti(true);
    
    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <Card className="border-2 border-rainbow-200 shadow-lg relative overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🎉</span>
          Save & Celebrate
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {!isSaved ? (
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Ready to save your pricing for {productName || 'your product'}?
            </p>
            <Button 
              onClick={handleSave}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              size="lg"
            >
              Save this product for later 🎉
            </Button>
          </div>
        ) : (
          <motion.div 
            className="text-center space-y-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="text-6xl mb-4">🎊</div>
            <h3 className="text-xl font-bold text-green-600">
              Great job! You've priced your product like a real entrepreneur!
            </h3>
            <p className="text-gray-600">
              Your pricing for {productName || 'your product'} has been saved successfully.
            </p>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">What's next? 🚀</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Test your price with a small batch of customers</li>
                <li>• Create compelling product photos and descriptions</li>
                <li>• Set up your online store or marketplace listing</li>
                <li>• Track your actual costs vs. estimates</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full"
                initial={{
                  x: Math.random() * 400,
                  y: -10,
                  rotate: 0,
                  scale: 0
                }}
                animate={{
                  y: 400,
                  rotate: 360,
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
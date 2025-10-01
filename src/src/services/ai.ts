import { API_KEY, AI_CONFIG } from '../config';
import { AIInput, AIResponse } from '../types';

// Main AI service function that calls the AI API
export const callAI = async (inputs: AIInput): Promise<AIResponse> => {
  // Check if API key is configured
  if (API_KEY === "YOUR_API_KEY_HERE") {
    console.warn("API key not configured. Using mock data.");
    return getMockAIResponse(inputs);
  }

  try {
    const prompt = buildPrompt(inputs);
    
    const response = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          {
            role: "system",
            content: "You are a business pricing expert helping young entrepreneurs at a business fair. Provide practical, realistic pricing advice in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No content received from AI API");
    }

    // Parse the JSON response
    const parsedResponse = JSON.parse(aiContent);
    return formatAIResponse(parsedResponse);

  } catch (error) {
    console.error("AI API call failed:", error);
    // Fallback to mock data if API fails
    return getMockAIResponse(inputs);
  }
};

// Build the prompt for the AI
const buildPrompt = (inputs: AIInput): string => {
  return `
Please analyze this product and provide pricing recommendations in JSON format:

Product Information:
- Name: ${inputs.productName}
- Description: ${inputs.productDescription}
- Unique Feature: ${inputs.uniqueFeature}
- Target Age: ${inputs.targetAge}
- Customer Spending Range: ${inputs.spendingRange}
- Competition Level: ${inputs.competitionLevel}

Please provide a JSON response with this exact structure:
{
  "suggestedCosts": {
    "materials": [{"name": "Material Name", "costPerUnit": 1.50, "unitsProduced": 1}],
    "packaging": [{"name": "Packaging Item", "costPerUnit": 0.50, "unitsProduced": 1}],
    "equipment": [{"name": "Equipment Name", "totalCost": 100, "unitsBeforeReplacement": 100}],
    "extra": [{"name": "Extra Cost", "costPerUnit": 0.25, "category": "shipping"}]
  },
  "suggestedCompetitors": {
    "competitors": [
      {
        "name": "Competitor Name",
        "price": 12.99,
        "strengths": "Popular brand, good quality",
        "weaknesses": "Higher price, limited features",
        "website": "www.example.com"
      }
    ]
  },
  "suggestedValue": {
    "problemSolved": "What problem does this product solve?",
    "specialBenefit": "What makes this product special?",
    "alternatives": [{"name": "Alternative Option", "cost": 8.00}]
  },
  "pricingStrategies": {
    "costPlus": {
      "price": 10.50,
      "markup": 50,
      "explanation": "Cost-plus pricing explanation"
    },
    "market": {
      "price": 12.00,
      "explanation": "Market-based pricing explanation"
    },
    "value": {
      "price": 15.00,
      "explanation": "Value-based pricing explanation"
    }
  }
}

Make sure all prices have exactly 2 decimal places. Provide realistic, age-appropriate suggestions for the target market.
`;
};

// Format the AI response to match our types
const formatAIResponse = (aiResponse: any): AIResponse => {
  return {
    suggestedCosts: {
      materials: aiResponse.suggestedCosts?.materials || [],
      packaging: aiResponse.suggestedCosts?.packaging || [],
      equipment: aiResponse.suggestedCosts?.equipment || [],
      extra: aiResponse.suggestedCosts?.extra || [],
    },
    suggestedCompetitors: {
      competitors: aiResponse.suggestedCompetitors?.competitors || [],
    },
    suggestedValue: {
      problemSolved: aiResponse.suggestedValue?.problemSolved || '',
      specialBenefit: aiResponse.suggestedValue?.specialBenefit || '',
      alternatives: aiResponse.suggestedValue?.alternatives || [],
    },
    pricingStrategies: {
      costPlus: {
        price: Number(aiResponse.pricingStrategies?.costPlus?.price || 0),
        markup: aiResponse.pricingStrategies?.costPlus?.markup || 50,
        explanation: aiResponse.pricingStrategies?.costPlus?.explanation || '',
      },
      market: {
        price: Number(aiResponse.pricingStrategies?.market?.price || 0),
        explanation: aiResponse.pricingStrategies?.market?.explanation || '',
      },
      value: {
        price: Number(aiResponse.pricingStrategies?.value?.price || 0),
        explanation: aiResponse.pricingStrategies?.value?.explanation || '',
      },
    },
  };
};

// Mock AI response for testing and fallback
const getMockAIResponse = (inputs: AIInput): AIResponse => {
  const productType = inputs.productName.toLowerCase();
  
  return {
    suggestedCosts: {
      materials: [
        { name: "Primary Material", costPerUnit: 2.50, unitsProduced: 1 },
        { name: "Secondary Components", costPerUnit: 1.25, unitsProduced: 1 }
      ],
      packaging: [
        { name: "Protective Packaging", costPerUnit: 0.75, unitsProduced: 1 }
      ],
      equipment: [
        { name: "Basic Assembly Tools", totalCost: 150.00, unitsBeforeReplacement: 200 }
      ],
      extra: [
        { name: "Shipping Costs", costPerUnit: 1.50, category: "shipping" },
        { name: "Marketing Materials", costPerUnit: 0.50, category: "marketing" }
      ]
    },
    suggestedCompetitors: {
      competitors: [
        {
          name: `${productType.includes('game') ? 'Fun Games Co' : 'Quality Products Inc'}`,
          price: 12.99,
          strengths: "Established brand, wide distribution",
          weaknesses: "Higher price, generic design",
          website: "www.example-competitor.com"
        },
        {
          name: `${productType.includes('toy') ? 'Toy Master' : 'Creative Solutions'}`,
          price: 8.50,
          strengths: "Lower price, colorful design",
          weaknesses: "Lower quality materials, limited features",
          website: "www.budget-competitor.com"
        }
      ]
    },
    suggestedValue: {
      problemSolved: `Provides an engaging solution for ${inputs.targetAge} children looking for creative entertainment`,
      specialBenefit: `${inputs.uniqueFeature} makes this product stand out from typical alternatives`,
      alternatives: [
        { name: "DIY Version", cost: 5.00 },
        { name: "Generic Alternative", cost: 7.50 }
      ]
    },
    pricingStrategies: {
      costPlus: {
        price: 9.75,
        markup: 50,
        explanation: "This adds a 50% markup to your total costs, ensuring you make a profit on each sale."
      },
      market: {
        price: 10.75,
        explanation: "This price is competitive with similar products in the market while maintaining good profit margins."
      },
      value: {
        price: 13.50,
        explanation: "This price reflects the unique value your product provides compared to alternatives."
      }
    }
  };
};

// Helper function to generate AI analysis for specific components
export const generateCostSuggestions = async (productInfo: {
  name: string;
  description: string;
  category: string;
}): Promise<AISuggestedCosts> => {
  const input: AIInput = {
    productName: productInfo.name,
    productDescription: productInfo.description,
    uniqueFeature: '',
    targetAge: '8-12 years',
    spendingRange: '$5-15',
    competitionLevel: 'Medium'
  };

  const response = await callAI(input);
  return response.suggestedCosts;
};

export const generateCompetitorAnalysis = async (productInfo: {
  name: string;
  description: string;
  targetAge: string;
  spendingRange: string;
}): Promise<AISuggestedCompetitors> => {
  const input: AIInput = {
    productName: productInfo.name,
    productDescription: productInfo.description,
    uniqueFeature: '',
    targetAge: productInfo.targetAge,
    spendingRange: productInfo.spendingRange,
    competitionLevel: 'Medium'
  };

  const response = await callAI(input);
  return response.suggestedCompetitors;
};

export const generateValueAnalysis = async (productInfo: {
  name: string;
  description: string;
  uniqueFeature: string;
}): Promise<AISuggestedValue> => {
  const input: AIInput = {
    productName: productInfo.name,
    productDescription: productInfo.description,
    uniqueFeature: productInfo.uniqueFeature,
    targetAge: '8-12 years',
    spendingRange: '$5-15',
    competitionLevel: 'Medium'
  };

  const response = await callAI(input);
  return response.suggestedValue;
};
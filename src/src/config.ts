// Configuration file for API keys and settings
// Replace "YOUR_API_KEY_HERE" with your actual OpenAI API key

export const API_KEY = "YOUR_API_KEY_HERE";

// API Configuration
export const AI_CONFIG = {
  endpoint: "https://api.openai.com/v1/chat/completions",
  model: "gpt-3.5-turbo",
  maxTokens: 10000,
  temperature: 0.7,
};

// You can also add other configuration options here
export const APP_CONFIG = {
  currency: "USD",
  defaultMarkupPercentage: 50,
  maxCompetitors: 5,
  maxAlternatives: 3,
};
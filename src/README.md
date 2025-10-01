# Priceit! AI Business Helper

A comprehensive product pricing calculator app that helps young entrepreneurs price their products through AI-powered analysis and step-by-step guidance.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure AI Integration
1. Open the file `src/config.ts`
2. Replace `"YOUR_API_KEY_HERE"` with your actual OpenAI API key:
   ```typescript
   export const API_KEY = "sk-your-actual-openai-api-key-here";
   ```

### 3. Run the Application
```bash
npm start
```

The app will open in your browser at `http://localhost:3000`

## 🤖 AI Integration Setup

### Where to Put Your API Key
- **File:** `src/config.ts`
- **Line:** Replace `"YOUR_API_KEY_HERE"` with your OpenAI API key
- **Format:** The key should start with `sk-` and be enclosed in quotes

### How AI Integration Works

The app includes several AI-powered features that enhance the user experience:

#### 1. **Cost Analysis (CostInputsPage)**
- **Trigger:** "AI Generate All Costs" button
- **Function:** `generateCostSuggestions()` in `src/services/ai.ts`
- **What it does:** Analyzes the product description and suggests realistic costs for materials, packaging, equipment, and extra expenses

#### 2. **Competitor Analysis (MarketInputsPage)**
- **Trigger:** "AI Generate Competitors" button  
- **Function:** `generateCompetitorAnalysis()` in `src/services/ai.ts`
- **What it does:** Generates realistic competitors with names, prices, strengths, and weaknesses based on the product type and target market

#### 3. **Value Analysis (ValueInputsPage)**
- **Trigger:** "AI Generate Value Analysis" button
- **Function:** `generateValueAnalysis()` in `src/services/ai.ts`
- **What it does:** Analyzes the product's value proposition, problem it solves, and alternative options available to customers

#### 4. **Pricing Strategies (ResultsPage)**
- **Trigger:** Automatic on page load + "Regenerate AI Analysis" button
- **Function:** `callAI()` in `src/services/ai.ts`
- **What it does:** Provides comprehensive pricing analysis with three strategies (cost-plus, market-based, value-based) including detailed explanations

### Step-by-Step AI Flow

1. **User Input Collection:** The app collects product information, costs, market data, and value propositions through a kid-friendly UI
2. **AI Analysis:** When AI buttons are clicked, the app calls the `callAI()` function with structured input data
3. **API Request:** The service makes a request to OpenAI's API with a detailed prompt
4. **Response Processing:** AI responses are parsed and formatted to match the app's data structures
5. **UI Updates:** The generated suggestions populate editable fields, allowing users to modify AI recommendations
6. **Final Results:** All data feeds into comprehensive pricing strategies with explanations

## 🛠️ Customizing AI Integration

### Changing API Settings
Edit `src/config.ts` to modify:
- **Model:** Change from `gpt-3.5-turbo` to `gpt-4` for better analysis
- **Max Tokens:** Increase for longer responses
- **Temperature:** Adjust creativity (0 = deterministic, 1 = creative)

### Modifying AI Prompts
Edit the `buildPrompt()` function in `src/services/ai.ts` to:
- Change the AI's personality or tone
- Add specific industry knowledge
- Modify output format requirements

### Adding New AI Features
1. Create a new function in `src/services/ai.ts`
2. Add appropriate TypeScript interfaces in `src/types/index.ts`
3. Call the function from your component with loading states and error handling

### Error Handling & Fallbacks
The app includes robust error handling:
- **API Failures:** Falls back to mock data if API calls fail
- **Missing API Key:** Uses mock responses and shows console warnings
- **Invalid Responses:** Gracefully handles malformed AI responses
- **Loading States:** Shows user-friendly loading indicators
- **Toast Notifications:** Provides feedback for AI operations

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn UI components
│   ├── figma/           # Figma import components
│   └── ProgressStepper.tsx
├── pages/               # Main application pages
│   ├── LandingPage.tsx     # Welcome screen
│   ├── ProductInfoPage.tsx # Product information input
│   ├── CostInputsPage.tsx  # Cost analysis with AI
│   ├── MarketInputsPage.tsx # Market research with AI
│   ├── ValueInputsPage.tsx # Value analysis with AI
│   └── ResultsPage.tsx     # Final pricing results with AI
├── services/
│   └── ai.ts            # AI integration service
├── types/
│   └── index.ts         # TypeScript type definitions
├── config.ts            # API configuration
└── App.tsx              # Main application component
```

## 🎯 Features

### Core Functionality
- **Product Definition:** Name, description, and unique features
- **Cost Analysis:** Materials, packaging, equipment, and extra costs
- **Market Research:** Competitor analysis and target market definition
- **Value Proposition:** Problem solving and customer benefits
- **Pricing Strategies:** Cost-plus, market-based, and value-based pricing

### AI-Powered Enhancements
- **Smart Cost Estimation:** AI suggests realistic costs based on product type
- **Competitor Discovery:** AI generates relevant competitors with pricing
- **Value Analysis:** AI helps identify customer value and alternatives
- **Pricing Optimization:** AI provides strategic pricing recommendations

### User Experience
- **Kid-Friendly Design:** Colorful, game-like interface with emojis and animations
- **Progress Tracking:** Visual stepper showing completion progress
- **Editable AI Suggestions:** All AI-generated content can be modified
- **Real-time Calculations:** Live updates of pricing and profit margins
- **Responsive Design:** Works on desktop and mobile devices

## 🧪 Testing AI Integration

### Test Without API Key
1. Leave the API key as `"YOUR_API_KEY_HERE"`
2. Click any AI generation button
3. The app will use mock data and show console warnings
4. This lets you test the UI flow without API costs

### Test With API Key
1. Add your OpenAI API key to `src/config.ts`
2. Test each AI feature:
   - Cost generation on the Costs page
   - Competitor analysis on the Market page
   - Value analysis on the Value page
   - Pricing strategies on the Results page
3. Check browser console for any API errors
4. Verify AI responses are properly formatted and editable

### Monitoring API Usage
- Check your OpenAI dashboard for API usage
- Each AI generation uses approximately 1000-2000 tokens
- Consider implementing usage limits for production

## 🔧 Development Tips

### Adding New Fields
1. Update the `AppData` interface in `src/types/index.ts`
2. Add the field to `initialData` in `src/App.tsx`
3. Update relevant page components to collect the data
4. Modify AI prompts to use the new data

### Customizing the UI
- All pages use the same design system with colorful cards
- Modify Tailwind classes to change colors or styling
- Add new icons from the `lucide-react` package
- Prices always display with exactly 2 decimal places using `.toFixed(2)`

### API Error Debugging
- Check browser console for detailed error messages
- Verify your API key has sufficient credits
- Ensure proper JSON format in AI responses
- Test with smaller prompts if hitting token limits

## 📊 Data Flow

1. **Landing Page** → User starts the journey
2. **Product Info** → Collects basic product information
3. **Cost Inputs** → AI suggests costs → User edits → Calculates totals
4. **Market Inputs** → AI finds competitors → User edits → Analyzes market
5. **Value Inputs** → AI analyzes value → User edits → Defines proposition
6. **Results** → AI generates pricing strategies → User selects final price

## 🎨 Design Philosophy

This app transforms traditional business analysis into a fun, educational experience for young entrepreneurs by:
- Using game-like visual elements and animations
- Breaking complex concepts into simple, digestible steps
- Providing AI assistance to reduce overwhelming decisions
- Making all generated content editable to maintain user control
- Celebrating progress with encouraging messages and emojis

## 🔒 Security Notes

- Never commit your actual API key to version control
- The API key is only used client-side for this demo application
- For production use, implement proper backend API key management
- Consider implementing rate limiting and usage quotas

## 🤝 Contributing

To add new features or improve AI integration:
1. Follow the existing code structure and TypeScript patterns
2. Add proper error handling and loading states
3. Include mock data fallbacks for offline testing
4. Update this README with any new AI features
5. Test thoroughly with and without API keys

---

Happy pricing! 🚀 Remember: this app is designed to be educational and fun while teaching real business principles to young entrepreneurs.
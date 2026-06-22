export interface TemplateChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface BusinessTemplateInput {
  productName: string;
  targetCustomer: string;
  sellingPrice: number;
  costPerUnit: number;
  profitPerUnit: number;
  marginPct: number;
}

export interface TemplateReview {
  name: string;
  age: number;
  rating: number;
  text: string;
  tag: "Love it ❤️" | "Needs work 🔧";
}

interface SetupAnswers {
  ideaPath?: "already" | "help";
  interests?: string;
  audience?: string;
  productType?: "physical" | "service" | "either";
  selectedIdea?: string;
  demandReason?: string;
  name?: string;
  description?: string;
  targetCustomer?: string;
  specialFeature?: string;
  currentChallenge?: string;
  improvementGoal?: string;
  inspiration?: string;
}

export type SetupJourneyMode = "create" | "improve";

function categoryFromDescription(description: string) {
  const value = description.toLowerCase();
  if (/food|drink|snack|cookie|cake|lemonade/.test(value)) return "Food & Beverage";
  if (/app|game|website|digital|download/.test(value)) return "Digital Product";
  if (/service|wash|walk|lesson|help/.test(value)) return "Service";
  return "Physical Product";
}

function wordCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function isGreeting(value: string) {
  return /^(?:hi|hello|hey|how are you|what(?:'s| is) up|thanks|thank you)[!?.\s]*$/i.test(value);
}

function isUnrelatedQuestion(value: string) {
  return /^(?:what|who|when|where|why|how|can|could|would|should|do|does|is|are)\b/i.test(value);
}

function acceptsSetupAnswer(stage: keyof SetupAnswers, value: string) {
  if (!value || isGreeting(value) || isUnrelatedQuestion(value)) return false;
  if (stage === "ideaPath") return /already|have an idea|help|create an idea|need an idea/i.test(value);
  if (stage === "productType") return /physical|service|either/i.test(value);
  if (stage === "interests" || stage === "audience") return value.length >= 2;
  if (stage === "selectedIdea") return value.length >= 1;
  if (stage === "name") return wordCount(value) <= 8 && value.length <= 60;
  if (stage === "description") return wordCount(value) >= 4 && value.length >= 18;
  if (stage === "targetCustomer") return wordCount(value) <= 15 && value.length <= 100;
  if (stage === "currentChallenge") return value.length >= 3 && value.length <= 120;
  return wordCount(value) >= 3 && value.length >= 12;
}

function nextSetupStage(answers: SetupAnswers, mode: SetupJourneyMode): keyof SetupAnswers | null {
  if (mode === "improve") {
    return (["name", "description", "targetCustomer", "currentChallenge", "improvementGoal"] as const)
      .find((stage) => !answers[stage]) ?? null;
  }
  if (!answers.ideaPath) return "ideaPath";
  const stages = answers.ideaPath === "already"
    ? (["name", "description", "targetCustomer", "specialFeature", "inspiration"] as const)
    : (["interests", "audience", "productType", "selectedIdea", "name", "demandReason", "specialFeature"] as const);
  return stages.find((stage) => !answers[stage]) ?? null;
}

function buildIdeaSuggestions(answers: SetupAnswers): string[] {
  const interest = answers.interests ?? "your favorite things";
  const audience = answers.audience ?? "people you want to help";
  const physicalIdeas = [
    `A ${interest} starter kit that makes it easier for ${audience} to get started`,
    `A customizable ${interest} organizer or activity pack made for ${audience}`,
    `A reusable ${interest} challenge kit that helps ${audience} practice and have fun`,
  ];
  const serviceIdeas = [
    `A friendly ${interest} helper service for ${audience}`,
    `A small ${interest} club or lesson service that helps ${audience} learn together`,
    `A personalized ${interest} planning service that saves ${audience} time`,
  ];
  if (answers.productType === "physical") return physicalIdeas;
  if (answers.productType === "service") return serviceIdeas;
  return [physicalIdeas[0], physicalIdeas[1], serviceIdeas[0], serviceIdeas[1]];
}

function normalizeSetupAnswer(
  stage: keyof SetupAnswers,
  value: string,
  answers: SetupAnswers,
  lastAssistantMessage: string
): string {
  if (stage === "ideaPath") return /already|have an idea/i.test(value) ? "already" : "help";
  if (stage === "productType") {
    if (/physical/i.test(value)) return "physical";
    if (/service/i.test(value)) return "service";
    return "either";
  }
  if (stage === "selectedIdea") {
    const choice = value.match(/^(?:idea\s*)?([1-5])$/i);
    if (choice) {
      const choiceNumber = Number(choice[1]);
      const displayedIdeas = lastAssistantMessage
        .split("\n")
        .map((line) => line.match(/^\s*([1-5])[.)]\s+(.+)$/))
        .filter((match): match is RegExpMatchArray => Boolean(match));
      const displayedChoice = displayedIdeas.find((match) => Number(match[1]) === choiceNumber)?.[2];
      return displayedChoice?.replace(/[*_`]/g, "").trim()
        ?? buildIdeaSuggestions(answers)[choiceNumber - 1]
        ?? value;
    }
  }
  return value;
}

export function getSetupAnswers(history: TemplateChatMessage[], mode: SetupJourneyMode = "create"): SetupAnswers {
  const answers: SetupAnswers = {};
  let lastAssistantMessage = "";
  for (const message of history) {
    if (message.role === "assistant") {
      lastAssistantMessage = message.content;
      continue;
    }
    const stage = nextSetupStage(answers, mode);
    if (!stage) break;
    const value = message.content.trim();
    if (acceptsSetupAnswer(stage, value)) {
      const normalized = normalizeSetupAnswer(stage, value, answers, lastAssistantMessage);
      if (stage === "ideaPath") answers.ideaPath = normalized as SetupAnswers["ideaPath"];
      else if (stage === "productType") answers.productType = normalized as SetupAnswers["productType"];
      else answers[stage] = normalized as never;
    }
  }
  return answers;
}

export function getSetupQuickOptions(
  history: TemplateChatMessage[],
  mode: SetupJourneyMode = "create"
): string[] {
  if (mode !== "create") return [];
  const stage = nextSetupStage(getSetupAnswers(history, mode), mode);
  if (stage === "ideaPath") return ["I already have an idea", "Help me create an idea"];
  if (stage === "productType") return ["A physical product", "A service", "Either one"];
  return [];
}

function invalidAnswerResponse(stage: keyof SetupAnswers, value: string, mode: SetupJourneyMode) {
  const math = value.match(/(?:what is\s*)?(-?\d+)\s*\+\s*(-?\d+)\??/i);
  const prefix = math
    ? `${Number(math[1]) + Number(math[2])}! Now let's get back to your business idea. `
    : isGreeting(value)
      ? "Hi! I'm doing great and I'm ready to help. "
      : isUnrelatedQuestion(value)
        ? ""
      : value
        ? "That doesn't look like the product detail I need yet. "
        : "";
  if (stage === "name") return `${prefix}${mode === "improve" ? "What is the **name** of the product you want to improve?" : "What is the **name** of your product?"}`;
  if (stage === "ideaPath") return `${prefix}Do you already have a product idea, or would you like help creating one?`;
  if (stage === "interests") return `${prefix}What are some things you enjoy or care about? For example: sports, pets, art, gaming, school, food, music, technology, helping people, or the environment.`;
  if (stage === "audience") return `${prefix}Who would you like to help or sell to? For example: kids your age, parents, teachers, athletes, pet owners, families, or students.`;
  if (stage === "productType") return `${prefix}Would you rather create a physical product, a service, or either one?`;
  if (stage === "selectedIdea") return `${prefix}Which idea would you like to choose? You can also combine parts of different ideas.`;
  if (stage === "demandReason") return `${prefix}Why do you think people would want it?`;
  if (stage === "description") return `${prefix}${mode === "improve" ? "Tell me about your product. What does it do, and what value does it give customers?" : "Describe your product idea. What problem does it solve?"}`;
  if (stage === "targetCustomer") return `${prefix}${mode === "improve" ? "Who are your current customers?" : "Who is your ideal customer? For example: kids, parents, students, athletes, pet owners, or someone else."}`;
  if (stage === "currentChallenge") return `${prefix}What is the biggest challenge your product is facing right now?`;
  if (stage === "improvementGoal") return `${prefix}If we could improve one thing over the next month, what would you want to see happen?`;
  if (stage === "inspiration") return `${prefix}What inspired this idea?`;
  return `${prefix}Why would someone choose your product instead of another option?`;
}

export function setupConversationTemplate(history: TemplateChatMessage[], mode: SetupJourneyMode = "create") {
  const answers = getSetupAnswers(history, mode);
  const userMessages = history.filter((message) => message.role === "user");
  const lastUserInput = userMessages.at(-1)?.content.trim() ?? "";
  const acceptedCount = Object.keys(answers).length;
  const previousAnswers = getSetupAnswers(history.slice(0, -1), mode);
  const previousAcceptedCount = Object.keys(previousAnswers).length;

  if (userMessages.length > 0 && acceptedCount === previousAcceptedCount) {
    return invalidAnswerResponse(nextSetupStage(answers, mode) ?? "specialFeature", lastUserInput, mode);
  }

  if (mode === "create" && !answers.ideaPath) {
    return "Do you already have a product idea, or would you like help creating one?";
  }

  if (mode === "create" && answers.ideaPath === "help") {
    if (!answers.interests) {
      return "What are some things you enjoy or care about? For example: sports, pets, art, gaming, school, food, music, technology, helping people, or the environment.";
    }
    if (!answers.audience) {
      return "Who would you like to help or sell to? For example: kids your age, parents, teachers, athletes, pet owners, families, or students.";
    }
    if (!answers.productType) {
      return "Would you rather create a physical product, a service, or either one?";
    }
    if (!answers.selectedIdea) {
      const ideas = buildIdeaSuggestions(answers);
      return `Here are some ideas made for you:\n\n${ideas.map((idea, index) => `${index + 1}. ${idea}`).join("\n")}\n\nWhich idea would you like to choose? You can also combine parts of different ideas.`;
    }
    if (!answers.name) return "What would you like to call this product or business?";
    if (!answers.demandReason) return "Why do you think people would want it?";
    if (!answers.specialFeature) return "What makes it different from other options?";

    const description = `${answers.selectedIdea}. ${answers.demandReason}`;
    const completion = {
      name: answers.name,
      description,
      targetCustomer: answers.audience,
      specialFeature: answers.specialFeature,
      category: answers.productType === "service" ? "Service" : categoryFromDescription(description),
      currentChallenge: "",
      improvementGoal: "",
      inspiration: answers.interests,
    };
    return `That is a creative idea! Now let's build the numbers behind it. 🚀\n\nPRODUCT_COMPLETE\n${JSON.stringify(completion)}`;
  }

  if (!answers.name) {
    return mode === "improve"
      ? "Let's make a product you already have even better. 📈 What is the **name** of the product you want to improve?"
      : "Hi! I'm excited to help build your business idea! 🚀 What is the **name** of your product?";
  }
  if (!answers.description) {
    return mode === "improve"
      ? `Thanks! Tell me about **${answers.name}**. What does it do, and what value does it give customers?`
      : `**${answers.name}** sounds like a great start! Describe your product idea. What problem does it solve?`;
  }
  if (!answers.targetCustomer) {
    return mode === "improve"
      ? "Who are your current customers?"
      : "Who is your ideal customer? For example: kids, parents, students, athletes, pet owners, or someone else.";
  }
  if (mode === "improve" && !answers.currentChallenge) {
    return "What is the biggest challenge your product is facing right now?";
  }
  if (mode === "improve" && !answers.improvementGoal) {
    return "If we could improve one thing over the next month, what would you want to see happen?";
  }
  if (mode === "create" && !answers.specialFeature) {
    return "Why would someone choose your product instead of another option?";
  }
  if (mode === "create" && !answers.inspiration) {
    return "What inspired this idea?";
  }

  const completion = {
    name: answers.name,
    description: answers.description,
    targetCustomer: answers.targetCustomer,
    specialFeature: mode === "improve" ? answers.improvementGoal : answers.specialFeature,
    category: categoryFromDescription(answers.description),
    currentChallenge: answers.currentChallenge ?? "",
    improvementGoal: answers.improvementGoal ?? "",
    inspiration: answers.inspiration ?? "",
  };

  return `${mode === "improve" ? "Great—now let's rebuild the numbers and make a focused improvement plan! 📈" : "Amazing! I've got everything I need. Let's build your price! 🚀"}\n\nPRODUCT_COMPLETE\n${JSON.stringify(completion)}`;
}

export function businessRatingTemplate(input: BusinessTemplateInput) {
  const profitable = input.profitPerUnit > 0;
  const healthyMargin = input.marginPct >= 25;
  const rating = !profitable ? 2 : healthyMargin ? 4.5 : input.marginPct >= 10 ? 3.5 : 3;
  const verdict = profitable
    ? `${input.productName} can earn about $${input.profitPerUnit.toFixed(2)} per sale. ${healthyMargin ? "That gives you a strong cushion for surprises—great planning!" : "You have a working plan, and testing a slightly higher price or lower costs could make it even stronger."}`
    : `${input.productName} currently costs more to make than its selling price. Try raising the price or lowering costs so every sale helps your business grow.`;
  return { rating, verdict };
}

export function customerReviewsTemplate(input: BusinessTemplateInput): TemplateReview[] {
  const names = ["Maya", "Leo", "Ava", "Noah", "Zoe", "Eli", "Mia", "Sam", "Nora", "Ben"];
  return names.map((name, index) => {
    const constructive = index === 2 || index === 5 || index === 8;
    const age = index % 4 === 0 ? 34 + index : 9 + (index % 6);
    return {
      name,
      age,
      rating: constructive ? 3 : index % 3 === 0 ? 5 : 4,
      text: constructive
        ? `The idea for ${input.productName} sounds interesting. I'd want to learn a little more before deciding if the $${input.sellingPrice.toFixed(2)} price is right for me.`
        : `${input.productName} sounds like a fun idea for ${input.targetCustomer || "its customers"}. The plan is easy to understand, and I would be curious to try it!`,
      tag: constructive ? "Needs work 🔧" : "Love it ❤️",
    };
  });
}

export function simulationEventTemplate(week: number, productName: string) {
  const events = [
    { headline: "Friends Spread the Word", description: `More people heard about ${productName} this week!`, modifier: 1.15, modifierLabel: "More customers" },
    { headline: "A Quiet School Week", description: "Customers were a little busier than usual this week.", modifier: 0.9, modifierLabel: "Fewer customers" },
    { headline: "Great Customer Feedback", description: `A happy customer recommended ${productName} to a friend.`, modifier: 1.1, modifierLabel: "More customers" },
    { headline: "A Normal Business Week", description: "Demand stayed steady while you worked on your plan.", modifier: 1, modifierLabel: "Steady demand" },
  ];
  return events[(Math.max(1, week) - 1) % events.length];
}

export type AssistantTemplateAction =
  | { tool: "update_selling_price"; args: { price: number } }
  | { tool: "set_product_info"; args: { field: string; value: string } }
  | { response: string };

export function setupAssistantTemplate(input: string): AssistantTemplateAction {
  const priceMatch = input.match(/(?:price|selling price)(?:\s+(?:to|is|at))?\s*\$?([0-9]+(?:\.[0-9]{1,2})?)/i);
  if (priceMatch) {
    return { tool: "update_selling_price", args: { price: Number(priceMatch[1]) } };
  }

  const fields = [
    { field: "name", pattern: /(?:product\s+)?name(?:\s+(?:to|is))\s+(.+)/i },
    { field: "description", pattern: /description(?:\s+(?:to|is))\s+(.+)/i },
    { field: "targetCustomer", pattern: /target customer(?:\s+(?:to|is))\s+(.+)/i },
    { field: "specialFeature", pattern: /special feature(?:\s+(?:to|is))\s+(.+)/i },
    { field: "category", pattern: /category(?:\s+(?:to|is))\s+(.+)/i },
  ];
  for (const candidate of fields) {
    const match = input.match(candidate.pattern);
    if (match?.[1]) {
      return { tool: "set_product_info", args: { field: candidate.field, value: match[1].trim() } };
    }
  }

  return {
    response: "I'm using my built-in helper right now. Try a direct request like **set the price to $12** or **change the product name to Bright Bites**.",
  };
}

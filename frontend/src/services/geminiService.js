import axios from "axios";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_API_KEY || "";
const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY || "";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile";
const XAI_MODEL = import.meta.env.VITE_XAI_MODEL || "grok-beta";

const SYSTEM_CONTEXT = `You are AgriEase Assistant, a practical agriculture AI assistant.
Give concise and useful responses for farmers in India.
Prefer actionable steps, local relevance, and safety in advice.`;

const provider = XAI_API_KEY ? "xai" : GROQ_API_KEY ? "groq" : "fallback";

if (provider === "fallback") {
  console.warn(
    "AI API key not configured. Configure one key:\n" +
    "1) VITE_XAI_API_KEY (Grok)\n" +
    "or 2) VITE_GROQ_API_KEY (free Groq)\n" +
    "Fallback responses will be used."
  );
}

async function requestAI(messages, options = {}) {
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 700;

  if (provider === "fallback") {
    return null;
  }

  const payload = {
    model: provider === "xai" ? XAI_MODEL : GROQ_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  const url = provider === "xai" ? XAI_API_URL : GROQ_API_URL;
  const key = provider === "xai" ? XAI_API_KEY : GROQ_API_KEY;

  const response = await axios.post(url, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
  });

  return response.data?.choices?.[0]?.message?.content?.trim() || null;
}

export const sendMessageToGemini = async (userMessage, conversationHistory = []) => {
  try {
    const messages = [{ role: "system", content: SYSTEM_CONTEXT }];

    conversationHistory.slice(-6).forEach((msg) => {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text,
      });
    });

    messages.push({ role: "user", content: userMessage });

    const aiText = await requestAI(messages, { temperature: 0.7, maxTokens: 900 });
    if (aiText) return aiText;
    return getFallbackResponse(userMessage);
  } catch (error) {
    console.error("AI chat error:", error?.response?.data || error.message);
    return getFallbackResponse(userMessage);
  }
};

export const generateCropAdvisorInsight = async ({
  location,
  temperatureCelsius,
  humidityPercentage,
  recommendations,
}) => {
  const top = (recommendations || []).slice(0, 4)
    .map((r, idx) => `${idx + 1}. ${r.cropName} (${r.suitabilityPercentage}%)`)
    .join("\n");

  const prompt = `Create a practical crop advisory in <=120 words.
Location: ${location}
Weather: ${temperatureCelsius}C, Humidity ${humidityPercentage}%
Top crops:
${top}

Include:
- best crop choice and why
- one risk to monitor
- one action for next 7 days`;

  try {
    const messages = [
      { role: "system", content: SYSTEM_CONTEXT },
      { role: "user", content: prompt },
    ];
    const aiText = await requestAI(messages, { temperature: 0.5, maxTokens: 350 });
    if (aiText) return aiText;
  } catch (error) {
    console.error("Crop advisory AI error:", error?.response?.data || error.message);
  }

  const best = recommendations?.[0];
  return best
    ? `Best crop for current conditions in ${location} is ${best.cropName} (${best.suitabilityPercentage}%). Monitor moisture stress and pest pressure this week. Start with seedbed prep and maintain balanced irrigation.`
    : "Weather-based advisory unavailable right now. Please retry.";
};

export const generateWeeklyPlanInsight = async ({
  cropName,
  scheduleType,
  totalWeeks,
  landAreaAcres,
  weeks,
}) => {
  const sampleWeeks = (weeks || []).slice(0, 4).map((w) => ({
    week: w.weekNumber,
    focus: w.focus,
    tasks: w.tasks?.slice(0, 2) || [],
  }));

  const prompt = `You are an agronomy planner. Summarize this weekly plan in <=140 words.
Crop: ${cropName}
Type: ${scheduleType}
Duration: ${totalWeeks} weeks
Area: ${landAreaAcres} acres
Week sample: ${JSON.stringify(sampleWeeks)}

Also provide:
- 1 optimization tip
- 1 cost-saving tip
- 1 caution point`;

  try {
    const messages = [
      { role: "system", content: SYSTEM_CONTEXT },
      { role: "user", content: prompt },
    ];
    const aiText = await requestAI(messages, { temperature: 0.45, maxTokens: 380 });
    if (aiText) return aiText;
  } catch (error) {
    console.error("Weekly plan AI error:", error?.response?.data || error.message);
  }

  return `Plan generated for ${cropName} (${scheduleType}) over ${totalWeeks} weeks on ${landAreaAcres} acres. Prioritize timely irrigation, scouting, and nutrient balancing. Optimize by clustering field tasks by zone, save cost with targeted inputs, and monitor pest outbreaks during humid weeks.`;
};

const getFallbackResponse = (msg) => {
  const text = msg.toLowerCase();

  if (text.includes("crop") && (text.includes("summer") || text.includes("season"))) {
    return "For summer in Maharashtra, crops like Jowar, Bajra, Moong, and Groundnut are suitable. For winter, consider Wheat, Gram, and Mustard.";
  }
  if (text.includes("fertilizer") || text.includes("nutrient")) {
    return "Use soil-test-based NPK and increase organic matter using compost for sustained yield.";
  }
  if (text.includes("pest") || text.includes("disease")) {
    return "Use early scouting, neem-based sprays, and remove infected plants to limit spread.";
  }
  if (text.includes("weather") || text.includes("temperature")) {
    return "Track weather before irrigation and spraying. Avoid heavy input application before rain.";
  }

  return "Ask about crops, pests, irrigation, fertilizer planning, and market strategy. I can help with actionable farming advice.";
};

import axios from "axios";

// Groq API Configuration
const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY || ""; // Using same env var name for compatibility
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Check if API key is configured
if (!GROQ_API_KEY || GROQ_API_KEY === "YOUR_GROK_API_KEY") {
  console.warn(
    "⚠️ Groq API key not configured!\n" +
    "The chatbot will use fallback responses.\n" +
    "To enable AI responses:\n" +
    "1. Get API key from: https://console.groq.com\n" +
    "2. Create .env file in frontend folder\n" +
    "3. Add: VITE_GROK_API_KEY=your_key_here\n" +
    "4. Restart the dev server\n" +
    "See CHATBOT_SETUP.md for detailed instructions."
  );
}

// System prompt to guide the AI's behavior
const SYSTEM_CONTEXT = `You are AgriEase Assistant, a helpful AI chatbot specialized in agriculture and farming. 
You help farmers with information about:
- Crop selection and recommendations
- Pest and disease management
- Fertilizer and soil management
- Weather-related farming advice
- Irrigation techniques
- Seasonal farming tips
- Market prices and trends
- Equipment usage

Provide concise, practical, and farmer-friendly advice. Keep responses under 150 words unless detailed explanation is needed.`;

/**
 * Send a message to Groq AI and get a response
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} - The AI's response
 */
export const sendMessageToGemini = async (userMessage, conversationHistory = []) => {
  // If API key is not configured, use fallback immediately
  if (!GROQ_API_KEY || GROQ_API_KEY === "YOUR_GROK_API_KEY") {
    console.log("⚠️ Using fallback - API key not configured");
    return getFallbackResponse(userMessage);
  }

  console.log("✅ Groq API Key found, making API call...");

  try {
    // Build messages array for Groq API
    const messages = [
      {
        role: "system",
        content: SYSTEM_CONTEXT
      }
    ];

    // Add conversation history for context (last 6 messages)
    if (conversationHistory.length > 0) {
      conversationHistory.slice(-6).forEach(msg => {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.text
        });
      });
    }

    // Add current user message
    messages.push({
      role: "user",
      content: userMessage
    });

    const requestBody = {
      messages: messages,
      model: "llama-3.3-70b-versatile", // Latest Groq Llama model
      temperature: 0.7,
      max_tokens: 1024
    };

    const response = await axios.post(GROQ_API_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
    });

    console.log("✅ Groq API Response received:", response.data);

    // Extract the response text
    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content.trim();
    } else {
      throw new Error("Invalid response format from Groq API");
    }
  } catch (error) {
    console.error("❌ Groq API Error:", error.response?.data || error.message);
    console.error("Full error:", error);
    console.error("Error details:", JSON.stringify(error.response?.data, null, 2));
    
    // Provide fallback responses based on error type
    if (error.response?.status === 429) {
      return "I'm experiencing high traffic right now. Please try again in a moment.";
    } else if (error.response?.status === 403) {
      return "API key configuration issue. Please contact support.";
    } else if (!navigator.onLine) {
      return "You appear to be offline. Please check your internet connection.";
    }
    
    // Generic fallback response
    return getFallbackResponse(userMessage);
  }
};

/**
 * Fallback response when API is unavailable
 */
const getFallbackResponse = (msg) => {
  const text = msg.toLowerCase();

  if (text.includes("crop") && (text.includes("summer") || text.includes("season"))) {
    return "For summer in Maharashtra, crops like Jowar, Bajra, Moong, and Groundnut are good choices. For winter, consider Wheat, Gram, and Mustard.";
  }

  if (text.includes("fertilizer") || text.includes("nutrient")) {
    return "Use organic compost and soil-test-based fertilizers for best results. NPK ratio depends on your crop and soil type.";
  }

  if (text.includes("pest") || text.includes("disease") || text.includes("insect")) {
    return "Neem oil spray and proper irrigation can help control pests. Use our crop disease detection feature for specific diagnoses.";
  }

  if (text.includes("weather") || text.includes("rain") || text.includes("temperature")) {
    return "Check the weather widget on your dashboard for accurate forecasts. Plan your farming activities accordingly.";
  }

  if (text.includes("market") || text.includes("price") || text.includes("sell")) {
    return "Visit the Market section to browse products and check current prices. You can also view equipment rentals in the Tools section.";
  }

  if (text.includes("water") || text.includes("irrigation")) {
    return "Drip irrigation is most efficient for water conservation. Schedule irrigation based on crop type and soil moisture levels.";
  }

  return "I'm your AgriEase assistant! Ask me about crops, fertilizers, pests, weather, irrigation, or farming techniques. I'm here to help!";
};

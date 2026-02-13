# AgriEase Chatbot Setup Guide

## Grok AI Integration

The chatbot is now powered by xAI's Grok AI API, providing intelligent responses to farming and agriculture-related questions.

## Setup Instructions

### 1. Get Your Grok API Key

1. Visit [xAI Console](https://console.x.ai)
2. Sign in or create an xAI account
3. Navigate to API Keys section
4. Click "Create API Key"
5. Copy your API key

### 2. Configure Environment Variables

1. Navigate to the `frontend` folder
2. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and add your API key:
   ```
   VITE_GROK_API_KEY=your_actual_api_key_here
   ```

### 3. Restart Development Server

After adding the API key, restart your Vite development server:

```bash
npm run dev
```

## Features

- **AI-Powered Responses**: Uses xAI's Grok Beta model
- **Context-Aware**: Maintains conversation history (last 6 messages)
- **Agriculture-Focused**: Specialized in farming, crops, pests, weather, and more
- **Fallback System**: Provides basic responses if API is unavailable
- **Error Handling**: Graceful degradation with user-friendly messages
- **Loading Indicators**: Shows typing animation while AI generates response
- **Enter Key Support**: Press Enter to send messages

## Chatbot Capabilities

The AI assistant can help with:
- Crop selection and recommendations
- Pest and disease management
- Fertilizer and soil management
- Weather-related farming advice
- Irrigation techniques
- Seasonal farming tips
- Market prices and trends
- Equipment usage and recommendations

## Usage

1. Open the Farmer Dashboard
2. Find the "AgriEase AI Assistant" widget on the home page
3. Type your agriculture-related question
4. Press Enter or click "Send"
5. Wait for the AI response (loading indicator will show)

## Troubleshooting

### "API key configuration issue"
- Check that your API key is correctly added to `.env`
- Ensure the file is named exactly `.env` (not `.env.txt`)
- Restart the development server after adding the key

### "High traffic" message
- Grok API has rate limits based on your plan
- Wait a moment and try again
- Check your API usage at https://console.x.ai

### Offline message
- Check your internet connection
- The chatbot requires internet to connect to Grok API

### Fallback responses
- If API is unavailable, the chatbot provides basic pre-programmed responses
- These cover common agriculture topics

## API Limits

- Rate limits depend on your xAI subscription plan
- Check [xAI Console](https://console.x.ai) for your current limits
- If you exceed limits, the chatbot will show appropriate messages

## Security Notes

- Never commit your `.env` file to version control
- Keep your API key private
- The `.gitignore` file is configured to exclude `.env`

## Cost

- Grok API pricing varies by plan
- Check [xAI Pricing](https://x.ai/api) for current rates and limits
- Free tier may be available depending on xAI's current offerings

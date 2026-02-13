import { useState } from "react";
import Button from "./ui/Button";
import { sendMessageToGemini } from "../services/geminiService";
import { toast } from "react-toastify";

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Send message to Gemini API with conversation history
      const botResponse = await sendMessageToGemini(input, messages);
      const botMsg = { role: "bot", text: botResponse };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot error:", error);
      toast.error("Failed to get response. Please try again.");
      const errorMsg = {
        role: "bot",
        text: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <div className={`chatbot-panel ${isOpen ? "open" : ""}`} aria-hidden={!isOpen}>
        <header className="chatbot-panel__header">
          <div>
            <p className="chatbot-panel__eyebrow">AgriEase AI</p>
            <h3>Need help on the field?</h3>
          </div>
          <button
            type="button"
            className="chatbot-panel__close"
            onClick={() => setIsOpen(false)}
            aria-label="Close chatbot"
          >
            ×
          </button>
        </header>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-bubble bot">
              👋 Hello! I'm your AgriEase AI Assistant. Ask me anything about farming, crops, pests, weather, or agriculture!
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat-bubble ${m.role === "user" ? "user" : "bot"}`}
            >
              {m.text}
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble bot">
              <span className="typing-indicator">●●●</span>
            </div>
          )}
        </div>

        <div className="chatbot-panel__composer">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about farming, crops, pests..."
            className="input"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            className="btn primary square"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? "..." : "Send"}
          </Button>
        </div>
      </div>

      <button
        type="button"
        className={`chatbot-launcher ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Chat with AgriEase assistant"
        aria-expanded={isOpen}
      >
        <span className="launcher-icon" aria-hidden="true">
          🤖
        </span>
        <span className="launcher-text">Ask AgriEase</span>
      </button>
    </>
  );
}

export default Chatbot;

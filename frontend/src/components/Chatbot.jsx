import { useState } from "react";
import Button from "./ui/Button";
import { sendMessageToGemini } from "../services/geminiService";
import { toast } from "react-toastify";
import { useLanguage } from "../context/LanguageContext";

function Chatbot() {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const speakText = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "mr" ? "mr-IN" : "en-IN";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

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
      toast.error(t("chatbot.responseFailed"));
      const errorMsg = {
        role: "bot",
        text: t("chatbot.responseFallback"),
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
            <p className="chatbot-panel__eyebrow">{t("chatbot.eyebrow")}</p>
            <h3>{t("chatbot.title")}</h3>
          </div>
          <button
            type="button"
            className="chatbot-panel__close"
            onClick={() => {
              window.speechSynthesis?.cancel();
              setIsOpen(false);
            }}
            aria-label={t("chatbot.closeAria")}
          >
            ×
          </button>
        </header>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-bubble bot">
              {t("chatbot.welcome")}
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat-bubble ${m.role === "user" ? "user" : "bot"}`}
            >
              {m.text}
              {m.role === "bot" && (
                <button type="button" className="chatbot-speak-btn" onClick={() => speakText(m.text)} title={t("chatbot.listen")}> 
                  🔊
                </button>
              )}
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
            placeholder={t("chatbot.placeholder")}
            className="input"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            className="btn primary square"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? "..." : t("chatbot.send")}
          </Button>
        </div>
      </div>

      <button
        type="button"
        className={`chatbot-launcher ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={t("chatbot.launcherAria")}
        aria-expanded={isOpen}
      >
        <span className="launcher-icon" aria-hidden="true">
          🤖
        </span>
        <span className="launcher-text">{t("chatbot.launcherText")}</span>
      </button>
    </>
  );
}

export default Chatbot;

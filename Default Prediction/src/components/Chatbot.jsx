import React, { useState, useEffect, useRef } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // new state
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Smooth auto-scroll
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };
  useEffect(() => {
    scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
  }, [messages]);

  // Welcome + focus input
  useEffect(() => {
    setMessages([
      {
        sender: "bot",
        text: "👋 Hi! I'm your FinShield AI Assistant powered by Gemini. I can help you with:",
        suggestions: [
          "How to upload data files",
          "Understanding risk scores",
          "File format requirements",
          "Troubleshooting issues",
        ],
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  // WARNING: Don’t ship hardcoded API keys in client code.
  const callGeminiAPI = async (userInput) => {
    const apiKey =
      import.meta?.env?.VITE_GEMINI_API_KEY ||
      process.env.REACT_APP_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `You are a helpful AI assistant for a credit risk analysis platform called FinShield.

The user asked: "${userInput}"

Please provide a helpful, professional response about credit risk analysis, file uploads, risk scores, or any other FinShield-related topics.

Keep your response concise (2-3 sentences) and helpful. If the user is asking about technical issues, provide practical solutions.`;

    try {
      if (!apiKey) throw new Error("Missing API key");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Invalid response format");
      return text;
    } catch (err) {
      console.error("Gemini API error:", err);
      return generateFallbackResponse(userInput);
    }
  };

  const generateFallbackResponse = (userInput) => {
    const q = (userInput || "").toLowerCase();
    if (q.includes("upload") || q.includes("file")) {
      return "📁 File Upload Guide: Supported formats include CSV, Excel (.xlsx, .xls), ODS, and JSON. File size limit is 5MB. Required columns: age, monthly_income_inr, outstanding_loan_amount_inr. First row should contain column headers.";
    }
    if (q.includes("risk") || q.includes("score")) {
      return "📊 Risk Score Explanation: Low Risk (Green) < 7% default probability — usually approved. Medium Risk (Yellow) 7–18% — under review. High Risk (Red) > 18% — usually rejected.";
    }
    if (q.includes("voice") || q.includes("microphone")) {
      return "🎤 Voice Analysis: Assesses stress levels, speech coherence, and emotional factors. Click the microphone button in the upload area, speak for 10–30 seconds, and get instant analysis.";
    }
    if (q.includes("help") || q.includes("support")) {
      return "🆘 How Can I Help? Ask about file management, risk analysis, voice features, defaulter tracking, or risk simulation.";
    }
    return "🤔 Ask me about file uploads, risk scores, voice analysis, or any FinShield features. Happy to help!";
  };

  const pushMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const handleSendCore = async (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    pushMessage({ sender: "user", text: trimmed });
    setIsTyping(true);
    try {
      const reply = await callGeminiAPI(trimmed);
      pushMessage({
        sender: "bot",
        text: reply,
        suggestions: [
          "File upload help",
          "Understanding scores",
          "Voice analysis",
          "Get started",
        ],
      });
    } catch {
      pushMessage({
        sender: "bot",
        text: generateFallbackResponse(trimmed),
        suggestions: [
          "File upload help",
          "Understanding scores",
          "Voice analysis",
          "Help",
        ],
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    const toSend = input;
    setInput("");
    await handleSendCore(toSend);
  };

  const handleSuggestion = async (suggestion) => {
    setInput("");
    await handleSendCore(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 1500);
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="FinShield AI Assistant"
      className={`
        fixed z-50
        inset-x-0 bottom-0 mx-auto
        sm:bottom-24 sm:right-6 sm:left-auto sm:inset-x-auto
        w-full sm:w-[420px]
        h-[72vh] sm:h-[560px]
        bg-white/95 backdrop-blur
        border border-gray-200 shadow-2xl
        rounded-xl flex flex-col
        ${isClosing ? "animate-chatbotOut" : "animate-chatbotIn"}
      `}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-white/20 rounded-full grid place-items-center">
            <i className="fas fa-robot text-lg" aria-hidden="true"></i>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold leading-tight truncate">
              FinShield AI Assistant
            </h3>
            <p className="text-[11px] text-purple-100">Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
          aria-label="Close chat"
        >
          <i className="fas fa-times text-lg" aria-hidden="true"></i>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 px-3 sm:px-4 py-3 overflow-y-auto space-y-4 bg-gray-50">
        {messages.map((msg, i) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={i}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[86%] sm:max-w-[80%] ${
                  isUser ? "order-2" : "order-1"
                }`}
              >
                {!isUser && (
                  <div className="mb-2 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full grid place-items-center text-white text-[11px] font-bold">
                      AI
                    </div>
                    <span className="text-xs text-gray-500">Assistant</span>
                  </div>
                )}

                <div
                  className={`p-3 rounded-xl text-[15px] leading-relaxed whitespace-pre-line shadow
                  ${
                    isUser
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}
                >
                  {msg.text}

                  {msg.sender === "bot" && msg.suggestions && (
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {msg.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendCore(s)}
                          className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 transition-colors"
                        >
                          💡 {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full grid place-items-center text-white text-[11px] font-bold">
              AI
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200">
              <div className="flex gap-1 items-end">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:120ms]"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:240ms]"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white px-3 sm:px-4 pt-2 pb-3 border-t border-gray-200">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              rows={1}
              className="w-full max-h-28 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400"
              placeholder="Ask about uploads, risk scores, voice analysis..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Type a message"
              onInput={(e) => {
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height = `${Math.min(
                  e.currentTarget.scrollHeight,
                  120
                )}px`;
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-medium
                      bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700
                      focus:outline-none focus:ring-2 focus:ring-purple-500
                      disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] flex items-center gap-1"
            aria-label="Send message"
            title="Send (Enter)"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;

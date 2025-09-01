import React, { useState, useEffect, useRef } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [useAnalysisData, setUseAnalysisData] = useState(false);
  const [hasAnalysisData, setHasAnalysisData] = useState(false);
  const [showNoDataMessage, setShowNoDataMessage] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatbotRef = useRef(null);

  // Simple function to get raw user analysis data
  const getUserAnalysisData = () => {
    try {
      const storedData = localStorage.getItem("userAnalysisData");
      if (!storedData) return null;

      const parsedData = JSON.parse(storedData);
      // Return the raw data - let Gemini interpret it
      return Array.isArray(parsedData) ? parsedData[0] : parsedData;
    } catch (error) {
      console.error("Error getting user analysis data:", error);
      return null;
    }
  };

  // Check if user has analysis data on component mount
  useEffect(() => {
    const analysisData = getUserAnalysisData();
    console.log("User analysis data:", analysisData);
    setHasAnalysisData(!!analysisData);
  }, []);

  // Handle clicks outside the chatbot to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (!isClosing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isClosing]);

  // Smooth auto-scroll
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
  }, [messages]);

  // Welcome + focus input
  useEffect(() => {
    const welcomeMessage = {
      sender: "bot",
      text: "👋 Hi! I'm your FinShield Credit Coach powered by Gemini. I'm here to help you understand your credit analysis and suggest ways to improve your financial health:",
      suggestions: [
        "What does FinShield do?",
        "How to upload data files",
        "Understanding risk scores",
        "File format requirements",
        "Troubleshooting issues",
      ],
    };

    if (hasAnalysisData) {
      welcomeMessage.suggestions.unshift("Analyze my credit report");
      welcomeMessage.text +=
        "\n\n💡 I can see you have analysis data. Enable 'Use My Analysis Data' below to get personalized insights!";
    }

    setMessages([welcomeMessage]);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [hasAnalysisData]);

  // Enhanced Gemini API call with comprehensive FinShield context
  const callGeminiAPI = async (userInput) => {
    const apiKey = "AIzaSyCeKifrVWpgoQ1Qz6FnmJUFDKH1vAcgGns";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    let prompt = "";

    if (useAnalysisData && hasAnalysisData) {
      const userData = getUserAnalysisData();

      // Enhanced prompt with comprehensive FinShield context
      prompt = `You are FinShield's AI Credit Coach, an expert financial advisor specializing in credit risk analysis and loan approval predictions.

ABOUT FINSHIELD RISK ANALYZER:
FinShield is an advanced AI-powered credit risk assessment platform that:
- Analyzes comprehensive financial data to predict loan default probability
- Evaluates 40+ financial parameters including income, expenses, behavioral patterns, digital footprints
- Categorizes applicants into risk levels: Low Risk (<7% default), Medium Risk (7-18% default), High Risk (>18% default)
- Provides personalized financial health scores, timeliness scores, and repayment ability assessments
- Helps lenders make informed loan approval decisions
- Assists individuals in understanding and improving their creditworthiness

RISK ASSESSMENT METHODOLOGY:
- Low Risk (Green): <18% default probability → Usually approved for loans
- Medium Risk (Yellow): 18-42% default probability → Requires review, conditional approval
- High Risk (Red): >42% default probability → Usually rejected or requires collateral

USER'S COMPLETE FINANCIAL ANALYSIS DATA:
${JSON.stringify(userData, null, 2)}

USER QUESTION: "${userInput}"

RESPONSE GUIDELINES:
- Answer their specific question DIRECTLY using their actual financial data
- Reference specific numbers, percentages, and scores from their profile
- For loan amount questions: Calculate realistic amounts based on income (typically 4-6x annual income minus existing debt)
- For risk questions: Explain their category and what it means for loan approval
- For improvement questions: Provide specific, actionable steps based on their weak areas
- Use emojis appropriately and maintain a supportive, professional tone
- Keep responses focused and practical (3-6 sentences)
- Compare their metrics to industry standards when relevant

EXPECTED OUTPUT FORMAT:
- Start with a direct answer to their question
- Include relevant numbers from their data
- Provide actionable insights or next steps
- End with encouragement or additional context if helpful`;
    } else {
      // Enhanced general prompt without personal data
      prompt = `You are FinShield's AI Credit Coach, a financial advisor specializing in credit analysis and risk assessment.

ABOUT FINSHIELD RISK ANALYZER:
FinShield is an AI-powered credit risk assessment platform that:
- Analyzes comprehensive financial profiles to predict loan default probability
- Evaluates income, expenses, employment history, behavioral patterns, and digital footprints
- Categorizes risk levels: Low Risk (<7% default), Medium Risk (7-18%), High Risk (>18%)
- Provides financial health scores and personalized improvement recommendations
- Helps both lenders and individuals make better financial decisions

PLATFORM CAPABILITIES:
- File Upload: Supports CSV, Excel, JSON formats with financial data
- Risk Analysis: Comprehensive evaluation of 40+ financial parameters
- Scoring System: Financial health, timeliness, repayment ability scores
- Recommendations: Personalized advice for credit improvement
- Dashboard: Visual analytics and historical analysis tracking

USER QUESTION: "${userInput}"

RESPONSE GUIDELINES:
- Provide helpful, accurate information about credit analysis and FinShield features
- Explain financial concepts in simple, understandable terms
- Give actionable advice for credit improvement
- Use emojis appropriately and maintain a professional yet friendly tone
- Keep responses concise and focused (3-5 sentences)
- If asked about specific calculations, explain the methodology clearly

EXPECTED OUTPUT FORMAT:
- Direct answer to their question
- Clear explanations with examples when helpful
- Actionable next steps or recommendations
- Encourage them to use FinShield's analysis features when relevant`;
    }

    if (!apiKey) {
      throw new Error(
        "Missing API key - Please set your Gemini API key in environment variables"
      );
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6, // Slightly higher for more conversational responses
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000, // Increased for more detailed responses
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Invalid response format from Gemini API");
    }

    return text.trim();
  };

  const pushMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const handleSendCore = async (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return;

    pushMessage({ sender: "user", text: trimmed });
    setIsTyping(true);

    try {
      const reply = await callGeminiAPI(trimmed);

      // Enhanced dynamic suggestions based on context
      const suggestions =
        useAnalysisData && hasAnalysisData
          ? [
              "What's my loan approval probability?",
              "How can I improve my risk score?", 
              "Explain my financial health score",
              "What's my maximum loan amount?",
              "Compare my profile to standards"
            ]
          : [
              "How does FinShield risk analysis work?",
              "What file formats are supported?",
              "Explain risk categories and scoring",
              "How to improve creditworthiness?",
              "What data does FinShield analyze?"
            ];

      pushMessage({
        sender: "bot",
        text: reply,
        suggestions: suggestions.slice(0, 4), // Limit to 4 suggestions
      });
    } catch (error) {
      console.error("Gemini API error:", error);

      // Show error message to user
      pushMessage({
        sender: "bot",
        text: `❌ **Error**: ${error.message}\n\nPlease check your API key configuration or try again later.`,
        suggestions: ["Try again", "Check API settings"],
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;

    if (isChecked && !hasAnalysisData) {
      setShowNoDataMessage(true);
      setUseAnalysisData(false);
      setTimeout(() => setShowNoDataMessage(false), 3000);
    } else {
      setUseAnalysisData(isChecked);
    }
  };

  // Rest of the JSX remains the same...
  return (
    <>
      {/* Inline CSS for animations */}
      <style jsx>{`
        @keyframes slideInFromRight {
          0% {
            opacity: 0;
            transform: translateX(100%);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOutToRight {
          0% {
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateX(100%);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .chatbot-slide-in {
          animation: slideInFromRight 0.5s forwards ease-in-out;
        }
        .chatbot-slide-out {
          animation: slideOutToRight 0.5s forwards ease-in-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

      <div
        ref={chatbotRef}
        role="dialog"
        aria-modal="true"
        aria-label="FinShield Credit Coach"
        className={`fixed z-50 inset-x-0 bottom-0 mx-auto sm:bottom-24 sm:right-6 sm:left-auto sm:inset-x-auto w-full sm:w-[420px] h-[72vh] sm:h-[560px] bg-white/95 backdrop-blur border border-gray-200 shadow-2xl rounded-xl flex flex-col ${
          isClosing ? "chatbot-slide-out" : "chatbot-slide-in"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-white/20 rounded-full grid place-items-center">
              <i className="fas fa-robot text-lg" aria-hidden="true"></i>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold leading-tight truncate">
                FinShield Credit Coach
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
                      <span className="text-xs text-gray-500">Coach</span>
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-xl text-[15px] leading-relaxed whitespace-pre-line shadow ${
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

        {/* Analysis Data Permission Checkbox */}
        <div className="px-3 sm:px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="relative">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={useAnalysisData}
                onChange={handleCheckboxChange}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              />
              <span
                className={`text-gray-700 ${
                  !hasAnalysisData ? "opacity-75" : ""
                }`}
              >
                Use my analysis data for personalized insights
              </span>
            </label>
            {showNoDataMessage && (
              <div className="absolute -top-12 left-0 right-0 bg-orange-100 border border-orange-300 rounded-lg p-2 shadow-lg animate-fade-in">
                <div className="flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle text-orange-500 text-sm"></i>
                  <span className="text-sm text-orange-700 font-medium">
                    Please perform an analysis first to enable this feature
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-white px-3 sm:px-4 pt-2 pb-3 border-t border-gray-200">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                rows={1}
                className="w-full max-h-28 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400 overflow-hidden"
                placeholder={
                  useAnalysisData
                    ? "Ask about your credit analysis, risk scores, or how to improve..."
                    : "Ask about FinShield, data uploads, risk scores..."
                }
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
              className="px-4 py-2.5 rounded-xl text-white text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] flex items-center gap-1"
              aria-label="Send message"
              title="Send (Enter)"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chatbot;

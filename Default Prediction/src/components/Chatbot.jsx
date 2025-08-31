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

  // Get user's analysis data from localStorage
  const getUserAnalysisData = () => {
    try {
      const storedData = localStorage.getItem("userAnalysisData");
      return storedData ? JSON.parse(storedData) : null;
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
      text:
        "👋 Hi! I'm your FinShield Credit Coach powered by Gemini. I’m here to help you understand your credit analysis and suggest ways to improve your financial health:",
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

  const callGeminiAPI = async (userInput) => {
    const apiKey =
      import.meta?.env?.VITE_GEMINI_API_KEY ||
      process.env.REACT_APP_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    let analysisContext = "";

    if (useAnalysisData && hasAnalysisData) {
      const analysisData = getUserAnalysisData();
      if (analysisData) {
        // Assuming single user data structure
        const userSummary = analysisData.user_summary || {};
        analysisContext = `

IMPORTANT: The user has given permission to use their personal credit analysis data. Here's your data:
- Total Loan Applications: ${userSummary.total_applications || "N/A"}
- Approved Applications: ${userSummary.approved || 0}
- Applications Under Review: ${userSummary.under_review || 0}
- Rejected Applications: ${userSummary.rejected || 0}
- Default Probability: ${
          userSummary.default_probability
            ? (userSummary.default_probability * 100).toFixed(2) + "%"
            : "N/A"
        }
- Monthly Income: ₹${userSummary.monthly_income?.toLocaleString() || "N/A"}
- Timeliness Score: ${userSummary.timeliness_score || "N/A"}
- Repayment Score: ${userSummary.repayment_score || "N/A"}

Use this data to give personalized credit health insights and recommendations.`;
      }
    }

    // Enhanced prompt with correct user-centric instructions
    const prompt = `You are a helpful AI assistant for a credit analysis platform called FinShield.

IMPORTANT INSTRUCTIONS:
- Always provide a helpful and accurate answer to every question.
- Do not ignore any questions - even if they seem outside your immediate scope.
- If you don't have specific information, provide a professional response based on your general knowledge.
- Be conversational and friendly while maintaining professionalism.

ABOUT FINSHIELD:
FinShield is an AI-powered platform designed to help you understand your personal credit and financial health. We provide automated credit analysis, personalized insights, and actionable recommendations to help you improve your financial profile and enhance your chances of loan approval.
${analysisContext}

The user asked: "${userInput}"

Please provide a helpful, professional response focused on user credit analysis and improvement insights.

${useAnalysisData && hasAnalysisData ? "Since you have access to their personal analysis data, provide personalized insights based on their specific results when relevant." : ""}

Keep your response concise (2-4 sentences) and helpful.`;

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

    if (useAnalysisData && hasAnalysisData) {
      const analysisData = getUserAnalysisData();
      if (analysisData) {
        const userSummary = analysisData.user_summary || {};
        if (q.includes("my") || q.includes("analysis") || q.includes("report")) {
          return `📊 Your Analysis Summary: You have applied for ${userSummary.total_applications || 0} loans, with ${
            userSummary.approved || 0
          } approved, ${
            userSummary.under_review || 0
          } under review, and ${
            userSummary.rejected || 0
          } rejected. Your average default probability is ${
            userSummary.default_probability
              ? (userSummary.default_probability * 100).toFixed(2) + "%"
              : "not available"
          }.`;
        }
      }
    }

    if (q.includes("finshield") && (q.includes("what") || q.includes("do") || q.includes("about"))) {
      return "🛡️ FinShield is an AI-powered platform designed to help you understand your personal credit and financial health. We provide automated credit analysis, personalized insights, and actionable recommendations to help you improve your financial profile and enhance your chances of loan approval.";
    }

    if (q.includes("finshield") && q.includes("feature")) {
      return "✨ FinShield offers automated credit analysis, personalized insights, data upload support (CSV, Excel), and actionable financial improvement suggestions based on your credit data.";
    }

    if (q.includes("upload") || q.includes("file")) {
      return "📁 File Upload Guide: Supported formats include CSV, Excel (.xlsx, .xls), ODS, and JSON. File size limit is 5MB. Required columns: age, monthly_income_inr, outstanding_loan_amount_inr. First row should contain column headers.";
    }

    if (q.includes("risk") || q.includes("score")) {
      return "📊 Risk Score Explanation: Low Risk (Green) < 7% default probability — usually approved. Medium Risk (Yellow) 7–18% — under review. High Risk (Red) > 18% — usually rejected.";
    }

    if (q.includes("help") || q.includes("support")) {
      return "🆘 How Can I Help? Ask about FinShield features, file management, risk analysis, or improving your credit score.";
    }

    return `🤔 I'd be happy to help with that! I specialize in credit analysis, FinShield platform features, file uploads, and user-focused financial improvement advice. Could you please provide more details about your question?`;
  };

  const pushMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const handleSendCore = async (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    pushMessage({ sender: "user", text: trimmed });
    setIsTyping(true);
    try {
      const reply = await callGeminiAPI(trimmed);
      const suggestions = [
        "What does FinShield do?",
        "File upload help",
        "Understanding scores",
        "Get started",
      ];

      if (useAnalysisData && hasAnalysisData) {
        suggestions.unshift("Improve my credit score", "My credit analysis");
      }

      pushMessage({
        sender: "bot",
        text: reply,
        suggestions,
      });
    } catch {
      pushMessage({
        sender: "bot",
        text: generateFallbackResponse(trimmed),
        suggestions: useAnalysisData && hasAnalysisData
          ? [
              "My credit analysis",
              "FinShield features",
              "File upload help",
              "Understanding scores",
            ]
          : [
              "What does FinShield do?",
              "File upload help",
              "Understanding scores",
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
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;

    if (isChecked && !hasAnalysisData) {
      setShowNoDataMessage(true);
      setUseAnalysisData(false);

      setTimeout(() => {
        setShowNoDataMessage(false);
      }, 3000);
    } else {
      setUseAnalysisData(isChecked);
    }
  };

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
        className={`
          fixed z-50
          inset-x-0 bottom-0 mx-auto
          sm:bottom-24 sm:right-6 sm:left-auto sm:inset-x-auto
          w-full sm:w-[420px]
          h-[72vh] sm:h-[560px]
          bg-white/95 backdrop-blur
          border border-gray-200 shadow-2xl
          rounded-xl flex flex-col
          ${isClosing ? "chatbot-slide-out" : "chatbot-slide-in"}
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
              <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[86%] sm:max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
                  {!isUser && (
                    <div className="mb-2 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full grid place-items-center text-white text-[11px] font-bold">
                        AI
                      </div>
                      <span className="text-xs text-gray-500">Coach</span>
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-xl text-[15px] leading-relaxed whitespace-pre-line shadow
                            ${isUser ? "bg-blue-600 text-white" : "bg-white text-gray-800 border border-gray-200"}`}
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
              <span className={`text-gray-700 ${!hasAnalysisData ? "opacity-75" : ""}`}>
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
                className="w-full max-h-28 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm resize-none
                   focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400"
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
                  e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 120)}px`;
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
    </>
  );
};

export default Chatbot;

import React, { useState } from "react";
import { Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import Chatbot from "./Chatbot";

function Layout({ children }) {
  const location = useLocation(); // This will track route changes
  const navigate = useNavigate();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check if current user is a banker
  const getBankerStatus = () => {
    const userType = localStorage.getItem("userType");
    return userType === "banker";
  };

  const isBanker = getBankerStatus();

  const handleChatbotToggle = () => {
    setIsChatbotOpen((prev) => !prev);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 1500);
  };

  // Logout function
  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("analysisHistory"); // Clear any cached analysis history

    // Dispatch auth change event to clear state in App component
    window.dispatchEvent(new Event("auth-change"));

    // Force refresh the page to clear all state
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white">
          <div className="flex items-center ml-7 h-16 px-4 border-b border-blue-700">
            <div className="flex items-left">
              <i className="fas fa-chart-line text-2xl text-blue-300"></i>
              <span className="text-xl font-semibold">RiskAnalyzer</span>
            </div>
          </div>

          <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
            <nav className="flex-1 space-y-2">
              <Link
                to="/dashboard"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  location.pathname === "/dashboard"
                    ? "bg-blue-700 text-white"
                    : "text-blue-200 hover:bg-blue-700 hover:text-white"
                }`}
              >
                <i className="fas fa-home mr-3"></i>
                Dashboard
              </Link>

              <Link
                to="/analyze"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  location.pathname === "/analyze"
                    ? "bg-blue-700 text-white"
                    : "text-blue-200 hover:bg-blue-700 hover:text-white"
                }`}
              >
                <i className="fas fa-file-upload mr-3"></i>
                Analyze Data
              </Link>

              <Link
                to="/history"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  location.pathname === "/history"
                    ? "bg-blue-700 text-white"
                    : "text-blue-200 hover:bg-blue-700 hover:text-white"
                }`}
              >
                <i className="fas fa-history mr-3"></i>
                Analysis History
              </Link>
            </nav>

            {/* User Info & Logout Section - Bottom Left */}
            <div className="mt-auto pt-4 space-y-3 border-t border-blue-700">
              {/* User Type Info */}
              <div className="flex items-center px-4 py-2 bg-blue-700 bg-opacity-50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full mr-3">
                  <i
                    className={`fas ${
                      isBanker ? "fa-user-tie" : "fa-user"
                    } text-white text-sm`}
                  ></i>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-200 uppercase tracking-wider">
                    {isBanker ? "Banker Account" : "User Account"}
                  </p>
                  <p className="text-sm font-medium text-white">
                    {isBanker ? "Banking Portal" : "Credit Analysis"}
                  </p>
                </div>
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isBanker ? "bg-green-400" : "bg-blue-400"
                    }`}
                  ></div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-4 text-sm font-medium rounded-lg text-blue-200 hover:bg-red-600 hover:text-white transition-colors duration-200"
              >
                <i className="fas fa-sign-out-alt mr-4"></i>
                <span className="leading-none">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-blue-800 text-white">
          <div className="flex items-center">
            <i className="fas fa-chart-line text-xl text-blue-300 mr-2"></i>
            <span className="text-lg font-semibold">RiskAnalyzer</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile user type indicator */}
            <div className="flex items-center px-2 py-1 bg-blue-700 rounded-md">
              <i
                className={`fas ${
                  isBanker ? "fa-user-tie" : "fa-user"
                } text-xs mr-1`}
              ></i>
              <span className="text-xs font-medium">
                {isBanker ? "Banker" : "User"}
              </span>
            </div>
            {/* Mobile logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-blue-200 hover:text-white hover:bg-red-600 transition-colors duration-200"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
            <button className="p-1 rounded-md text-blue-200 hover:text-white">
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {children}
        </main>

        {/* Chatbot button - Only show for users, not bankers */}
        {!isBanker && (
          <div className="fixed bottom-6 right-6 flex items-center gap-2">
            <button
              className={`p-1 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                isBouncing ? "animate-bounce" : ""
              }`}
              onClick={handleChatbotToggle}
              aria-label="Open AI Chatbot"
            >
              <img
                src="https://img.freepik.com/free-vector/chatbot-chat-message-vectorart_78370-4104.jpg"
                alt="AI"
                className="w-10 h-10 object-cover rounded-full"
              />
            </button>
          </div>
        )}

        {/* Chatbot component - Only render for users, not bankers */}
        {!isBanker && isChatbotOpen && (
          <Chatbot onClose={() => setIsChatbotOpen(false)} />
        )}
      </div>
    </div>
  );
}

export default Layout;

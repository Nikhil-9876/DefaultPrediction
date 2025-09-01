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
          <div className="flex flex-row items-center px-6 py-4 h-30 border-b border-blue-700">
            {/* Logo to the left */}
            <div className="mr-4">
              <img
                src="images/RA.png"
                alt="RiskAnalyzer Logo"
                className="w-20 h-20 object-cover"
              />
            </div>
            {/* Title to the right */}
            <div className="text-left">
              <span className="text-2xl font-bold tracking-tight">
                RiskAnalyzer
              </span>
            </div>
          </div>

          <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
            <nav className="flex-1 space-y-2">
              <Link
                to="/dashboard"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  location.pathname === "/dashboard"
                    ? "bg-blue-700 text-white shadow-md"
                    : "text-blue-200 hover:bg-blue-700 hover:text-white"
                }`}
              >
                <i className="fas fa-home mr-3 text-lg"></i>
                Dashboard
              </Link>

              <Link
                to="/analyze"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  location.pathname === "/analyze"
                    ? "bg-blue-700 text-white shadow-md"
                    : "text-blue-200 hover:bg-blue-700 hover:text-white"
                }`}
              >
                <i className="fas fa-file-upload mr-3 text-lg"></i>
                Analyze Data
              </Link>

              <Link
                to="/history"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  location.pathname === "/history"
                    ? "bg-blue-700 text-white shadow-md"
                    : "text-blue-200 hover:bg-blue-700 hover:text-white"
                }`}
              >
                <i className="fas fa-history mr-3 text-lg"></i>
                Analysis History
              </Link>

              <Link
                to="/about"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  location.pathname === "/about"
                    ? "bg-blue-700 text-white shadow-md"
                    : "text-blue-200 hover:bg-blue-700 hover:text-white"
                }`}
              >
                <i className="fas fa-info-circle mr-3 text-lg"></i>
                About Us
              </Link>
            </nav>

            {/* User Info & Logout Section - Bottom Left */}
            <div className="mt-auto pt-4 space-y-3 border-t border-blue-700">
              {/* User Type Info */}
              <div className="flex items-center px-4 py-3 bg-blue-700 bg-opacity-50 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full mr-3 shadow-md">
                  <i
                    className={`fas ${
                      isBanker ? "fa-user-tie" : "fa-user"
                    } text-white text-sm`}
                  ></i>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-200 uppercase tracking-wider font-medium">
                    {isBanker ? "Banker Account" : "User Account"}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {isBanker ? "Banking Portal" : "Credit Analysis"}
                  </p>
                </div>
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full shadow-sm ${
                      isBanker ? "bg-green-400" : "bg-blue-400"
                    }`}
                  ></div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-4 text-sm font-medium rounded-lg text-blue-200 hover:bg-red-600 hover:text-white transition-all duration-200 hover:shadow-md"
              >
                <i className="fas fa-sign-out-alt mr-4 text-lg"></i>
                <span className="leading-none font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg">
          <div className="flex items-center">
            {/* Mobile Logo - increased size */}
            <div className="mr-3">
              <img
                src="images/RA.png"
                alt="RiskAnalyzer Logo"
                className="w-12 h-12 object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">
                RiskAnalyzer
              </span>
              <span className="text-xs text-blue-300 font-medium">
                Financial Intelligence
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile user type indicator */}
            <div className="flex items-center px-3 py-1.5 bg-blue-700 rounded-lg shadow-md">
              <i
                className={`fas ${
                  isBanker ? "fa-user-tie" : "fa-user"
                } text-xs mr-2`}
              ></i>
              <span className="text-xs font-semibold">
                {isBanker ? "Banker" : "User"}
              </span>
            </div>
            {/* Mobile logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-red-600 transition-all duration-200 hover:shadow-md"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt text-lg"></i>
            </button>
            <button className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-700 transition-all duration-200">
              <i className="fas fa-bars text-lg"></i>
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
              className={`p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:shadow-xl ${
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

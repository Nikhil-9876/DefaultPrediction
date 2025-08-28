import React from 'react';

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-32 h-32 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fas fa-shield-alt text-white text-3xl animate-pulse"></i>
          </div>
        </div>
        
        <div className="text-white">
          <h2 className="text-2xl font-bold mb-2 animate-pulse">Credit Risk System</h2>
          <p className="text-blue-200 animate-bounce">Analyzing financial data...</p>
        </div>
        
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;

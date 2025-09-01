import React from "react";
import { Link } from "react-router-dom";

function Dashboard({ history, onLoadAnalysis }) {
  const totalAnalyses = history.length;
  const usertype = localStorage.getItem("userType");

  const getTotalPortfolioStats = (analysisHistory) => {
    let totalApproved = 0;
    let totalRejected = 0;
    let totalPending = 0;

    analysisHistory.forEach((analysis) => {
      if (analysis.jsonData && Array.isArray(analysis.jsonData)) {
        analysis.jsonData.forEach((applicant) => {
          if (applicant.risk_category) {
            const risk = applicant.risk_category.toLowerCase();
            
            if (risk.includes('low')) totalApproved += 1;
            else if (risk.includes('medium') || risk.includes('pending')) totalPending += 1;
            else if (risk.includes('high') || risk.includes('rejected') || risk.includes('very')) totalRejected += 1;
          }
        });
      }
    });

    return {
      totalApproved,
      totalRejected,
      totalPending,
      hasData: totalApproved + totalRejected + totalPending > 0,
    };
  };

  const portfolioStats = getTotalPortfolioStats(history);

  return (
    <div className="space-y-6">
      {/* Header - Removed the last analyzed date */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      {/* Stats Cards - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Analyses
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {totalAnalyses}
              </p>
            </div>
            {/* Removed circle background, kept only icon */}
            <i className="fas fa-chart-pie text-blue-600 text-2xl"></i>
          </div>
        </div>

        {portfolioStats.hasData ? (
          <>
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Approved Loans
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {portfolioStats.totalApproved}
                  </p>
                </div>
                {/* Removed circle background, kept only icon */}
                <i className="fas fa-check-circle text-green-600 text-2xl"></i>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Rejected Loans
                  </p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    {portfolioStats.totalRejected}
                  </p>
                </div>
                {/* Removed circle background, kept only icon */}
                <i className="fas fa-times-circle text-red-600 text-2xl"></i>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex items-center justify-center col-span-2 hover:shadow-xl transition-shadow duration-200">
            <div className="text-center">
              {/* Removed circle background, kept only icon */}
              <i className="fas fa-chart-bar text-gray-400 text-2xl mb-3"></i>
              <p className="text-gray-500">No portfolio data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions - Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/analyze"
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex flex-col items-center text-center">
            {/* Removed circle background, kept only icon with larger size */}
            <i className="fas fa-file-upload text-blue-600 text-3xl mb-4"></i>
            <h3 className="font-semibold text-gray-800 text-lg mb-2">New Analysis</h3>
            <p className="text-sm text-gray-500">
              Upload data for risk assessment
            </p>
          </div>
        </Link>

        <Link
          to="/history"
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex flex-col items-center text-center">
            {/* Removed circle background, kept only icon with larger size */}
            <i className="fas fa-history text-green-600 text-3xl mb-4"></i>
            <h3 className="font-semibold text-gray-800 text-lg mb-2">History</h3>
            <p className="text-sm text-gray-500">View past analyses</p>
          </div>
        </Link>

        <a
          href="/templates/sample.csv"
          download="credit_risk_template.csv"
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex flex-col items-center text-center">
            {/* Removed circle background, kept only icon with larger size */}
            <i className="fas fa-download text-purple-600 text-3xl mb-4"></i>
            <h3 className="font-semibold text-gray-800 text-lg mb-2">Template</h3>
            <p className="text-sm text-gray-500">Download data template</p>
          </div>
        </a>
      </div>

      {/* Recent Analyses */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <i className="fas fa-clock text-gray-600 mr-2"></i>
              Recent Analyses
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {history.slice(0, 5).map((analysis) => (
              <div
                key={analysis._id || analysis.dateTime}
                className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                onClick={() => onLoadAnalysis(analysis)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {/* Removed circle background, kept only icon */}
                    <i className="fas fa-file-csv text-blue-600 text-lg mr-3"></i>
                    <div>
                      <p className="font-medium text-gray-800">
                        {analysis.fileName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(analysis.dateTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                      <i className="fas fa-check mr-1"></i>
                      Completed
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <i className="fas fa-users mr-1"></i>
                      {analysis.jsonData?.length || 0} applicants
                    </span>
                    <i className="fas fa-chevron-right text-gray-400"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {history.length > 5 && (
            <div className="px-6 py-3 border-t border-gray-200 text-center bg-gray-50">
              <Link
                to="/history"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
              >
                <i className="fas fa-arrow-right mr-1"></i>
                View All Analyses
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;

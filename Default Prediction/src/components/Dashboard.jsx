import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard({ history, onLoadAnalysis }) {
  const totalAnalyses = history.length;
  const lastAnalysis = history[0];

  const usertype=localStorage.getItem("userType");
  // console.log("User type on Dashboard:", usertype);

  const getPortfolioStats = (analysis) => {
    if (!analysis || !analysis.data || !analysis.data.portfolio_overview) return null;
    return analysis.data.portfolio_overview.approval_summary;
  };

  const portfolioStats = getPortfolioStats(lastAnalysis);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {lastAnalysis
            ? `Last analyzed: ${new Date(lastAnalysis.timestamp).toLocaleString()}`
            : 'No analyses yet'}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Analyses</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{totalAnalyses}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <i className="fas fa-chart-pie text-xl"></i>
            </div>
          </div>
        </div>

        {portfolioStats ? (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved Loans</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{portfolioStats.Approve || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <i className="fas fa-check-circle text-xl"></i>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6 flex items-center justify-center">
            <p className="text-gray-500">No analysis data available</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/analyze" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition cursor-pointer">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-3">
              <i className="fas fa-file-upload text-2xl"></i>
            </div>
            <h3 className="font-medium text-gray-800">New Analysis</h3>
            <p className="text-sm text-gray-500 mt-1">Upload data for risk assessment</p>
          </div>
        </Link>

        <Link to="/history" className="bg-white rounded-xl shadow p-6 hover:shadow-md transition cursor-pointer">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-green-100 text-green-600 mb-3">
              <i className="fas fa-history text-2xl"></i>
            </div>
            <h3 className="font-medium text-gray-800">History</h3>
            <p className="text-sm text-gray-500 mt-1">View past analyses</p>
          </div>
        </Link>

        <a
          href="/templates/sample.csv"
          download="credit_risk_template.csv"
          className="bg-white rounded-xl shadow p-6 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-purple-100 text-purple-600 mb-3">
              <i className="fas fa-file-alt text-2xl"></i>
            </div>
            <h3 className="font-medium text-gray-800">Template</h3>
            <p className="text-sm text-gray-500 mt-1">Download data template</p>
          </div>
        </a>
      </div>

      {/* Recent Analyses */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Recent Analyses</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {history.slice(0, 5).map((analysis) => (
              <div
                key={analysis.id}
                className="px-6 py-4 hover:bg-gray-50 transition cursor-pointer"
                onClick={() => onLoadAnalysis(analysis)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{analysis.filename}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(analysis.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {analysis.status || 'Completed'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {analysis.data?.individual_applicants?.length || 0} applicants
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {history.length > 5 && (
            <div className="px-6 py-3 border-t border-gray-200 text-center">
              <Link to="/history" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
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

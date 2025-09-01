import React from "react";
import { Link } from "react-router-dom";
// Import Material UI Icons
import AddIcon from "@mui/icons-material/Add";
import HistoryIcon from "@mui/icons-material/History";
import DownloadIcon from "@mui/icons-material/Download";
import PieChartIcon from "@mui/icons-material/PieChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import BarChartIcon from "@mui/icons-material/BarChart";
import DescriptionIcon from "@mui/icons-material/Description";
import GroupIcon from "@mui/icons-material/Group";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

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

            if (risk.includes("low")) totalApproved += 1;
            else if (risk.includes("medium") || risk.includes("pending"))
              totalPending += 1;
            else if (
              risk.includes("high") ||
              risk.includes("rejected") ||
              risk.includes("very")
            )
              totalRejected += 1;
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
      {/* Header */}
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
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex items-center justify-center col-span-2 hover:shadow-xl transition-shadow duration-200">
            <div className="text-center">
              <BarChartIcon
                style={{ fontSize: 32, color: "#9ca3af", marginBottom: "12px" }}
              />
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
            <div className="relative mb-4">
              <AddIcon
                style={{
                  fontSize: 48,
                  color: "#3b82f6",
                }}
              />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-2">
              New Analysis
            </h3>
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
            <div className="relative mb-4">
              <HistoryIcon
                style={{
                  fontSize: 48,
                  color: "#10b981",
                }}
              />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-2">
              History
            </h3>
            <p className="text-sm text-gray-500">View past analyses</p>
          </div>
        </Link>

        <a
          href="/templates/sample.csv"
          download="credit_risk_template.csv"
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <DownloadIcon
                style={{
                  fontSize: 48,
                  color: "#a855f7",
                }}
              />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-2">
              Template
            </h3>
            <p className="text-sm text-gray-500">Download data template</p>
          </div>
        </a>
      </div>

      {/* Recent Analyses */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <AccessTimeIcon
                style={{ fontSize: 20, color: "#6b7280", marginRight: "8px" }}
              />
              Recent Analyses
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {history.slice(0, 5).map((analysis, index) => (
              <div
                key={analysis._id || analysis.dateTime}
                className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                onClick={() => onLoadAnalysis(analysis)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      <DescriptionIcon
                        style={{ fontSize: 20, color: "#3b82f6" }}
                      />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
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
                    <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium flex items-center">
                      <CheckCircleIcon
                        style={{ fontSize: 12, marginRight: "4px" }}
                      />
                      Completed
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <GroupIcon
                        style={{
                          fontSize: 16,
                          color: "#3b82f6",
                          marginRight: "4px",
                        }}
                      />
                      {analysis.jsonData?.length || 0} applicants
                    </span>
                    <ArrowForwardIcon
                      style={{ fontSize: 16, color: "#9ca3af" }}
                      className="hover:text-gray-600 transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {history.length > 5 && (
            <div className="px-6 py-3 border-t border-gray-200 text-center bg-gray-50">
              <Link
                to="/history"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center transition-colors"
              >
                <ArrowForwardIcon
                  style={{ fontSize: 16, marginRight: "4px" }}
                />
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

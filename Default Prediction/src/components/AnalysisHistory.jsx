import React, { useState } from 'react';
import ResultsModal from './../assets/modal/ResultsModal';

function AnalysisHistory({ history, onLoadAnalysis, showNotification, onDeleteAnalysis, userType = "banker" }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const handleRowClick = (analysis, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedAnalysis(analysis);
    
    if (onLoadAnalysis) {
      onLoadAnalysis(analysis);
    }
    
    setTimeout(() => {
      setModalOpen(true);
    }, 100);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setSelectedAnalysis(null);
    }, 300);
  };

  const handleDelete = (analysis, event) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      if (onDeleteAnalysis) {
        onDeleteAnalysis(analysis);
      }
    }
  };

  const calculateAnalysisStats = (analysis) => {
    if (!analysis?.jsonData || !Array.isArray(analysis.jsonData)) {
      return { Low: 0, Medium: 0, High: 0, total: 0 };
    }

    let lowCount = 0;
    let mediumCount = 0;
    let highCount = 0;

    analysis.jsonData.forEach((applicant) => {
      const riskCategory = applicant.risk_category;
      
      if (riskCategory === 'Low Risk') {
        lowCount++;
      } else if (riskCategory === 'Medium Risk') {
        mediumCount++;
      } else if (riskCategory === 'High Risk' || riskCategory === 'Very High Risk') {
        highCount++;
      } else {
        mediumCount++;
      }
    });

    return {
      Low: lowCount,
      Medium: mediumCount,
      High: highCount,
      total: analysis.jsonData.length
    };
  };

  const getAnalysisFilename = (analysis, index) => {
    return analysis.fileName || analysis.filename || analysis.name || `Analysis ${index + 1}`;
  };

  const getAnalysisTimestamp = (analysis) => {
    return analysis.dateTime || analysis.timestamp || analysis.createdAt || analysis.date;
  };

  const getAnalysisSummary = (analysis) => {
    if (!analysis?.jsonData || !Array.isArray(analysis.jsonData)) {
      return {
        totalApplicants: 0,
        avgRiskScore: 0,
        avgDefaultProb: 0,
        cities: []
      };
    }

    const totalApplicants = analysis.jsonData.length;
    let totalRiskScore = 0;
    let totalDefaultProb = 0;
    const cities = new Set();

    analysis.jsonData.forEach(applicant => {
      totalRiskScore += applicant.risk_score || 0;
      totalDefaultProb += applicant.probability_of_default || 0;
      if (applicant.city) {
        cities.add(applicant.city);
      }
    });

    return {
      totalApplicants,
      avgRiskScore: totalApplicants > 0 ? (totalRiskScore / totalApplicants).toFixed(1) : 0,
      avgDefaultProb: totalApplicants > 0 ? ((totalDefaultProb / totalApplicants) * 100).toFixed(1) : 0,
      cities: Array.from(cities).slice(0, 3)
    };
  };

  const getUserAnalysisData = (analysis) => {
    if (!analysis?.jsonData || !Array.isArray(analysis.jsonData) || analysis.jsonData.length === 0) {
      return null;
    }
    
    // For users, typically there should be only one record per analysis
    const userData = analysis.jsonData[0];
    return userData;
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header - Removed the "X analyses stored" text */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {userType === "user" ? "My Analysis History" : "Analysis History"}
          </h1>
        </div>

        {!Array.isArray(history) || history.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-history text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Analysis History</h3>
            <p className="text-gray-500">
              {userType === "user" 
                ? "Complete your credit assessment to see results here" 
                : "Perform analyses to see them appear here"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {userType === "user" ? (
                    // User table headers - simplified with income
                    <>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Analysis Date
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monthly Income
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Category
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Score
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </>
                  ) : (
                    // Banker table headers - full view
                    <>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Filename
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Records
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Low Risk
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medium Risk
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        High Risk
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Risk Score
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((analysis, index) => {
                  const stats = calculateAnalysisStats(analysis);
                  const summary = getAnalysisSummary(analysis);
                  const filename = getAnalysisFilename(analysis, index);
                  const timestamp = getAnalysisTimestamp(analysis);
                  const id = analysis._id || analysis.id || `analysis-${index}`;
                  const userData = getUserAnalysisData(analysis);
                  
                  return (
                    <tr 
                      key={id} 
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={(e) => handleRowClick(analysis, e)}
                    >
                      {userType === "user" ? (
                        // User table row - simplified with income
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-blue-600">
                              {userData?.applicant_id || 'YOUR_APPLICATION'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {userData?.city || 'Unknown City'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {timestamp ? new Date(timestamp).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(userData?.monthly_income_inr)}
                            </div>
                            <div className="text-xs text-gray-500">
                              per month
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                userData?.risk_category === "Low Risk"
                                  ? "bg-green-100 text-green-800"
                                  : userData?.risk_category === "Medium Risk"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {userData?.risk_category || 'Unknown'}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {userData?.probability_of_default ? 
                                `${(userData.probability_of_default * 100).toFixed(1)}% default risk` : 
                                'No data'
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="font-medium text-gray-900">
                              {userData?.risk_score ? userData.risk_score.toFixed(1) : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              out of 100
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(analysis, e);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-xs"
                                title="View details"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>View Report</span>
                              </button>
                              <button
                                onClick={(e) => handleDelete(analysis, e)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 text-xs"
                                title="Delete analysis"
                                aria-label="Delete analysis"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // Banker table row - full view
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-blue-600 truncate max-w-xs" title={filename}>
                              {filename}
                            </div>
                            {summary.cities.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {summary.cities.join(', ')}
                                {summary.cities.length === 3 && analysis.jsonData && analysis.jsonData.length > 3 && '...'}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {timestamp ? new Date(timestamp).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="font-medium text-gray-900">{stats.total}</div>
                            <div className="text-xs text-gray-500">applicants</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-medium">
                                {stats.Low}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {stats.total > 0 ? Math.round((stats.Low / stats.total) * 100) : 0}%
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-sm font-medium">
                                {stats.Medium}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {stats.total > 0 ? Math.round((stats.Medium / stats.total) * 100) : 0}%
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-medium">
                                {stats.High}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {stats.total > 0 ? Math.round((stats.High / stats.total) * 100) : 0}%
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                (High + Very High)
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="font-medium text-gray-900">{summary.avgRiskScore}</div>
                            <div className="text-xs text-gray-500">
                              {summary.avgDefaultProb}% default prob
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(analysis, e);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-xs"
                                title="View details"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>View</span>
                              </button>
                              <button
                                onClick={(e) => handleDelete(analysis, e)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 text-xs"
                                title="Delete analysis"
                                aria-label="Delete analysis"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Removed the blue information box that was at the bottom */}
      </div>

      {selectedAnalysis && (
        <ResultsModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          analysisData={selectedAnalysis}
          showNotification={showNotification}
        />
      )}
    </>
  );
}

export default AnalysisHistory;

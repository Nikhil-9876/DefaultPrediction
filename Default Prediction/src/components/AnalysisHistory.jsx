import React, { useState } from 'react';
import ResultsModal from './../assets/modal/ResultsModal';

function AnalysisHistory({ history, onLoadAnalysis, showNotification, onDeleteAnalysis }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const handleRowClick = (analysis, event) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedAnalysis(analysis);
    setTimeout(() => {
      setModalOpen(true);
    }, 0);
    
    if (onLoadAnalysis) {
      onLoadAnalysis(analysis);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleDelete = (analysis, event) => {
    event.stopPropagation(); // Prevent row click when delete is clicked
    
    if (window.confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      if (onDeleteAnalysis) {
        onDeleteAnalysis(analysis); // This calls the backend and handles notifications
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Analysis History</h1>
          <div className="text-sm text-gray-500">
            {Array.isArray(history) ? history.length : 0} analyses stored
          </div>
        </div>

        {!Array.isArray(history) || history.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-history text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Analysis History</h3>
            <p className="text-gray-500">Perform analyses to see them appear here</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rejected
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((analysis, index) => {
                  let stats = null;
                  let filename = 'Unknown File';
                  let timestamp = null;
                  let status = 'completed';
                  let id = analysis._id || analysis.id || `analysis-${index}`;
                  stats = analysis?.jsonData?.portfolio_overview?.approval_summary;

                  if (!stats) {
                    stats = { Approve: 0, Review: 0, Reject: 0 };
                  }

                  // Extract other properties with multiple fallbacks
                  filename = analysis.fileName || `File ${index + 1}`;
                  timestamp = analysis.dateTime;
                  status = 'completed';

                  const total = (stats.Approve || 0) + (stats.Review || 0) + (stats.Reject || 0);
                  
                  return (
                    <tr 
                      key={id} 
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={(e) => handleRowClick(analysis, e)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-blue-600 truncate max-w-xs" title={filename}>
                          {filename}
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
                        <div className="font-medium text-gray-900">{total}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-2 text-xs font-medium">
                            {stats.Approve || 0}
                          </div>
                          <div className="text-sm text-gray-500">
                            {total > 0 ? Math.round(((stats.Approve || 0) / total) * 100) : 0}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center mr-2 text-xs font-medium">
                            {stats.Review || 0}
                          </div>
                          <div className="text-sm text-gray-500">
                            {total > 0 ? Math.round(((stats.Review || 0) / total) * 100) : 0}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center mr-2 text-xs font-medium">
                            {stats.Reject || 0}
                          </div>
                          <div className="text-sm text-gray-500">
                            {total > 0 ? Math.round(((stats.Reject || 0) / total) * 100) : 0}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => handleDelete(analysis, e)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          title="Delete analysis"
                          aria-label="Delete analysis"
                        >
                          <svg 
                            className="w-4 h-4" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" 
                            />
                          </svg>
                          <span className="text-sm font-medium">Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results Modal */}
      <ResultsModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        analysisData={selectedAnalysis}
        showNotification={showNotification}
      />
    </>
  );
}

export default AnalysisHistory;

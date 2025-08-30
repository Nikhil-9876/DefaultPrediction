import React, { useState } from 'react';
import ResultsModal from './../assets/modal/ResultsModal';

function AnalysisHistory({ history ,onLoadAnalysis, showNotification }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const handleRowClick = (analysis, event) => {
    console.log("Selected analysis for modal:", analysis);
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
    console.log("Closing modal");
    setModalOpen(false);
    // Small delay before clearing selected analysis to prevent conflicts
    setTimeout(() => {
      setSelectedAnalysis(null);
    }, 100);
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
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-600">
              <div className="col-span-3">Filename</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Total</div>
              <div className="col-span-2">Approved</div>
              <div className="col-span-2">Review</div>
              <div className="col-span-1">Rejected</div>
            </div>
            <div className="divide-y divide-gray-200">
              {history.map((analysis, index) => {
                
                let stats = null;
                let filename = 'Unknown File';
                let timestamp = null;
                let status = 'completed';
                let id = analysis.id || `analysis-${index}`;
                stats = analysis?.jsonData?.portfolio_overview?.approval_summary;

                // console.log("this is me",analysis.jsonData);
                if (!stats) {
                  stats = { Approve: 0, Review: 0, Reject: 0 };
                }

                // Extract other properties with multiple fallbacks
                filename = analysis.fileName || `File ${index + 1}`;
                timestamp = analysis.dateTime 
                status = 'completed';

                const total = (stats.Approve || 0) + (stats.Review || 0) + (stats.Reject || 0);
                
                console.log(`Analysis ${index} processed:`, {
                  filename,
                  timestamp,
                  status,
                  stats,
                  total
                });
                
                return (
                  <div 
                    key={id} 
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition cursor-pointer"
                    onClick={(e) => handleRowClick(analysis, e)}
                  >
                    <div className="col-span-3 font-medium text-blue-600 truncate">
                      {filename}
                    </div>
                    <div className="col-span-2 text-sm">
                      {timestamp ? new Date(timestamp).toLocaleDateString() : 'N/A'}
                      <span className="text-gray-400 block">
                        {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 capitalize">
                        {status}
                      </span>
                    </div>
                    <div className="col-span-1 font-medium">{total}</div>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-2 text-xs">
                          {stats.Approve || 0}
                        </div>
                        <div className="text-sm text-gray-500">
                          {total > 0 ? Math.round(((stats.Approve || 0) / total) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center mr-2 text-xs">
                          {stats.Review || 0}
                        </div>
                        <div className="text-sm text-gray-500">
                          {total > 0 ? Math.round(((stats.Review || 0) / total) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center mr-2 text-xs">
                          {stats.Reject || 0}
                        </div>
                        <div className="text-sm text-gray-500">
                          {total > 0 ? Math.round(((stats.Reject || 0) / total) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

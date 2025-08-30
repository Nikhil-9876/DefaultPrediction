import React, { useEffect, useCallback } from 'react';
import ResultsDisplay from '../../components/ResultsDisplay';

function ResultsModal({ isOpen, onClose, analysisData, showNotification }) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);


  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [handleClose]);


  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Rest of your component remains the same */}
        <div className="flex items-center justify-between p-6 pr-16 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Analysis Results
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {analysisData ? (
            <ResultsDisplay 
              data={analysisData.jsonData}
              filename={analysisData.fileName}
              showNotification={showNotification}
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg 
                  className="mx-auto h-12 w-12 text-gray-400 mb-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
                <p className="text-gray-500 mb-2">No analysis data available</p>
                <p className="text-sm text-gray-400">
                  {analysisData ? 'Data structure may be different than expected' : 'No data provided'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsModal;

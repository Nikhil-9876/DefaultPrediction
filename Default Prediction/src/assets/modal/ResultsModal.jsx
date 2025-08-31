import React, { useEffect, useCallback } from 'react';
import ResultsDisplay from '../../components/ResultsDisplay';

function ResultsModal({ isOpen, onClose, analysisData, showNotification }) {
  const handleClose = useCallback(
    (e) => {
      e?.stopPropagation(); // Prevent event bubbling
      onClose();
    },
    [onClose]
  );

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        handleClose(e);
      }
    },
    [handleClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="flex items-center justify-center fixed inset-0 bg-black bg-opacity-50 z-[1000]"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pr-16 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Analysis Results</h2>
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose} // Use handleClose function
            aria-label="Close modal"
            className="absolute right-4 top-4 inline-flex items-center justify-center h-10 w-10 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              stroke="currentColor"
              fill="none"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
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
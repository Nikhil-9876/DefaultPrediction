import React, { useCallback, useState } from "react";

function FileUpload({ onProcess, isLoading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // const token=localStorage.getItem("token");
  // console.log(token);

  // Supported file extensions
  const SUPPORTED_FORMATS = ['.csv', '.xlsx', '.xls', '.xlsm', '.xlsb', '.ods', '.json'];
  
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0])
      handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file) => {
    if (file.size > 5 * 1024 * 1024)
      return alert("File size exceeds the 5MB limit.");
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    const isValidFormat = SUPPORTED_FORMATS.some(format => fileName.endsWith(format));
    
    if (!isValidFormat) {
      return alert(`Unsupported file format. Please upload: ${SUPPORTED_FORMATS.join(', ')}`);
    }
    
    setSelectedFile(file);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024,
      sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const name = fileName.toLowerCase();
    if (name.endsWith('.csv')) return 'fas fa-file-csv';
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm') || name.endsWith('.xlsb')) return 'fas fa-file-excel';
    if (name.endsWith('.ods')) return 'fas fa-file-alt';
    if (name.endsWith('.json')) return 'fas fa-file-code';
    return 'fas fa-file';
  };

  const getFileTypeDisplay = (fileName) => {
    const name = fileName.toLowerCase();
    if (name.endsWith('.csv')) return 'CSV File';
    if (name.endsWith('.xlsx')) return 'Excel File (.xlsx)';
    if (name.endsWith('.xls')) return 'Excel File (.xls)';
    if (name.endsWith('.xlsm')) return 'Excel File (.xlsm)';
    if (name.endsWith('.xlsb')) return 'Excel File (.xlsb)';
    if (name.endsWith('.ods')) return 'OpenDocument Spreadsheet';
    if (name.endsWith('.json')) return 'JSON File';
    return 'Data File';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <i className="fas fa-file-upload text-blue-500"></i>
          Upload Data File
        </h2>
        <a 
          href="/templates/sample.csv" 
          download="credit_risk_template.csv"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <i className="fas fa-download mr-1"></i>
          Download Template
        </a>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragActive
            ? "bg-blue-50 border-blue-500"
            : "border-gray-300 bg-white"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-5xl text-blue-400 mb-4">
          <i className="fas fa-cloud-upload-alt"></i>
        </div>
        <p className="text-gray-600 text-base font-medium mb-2">
          Drag & Drop your data file here
        </p>
        <p className="text-gray-500 mb-2 text-sm">
          Supports CSV, Excel (.xlsx, .xls, .xlsm, .xlsb), ODS, JSON
        </p>
        <p className="text-gray-500 mb-4">or</p>
        <label
          htmlFor="fileInput"
          className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 cursor-pointer transition"
        >
          <i className="fas fa-folder-open mr-2"></i>
          Browse Files
          <input
            type="file"
            id="fileInput"
            className="hidden"
            accept=".csv,.xlsx,.xls,.xlsm,.xlsb,.ods,.json"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-green-700 font-semibold text-lg mb-1 flex items-center">
                <i className={`${getFileIcon(selectedFile.name)} mr-2`}></i> 
                Selected File
              </h3>
              <p className="text-sm text-gray-700">
                <strong>Filename:</strong> {selectedFile.name}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Type:</strong> {getFileTypeDisplay(selectedFile.name)}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Size:</strong> {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button 
              onClick={() => setSelectedFile(null)}
              className="text-red-500 hover:text-red-700"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          type="button"
          className={`px-6 py-3 font-semibold text-white rounded-lg shadow transition flex items-center ${
            !selectedFile || isLoading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={() => onProcess(selectedFile)}
          disabled={!selectedFile || isLoading}
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Processing...
            </>
          ) : (
            <>
              <i className="fas fa-play mr-2"></i>
              Analyze Credit Risk
            </>
          )}
        </button>
      </div>

      {/* Requirements */}
      <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
        <h3 className="text-gray-800 font-semibold mb-3 flex items-center">
          <i className="fas fa-info-circle mr-2 text-gray-500"></i>
          File Requirements
        </h3>
        <ul className="list-disc pl-5 text-sm space-y-2 text-gray-700">
          <li>
            <strong>Supported formats:</strong> 
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">CSV</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Excel (.xlsx, .xls, .xlsm, .xlsb)</span>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">OpenDocument (.ods)</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">JSON</span>
            </div>
          </li>
          <li>File should not exceed <strong>5MB</strong> in size</li>
          <li>For Excel files: Data should be in the first sheet</li>
          <li>For CSV files: UTF-8 encoding recommended</li>
          <li>First row should contain column headers</li>
          <li>Ensure all required fields have valid numerical values</li>
          <li className="w-full">
            Required columns 33:
            <div className="w-full mt-2">
              <div className="font-mono text-xs text-gray-600 bg-gray-100 p-3 rounded-lg overflow-x-auto max-h-32 overflow-y-auto">
              applicant_id,application_date,age,gender,education_level,employment_type,marital_status,family_size,number_of_dependents,location_type,monthly_income_inr,spouse_income_inr,monthly_expenses_inr,monthly_savings_inr,monthly_utility_bills_inr,property_value_inr,vehicle_value_inr,total_investments_inr,outstanding_loan_amount_inr,loan_amount_applied_inr,years_current_employment,banking_relationship_years,monthly_business_revenue_inr,daily_mobile_hours,monthly_digital_transactions,avg_transaction_amount_inr,social_media_accounts_count,mobile_app_usage_intensity_score,digital_payment_adoption_score,consent_status,city,loan_type,interest_rate
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default FileUpload;

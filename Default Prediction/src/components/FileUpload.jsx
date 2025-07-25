import React, { useCallback, useState } from "react";

function FileUpload({ onProcess, isLoading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

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
    if (!file.name.toLowerCase().endsWith(".csv"))
      return alert("Please upload a valid CSV file.");
    if (file.size > 5 * 1024 * 1024)
      return alert("File size exceeds the 5MB limit.");
    setSelectedFile(file);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024,
      sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <i className="fas fa-file-upload text-blue-500"></i>
          Upload CSV File
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
          Drag & Drop your CSV file here
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
            accept=".csv"
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
                <i className="fas fa-file-csv mr-2"></i> Selected File
              </h3>
              <p className="text-sm text-gray-700">
                <strong>Filename:</strong> {selectedFile.name}
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
          CSV Requirements
        </h3>
        <ul className="list-disc pl-5 text-sm space-y-1 text-gray-700">
          <li>File must be in CSV format with UTF-8 encoding</li>
          <li>First row should contain headers</li>
          <li>File should not exceed 5MB in size</li>
          <li>Ensure all required fields have valid numerical values</li>
          <li className="w-full">
            Required columns:
            <div className="w-full mt-1">
              <div className="font-mono text-xs text-gray-600 bg-gray-100 p-3 rounded-lg overflow-x-auto">
                applicant_id, application_date, age, gender, education_level,
                employment_type, marital_status, family_size,
                number_of_dependents, location_type, monthly_income_inr,
                spouse_income_inr, monthly_expenses_inr, monthly_savings_inr,
                monthly_utility_bills_inr, property_value_inr,
                vehicle_value_inr, total_investments_inr,
                outstanding_loan_amount_inr, years_current_employment,
                banking_relationship_years, monthly_business_revenue_inr,
                daily_mobile_hours, monthly_digital_transactions,
                avg_transaction_amount_inr, social_media_accounts_count,
                mobile_app_usage_intensity_score,
                digital_payment_adoption_score,
                utility_payment_regularity_score, location_stability_score,
                mobile_banking_usage_score, payment_reliability_score,
                financial_health_score, stability_index, timeliness_score,
                repayment_ability_score, probability_of_default,
                data_completeness_pct, consent_status,
                explainability_support_flag
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default FileUpload;
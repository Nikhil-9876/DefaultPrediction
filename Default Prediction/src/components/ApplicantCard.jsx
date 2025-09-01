import React from "react";

function ApplicantCard({ applicant, isExpanded, onToggle }) {
  const {
    applicant_id,
    demographics,
    risk_assessment,
    top_decision_metrics,
    loan_details,
  } = applicant;

  const badgeColor = (value) => {
    const lower = value?.toLowerCase();
    if (lower === "low" || lower === "approve") return "bg-green-100 text-green-700";
    if (lower === "medium" || lower === "review") return "bg-yellow-100 text-yellow-800";
    if (lower === "high" || lower === "reject" || lower?.includes("very high")) 
      return "bg-red-100 text-red-700";
    return "bg-gray-200 text-gray-800";
  };

  const getRiskColor = (probability) => {
    if (probability < 0.3) return "text-green-600";
    if (probability < 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  // Enhanced formatting functions
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || !isFinite(amount)) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined || !isFinite(value)) return "N/A";
    // Handle both 0-1 range and 0-100 range
    const normalizedValue = value > 1 ? value / 100 : value;
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(normalizedValue);
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || !isFinite(value)) return "N/A";
    return Number(value).toFixed(decimals);
  };

  const safeDisplayValue = (value, fallback = "N/A") => {
    return value !== undefined && value !== null ? value : fallback;
  };

  return (
    <div
      className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        isExpanded ? "border-blue-300" : "border-gray-200"
      }`}
    >
      {/* Summary Row */}
      <div
        className="grid grid-cols-12 items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
        onClick={onToggle}
      >
        <div className="col-span-3 text-base font-bold text-gray-800">
          {applicant_id}
        </div>
        <div className="col-span-2 text-sm text-gray-700">
          <span className="inline-flex items-center">
            <i className="fas fa-user mr-1 text-gray-400"></i>
            Age: {safeDisplayValue(demographics?.age)}
          </span>
        </div>
        <div className="col-span-2 text-sm font-medium text-gray-700">
          {formatCurrency(demographics?.monthly_income)}
        </div>
        <div className="col-span-3">
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${badgeColor(
                risk_assessment?.overall_risk
              )}`}
            >
              {risk_assessment?.overall_risk}
            </span>
            <span
              className={`text-xs font-semibold ${getRiskColor(
                risk_assessment?.default_probability || 1
              )}`}
            >
              ({formatPercentage(risk_assessment?.default_probability)})
            </span>
          </div>
        </div>
        <div className="col-span-2 flex justify-between items-center">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${badgeColor(
              risk_assessment?.recommendation
            )}`}
          >
            {risk_assessment?.recommendation}
          </span>
          <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <i
              className={`fas ${
                isExpanded ? "fa-chevron-up" : "fa-chevron-down"
              }`}
            ></i>
          </button>
        </div>
      </div>

      {/* Expanded Section */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="px-6 py-6 space-y-8">
            {/* Demographics */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mr-4">
                  <i className="fas fa-user-circle text-blue-600 text-lg"></i>
                </div>
                Demographic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Age
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {safeDisplayValue(demographics?.age)} years
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Gender
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {safeDisplayValue(demographics?.gender)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Education
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {safeDisplayValue(demographics?.education)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Employment
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {safeDisplayValue(demographics?.employment)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Monthly Income
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(demographics?.monthly_income)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Location
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {safeDisplayValue(demographics?.location)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Marital Status
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {safeDisplayValue(demographics?.marital_status)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Dependents
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {safeDisplayValue(demographics?.dependents)}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mr-4">
                  <i className="fas fa-chart-line text-purple-600 text-lg"></i>
                </div>
                Risk Assessment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Overall Risk Level
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${badgeColor(
                        risk_assessment?.overall_risk
                      )}`}
                    >
                      {risk_assessment?.overall_risk}
                    </span>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-3xl font-bold mb-1 ${getRiskColor(
                        risk_assessment?.default_probability || 1
                      )}`}
                    >
                      {formatPercentage(risk_assessment?.default_probability)}
                    </div>
                    <div className="text-sm text-gray-500">Default Probability</div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                    Final Recommendation
                  </div>
                  <div className="flex items-center justify-center">
                    <span
                      className={`px-6 py-3 text-lg font-semibold rounded-lg ${badgeColor(
                        risk_assessment?.recommendation
                      )}`}
                    >
                      {risk_assessment?.recommendation}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Loan Details */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mr-4">
                  <i className="fas fa-file-invoice-dollar text-amber-600 text-lg"></i>
                </div>
                Loan Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Loan Applied
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    {formatCurrency(loan_details?.loan_applied)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Loan Type
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {safeDisplayValue(loan_details?.loan_type)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Interest Rate
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {safeDisplayValue(loan_details?.interest_rate)}%
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Application Date
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {safeDisplayValue(loan_details?.application_date)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Outstanding Amount
                  </div>
                  <div className="text-lg font-semibold text-red-600">
                    {formatCurrency(loan_details?.outstanding_amount)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Property Value
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(loan_details?.property_value)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    DSCR
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatNumber(loan_details?.dscr)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Income/Expense Ratio
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatNumber(loan_details?.income_expense_ratio)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Utilization Ratio
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatPercentage(loan_details?.utilization_ratio)}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            {top_decision_metrics && top_decision_metrics.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full mr-4">
                    <i className="fas fa-tachometer-alt text-teal-600 text-lg"></i>
                  </div>
                  Key Decision Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {top_decision_metrics.map((metric, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="text-base font-semibold text-gray-800 mb-1">
                            {metric.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Impact Level: {safeDisplayValue(metric.impact)}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-xl font-bold text-gray-900 mb-1">
                            {safeDisplayValue(metric.value)}
                          </div>
                          {metric.status && (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${badgeColor(
                                metric.status
                              )}`}
                            >
                              {metric.status}
                            </span>
                          )}
                        </div>
                      </div>
                      {metric.description && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                          {metric.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicantCard;

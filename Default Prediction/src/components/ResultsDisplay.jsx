import React, { useState } from "react";
import SummaryCards from "./SummaryCards";
import ApplicantCard from "./ApplicantCard";
import * as XLSX from "xlsx";

function ResultsDisplay({ data, filename, showNotification }) {
  const [expandedApplicant, setExpandedApplicant] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  console.log("ResultsDisplay received data:", data);

  // Helper function to calculate summary data from flat array
  const calculateSummaryData = () => {
    if (!Array.isArray(data) || data.length === 0) return null;

    const totalApplicants = data.length;
    const riskDistribution = {};
    const approvalSummary = {};
    let totalIncome = 0;
    let totalDefaultProb = 0;
    let totalRepaymentScore = 0;
    let totalTimeliness = 0;

    data.forEach(applicant => {
      // Risk distribution
      const riskCategory = applicant.risk_category || 'Unknown';
      riskDistribution[riskCategory] = (riskDistribution[riskCategory] || 0) + 1;

      // For approval summary, we'll use risk categories as proxy
      let decision = 'Review'; // Default
      if (riskCategory === 'Low Risk') decision = 'Approve';
      else if (riskCategory === 'High Risk' || riskCategory === 'Very High Risk') decision = 'Reject';

      approvalSummary[decision] = (approvalSummary[decision] || 0) + 1;

      // Calculate averages
      totalIncome += applicant.monthly_income_inr || 0;
      totalDefaultProb += applicant.probability_of_default || 0;
      totalRepaymentScore += applicant.repayment_ability_score || 0;
      totalTimeliness += applicant.timeliness_score || 0;
    });

    return {
      totalApplicants,
      riskDistribution,
      approvalSummary,
      averages: {
        monthly_income: Math.round(totalIncome / totalApplicants),
        default_probability: totalDefaultProb / totalApplicants,
        repayment_score: Math.round(totalRepaymentScore / totalApplicants),
        timeliness_score: Math.round(totalTimeliness / totalApplicants)
      }
    };
  };

  const summaryData = calculateSummaryData();

  // Convert flat data structure to match ApplicantCard expected format
  const convertToApplicantCardFormat = (applicant) => {
    return {
      applicant_id: applicant.applicant_id || "N/A",
      demographics: {
        age: applicant.age,
        gender: applicant.gender || "N/A",
        education: applicant.education_level || "N/A",
        employment: applicant.employment_type || "N/A",
        monthly_income: applicant.monthly_income_inr,
        location: applicant.city || applicant.location_type || "N/A",
        marital_status: applicant.marital_status || "N/A",
        dependents: applicant.number_of_dependents,
      },
      risk_assessment: {
        overall_risk: applicant.risk_category,
        default_probability: applicant.probability_of_default,
        recommendation: applicant.risk_category === "Low Risk" ? "Approve" : 
                      applicant.risk_category === "Medium Risk" ? "Review" : "Reject",
        confidence_score: 0.85 // Default confidence score since it's not in our data
      },
      top_decision_metrics: [
        {
          name: "Repayment Ability",
          value: applicant.repayment_ability_score,
          impact: "High",
          status: applicant.repayment_ability_score >= 70 ? "Good" : 
                 applicant.repayment_ability_score >= 50 ? "Fair" : "Poor",
          description: "Score indicating ability to repay loans"
        },
        {
          name: "Payment Timeliness",
          value: applicant.timeliness_score,
          impact: "High",
          status: applicant.timeliness_score >= 70 ? "Good" : 
                 applicant.timeliness_score >= 50 ? "Fair" : "Poor",
          description: "Historical payment timeliness pattern"
        },
        {
          name: "Financial Health",
          value: applicant.financial_health_score,
          impact: "Medium",
          status: applicant.financial_health_score >= 70 ? "Good" : 
                 applicant.financial_health_score >= 50 ? "Fair" : "Poor",
          description: "Overall financial stability indicator"
        },
        {
          name: "Stability Index",
          value: applicant.stability_index,
          impact: "Medium",
          status: applicant.stability_index >= 70 ? "Good" : 
                 applicant.stability_index >= 50 ? "Fair" : "Poor",
          description: "Employment and income stability measure"
        }
      ],
      loan_details: {
        loan_applied: applicant.loan_amount_applied_inr,
        loan_type: applicant.loan_type || "Personal Loan",
        interest_rate: applicant.interest_rate,
        application_date: applicant.application_date,
        outstanding_amount: applicant.outstanding_loan_amount_inr,
        property_value: applicant.property_value_inr,
        dscr: applicant.debt_service_coverage,
        income_expense_ratio: applicant.income_to_expense_ratio,
        utilization_ratio: applicant.loan_utilization_ratio,
        eligibility: applicant.risk_category === "Low Risk" ? "Eligible" : 
                   applicant.risk_category === "Medium Risk" ? "Review Required" : "Not Eligible",
        loan_range: {
          minimum: Math.round((applicant.monthly_income_inr || 0) * 6),
          maximum: Math.round((applicant.monthly_income_inr || 0) * 60)
        },
        terms: {
          tenure_months: applicant.risk_category === "Low Risk" ? 60 : 
                       applicant.risk_category === "Medium Risk" ? 36 : 24,
          monthly_emi: Math.round((applicant.loan_amount_applied_inr || applicant.monthly_income_inr * 12) / 36),
          interest_rate_range: {
            min: applicant.risk_category === "Low Risk" ? 8.5 : 
                applicant.risk_category === "Medium Risk" ? 12.5 : 18.0,
            max: applicant.risk_category === "Low Risk" ? 12.0 : 
                applicant.risk_category === "Medium Risk" ? 16.0 : 24.0
          }
        }
      }
    };
  };

  // Get all field names from the data (all 41 fields)
  const getAllFieldNames = () => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    // Get all unique keys from all records
    const allKeys = new Set();
    data.forEach(applicant => {
      Object.keys(applicant).forEach(key => allKeys.add(key));
    });
    return Array.from(allKeys).sort();
  };

  const allFields = getAllFieldNames();

  const handleExportExcel = () => {
    if (!Array.isArray(data) || data.length === 0) {
      showNotification("No data to export", "error");
      return;
    }

    // Create Excel data with ALL fields from the dataset
    const excelData = data.map((applicant, index) => {
      const row = {};
      
      // Include all fields present in the data
      allFields.forEach(field => {
        let value = applicant[field];
        
        // Format specific fields for better readability
        if (field === 'probability_of_default' && typeof value === 'number') {
          value = `${(value * 100).toFixed(2)}%`;
        } else if (field === 'risk_score' && typeof value === 'number') {
          value = value.toFixed(2);
        } else if (field.includes('inr') && typeof value === 'number') {
          value = value.toLocaleString('en-IN');
        }
        
        // Convert field names to readable format
        const fieldName = field
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        row[fieldName] = value || "N/A";
      });
      
      return row;
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Credit Risk Analysis");

    // Summary sheet
    if (summaryData) {
      const summarySheetData = [
        { Metric: "Total Applicants", Value: summaryData.totalApplicants },
        { Metric: "Total Fields Per Record", Value: allFields.length },
        { Metric: "Low Risk", Value: summaryData.riskDistribution['Low Risk'] || 0 },
        { Metric: "Medium Risk", Value: summaryData.riskDistribution['Medium Risk'] || 0 },
        { Metric: "High Risk", Value: summaryData.riskDistribution['High Risk'] || 0 },
        { Metric: "Very High Risk", Value: summaryData.riskDistribution['Very High Risk'] || 0 },
        { Metric: "Approved", Value: summaryData.approvalSummary.Approve || 0 },
        { Metric: "Under Review", Value: summaryData.approvalSummary.Review || 0 },
        { Metric: "Rejected", Value: summaryData.approvalSummary.Reject || 0 },
        { Metric: "Average Monthly Income", Value: summaryData.averages.monthly_income },
        { Metric: "Average Default Probability", Value: `${(summaryData.averages.default_probability * 100).toFixed(2)}%` },
        { Metric: "Average Repayment Score", Value: summaryData.averages.repayment_score },
        { Metric: "Average Timeliness Score", Value: summaryData.averages.timeliness_score }
      ];

      const summaryWorksheet = XLSX.utils.json_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Portfolio Summary");
    }

    // Auto-width for columns
    const maxCols = Math.max(allFields.length, 20);
    const colWidths = Array(maxCols).fill().map(() => ({ wch: 15 }));
    worksheet["!cols"] = colWidths;

    // Generate and download Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `credit_risk_analysis_complete_${filename || Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification(`Excel file exported with ${allFields.length} fields`, "success");
  };

  const handleExportCSV = () => {
    if (!Array.isArray(data) || data.length === 0) {
      showNotification("No data to export", "error");
      return;
    }

    // Create headers from all field names
    const headers = allFields.map(field =>
      field
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );

    // Create rows with all field data
    const rows = data.map((applicant, index) => {
      return allFields.map(field => {
        let value = applicant[field];
        
        // Format specific fields
        if (field === 'probability_of_default' && typeof value === 'number') {
          value = (value * 100).toFixed(2) + '%';
        } else if (field === 'risk_score' && typeof value === 'number') {
          value = value.toFixed(2);
        } else if (field.includes('inr') && typeof value === 'number') {
          value = value.toLocaleString('en-IN');
        }
        
        return value || "N/A";
      });
    });

    // Build CSV content
    let csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.map((field) => {
        // Escape commas and quotes in field values
        const fieldStr = String(field);
        if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
          return `"${fieldStr.replace(/"/g, '""')}"`;
        }
        return fieldStr;
      }).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `credit_risk_results_complete_${filename || Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification(`CSV file exported with ${allFields.length} fields`, "success");
  };

  const filteredApplicants = Array.isArray(data) ? data.filter((applicant) => {
    const matchesSearch = 
      (applicant.applicant_id && applicant.applicant_id.toString().includes(searchTerm)) ||
      (applicant.age && applicant.age.toString().includes(searchTerm)) ||
      searchTerm === "";

    const matchesFilter = 
      filter === "all" ||
      (filter === "approve" && (applicant.risk_category === "Low Risk")) ||
      (filter === "review" && (applicant.risk_category === "Medium Risk")) ||
      (filter === "reject" && (applicant.risk_category === "High Risk" || applicant.risk_category === "Very High Risk"));

    return matchesSearch && matchesFilter;
  }) : [];

  // Handle row click to expand/collapse ApplicantCard
  const handleRowClick = (applicantId, applicantIndex) => {
    const identifier = applicantId || applicantIndex;
    console.log("Row clicked:", identifier, "Currently expanded:", expandedApplicant);
    
    if (expandedApplicant === identifier) {
      setExpandedApplicant(null); // Collapse if already expanded
    } else {
      setExpandedApplicant(identifier); // Expand the clicked row
    }
  };

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="p-8 bg-gray-50 rounded-lg">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-6xl text-gray-400 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Available</h3>
          <p className="text-gray-500">Please upload a file to see the analysis results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summaryData && <SummaryCards summaryData={summaryData} />}

      {/* Export and Filter Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <input
              type="text"
              placeholder="Search by ID or Age..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Applications</option>
              <option value="approve">Approve (Low Risk)</option>
              <option value="review">Review (Medium Risk)</option>
              <option value="reject">Reject (High/Very High Risk)</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-file-csv"></i>
              Export CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-file-excel"></i>
              Export Excel
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4 flex flex-wrap gap-4">
          <span>• Total Records: {data.length}</span>
          <span>• Fields Per Record: {allFields.length}</span>
          <span>• Export includes all {allFields.length} fields from the analysis</span>
          <span>• Click on any row to view detailed analysis</span>
        </div>

        {/* Table Header */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Age</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Monthly Income</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Risk Category</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Risk Score</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Repayment Score</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
          </table>

          {/* Applicant Cards */}
          <div className="space-y-3 mt-4">
            {filteredApplicants.map((applicant, index) => {
              const convertedApplicant = convertToApplicantCardFormat(applicant);
              const identifier = applicant.applicant_id || index;
              const isExpanded = expandedApplicant === identifier;

              return (
                <div key={identifier} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Summary Row */}
                  <div 
                    className="grid grid-cols-7 gap-4 p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
                    onClick={() => handleRowClick(applicant.applicant_id, index)}
                  >
                    <div className="font-semibold text-gray-900">
                      {applicant.applicant_id || `APPL_${index + 1}`}
                    </div>
                    <div className="text-gray-700">{applicant.age}</div>
                    <div className="text-gray-700">
                      ₹{applicant.monthly_income_inr?.toLocaleString() || "N/A"}
                    </div>
                    <div className="text-gray-700">
                      {applicant.risk_category} ({(applicant.probability_of_default * 100).toFixed(1)}%)
                    </div>
                    <div className="text-gray-700">{applicant.risk_score?.toFixed(1)}</div>
                    <div className="text-gray-700">{applicant.repayment_ability_score}</div>
                    <div className="text-blue-600 font-medium">
                      {isExpanded ? '▼ Collapse' : '▶ Expand'}
                    </div>
                  </div>

                  {/* Expanded ApplicantCard */}
                  {isExpanded && (
                    <ApplicantCard
                      applicant={convertedApplicant}
                      isExpanded={true}
                      onToggle={() => {}} // Empty since we handle toggle in parent
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsDisplay;

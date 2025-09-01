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
    console.log("Converting applicant data for card:", applicant);
    
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
        dependents: applicant.number_of_dependents || "N/A"
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
        eligibility: applicant.risk_category === "Low Risk" ? "Eligible" : 
                    applicant.risk_category === "Medium Risk" ? "Review Required" : "Not Eligible",
        loan_range: {
          minimum: Math.round(applicant.monthly_income_inr * 6),
          maximum: Math.round(applicant.monthly_income_inr * 60)
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
        },
        purpose: "Personal Loan"
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
      <div className="text-center text-gray-500 mt-8">
        Upload and analyze a CSV file to see results
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Analysis Results - {filename}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2"
          >
            <span>📊</span>
            <span>Export CSV ({allFields.length} fields)</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>📈</span>
            <span>Export Excel ({allFields.length} fields)</span>
          </button>
        </div>
      </div>

      {/* Display field count info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-blue-400">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Dataset Information
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• Total Records: {data.length}</p>
              <p>• Fields Per Record: {allFields.length}</p>
              <p>• Export includes all {allFields.length} fields from the analysis</p>
              <p>• Click on any row to view detailed analysis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards with calculated data */}
      {summaryData && <SummaryCards data={summaryData.approvalSummary} />}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Individual Applicants ({data.length})
          </h3>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search by ID or age..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="approve">Low Risk (Approve)</option>
              <option value="review">Medium Risk (Review)</option>
              <option value="reject">High Risk (Reject)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Income
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repayment Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplicants.map((applicant, index) => {
                const applicantId = applicant.applicant_id || index;
                const isExpanded = expandedApplicant === applicantId;
                
                return (
                  <React.Fragment key={applicantId}>
                    <tr
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleRowClick(applicant.applicant_id, index)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {applicant.applicant_id || `APPL_${index + 1}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {applicant.age}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{applicant.monthly_income_inr?.toLocaleString() || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            applicant.risk_category === "Low Risk"
                              ? "bg-green-100 text-green-800"
                              : applicant.risk_category === "Medium Risk"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {applicant.risk_category}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({(applicant.probability_of_default * 100).toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {applicant.risk_score?.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {applicant.repayment_ability_score}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-blue-600 font-medium">
                          {isExpanded ? '▼ Collapse' : '▶ Expand'}
                        </span>
                      </td>
                    </tr>
                    
                    
                    {/* Expanded Row with ApplicantCard */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-0 py-0 bg-gray-50">
                          <div className="border-t border-gray-200 p-4">
                            <ApplicantCard
                              applicant={convertToApplicantCardFormat(applicant)}
                              isExpanded={true}
                              onToggle={() => setExpandedApplicant(null)}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredApplicants.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No applicants match your search criteria
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
          Showing {filteredApplicants.length} of {data.length} applicants
          {expandedApplicant && (
            <span className="ml-4 text-blue-600">
              • Detailed view active for {expandedApplicant}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsDisplay;

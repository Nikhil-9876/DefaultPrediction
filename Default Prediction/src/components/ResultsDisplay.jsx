import React, { useState } from "react";
import SummaryCards from "./SummaryCards";
import ApplicantCard from "./ApplicantCard";
import * as XLSX from 'xlsx';

function ResultsDisplay({ data, filename, showNotification }) {
  const [expandedApplicant, setExpandedApplicant] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  console.log("ResultsDisplay received data:", data);

  const handleExportExcel = () => {
    // Prepare data for Excel export
    const excelData = data.individual_applicants.map((applicant) => ({
      "Applicant ID": applicant.applicant_id,
      "Name": applicant.demographics.name || "N/A",
      "Age": applicant.demographics.age,
      "Gender": applicant.demographics.gender,
      "Education": applicant.demographics.education,
      "Employment": applicant.demographics.employment,
      "Monthly Income": applicant.demographics.monthly_income,
      "Risk Level": applicant.risk_assessment.overall_risk,
      "Risk Color": applicant.risk_assessment.risk_color,
      "Default Probability": `${(applicant.risk_assessment.default_probability * 100).toFixed(2)}%`,
      "Recommendation": applicant.risk_assessment.recommendation,
      "Repayment Ability": applicant.top_decision_metrics.find(m => m.name === "Repayment Ability")?.value || "N/A",
      "Timeliness Score": applicant.top_decision_metrics.find(m => m.name === "Payment Timeliness")?.value || "N/A",
      "Loan Eligibility": applicant.loan_details.eligibility,
      "Min Loan Amount": applicant.loan_details.loan_range.minimum,
      "Max Loan Amount": applicant.loan_details.loan_range.maximum,
      "Suggested Term (Months)": applicant.loan_details.terms.tenure_months,
      "Monthly EMI": applicant.loan_details.terms.monthly_emi,
      "Interest Rate Min": applicant.loan_details.terms.interest_rate_range.min,
      "Interest Rate Max": applicant.loan_details.terms.interest_rate_range.max
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();

    // Main applicant data sheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Credit Risk Analysis");

    // Summary sheet
    const summaryData = [
      { Metric: "Total Applicants", Value: data.analysis_metadata.total_applicants },
      { Metric: "Approved", Value: data.portfolio_overview.approval_summary.Approve },
      { Metric: "Under Review", Value: data.portfolio_overview.approval_summary.Review },
      { Metric: "Rejected", Value: data.portfolio_overview.approval_summary.Reject },
      { Metric: "Low Risk", Value: data.portfolio_overview.risk_distribution.Low },
      { Metric: "Medium Risk", Value: data.portfolio_overview.risk_distribution.Medium },
      { Metric: "High Risk", Value: data.portfolio_overview.risk_distribution.High },
      { Metric: "Total Loan Potential", Value: data.portfolio_overview.total_loan_potential },
      { Metric: "Average Default Probability", Value: `${(data.portfolio_overview.average_metrics.default_probability * 100).toFixed(2)}%` },
      { Metric: "Average Timeliness Score", Value: data.portfolio_overview.average_metrics.timeliness_score },
      { Metric: "Average Repayment Score", Value: data.portfolio_overview.average_metrics.repayment_score },
      { Metric: "Average Monthly Income", Value: data.portfolio_overview.average_metrics.monthly_income }
    ];

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Portfolio Summary");

    // Auto-width for columns (added one more for Repayment Ability)
    const colWidths = [
      { wch: 15 }, { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, 
      { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, 
      { wch: 15 }, { wch: 15 }
    ];
    worksheet['!cols'] = colWidths;

    // Generate and download Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `credit_risk_analysis_${filename || Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification("Results exported as Excel file", "success");
  };

  const handleExportCSV = () => {
    const headers = [
      "Applicant ID",
      "Name", 
      "Age",
      "Gender",
      "Monthly Income",
      "Risk Level",
      "Recommendation",
      "Repayment Ability",
      "Default Probability",
    ];

    const rows = data.individual_applicants.map((applicant) => [
      applicant.applicant_id,
      applicant.demographics.name || "N/A",
      applicant.demographics.age,
      applicant.demographics.gender,
      applicant.demographics.monthly_income,
      applicant.risk_assessment.overall_risk,
      applicant.risk_assessment.recommendation,
      applicant.top_decision_metrics.find(m => m.name === "Repayment Ability")?.value || "N/A",
      applicant.risk_assessment.default_probability,
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.map((field) => `"${field}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `credit_risk_results_${filename || Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification("Results exported as CSV", "success");
  };

  const filteredApplicants = data?.individual_applicants.filter((applicant) => {
    const matchesSearch = 
      applicant.applicant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (applicant.demographics.name && 
       applicant.demographics.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = 
      filter === "all" ||
      (filter === "approve" && applicant.risk_assessment.recommendation.toLowerCase() === "approve") ||
      (filter === "review" && applicant.risk_assessment.recommendation.toLowerCase() === "review") ||
      (filter === "reject" && applicant.risk_assessment.recommendation.toLowerCase() === "reject");

    return matchesSearch && matchesFilter;
  });

  if (!data) {
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
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>📈</span>
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <SummaryCards data={data} />

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Individual Applicants</h3>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search applicants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Decisions</option>
              <option value="approve">Approved</option>
              <option value="review">Under Review</option>
              <option value="reject">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decision</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repayment Ability</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplicants.map((applicant) => (
                <tr key={applicant.applicant_id} className="hover:bg-gray-50 cursor-pointer" 
                    onClick={() => setExpandedApplicant(expandedApplicant === applicant.applicant_id ? null : applicant.applicant_id)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {applicant.applicant_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {applicant.demographics.age}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{applicant.demographics.monthly_income?.toLocaleString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      applicant.risk_assessment.overall_risk.toLowerCase() === 'low' ? 'bg-green-100 text-green-800' :
                      applicant.risk_assessment.overall_risk.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {applicant.risk_assessment.overall_risk}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      ({(applicant.risk_assessment.default_probability * 100).toFixed(1)}%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      applicant.risk_assessment.recommendation.toLowerCase() === 'approve' ? 'bg-green-100 text-green-800' :
                      applicant.risk_assessment.recommendation.toLowerCase() === 'review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {applicant.risk_assessment.recommendation}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {applicant.top_decision_metrics.find(m => m.name === "Repayment Ability")?.value || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {expandedApplicant && (
          <div className="mt-4">
            <ApplicantCard
              applicant={data.individual_applicants.find(a => a.applicant_id === expandedApplicant)}
              isExpanded={true}
              onToggle={() => setExpandedApplicant(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsDisplay;

import React, { useState } from "react";
import SummaryCards from "./SummaryCards";
import ApplicantCard from "./ApplicantCard";
import * as XLSX from 'xlsx';

function ResultsDisplay({ data, filename,showNotification }) {
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
      "Timeliness Score": applicant.top_decision_metrics.find(m => m.name === "Payment Timeliness")?.value || "N/A",
      "Repayment Score": applicant.top_decision_metrics.find(m => m.name === "Repayment Ability")?.value || "N/A",
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

    // Auto-width for columns
    const colWidths = [
      { wch: 15 }, { wch: 20 }, { wch: 8 }, { wch: 10 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
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
        applicant.demographics.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesFilter =
      filter === "all" ||
      (filter === "approve" &&
        applicant.risk_assessment.recommendation.toLowerCase() === "approve") ||
      (filter === "review" &&
        applicant.risk_assessment.recommendation.toLowerCase() === "review") ||
      (filter === "reject" &&
        applicant.risk_assessment.recommendation.toLowerCase() === "reject");

    return matchesSearch && matchesFilter;
  });

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-chart-pie text-3xl text-blue-500"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No Analysis Data
          </h3>
          <p className="text-gray-500">
            Upload and analyze a CSV file to see results
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          {filename}
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              placeholder="Search applicants..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-48">
            <select
              className="appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500 w-full"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Decisions</option>
              <option value="approve">Approved</option>
              <option value="review">Review</option>
              <option value="reject">Rejected</option>
            </select>
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <path
                  d="M6 8l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <SummaryCards data={data.portfolio_overview.approval_summary} />

        <div className="mt-8">
          <div className="grid grid-cols-12 gap-4 font-semibold text-gray-600 border-b pb-2">
            <div className="col-span-2">ID</div>
            <div className="col-span-3">Age</div>
            <div className="col-span-2">Income</div>
            <div className="col-span-2">Risk</div>
            <div className="col-span-2">Decision</div>
            <div className="col-span-1">Actions</div>
          </div>

          <div className="mt-2 space-y-2">
            {filteredApplicants?.map((applicant) => (
              <ApplicantCard
                key={applicant.applicant_id}
                applicant={applicant}
                isExpanded={expandedApplicant === applicant.applicant_id}
                onToggle={() =>
                  setExpandedApplicant(
                    expandedApplicant === applicant.applicant_id
                      ? null
                      : applicant.applicant_id
                  )
                }
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {filteredApplicants?.length || 0} of{" "}
            {data.individual_applicants.length} applicants
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center"
              onClick={handleExportCSV}
            >
              <i className="fas fa-file-csv mr-2"></i> Export CSV
            </button>
            <button
              type="button"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center"
              onClick={handleExportExcel}
            >
              <i className="fas fa-file-excel mr-2"></i> Export Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsDisplay;

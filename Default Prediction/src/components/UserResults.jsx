import React from "react";
import ApplicantCard from "./ApplicantCard";

function UserResults({ data }) {
  // Function to convert raw data to ApplicantCard format
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
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8 p-6 bg-white rounded-lg shadow">
        <div className="text-xl font-semibold mb-2">No Data Available</div>
        <p>Please upload your financial data to see your credit assessment.</p>
      </div>
    );
  }

  // For users, we expect only one record
  const applicantData = data[0];
  const formattedApplicant = convertToApplicantCardFormat(applicantData);

  return (
    <div className="h-screen flex flex-col pb-20">
      {/* Header section with fixed height */}
      <div className="flex-shrink-0 bg-white rounded-b-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Your Credit Risk Analysis
        </h2>
        <p className="text-gray-600">
          Based on your financial profile and credit history
        </p>
      </div>
      

      {/* Scrollable content area */}
      <div className="flex-grow overflow-y-auto px-4 py-4">
        <ApplicantCard
          applicant={formattedApplicant}
          isExpanded={true}
          onToggle={() => {}}
        />
      </div>
      
      {/* Footer with fixed height */}
      <div className="flex-shrink-0 bg-gray-50 p-4 text-center text-sm text-gray-500">
        <p>This assessment was generated on {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export default UserResults;
import React from "react";
import ApplicantCard from "./ApplicantCard";

function UserResults({ data }) {
  // Function to convert raw data to ApplicantCard format
  const convertToApplicantCardFormat = (applicant) => {
    // Determine recommendation based on risk category
    let recommendation = "Review";
    if (applicant.risk_category === "Low Risk") recommendation = "Approve";
    if (applicant.risk_category === "High Risk" || applicant.risk_category === "Very High Risk") 
      recommendation = "Reject";

    // Calculate loan details
    const monthlyIncome = applicant.monthly_income_inr || 0;
    const minLoan = Math.round(monthlyIncome * 6);
    const maxLoan = Math.round(monthlyIncome * 60);
    
    // Determine tenure and interest rates based on risk
    let tenureMonths = 36;
    let minInterest = 12.5;
    let maxInterest = 16.0;
    
    if (applicant.risk_category === "Low Risk") {
      tenureMonths = 60;
      minInterest = 8.5;
      maxInterest = 12.0;
    } else if (applicant.risk_category === "High Risk" || applicant.risk_category === "Very High Risk") {
      tenureMonths = 24;
      minInterest = 18.0;
      maxInterest = 24.0;
    }
    
    // Calculate EMI (simplified calculation)
    const loanAmount = applicant.loan_amount_applied_inr || monthlyIncome * 12;
    const monthlyEmi = Math.round(loanAmount / tenureMonths);

    return {
      applicant_id: applicant.applicant_id || "N/A",
      demographics: {
        age: applicant.age,
        gender: applicant.gender || "N/A",
        education: applicant.education_level || "N/A",
        employment: applicant.employment_type || "N/A",
        monthly_income: monthlyIncome,
        location: applicant.city || applicant.location_type || "N/A",
        marital_status: applicant.marital_status || "N/A",
        dependents: applicant.number_of_dependents || "N/A"
      },
      risk_assessment: {
        overall_risk: applicant.risk_category || "Unknown",
        default_probability: applicant.probability_of_default || 0,
        recommendation: recommendation,
        confidence_score: 0.85 // Default value
      },
      top_decision_metrics: [
        {
          name: "Repayment Ability",
          value: applicant.repayment_ability_score || 0,
          impact: "High",
          status: (applicant.repayment_ability_score || 0) >= 70 ? "Good" : 
                 (applicant.repayment_ability_score || 0) >= 50 ? "Fair" : "Poor",
          description: "Score indicating ability to repay loans"
        },
        {
          name: "Payment Timeliness",
          value: applicant.timeliness_score || 0,
          impact: "High",
          status: (applicant.timeliness_score || 0) >= 70 ? "Good" : 
                 (applicant.timeliness_score || 0) >= 50 ? "Fair" : "Poor",
          description: "Historical payment timeliness pattern"
        },
        {
          name: "Financial Health",
          value: applicant.financial_health_score || 0,
          impact: "Medium",
          status: (applicant.financial_health_score || 0) >= 70 ? "Good" : 
                 (applicant.financial_health_score || 0) >= 50 ? "Fair" : "Poor",
          description: "Overall financial stability indicator"
        },
        {
          name: "Stability Index",
          value: applicant.stability_index || 0,
          impact: "Medium",
          status: (applicant.stability_index || 0) >= 70 ? "Good" : 
                 (applicant.stability_index || 0) >= 50 ? "Fair" : "Poor",
          description: "Employment and income stability measure"
        }
      ],
      loan_details: {
        eligibility: applicant.risk_category === "Low Risk" ? "Eligible" : 
                    applicant.risk_category === "Medium Risk" ? "Review Required" : "Not Eligible",
        loan_range: {
          minimum: minLoan,
          maximum: maxLoan
        },
        terms: {
          tenure_months: tenureMonths,
          monthly_emi: monthlyEmi,
          interest_rate_range: {
            min: minInterest,
            max: maxInterest
          }
        },
        purpose: applicant.loan_purpose || "Personal Loan"
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
import React, { useState, useCallback, useRef } from "react";
// Import Material UI Icons
import PersonIcon from "@mui/icons-material/Person";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import WorkIcon from "@mui/icons-material/Work";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import SpinnerIcon from "@mui/icons-material/Autorenew";

function CreditRiskForm({ onProcess, isLoading }) {
  // City to location type mapping based on your image
  const cityLocationMapping = {
    // Metro cities
    Ahmedabad: "Metro",
    Surat: "Metro",
    Vadodara: "Metro",

    // Tier1 cities
    Rajkot: "Tier1",
    Bhavnagar: "Tier1",
    Jamnagar: "Tier1",
    Gandhinagar: "Metro", // Updated to Metro as shown in image
    Surendranagar: "Tier1",

    // Tier2 cities
    Junagadh: "Tier2",
    Nadiad: "Tier2",
    Morbi: "Tier2",
    Anand: "Tier2",
    Mehsana: "Tier2",
    Navsari: "Tier2",
    Bharuch: "Tier2",
    Vapi: "Tier2",
    Valsad: "Tier2",
    Patan: "Tier2",
    Godhra: "Tier2",
    Porbandar: "Tier2",
    Palanpur: "Tier2",
    Veraval: "Tier2",
  };

  const [formData, setFormData] = useState({
    // Personal Information (8 fields - removed location_type)
    applicant_id: "",
    application_date: new Date().toISOString().split("T")[0],
    age: "",
    gender: "",
    education_level: "",
    employment_type: "",
    marital_status: "",
    family_size: "",
    number_of_dependents: "0",

    // Location & Financial Information (12 fields - location_type auto-mapped)
    city: "",
    monthly_income_inr: "",
    spouse_income_inr: "0",
    monthly_expenses_inr: "",
    monthly_savings_inr: "0",
    monthly_utility_bills_inr: "0",
    property_value_inr: "0",
    vehicle_value_inr: "0",
    total_investments_inr: "0",
    outstanding_loan_amount_inr: "0",
    loan_amount_applied_inr: "",
    monthly_business_revenue_inr: "0",

    // Employment & Banking (2 fields)
    years_current_employment: "",
    banking_relationship_years: "",

    // Digital Behavior (4 fields)
    daily_mobile_hours: "",
    monthly_digital_transactions: "",
    avg_transaction_amount_inr: "0",
    social_media_accounts_count: "0",

    // Risk Scores (2 fields only)
    mobile_app_usage_intensity_score: "50",
    digital_payment_adoption_score: "50",

    // System Fields (3 fields)
    data_completeness_pct: "100",
    consent_status: "granted",
    explainability_support_flag: "1",
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [canSubmit, setCanSubmit] = useState(false);
  const formRef = useRef(null);

  const steps = [
    { title: "Personal Information", icon: PersonIcon },
    { title: "Financial Details", icon: AccountBalanceWalletIcon },
    { title: "Employment & Banking", icon: WorkIcon },
    { title: "Digital Behavior", icon: SmartphoneIcon },
    { title: "Risk Scores", icon: AssessmentIcon },
  ];

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      setFormData((prev) => {
        const newData = {
          ...prev,
          [name]: value,
        };

        // Auto-set location_type when city is selected
        if (name === "city" && value) {
          newData.location_type = cityLocationMapping[value] || "Tier2";
        }

        return newData;
      });

      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors, cityLocationMapping]
  );

  const validateStep = useCallback(
    (step) => {
      const newErrors = {};

      switch (step) {
        case 0:
          if (
            !formData.age ||
            parseInt(formData.age) < 18 ||
            parseInt(formData.age) > 100
          ) {
            newErrors.age = "Age must be between 18-100";
          }
          if (!formData.gender) newErrors.gender = "Gender is required";
          if (!formData.education_level)
            newErrors.education_level = "Education level is required";
          if (!formData.employment_type)
            newErrors.employment_type = "Employment type is required";
          if (!formData.marital_status)
            newErrors.marital_status = "Marital status is required";
          if (!formData.family_size || parseInt(formData.family_size) < 1) {
            newErrors.family_size = "Family size must be at least 1";
          }
          if (!formData.city || formData.city.trim().length === 0) {
            newErrors.city = "City is required";
          }
          break;

        case 1:
          if (
            !formData.monthly_income_inr ||
            parseFloat(formData.monthly_income_inr) <= 0
          ) {
            newErrors.monthly_income_inr =
              "Monthly income is required and must be greater than 0";
          }
          if (
            !formData.monthly_expenses_inr ||
            parseFloat(formData.monthly_expenses_inr) < 0
          ) {
            newErrors.monthly_expenses_inr =
              "Monthly expenses is required and cannot be negative";
          }
          if (
            !formData.loan_amount_applied_inr ||
            parseFloat(formData.loan_amount_applied_inr) <= 0
          ) {
            newErrors.loan_amount_applied_inr =
              "Loan amount is required and must be greater than 0";
          }
          break;

        case 2:
          if (
            !formData.years_current_employment ||
            parseFloat(formData.years_current_employment) < 0
          ) {
            newErrors.years_current_employment =
              "Employment years is required and cannot be negative";
          }
          if (
            !formData.banking_relationship_years ||
            parseFloat(formData.banking_relationship_years) < 0
          ) {
            newErrors.banking_relationship_years =
              "Banking relationship years is required and cannot be negative";
          }
          break;

        case 3:
          {
            const mobileHours = parseFloat(formData.daily_mobile_hours);
            if (
              !formData.daily_mobile_hours ||
              mobileHours < 0 ||
              mobileHours > 24
            ) {
              newErrors.daily_mobile_hours =
                "Daily mobile hours must be between 0-24";
            }
            if (
              !formData.monthly_digital_transactions ||
              parseInt(formData.monthly_digital_transactions) < 0
            ) {
              newErrors.monthly_digital_transactions =
                "Monthly digital transactions is required and cannot be negative";
            }
          }
          break;

        case 4:
          {
            const scoreFields = [
              "mobile_app_usage_intensity_score",
              "digital_payment_adoption_score",
            ];

            scoreFields.forEach((field) => {
              const value = parseInt(formData[field]);
              if (isNaN(value) || value < 0 || value > 100) {
                newErrors[field] = "Score must be between 0-100";
              }
            });
          }
          break;

        default:
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData]
  );

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      const newStep = Math.min(currentStep + 1, steps.length - 1);
      setCurrentStep(newStep);
      setCanSubmit(false);
    }
  }, [currentStep, validateStep, steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setCanSubmit(false);
  }, []);

  const generateApplicantId = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `USR_${timestamp}_${random}`;
  }, []);

  const convertToCSV = useCallback((data) => {
    const headers = Object.keys(data);
    const values = Object.values(data);
    const escapedValues = values.map((value) => {
      const stringValue = String(value);
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    return `${headers.join(",")}\n${escapedValues.join(",")}`;
  }, []);

  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (currentStep !== steps.length - 1 || !canSubmit) {
        return false;
      }

      if (!validateStep(currentStep)) {
        setCanSubmit(false);
        return false;
      }

      try {
        const finalData = {
          ...formData,
          applicant_id: formData.applicant_id || generateApplicantId(),
          // Ensure location_type is set based on selected city
          location_type: cityLocationMapping[formData.city] || "Tier2",
        };

        const csvData = convertToCSV(finalData);
        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
        const file = new File(
          [blob],
          `credit_application_${finalData.applicant_id}.csv`,
          { type: "text/csv" }
        );

        if (onProcess && typeof onProcess === "function") {
          onProcess(file);
        } else {
          console.error("onProcess function is not provided or not a function");
        }
      } catch (error) {
        console.error("Error processing form data:", error);
      }

      setCanSubmit(false);
      return false;
    },
    [
      currentStep,
      steps.length,
      canSubmit,
      validateStep,
      formData,
      generateApplicantId,
      convertToCSV,
      onProcess,
      cityLocationMapping,
    ]
  );

  const handleExplicitSubmit = useCallback(() => {
    if (currentStep === steps.length - 1) {
      setCanSubmit(true);
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
          );
        }
      }, 0);
    }
  }, [currentStep, steps.length]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (currentStep < steps.length - 1) {
          nextStep();
        }
        return false;
      }
    },
    [currentStep, steps.length, nextStep]
  );

  const handleInputKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, []);

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Applicant ID (Optional)
          </label>
          <input
            type="text"
            name="applicant_id"
            value={formData.applicant_id}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Auto-generated if empty"
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age *
          </label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="18"
            max="100"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.age ? "border-red-500" : "border-gray-300"
            }`}
            required
            aria-describedby={errors.age ? "age-error" : undefined}
          />
          {errors.age && (
            <p id="age-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.age}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.gender ? "border-red-500" : "border-gray-300"
            }`}
            required
            aria-describedby={errors.gender ? "gender-error" : undefined}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.gender && (
            <p id="gender-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.gender}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Education Level *
          </label>
          <select
            name="education_level"
            value={formData.education_level}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.education_level ? "border-red-500" : "border-gray-300"
            }`}
            required
            aria-describedby={
              errors.education_level ? "education-error" : undefined
            }
          >
            <option value="">Select Education Level</option>
            <option value="High School">High School</option>
            <option value="Diploma">Diploma</option>
            <option value="Graduate">Graduate</option>
            <option value="Post Graduate">Post Graduate</option>
            <option value="Professional">Professional</option>
          </select>
          {errors.education_level && (
            <p id="education-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.education_level}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employment Type *
          </label>
          <select
            name="employment_type"
            value={formData.employment_type}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.employment_type ? "border-red-500" : "border-gray-300"
            }`}
            required
            aria-describedby={
              errors.employment_type ? "employment-error" : undefined
            }
          >
            <option value="">Select Employment Type</option>
            <option value="Salaried">Salaried</option>
            <option value="Self Employed">Self Employed</option>
            <option value="Business Owner">Business Owner</option>
            <option value="Professional">Professional</option>
          </select>
          {errors.employment_type && (
            <p id="employment-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.employment_type}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marital Status *
          </label>
          <select
            name="marital_status"
            value={formData.marital_status}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.marital_status ? "border-red-500" : "border-gray-300"
            }`}
            required
            aria-describedby={
              errors.marital_status ? "marital-error" : undefined
            }
          >
            <option value="">Select Marital Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
          </select>
          {errors.marital_status && (
            <p id="marital-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.marital_status}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Family Size *
          </label>
          <input
            type="number"
            name="family_size"
            value={formData.family_size}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="1"
            max="20"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.family_size ? "border-red-500" : "border-gray-300"
            }`}
            required
            aria-describedby={
              errors.family_size ? "family-size-error" : undefined
            }
          />
          {errors.family_size && (
            <p id="family-size-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.family_size}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Dependents
          </label>
          <input
            type="number"
            name="number_of_dependents"
            value={formData.number_of_dependents}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            max="20"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
            {formData.city && (
              <span className="ml-2 text-sm font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                Location Type: {cityLocationMapping[formData.city] || "Tier2"}
              </span>
            )}
          </label>
          <select
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.city ? "border-red-500" : "border-gray-300"
            }`}
            required
            aria-describedby={errors.city ? "city-error" : undefined}
          >
            <option value="">Select City</option>
            <optgroup label="Metro Cities">
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Gandhinagar">Gandhinagar</option>
              <option value="Surat">Surat</option>
              <option value="Vadodara">Vadodara</option>
            </optgroup>
            <optgroup label="Tier1 Cities">
              <option value="Bhavnagar">Bhavnagar</option>
              <option value="Jamnagar">Jamnagar</option>
              <option value="Rajkot">Rajkot</option>
              <option value="Surendranagar">Surendranagar</option>
            </optgroup>
            <optgroup label="Tier2 Cities">
              <option value="Anand">Anand</option>
              <option value="Bharuch">Bharuch</option>
              <option value="Godhra">Godhra</option>
              <option value="Junagadh">Junagadh</option>
              <option value="Mehsana">Mehsana</option>
              <option value="Morbi">Morbi</option>
              <option value="Nadiad">Nadiad</option>
              <option value="Navsari">Navsari</option>
              <option value="Palanpur">Palanpur</option>
              <option value="Patan">Patan</option>
              <option value="Porbandar">Porbandar</option>
              <option value="Valsad">Valsad</option>
              <option value="Vapi">Vapi</option>
              <option value="Veraval">Veraval</option>
            </optgroup>
          </select>
          {errors.city && (
            <p id="city-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.city}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderFinancialInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Income (INR) *
          </label>
          <input
            type="number"
            name="monthly_income_inr"
            value={formData.monthly_income_inr}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.monthly_income_inr ? "border-red-500" : "border-gray-300"
            }`}
            required
            aria-describedby={
              errors.monthly_income_inr ? "income-error" : undefined
            }
          />
          {errors.monthly_income_inr && (
            <p id="income-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.monthly_income_inr}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Spouse Income (INR)
          </label>
          <input
            type="number"
            name="spouse_income_inr"
            value={formData.spouse_income_inr}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Expenses (INR) *
          </label>
          <input
            type="number"
            name="monthly_expenses_inr"
            value={formData.monthly_expenses_inr}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.monthly_expenses_inr ? "border-red-500" : "border-gray-300"
            }`}
            required
            aria-describedby={
              errors.monthly_expenses_inr ? "expenses-error" : undefined
            }
          />
          {errors.monthly_expenses_inr && (
            <p id="expenses-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.monthly_expenses_inr}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loan Amount Applied (INR) *
          </label>
          <input
            type="number"
            name="loan_amount_applied_inr"
            value={formData.loan_amount_applied_inr}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="1000"
            step="1000"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.loan_amount_applied_inr
                ? "border-red-500"
                : "border-gray-300"
            }`}
            required
            aria-describedby={
              errors.loan_amount_applied_inr ? "loan-amount-error" : undefined
            }
          />
          {errors.loan_amount_applied_inr && (
            <p id="loan-amount-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.loan_amount_applied_inr}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Savings (INR)
          </label>
          <input
            type="number"
            name="monthly_savings_inr"
            value={formData.monthly_savings_inr}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Utility Bills (INR)
          </label>
          <input
            type="number"
            name="monthly_utility_bills_inr"
            value={formData.monthly_utility_bills_inr}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Value (INR)
          </label>
          <input
            type="number"
            name="property_value_inr"
            value={formData.property_value_inr}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Value (INR)
          </label>
          <input
            type="number"
            name="vehicle_value_inr"
            value={formData.vehicle_value_inr}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Investments (INR)
          </label>
          <input
            type="number"
            name="total_investments_inr"
            value={formData.total_investments_inr}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Outstanding Loan Amount (INR)
          </label>
          <input
            type="number"
            name="outstanding_loan_amount_inr"
            value={formData.outstanding_loan_amount_inr}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Business Revenue (INR)
          </label>
          <input
            type="number"
            name="monthly_business_revenue_inr"
            value={formData.monthly_business_revenue_inr}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Leave blank if not applicable"
          />
        </div>
      </div>
    </div>
  );

  const renderEmploymentBanking = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years in Current Employment *
          </label>
          <input
            type="number"
            name="years_current_employment"
            value={formData.years_current_employment}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="0.1"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.years_current_employment
                ? "border-red-500"
                : "border-gray-300"
            }`}
            required
            aria-describedby={
              errors.years_current_employment
                ? "employment-years-error"
                : undefined
            }
          />
          {errors.years_current_employment && (
            <p
              id="employment-years-error"
              className="text-red-500 text-sm mt-1 flex items-center"
            >
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.years_current_employment}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Banking Relationship Years *
          </label>
          <input
            type="number"
            name="banking_relationship_years"
            value={formData.banking_relationship_years}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="0.1"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.banking_relationship_years
                ? "border-red-500"
                : "border-gray-300"
            }`}
            required
            aria-describedby={
              errors.banking_relationship_years
                ? "banking-years-error"
                : undefined
            }
          />
          {errors.banking_relationship_years && (
            <p id="banking-years-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.banking_relationship_years}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderDigitalBehavior = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Mobile Usage Hours *
          </label>
          <input
            type="number"
            name="daily_mobile_hours"
            value={formData.daily_mobile_hours}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            max="24"
            step="0.5"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.daily_mobile_hours ? "border-red-500" : "border-gray-300"
            }`}
            required
            aria-describedby={
              errors.daily_mobile_hours ? "mobile-hours-error" : undefined
            }
          />
          {errors.daily_mobile_hours && (
            <p id="mobile-hours-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.daily_mobile_hours}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Digital Transactions *
          </label>
          <input
            type="number"
            name="monthly_digital_transactions"
            value={formData.monthly_digital_transactions}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.monthly_digital_transactions
                ? "border-red-500"
                : "border-gray-300"
            }`}
            required
            aria-describedby={
              errors.monthly_digital_transactions
                ? "digital-transactions-error"
                : undefined
            }
          />
          {errors.monthly_digital_transactions && (
            <p
              id="digital-transactions-error"
              className="text-red-500 text-sm mt-1 flex items-center"
            >
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.monthly_digital_transactions}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Average Transaction Amount (INR)
          </label>
          <input
            type="number"
            name="avg_transaction_amount_inr"
            value={formData.avg_transaction_amount_inr}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            step="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Social Media Accounts Count
          </label>
          <input
            type="number"
            name="social_media_accounts_count"
            value={formData.social_media_accounts_count}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            max="50"
            step="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );

  const renderRiskScores = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800 flex items-center">
          <InfoIcon style={{ fontSize: 16, marginRight: "8px" }} />
          Please rate yourself on a scale of 0-100 for these digital behavior
          aspects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile App Usage Intensity (0-100)
          </label>
          <input
            type="number"
            name="mobile_app_usage_intensity_score"
            value={formData.mobile_app_usage_intensity_score}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            max="100"
            step="1"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.mobile_app_usage_intensity_score
                ? "border-red-500"
                : "border-gray-300"
            }`}
            aria-describedby={
              errors.mobile_app_usage_intensity_score
                ? "mobile-app-error"
                : undefined
            }
          />
          {errors.mobile_app_usage_intensity_score && (
            <p id="mobile-app-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.mobile_app_usage_intensity_score}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Digital Payment Adoption (0-100)
          </label>
          <input
            type="number"
            name="digital_payment_adoption_score"
            value={formData.digital_payment_adoption_score}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            min="0"
            max="100"
            step="1"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              errors.digital_payment_adoption_score
                ? "border-red-500"
                : "border-gray-300"
            }`}
            aria-describedby={
              errors.digital_payment_adoption_score
                ? "digital-payment-error"
                : undefined
            }
          />
          {errors.digital_payment_adoption_score && (
            <p id="digital-payment-error" className="text-red-500 text-sm mt-1 flex items-center">
              <InfoIcon style={{ fontSize: 16, marginRight: "4px" }} />
              {errors.digital_payment_adoption_score}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalInfo();
      case 1:
        return renderFinancialInfo();
      case 2:
        return renderEmploymentBanking();
      case 3:
        return renderDigitalBehavior();
      case 4:
        return renderRiskScores();
      default:
        return renderPersonalInfo();
    }
  };

  return (
    <div className="space-y-6 mx-0">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          Credit Risk Analysis Form
        </h1>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Application Progress</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={index}
                  className={`flex items-center ${
                    index < steps.length - 1 ? "flex-1" : ""
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                      index <= currentStep
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    <IconComponent style={{ fontSize: 20 }} />
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p
                      className={`text-sm font-medium ${
                        index <= currentStep
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 transition-all duration-200 ${
                        index < currentStep ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
        className="space-y-6"
        noValidate
      >
        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              {React.createElement(steps[currentStep].icon, {
                style: { fontSize: 20, color: "#3b82f6", marginRight: "8px" }
              })}
              {steps[currentStep].title}
            </h3>
          </div>
          <div className="p-6">
            {renderCurrentStep()}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-xl font-medium flex items-center transition-all duration-200 ${
              currentStep === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-lg hover:shadow-xl"
            }`}
          >
            <ArrowBackIcon style={{ fontSize: 18, marginRight: "8px" }} />
            Previous
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Next
              <ArrowForwardIcon style={{ fontSize: 18, marginLeft: "8px" }} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExplicitSubmit}
              disabled={isLoading}
              className={`px-6 py-3 font-medium text-white rounded-xl flex items-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                isLoading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isLoading ? (
                <>
                  <SpinnerIcon 
                    style={{ fontSize: 18, marginRight: "8px" }}
                    className="animate-spin"
                  />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircleIcon style={{ fontSize: 18, marginRight: "8px" }} />
                  Analyze My Credit Risk
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default CreditRiskForm;

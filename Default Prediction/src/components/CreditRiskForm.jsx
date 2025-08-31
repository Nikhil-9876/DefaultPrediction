import React, { useState, useCallback, useRef } from "react";

function CreditRiskForm({ onProcess, isLoading }) {
  const [formData, setFormData] = useState({
    // Personal Information
    applicant_id: '',
    application_date: new Date().toISOString().split('T')[0],
    age: '',
    gender: '',
    education_level: '',
    employment_type: '',
    marital_status: '',
    family_size: '',
    number_of_dependents: '0',
    location_type: '',
    
    // Financial Information (in INR)
    monthly_income_inr: '',
    spouse_income_inr: '0',
    monthly_expenses_inr: '',
    monthly_savings_inr: '0',
    monthly_utility_bills_inr: '0',
    property_value_inr: '0',
    vehicle_value_inr: '0',
    total_investments_inr: '0',
    outstanding_loan_amount_inr: '0',
    
    // Employment & Banking
    years_current_employment: '',
    banking_relationship_years: '',
    monthly_business_revenue_inr: '0',
    
    // Digital Behavior
    daily_mobile_hours: '',
    monthly_digital_transactions: '',
    avg_transaction_amount_inr: '0',
    social_media_accounts_count: '0',
    
    // Scores (0-100) - default to reasonable values if empty
    mobile_app_usage_intensity_score: '50',
    digital_payment_adoption_score: '50',
    utility_payment_regularity_score: '75',
    location_stability_score: '75',
    mobile_banking_usage_score: '50',
    payment_reliability_score: '75',
    financial_health_score: '60',
    stability_index: '70',
    timeliness_score: '75',
    repayment_ability_score: '60',
    
    // Risk Assessment - will be calculated by model
    probability_of_default: '0',
    data_completeness_pct: '100',
    consent_status: 'granted',
    explainability_support_flag: '1'
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [canSubmit, setCanSubmit] = useState(false);
  const formRef = useRef(null);

  const steps = [
    "Personal Information",
    "Financial Details", 
    "Employment & Banking",
    "Digital Behavior",
    "Risk Scores"
  ];

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const validateStep = useCallback((step) => {
    const newErrors = {};
    
    switch(step) {
      case 0:
        if (!formData.age || parseInt(formData.age) < 18 || parseInt(formData.age) > 100) {
          newErrors.age = 'Age must be between 18-100';
        }
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.education_level) newErrors.education_level = 'Education level is required';
        if (!formData.employment_type) newErrors.employment_type = 'Employment type is required';
        if (!formData.marital_status) newErrors.marital_status = 'Marital status is required';
        if (!formData.family_size || parseInt(formData.family_size) < 1) {
          newErrors.family_size = 'Family size must be at least 1';
        }
        if (!formData.location_type) newErrors.location_type = 'Location type is required';
        break;
        
      case 1:
        if (!formData.monthly_income_inr || parseFloat(formData.monthly_income_inr) <= 0) {
          newErrors.monthly_income_inr = 'Monthly income is required and must be greater than 0';
        }
        if (!formData.monthly_expenses_inr || parseFloat(formData.monthly_expenses_inr) < 0) {
          newErrors.monthly_expenses_inr = 'Monthly expenses is required and cannot be negative';
        }
        break;
        
      case 2:
        if (!formData.years_current_employment || parseFloat(formData.years_current_employment) < 0) {
          newErrors.years_current_employment = 'Employment years is required and cannot be negative';
        }
        if (!formData.banking_relationship_years || parseFloat(formData.banking_relationship_years) < 0) {
          newErrors.banking_relationship_years = 'Banking relationship years is required and cannot be negative';
        }
        break;
        
      case 3:
        {
          const mobileHours = parseFloat(formData.daily_mobile_hours);
          if (!formData.daily_mobile_hours || mobileHours < 0 || mobileHours > 24) {
            newErrors.daily_mobile_hours = 'Daily mobile hours must be between 0-24';
          }
          if (!formData.monthly_digital_transactions || parseInt(formData.monthly_digital_transactions) < 0) {
            newErrors.monthly_digital_transactions = 'Monthly digital transactions is required and cannot be negative';
          }
        }
        break;
        
      case 4:
        {
          const scoreFields = [
            'mobile_app_usage_intensity_score', 'digital_payment_adoption_score',
            'utility_payment_regularity_score', 'location_stability_score',
            'mobile_banking_usage_score', 'payment_reliability_score',
            'financial_health_score', 'stability_index',
            'timeliness_score', 'repayment_ability_score'
          ];
          
          scoreFields.forEach(field => {
            const value = parseInt(formData[field]);
            if (isNaN(value) || value < 0 || value > 100) {
              newErrors[field] = 'Score must be between 0-100';
            }
          });
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      const newStep = Math.min(currentStep + 1, steps.length - 1);
      setCurrentStep(newStep);
      // Reset submit permission when moving to next step
      setCanSubmit(false);
    }
  }, [currentStep, validateStep, steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    // Reset submit permission when moving to previous step
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
    const escapedValues = values.map(value => {
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    return `${headers.join(',')}\n${escapedValues.join(',')}`;
  }, []);

  // Prevent any form submission except when explicitly allowed
  const handleFormSubmit = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow submission if we're on the last step AND canSubmit is true
    if (currentStep !== steps.length - 1 || !canSubmit) {
      return false;
    }

    if (!validateStep(currentStep)) {
      setCanSubmit(false);
      return false;
    }

    // Process the form
    try {
      const finalData = {
        ...formData,
        applicant_id: formData.applicant_id || generateApplicantId()
      };

      const csvData = convertToCSV(finalData);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
      const file = new File([blob], `credit_application_${finalData.applicant_id}.csv`, { type: 'text/csv' });

      if (onProcess && typeof onProcess === 'function') {
        onProcess(file);
      } else {
        console.error('onProcess function is not provided or not a function');
      }
    } catch (error) {
      console.error('Error processing form data:', error);
    }

    // Reset submission permission
    setCanSubmit(false);
    return false;
  }, [currentStep, steps.length, canSubmit, validateStep, formData, generateApplicantId, convertToCSV, onProcess]);

  // Handle explicit submit button click
  const handleExplicitSubmit = useCallback(() => {
    if (currentStep === steps.length - 1) {
      setCanSubmit(true);
      // Use setTimeout to ensure canSubmit state is updated before form submission
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }, 0);
    }
  }, [currentStep, steps.length]);

  // Prevent Enter key from submitting form
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      // Optional: Move to next step on Enter (except on last step)
      if (currentStep < steps.length - 1) {
        nextStep();
      }
      return false;
    }
  }, [currentStep, steps.length, nextStep]);

  // Prevent any input from triggering form submission
  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, []);

  const renderPersonalInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Applicant ID (Optional)
          </label>
          <input
            type="text"
            name="applicant_id"
            value={formData.applicant_id}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Auto-generated if empty"
            maxLength={50}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-describedby={errors.age ? 'age-error' : undefined}
          />
          {errors.age && <p id="age-error" className="text-red-500 text-xs mt-1">{errors.age}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender *
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-describedby={errors.gender ? 'gender-error' : undefined}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <p id="gender-error" className="text-red-500 text-xs mt-1">{errors.gender}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Education Level *
          </label>
          <select
            name="education_level"
            value={formData.education_level}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.education_level ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-describedby={errors.education_level ? 'education-error' : undefined}
          >
            <option value="">Select Education Level</option>
            <option value="High School">High School</option>
            <option value="Bachelor's Degree">Bachelor's Degree</option>
            <option value="Master's Degree">Master's Degree</option>
            <option value="PhD">PhD</option>
            <option value="Diploma">Diploma</option>
            <option value="Other">Other</option>
          </select>
          {errors.education_level && <p id="education-error" className="text-red-500 text-xs mt-1">{errors.education_level}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employment Type *
          </label>
          <select
            name="employment_type"
            value={formData.employment_type}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.employment_type ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-describedby={errors.employment_type ? 'employment-error' : undefined}
          >
            <option value="">Select Employment Type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Self-employed">Self-employed</option>
            <option value="Unemployed">Unemployed</option>
            <option value="Retired">Retired</option>
            <option value="Student">Student</option>
          </select>
          {errors.employment_type && <p id="employment-error" className="text-red-500 text-xs mt-1">{errors.employment_type}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marital Status *
          </label>
          <select
            name="marital_status"
            value={formData.marital_status}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.marital_status ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-describedby={errors.marital_status ? 'marital-error' : undefined}
          >
            <option value="">Select Marital Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
          {errors.marital_status && <p id="marital-error" className="text-red-500 text-xs mt-1">{errors.marital_status}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.family_size ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-describedby={errors.family_size ? 'family-size-error' : undefined}
          />
          {errors.family_size && <p id="family-size-error" className="text-red-500 text-xs mt-1">{errors.family_size}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location Type *
          </label>
          <select
            name="location_type"
            value={formData.location_type}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.location_type ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-describedby={errors.location_type ? 'location-error' : undefined}
          >
            <option value="">Select Location Type</option>
            <option value="Urban">Urban</option>
            <option value="Suburban">Suburban</option>
            <option value="Rural">Rural</option>
          </select>
          {errors.location_type && <p id="location-error" className="text-red-500 text-xs mt-1">{errors.location_type}</p>}
        </div>
      </div>
    </div>
  );

  const renderFinancialInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.monthly_income_inr ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-describedby={errors.monthly_income_inr ? 'income-error' : undefined}
          />
          {errors.monthly_income_inr && <p id="income-error" className="text-red-500 text-xs mt-1">{errors.monthly_income_inr}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.monthly_expenses_inr ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-describedby={errors.monthly_expenses_inr ? 'expenses-error' : undefined}
          />
          {errors.monthly_expenses_inr && <p id="expenses-error" className="text-red-500 text-xs mt-1">{errors.monthly_expenses_inr}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderEmploymentBanking = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.years_current_employment ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-describedby={errors.years_current_employment ? 'employment-years-error' : undefined}
          />
          {errors.years_current_employment && <p id="employment-years-error" className="text-red-500 text-xs mt-1">{errors.years_current_employment}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.banking_relationship_years ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-describedby={errors.banking_relationship_years ? 'banking-years-error' : undefined}
          />
          {errors.banking_relationship_years && <p id="banking-years-error" className="text-red-500 text-xs mt-1">{errors.banking_relationship_years}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Leave blank if not applicable"
          />
        </div>
      </div>
    </div>
  );

  const renderDigitalBehavior = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.daily_mobile_hours ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-describedby={errors.daily_mobile_hours ? 'mobile-hours-error' : undefined}
          />
          {errors.daily_mobile_hours && <p id="mobile-hours-error" className="text-red-500 text-xs mt-1">{errors.daily_mobile_hours}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.monthly_digital_transactions ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-describedby={errors.monthly_digital_transactions ? 'digital-transactions-error' : undefined}
          />
          {errors.monthly_digital_transactions && <p id="digital-transactions-error" className="text-red-500 text-xs mt-1">{errors.monthly_digital_transactions}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderRiskScores = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <i className="fas fa-info-circle mr-2"></i>
          Please rate yourself on a scale of 0-100 for the following aspects. These values are pre-filled with reasonable defaults but you can adjust them based on your self-assessment.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { name: 'mobile_app_usage_intensity_score', label: 'Mobile App Usage Intensity (0-100)' },
          { name: 'digital_payment_adoption_score', label: 'Digital Payment Adoption (0-100)' },
          { name: 'utility_payment_regularity_score', label: 'Utility Payment Regularity (0-100)' },
          { name: 'location_stability_score', label: 'Location Stability (0-100)' },
          { name: 'mobile_banking_usage_score', label: 'Mobile Banking Usage (0-100)' },
          { name: 'payment_reliability_score', label: 'Payment Reliability (0-100)' },
          { name: 'financial_health_score', label: 'Financial Health (0-100)' },
          { name: 'stability_index', label: 'Stability Index (0-100)' },
          { name: 'timeliness_score', label: 'Timeliness Score (0-100)' },
          { name: 'repayment_ability_score', label: 'Repayment Ability (0-100)' }
        ].map(field => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="number"
              name={field.name}
              value={formData[field.name]}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              min="0"
              max="100"
              step="1"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors[field.name] ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
            />
            {errors[field.name] && <p id={`${field.name}-error`} className="text-red-500 text-xs mt-1">{errors[field.name]}</p>}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch(currentStep) {
      case 0: return renderPersonalInfo();
      case 1: return renderFinancialInfo();
      case 2: return renderEmploymentBanking();
      case 3: return renderDigitalBehavior();
      case 4: return renderRiskScores();
      default: return renderPersonalInfo();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <i className="fas fa-user-edit text-blue-500"></i>
          Individual Credit Risk Application
        </h2>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <span className={`ml-2 text-sm ${index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                {step}
              </span>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
        className="space-y-6"
        noValidate
      >
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {steps[currentStep]}
          </h3>
          {renderCurrentStep()}
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg font-medium flex items-center transition-colors ${
              currentStep === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Previous
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center transition-colors"
            >
              Next
              <i className="fas fa-arrow-right ml-2"></i>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExplicitSubmit}
              disabled={isLoading}
              className={`px-6 py-3 font-medium text-white rounded-lg flex items-center transition-colors ${
                isLoading
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Analyze My Credit Risk
                </>
              )}
            </button>
          )}
        </div>
      </form>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
          <i className="fas fa-question-circle mr-2"></i>
          Need Help?
        </h4>
        <p className="text-sm text-yellow-700">
          This form collects personal information for credit risk assessment. All financial amounts should be in Indian Rupees (INR). Fields marked with * are required. Data will be processed securely and used only for credit evaluation.
        </p>
      </div>
    </div>
  );
}

export default CreditRiskForm;

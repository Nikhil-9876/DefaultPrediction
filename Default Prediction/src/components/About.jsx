// components/About.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  CpuChipIcon,
  LightBulbIcon,
  ArrowRightIcon,
  PhotoIcon,
  XMarkIcon,
  UserIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  DevicePhoneMobileIcon,
  ChartBarSquareIcon,
  KeyIcon,
  TagIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon,
  CogIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

function About() {
  const navigate = useNavigate();
  const [popupImage, setPopupImage] = useState(null);

  // Updated metrics with your requested changes
  const metrics = [
    { name: 'Best Model', value: 'XGBoost', description: 'Top performing algorithm' },
    { name: 'Combined Score', value: '0.9010', description: 'Overall performance metric' },
    { name: 'Validation Accuracy', value: '0.8293', description: 'Holdout set performance' },
    { name: 'CV Accuracy', value: '0.7990', description: 'Cross-validation accuracy' },
    { name: 'Mean Absolute Error (MAE)', value: '0.0496', description: 'Prediction error metric' },
    { name: 'AUC', value: '0.9949', description: 'Area Under Curve score' }
  ];

  const datasetOverview = [
    { label: 'Total Columns', value: '44', description: 'Complete feature set' },
    { label: 'Target Variables', value: '2', description: 'Regression + Classification' },
    { label: 'Model Features', value: '35+', description: 'Features for ML training' },
    { label: 'Geographic Focus', value: 'Gujarat, India', description: '22 cities covered' },
    { label: 'Sample Size', value: '15,000', description: 'Synthetic loan applications' },
    { label: 'Time Period', value: 'June 2024 - July 2025', description: '13-month span' }
  ];

  const columnCategories = [
    {
      category: "Application Identifiers",
      icon: TagIcon,
      columns: [
        {
          name: "applicant_id",
          type: "String",
          details: "Format: [A-F][0-9]{4} (e.g., 'A1234', 'C5678'). Random prefix + 4-digit number. Purpose: Unique identifier for each application."
        },
        {
          name: "application_date",
          type: "Date",
          details: "Format: YYYY-MM-DD. Range: 2024-06-01 to 2025-07-31. Random date within range using datetime library."
        }
      ]
    },
    {
      category: "Demographics",
      icon: UserIcon,
      columns: [
        {
          name: "age",
          type: "Integer",
          details: "Range: 18-75 years. Normal distribution (μ=36, σ=12) with segment adjustments: Excellent +5 years, Poor -3 years, Bad -5 years."
        },
        {
          name: "gender",
          type: "Categorical",
          details: "Values: 'Male', 'Female'. Distribution: 55% Male, 45% Female. Random choice with fixed probabilities."
        },
        {
          name: "education_level",
          type: "Categorical",
          details: "Values: 'High School', 'Diploma', 'Graduate', 'Post Graduate', 'Professional'. Distribution varies by segment."
        },
        {
          name: "employment_type",
          type: "Categorical",
          details: "Values: 'Salaried', 'Self Employed', 'Business Owner', 'Professional'. Distribution varies by risk segment."
        },
        {
          name: "marital_status",
          type: "Categorical",
          details: "Values: 'Single', 'Married'. Age-dependent probability (70% single if age < 28)."
        },
        {
          name: "family_size",
          type: "Integer",
          details: "Range: 1-5. Logic: 1 if single, 2-5 if married (random)."
        },
        {
          name: "number_of_dependents",
          type: "Integer",
          details: "Range: 0-3. Calculation: max(0, family_size - 2)."
        }
      ]
    },
    {
      category: "Geographic Information",
      icon: MapPinIcon,
      columns: [
        {
          name: "city",
          type: "Categorical",
          details: "22 Gujarat cities: Ahmedabad, Surat, Vadodara, Rajkot, Bhavnagar, Jamnagar, Junagadh, Gandhinagar, Nadiad, Morbi, Anand, Mehsana, Navsari, Bharuch, Vapi, Valsad, Patan, Godhra, Porbandar, Palanpur, Veraval, Surendranagar."
        },
        {
          name: "location_type",
          type: "Categorical",
          details: "Values: 'Metro', 'Tier1', 'Tier2'. Metro: Ahmedabad, Surat, Vadodara, Gandhinagar. Tier1: Rajkot, Bhavnagar, Jamnagar, Surendranagar. Tier2: All other cities."
        }
      ]
    },
    {
      category: "Financial Information",
      icon: CurrencyDollarIcon,
      columns: [
        {
          name: "monthly_income_inr",
          type: "Integer",
          details: "Range: 15,000 - 500,000 INR. Normal distribution (μ=55,000, σ=25,000) with segment multipliers: Excellent ×1.5, Good ×1.15, Poor ×0.65, Bad ×0.52."
        },
        {
          name: "spouse_income_inr",
          type: "Integer",
          details: "Range: 0 - 80% of primary income. 0 if single. If married: 60% probability of having spouse income (20-80% of primary income)."
        },
        {
          name: "monthly_expenses_inr",
          type: "Integer",
          details: "Range: 2,000 - (income - 500) INR. Calculation: income × expense_ratio ± random_noise. Expense ratios vary by segment."
        },
        {
          name: "monthly_savings_inr",
          type: "Integer",
          details: "Range: 0 - (income - expenses). Calculation: max(0, income - expenses - random_reduction)."
        },
        {
          name: "monthly_utility_bills_inr",
          type: "Integer",
          details: "Range: 500 - 15,000 INR. Uses telco dataset charges multiplied by family size and random factor (0.8-1.2)."
        }
      ]
    },
    {
      category: "Asset Information",
      icon: BuildingOfficeIcon,
      columns: [
        {
          name: "property_value_inr",
          type: "Integer",
          details: "Range: 0 - 50,000,000 INR. High income (>80k) + Age >30: income × 25-55 × (age/40). Medium income (>50k): 40% probability. Low income: 0."
        },
        {
          name: "vehicle_value_inr",
          type: "Integer",
          details: "Range: 0 - 4,000,000 INR. High income: income × 2-8. Medium income: 60% probability, income × 1-5. Low income: 30% probability, income × 0.5-3."
        },
        {
          name: "total_investments_inr",
          type: "Integer",
          details: "Range: 0 - 10,000,000 INR. Varies by income level with age factor multipliers."
        }
      ]
    },
    {
      category: "Loan Information",
      icon: KeyIcon,
      columns: [
        {
          name: "loan_type",
          type: "Categorical",
          details: "Values: 'personal loan', 'home loan', 'auto loan', 'education loan', 'business loan', 'credit card', 'gold loan'. Age-based assignment logic with adjustments for business owners and property owners."
        },
        {
          name: "interest_rate",
          type: "Float",
          details: "2 decimal places. Range by loan type: Personal: 11.99%-24.0%, Home: 7.35%-12.95%, Auto: 7.70%-15.30%, Education: 9.45%-15.0%, Business: 10.85%-17.95%, Credit Card: 18.0%-42.0%, Gold: 8.30%-16.0%."
        },
        {
          name: "loan_amount_applied_inr",
          type: "Integer",
          details: "Complex multi-factor formula with income multipliers and loan type bounds. Home: ₹500k-₹8M, Auto: ₹200k-₹1.5M, Business: ₹100k-₹5M, Personal: ₹25k-₹2M, Credit Card: ₹10k-₹500k."
        },
        {
          name: "outstanding_loan_amount_inr",
          type: "Integer",
          details: "Range: 15,000 - loan_amount_applied_inr. Calculation: loan_amount_applied × utilization_rate. Beta distribution (2,2) clipped to 0.3-1.0."
        }
      ]
    },
    {
      category: "Employment & Banking History",
      icon: BuildingOfficeIcon,
      columns: [
        {
          name: "years_current_employment",
          type: "Float",
          details: "Range: 0.5 - 35.0 years. Uses telco tenure statistics modified by random factor (0.6-1.0)."
        },
        {
          name: "banking_relationship_years",
          type: "Float",
          details: "Range: 0.5 - (age - 18) years. Calculation: tenure - random_adjustment(-2.0, +3.0). Cannot exceed years since turning 18."
        },
        {
          name: "monthly_business_revenue_inr",
          type: "Integer",
          details: "Range: 0 or (1.2 - 2.8) × monthly_income. 0 for Salaried/Professional employees. For Business Owner/Self Employed: income × 1.2-2.8."
        }
      ]
    },
    {
      category: "Digital Behavior Metrics",
      icon: DevicePhoneMobileIcon,
      columns: [
        {
          name: "daily_mobile_hours",
          type: "Float",
          details: "Range: 1.0 - 12.0 hours. <35 years + Graduate+: 6-12 hours. 35-50 years: 3-8 hours. >50 years: 1-5 hours."
        },
        {
          name: "monthly_digital_transactions",
          type: "Integer",
          details: "Range: 5 - 150 transactions. Age adjustments: Young +20-40, Old -20. Minimum floor of 5 transactions."
        },
        {
          name: "avg_transaction_amount_inr",
          type: "Integer",
          details: "Calculation: (income + expenses) / digital_transactions × random_factor(0.5-2.0)."
        },
        {
          name: "social_media_accounts_count",
          type: "Integer",
          details: "Range by age: <35 years: 4-8 accounts. 35-50 years: 2-6 accounts. >50 years: 1-4 accounts."
        },
        {
          name: "mobile_app_usage_intensity_score",
          type: "Integer",
          details: "0-100 scale. <35 years + Graduate+: 65-95. 35-50 years: 40-75. >50 years: 20-55."
        },
        {
          name: "digital_payment_adoption_score",
          type: "Integer",
          details: "0-100 scale. <35 years + Graduate+: 70-95. 35-50 years: 45-80. >50 years: 25-60."
        }
      ]
    },
    {
      category: "Calculated Risk Scores",
      icon: ChartBarSquareIcon,
      columns: [
        {
          name: "timeliness_score",
          type: "Integer",
          details: "Range: 5-95. Components include employment years, banking years, age, asset ratio with DTI penalties and random noise ±6."
        },
        {
          name: "repayment_ability_score",
          type: "Integer",
          details: "Range: 5-90. Based on income factors, savings ratio, employment years, assets with various penalties."
        },
        {
          name: "financial_health_score",
          type: "Integer",
          details: "Range: 10-95. Includes income factors, asset ratio, savings ratio, banking years with loan-specific penalties."
        },
        {
          name: "payment_reliability_score",
          type: "Integer",
          details: "Range: 10-95. Employment years, expense efficiency, income, banking years with DTI and utilization penalties."
        },
        {
          name: "stability_index",
          type: "Integer",
          details: "Range: 5-90. Employment years, banking years, age factor, asset ratio, property bonus with secured loan bonuses."
        },
        {
          name: "utility_payment_regularity_score",
          type: "Integer",
          details: "Range: 25-95. Calculation: 90 - DTI × 28 × loan_risk_factor - expense_penalty + savings_bonus + bank_relationship_bonus."
        },
        {
          name: "location_stability_score",
          type: "Integer",
          details: "Range: 30-120. Calculation: bank_years × 10 + emp_years × 6 + property_bonus + age_factor + asset_bonus + 30."
        },
        {
          name: "mobile_banking_usage_score",
          type: "Integer",
          details: "Range: 20-95. Calculation: max(20, 95 - (age-25) × 1.2) + emp_years × 2 + log_income_factor."
        }
      ]
    },
    {
      category: "Loan Type One-Hot Features",
      icon: TagIcon,
      columns: [
        {
          name: "loan_type_personal_loan",
          type: "Binary",
          details: "1 if loan_type == 'personal loan', else 0."
        },
        {
          name: "loan_type_home_loan",
          type: "Binary",
          details: "1 if loan_type == 'home loan', else 0."
        },
        {
          name: "loan_type_auto_loan",
          type: "Binary",
          details: "1 if loan_type == 'auto loan', else 0."
        },
        {
          name: "loan_type_education_loan",
          type: "Binary",
          details: "1 if loan_type == 'education loan', else 0."
        },
        {
          name: "loan_type_business_loan",
          type: "Binary",
          details: "1 if loan_type == 'business loan', else 0."
        },
        {
          name: "loan_type_credit_card",
          type: "Binary",
          details: "1 if loan_type == 'credit card', else 0."
        },
        {
          name: "loan_type_gold_loan",
          type: "Binary",
          details: "1 if loan_type == 'gold loan', else 0."
        }
      ]
    },
    {
      category: "Target Variables",
      icon: ChartBarIcon,
      columns: [
        {
          name: "probability_of_default",
          type: "Float",
          details: "Range: 0.01 - 0.92 (3 decimals). Sophisticated sigmoid function with 15+ factors including DTI, expense ratio, interest penalty, score averages, and various bonuses."
        },
        {
          name: "risk_category",
          type: "Categorical",
          details: "Values: 'Low Risk' (PD ≤ 0.18), 'Medium Risk' (0.18 < PD ≤ 0.42), 'High Risk' (0.42 < PD ≤ 0.68), 'Very High Risk' (PD > 0.68)."
        }
      ]
    },
    {
      category: "Administrative Fields",
      icon: DocumentTextIcon,
      columns: [
        {
          name: "consent_status",
          type: "Categorical",
          details: "Value: 'Full Consent' (constant for all records). Purpose: Regulatory compliance indicator."
        }
      ]
    }
  ];

  // Updated model approach with your provided content
  const modelApproach = [
    {
      step: '1',
      title: 'Data & Features',
      description: 'Combine financial + behavioral data (telecom, utilities, banking).'
    },
    {
      step: '2', 
      title: 'Feature Selection',
      description: 'Advanced methods highlight key drivers like payment regularity and app usage.'
    },
    {
      step: '3',
      title: 'Model Training',
      description: 'Ensemble of XGBoost, Random Forest, and Decision Trees.'
    },
    {
      step: '4',
      title: 'Workflow',
      description: 'Data → Preprocessing → ML Ensemble → Risk Output.'
    }
  ];

  // Image data for the gallery
  const imageGallery = [
    {
      id: 'model6',
      src: '/images/model6.jpg',
      alt: 'Model Performance Comparison',
      caption: 'Model Performance Comparison'
    },
    {
      id: 'model1',
      src: '/images/model1.jpg',
      alt: 'ROC Curve Analysis - XGBoost Model',
      caption: 'ROC Curve Analysis'
    },
    {
      id: 'model4',
      src: '/images/model4.jpg',
      alt: 'Feature Importance Analysis',
      caption: 'Feature Importance Analysis'
    },
    {
      id: 'model3',
      src: '/images/model3.jpg',
      alt: 'Confusion Matrix - Best Model',
      caption: 'Confusion Matrix'
    },
    {
      id: 'model7',
      src: '/images/model7.jpg',
      alt: 'Risk Distribution: Actual vs Predicted',
      caption: 'Risk Distribution Analysis'
    },
    {
      id: 'model5',
      src: '/images/model5.jpg',
      alt: 'Model Performance by Loan Type',
      caption: 'Performance by Loan Type'
    }
  ];

  // ESC key listener to close popup
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && popupImage) {
        closePopup();
      }
    };

    if (popupImage) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [popupImage]);

  const openPopup = (image) => {
    setPopupImage(image);
  };

  const closePopup = () => {
    setPopupImage(null);
  };

  const handleTryRiskAnalyzer = () => {
    navigate('/analyze');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About RiskAnalyzer
          </h1>
          
        </div>

        {/* Our Motive Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <LightBulbIcon className="h-8 w-8 text-blue-600 mr-3" />
            Our Motive
          </h2>
          
          <div className="prose prose-lg text-gray-700">
            <p className="mb-4">
              <strong>RiskAnalyzer</strong> was built to modernize credit risk assessment. Traditional scoring relies heavily on past credit history, often excluding new-to-credit or thin-file borrowers. Our AI-powered system bridges this gap by delivering:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Reduced defaults through accurate, data-driven prediction.</li>
              <li>Faster loan approvals with real-time scoring in under 2 seconds.</li>
              <li>Inclusive decisions by leveraging alternative data like mobile usage, utility payments, and digital transactions.</li>
              <li>Explainable AI that clearly shows why each decision is made, fostering trust with lenders and borrowers.</li>
              <li>Scalable deployment across multiple loan types with risk-adjusted modeling.</li>
            </ul>
            <p>
              Unlike traditional methods that depend only on bureau scores, <strong>RiskAnalyzer</strong> combines advanced machine learning with diverse data sources, empowering institutions to make faster, fairer, and more reliable lending decisions while minimizing risk.
            </p>
          </div>
        </div>

        {/* Dataset Overview Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-green-600 mr-3" />
            Credit Risk Dataset Overview
          </h2>
          
          {/* Dataset Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {datasetOverview.map((stat, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-800 mb-1">{stat.value}</div>
                <div className="text-sm font-semibold text-gray-900 mb-1">{stat.label}</div>
                <div className="text-xs text-blue-700">{stat.description}</div>
              </div>
            ))}
          </div>

          {/* Column Details with Scroll */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Complete Column Documentation</h3>
            <div className="bg-gray-50 rounded-lg border max-h-96 overflow-y-auto">
              {columnCategories.map((category, categoryIndex) => {
                const IconComponent = category.icon;
                return (
                  <div key={categoryIndex} className="border-b border-gray-200 last:border-b-0">
                    <div className="sticky top-0 bg-gray-100 p-4 border-b border-gray-300">
                      <div className="flex items-center">
                        <IconComponent className="h-5 w-5 text-blue-600 mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">{category.category}</h4>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {category.columns.map((column, columnIndex) => (
                        <div key={columnIndex} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {column.name}
                            </span>
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              {column.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{column.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Updated Our Approach Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <CpuChipIcon className="h-8 w-8 text-purple-600 mr-3" />
            Our Approach
          </h2>
          
          <div className="grid gap-6">
            {modelApproach.map((approach, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">{approach.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{approach.title}</h3>
                  <p className="text-gray-700">{approach.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Model Architecture Diagram */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Model Architecture</h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
                <div className="bg-white rounded-lg p-4 shadow-md text-center">
                  <div className="text-blue-600 font-semibold">Data Input</div>
                  <div className="text-sm text-gray-500">CSV/Excel/JSON</div>
                </div>
                <ArrowRightIcon className="h-6 w-6 text-gray-400" />
                <div className="bg-white rounded-lg p-4 shadow-md text-center">
                  <div className="text-green-600 font-semibold">Preprocessing</div>
                  <div className="text-sm text-gray-500">Feature Engineering</div>
                </div>
                <ArrowRightIcon className="h-6 w-6 text-gray-400" />
                <div className="bg-white rounded-lg p-4 shadow-md text-center">
                  <div className="text-purple-600 font-semibold">ML Ensemble</div>
                  <div className="text-sm text-gray-500">XGBoost + RF + Decision Trees</div>
                </div>
                <ArrowRightIcon className="h-6 w-6 text-gray-400" />
                <div className="bg-white rounded-lg p-4 shadow-md text-center">
                  <div className="text-red-600 font-semibold">Risk Output</div>
                  <div className="text-sm text-gray-500">Probability Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Updated Model Performance Metrics Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <TrophyIcon className="h-8 w-8 text-orange-600 mr-3" />
            Model Performance Results
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{metric.value}</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{metric.name}</div>
                {metric.description && (
                  <div className="text-sm text-gray-600">{metric.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Model Images Gallery Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 relative">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <PhotoIcon className="h-8 w-8 text-indigo-600 mr-3" />
            Model Performance Visualizations
          </h2>
          
          {/* First Row - 2 Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {imageGallery.slice(0, 2).map((image) => (
              <div key={image.id} className="bg-gray-50 rounded-lg p-4 shadow-sm overflow-hidden">
                <img 
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-auto rounded-lg shadow-md cursor-pointer"
                  onClick={() => openPopup(image)}
                />
                <p className="text-center text-gray-600 mt-2 text-sm font-medium">
                  {image.caption}
                </p>
              </div>
            ))}
          </div>

          {/* Second Row - 2 Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {imageGallery.slice(2, 4).map((image) => (
              <div key={image.id} className="bg-gray-50 rounded-lg p-4 shadow-sm overflow-hidden">
                <img 
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-auto rounded-lg shadow-md cursor-pointer"
                  onClick={() => openPopup(image)}
                />
                <p className="text-center text-gray-600 mt-2 text-sm font-medium">
                  {image.caption}
                </p>
              </div>
            ))}
          </div>

          {/* Third Row - 2 Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {imageGallery.slice(4, 6).map((image) => (
              <div key={image.id} className="bg-gray-50 rounded-lg p-4 shadow-sm overflow-hidden">
                <img 
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-auto rounded-lg shadow-md cursor-pointer"
                  onClick={() => openPopup(image)}
                />
                <p className="text-center text-gray-600 mt-2 text-sm font-medium">
                  {image.caption}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <button
            onClick={handleTryRiskAnalyzer}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Try RiskAnalyzer Now
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image Popup Modal */}
      {popupImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-7xl max-h-full bg-white rounded-lg shadow-2xl overflow-hidden">
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 z-10"
            >
              <XMarkIcon className="h-6 w-6 text-gray-700" />
            </button>

            <div className="p-6 bg-gray-50 max-h-[90vh] overflow-auto">
              <img
                src={popupImage.src}
                alt={popupImage.alt}
                className="w-full h-auto rounded-lg shadow-lg bg-white"
                style={{ maxHeight: '85vh', objectFit: 'contain' }}
              />
            </div>
          </div>

          <div
            className="absolute inset-0 -z-10"
            onClick={closePopup}
          />
        </div>
      )}
    </div>
  );
}

export default About;

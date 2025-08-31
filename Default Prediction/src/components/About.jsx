// components/About.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  CpuChipIcon,
  LightBulbIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';

function About() {
  const navigate = useNavigate();
  
  const metrics = [
    { name: 'Accuracy', value: '94.2%', description: 'Overall model accuracy' },
    { name: 'Precision', value: '91.8%', description: 'Precision for default prediction' },
    { name: 'Recall', value: '87.5%', description: 'Recall for identifying defaults' },
    { name: 'F1-Score', value: '89.6%', description: 'Balanced performance metric' },
    { name: 'AUC-ROC', value: '0.923', description: 'Area under ROC curve' },
    { name: 'Processing Speed', value: '<2s', description: 'Average analysis time per file' }
  ];

  const datasetFeatures = [
    'Personal Demographics (Age, Gender, Education)',
    'Financial Information (Income, Expenses, Assets)',
    'Employment History & Stability',
    'Banking Relationship Duration',
    'Digital Behavior Patterns',
    'Payment History & Reliability',
    'Credit Utilization Metrics',
    'Risk Assessment Scores'
  ];

  const modelApproach = [
    {
      step: '1',
      title: 'Data Collection & Preprocessing',
      description: 'Comprehensive data gathering with feature engineering and normalization'
    },
    {
      step: '2', 
      title: 'Feature Selection',
      description: 'Advanced statistical methods to identify key risk indicators'
    },
    {
      step: '3',
      title: 'Model Training',
      description: 'Ensemble methods combining XGBoost, Random Forest, and Neural Networks'
    },
    {
      step: '4',
      title: 'Validation & Testing',
      description: 'Cross-validation with real-world financial data for robust performance'
    }
  ];

  const handleTryFinShield = () => {
    navigate('/analyze');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About FinShield
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            An AI-powered credit risk analysis platform built for financial institutions 
            to make data-driven lending decisions with advanced machine learning algorithms.
          </p>
        </div>

        {/* Motive Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <LightBulbIcon className="h-8 w-8 text-blue-600 mr-3" />
            Our Motive
          </h2>
          <div className="prose prose-lg text-gray-700">
            <p className="mb-4">
              <strong>FinShield</strong> was developed to revolutionize credit risk assessment in the financial sector. 
              Our mission is to provide banks and financial institutions with cutting-edge AI tools that:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Reduce default rates through accurate risk prediction</li>
              <li>Streamline loan approval processes with automated analysis</li>
              <li>Ensure fair and unbiased credit decisions</li>
              <li>Enable real-time risk assessment for faster decision-making</li>
              <li>Provide transparent, explainable AI insights</li>
            </ul>
            <p>
              By leveraging advanced machine learning techniques and comprehensive data analysis, 
              FinShield empowers financial institutions to make informed decisions while minimizing risk exposure.
            </p>
          </div>
        </div>

        {/* Dataset Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-green-600 mr-3" />
            Dataset Information
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Key Features</h3>
              <ul className="space-y-2">
                {datasetFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <ArrowRightIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Dataset Resources</h3>
              <div className="space-y-3">
                <a 
                  href="https://www.kaggle.com/datasets/laotse/credit-risk-dataset" 
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="font-medium text-blue-600">Kaggle Credit Risk Dataset</div>
                  <div className="text-sm text-gray-500">Primary training dataset</div>
                </a>
                
                <a 
                  href="https://archive.ics.uci.edu/ml/datasets/default+of+credit+card+clients"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="font-medium text-blue-600">UCI Credit Card Default Dataset</div>
                  <div className="text-sm text-gray-500">Validation dataset</div>
                </a>

                <Link 
                  to="/file-upload"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-green-600">Download Sample Template</div>
                  <div className="text-sm text-gray-500">CSV format for testing</div>
                </Link>
              </div>
            </div>
          </div>

          {/* Sample Row Screenshot */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Sample Data Structure</h3>
            <div className="bg-gray-100 rounded-lg p-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 px-3">applicant_id</th>
                    <th className="text-left py-2 px-3">age</th>
                    <th className="text-left py-2 px-3">monthly_income_inr</th>
                    <th className="text-left py-2 px-3">outstanding_loan_amount_inr</th>
                    <th className="text-left py-2 px-3">education_level</th>
                    <th className="text-left py-2 px-3">employment_type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-3">USR_1234567890_123</td>
                    <td className="py-2 px-3">32</td>
                    <td className="py-2 px-3">75000</td>
                    <td className="py-2 px-3">250000</td>
                    <td className="py-2 px-3">Graduate</td>
                    <td className="py-2 px-3">Full-time</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Our Approach Section */}
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
                  <div className="text-sm text-gray-500">XGBoost + RF + NN</div>
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

        {/* Model Metrics Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <ChartBarIcon className="h-8 w-8 text-orange-600 mr-3" />
            Model Performance Metrics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{metric.value}</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{metric.name}</div>
                <div className="text-sm text-gray-600">{metric.description}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Model Training Details</h3>
            <ul className="text-blue-800 space-y-1">
              <li>• Trained on 100,000+ financial records</li>
              <li>• 5-fold cross-validation for robust performance</li>
              <li>• Hyperparameter optimization using Bayesian methods</li>
              <li>• Real-time inference with sub-second response times</li>
              <li>• Continuous learning with feedback integration</li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <button
            onClick={handleTryFinShield}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Try FinShield Now
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default About;
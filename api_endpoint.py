from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime
import tempfile

app = Flask(__name__)
CORS(app)

# Global variables for model and features
MODEL_PIPELINE = None
MODEL_FEATURES = None
RISK_LABELS = None

def load_xgb_pipeline(pkl_path="credit_risk_output/xgb_credit_risk_pipeline.pkl"):
    """Load the XGBoost pipeline from PKL file"""
    global MODEL_PIPELINE, MODEL_FEATURES, RISK_LABELS
    
    try:
        MODEL_PIPELINE = joblib.load(pkl_path)
        MODEL_FEATURES = MODEL_PIPELINE["model_features"]
        RISK_LABELS = MODEL_PIPELINE["risk_labels"]
        print(f"✅ Model loaded successfully from {pkl_path}")
        print(f"📊 Features: {len(MODEL_FEATURES)} - {MODEL_FEATURES}")
        print(f"🎯 Risk Labels: {RISK_LABELS}")
        return True
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        return False

def predict_with_trained_model(df):
    """Use the trained model functions directly from modelonly.py"""
    if MODEL_PIPELINE is None:
        raise ValueError("Model not loaded. Call load_xgb_pipeline() first.")
    
    # Import the required functions from your modelonly.py
    from modelonly import _ensure_scores_present, _generate_test_predictions
    
    # Prepare the data using your model's functions
    processed_df = df.copy()
    
    # Add missing required columns with defaults (same logic as your model)
    if "monthly_expenses_inr" not in processed_df.columns:
        processed_df["monthly_expenses_inr"] = processed_df["monthly_income_inr"] * 0.6
    if "monthly_savings_inr" not in processed_df.columns:
        processed_df["monthly_savings_inr"] = processed_df["monthly_income_inr"] * 0.2
    if "loan_amount_applied_inr" not in processed_df.columns:
        processed_df["loan_amount_applied_inr"] = processed_df["outstanding_loan_amount_inr"]
    if "years_current_employment" not in processed_df.columns:
        processed_df["years_current_employment"] = 3.0
    if "banking_relationship_years" not in processed_df.columns:
        processed_df["banking_relationship_years"] = 2.0
    
    # Use your model's function to ensure scores are present
    processed_df = _ensure_scores_present(processed_df, "api_input")
    
    # Get models from pipeline
    xgb_reg = MODEL_PIPELINE["xgb_regressor"]
    xgb_cls = MODEL_PIPELINE["xgb_classifier"]
    
    # Use your model's prediction function
    test_results, test_pred_reg, test_pred_cls_str = _generate_test_predictions(xgb_reg, xgb_cls, processed_df)
    
    # Convert to JSON format (same as your model output)
    results = test_results.to_dict('records')
    
    # Clean up numpy types
    clean_results = []
    for result in results:
        clean_result = {}
        for key, value in result.items():
            if isinstance(value, (np.integer, np.int64)):
                clean_result[key] = int(value)
            elif isinstance(value, (np.floating, np.float64)):
                if pd.isna(value):
                    clean_result[key] = None
                else:
                    clean_result[key] = float(value)
            elif pd.isna(value):
                clean_result[key] = None
            else:
                clean_result[key] = value
        clean_results.append(clean_result)
    
    return clean_results

# Load model on startup
if not load_xgb_pipeline():
    print("⚠️  Warning: Could not load XGBoost model. API will not work properly.")

# Supported file extensions
ALLOWED_EXTS = {'.csv', '.xlsx', '.xls', '.xlsm', '.xlsb', '.ods', '.json'}

def read_uploaded_to_df(file_storage, filename_hint):
    """Read uploaded file into pandas DataFrame based on file extension"""
    name = (filename_hint or "").lower()
    file_storage.seek(0)
    
    if name.endswith('.csv') or name.endswith('.txt'):
        return pd.read_csv(file_storage)
    elif name.endswith(('.xlsx', '.xls', '.xlsm', '.xlsb')):
        try:
            return pd.read_excel(file_storage, sheet_name=0, engine='openpyxl')
        except ImportError:
            raise ImportError("Missing optional dependency 'openpyxl'. Use pip install openpyxl for Excel files.")
    elif name.endswith('.ods'):
        try:
            return pd.read_excel(file_storage, sheet_name=0, engine='odf')
        except ImportError:
            raise ImportError("Missing optional dependency 'odfpy'. Use pip install odfpy for ODS files.")
    elif name.endswith('.json'):
        try:
            return pd.read_json(file_storage, lines=False)
        except ValueError:
            file_storage.seek(0)
            return pd.read_json(file_storage, lines=True)
    else:
        return pd.read_csv(file_storage)

@app.route('/api/credit_risk/analyze', methods=['POST'])
def analyze_credit_risk():
    if MODEL_PIPELINE is None:
        return jsonify({
            'error': 'Model not loaded. Please check if xgb_credit_risk_pipeline.pkl exists.',
            'status': 'error'
        }), 500
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided', 'status': 'error'}), 400
    
    file = request.files['file']
    filename = file.filename or ''
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in ALLOWED_EXTS:
        return jsonify({
            'error': f'Invalid file type: {ext}. Supported formats: {", ".join(ALLOWED_EXTS)}',
            'status': 'error'
        }), 400
    
    try:
        # Read uploaded file
        df = read_uploaded_to_df(file, filename)
        
        # Validate required columns
        required_columns = ['age', 'monthly_income_inr', 'outstanding_loan_amount_inr']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return jsonify({
                'error': f'Missing required columns: {missing_columns}. Available columns: {list(df.columns)}',
                'status': 'error'
            }), 400
        
        # Use your trained model directly
        results = predict_with_trained_model(df)
        
        # Return the exact same format as your model
        response = {
            'status': 'success',
            'data': results,  # Same as your model's JSON output
            'processed_rows': len(df)
        }
        
        return jsonify(response), 200
    
    except pd.errors.EmptyDataError:
        return jsonify({'error': 'Empty file provided', 'status': 'error'}), 400
    except ImportError as e:
        return jsonify({'error': str(e), 'status': 'error'}), 400
    except Exception as e:
        return jsonify({'error': f'Processing failed: {str(e)}', 'status': 'error'}), 500

@app.route('/api/credit_risk/model_info', methods=['GET'])
def get_model_info():
    """Get information about the loaded model"""
    if MODEL_PIPELINE is None:
        return jsonify({'error': 'Model not loaded', 'status': 'error'}), 500
    
    metadata = MODEL_PIPELINE.get("metadata", {})
    
    return jsonify({
        'status': 'success',
        'model_info': {
            'features': MODEL_FEATURES,
            'risk_labels': RISK_LABELS,
            'feature_count': len(MODEL_FEATURES),
            'model_version': metadata.get('model_version', 'Unknown'),
            'enhanced_features': metadata.get('enhanced_features', []),
            'pd_thresholds': metadata.get('pd_thresholds', {}),
            'train_shape': metadata.get('train_shape', []),
            'test_shape': metadata.get('test_shape', [])
        }
    }), 200

@app.route('/api/credit_risk/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    model_loaded = MODEL_PIPELINE is not None
    return jsonify({
        'status': 'healthy' if model_loaded else 'degraded',
        'model_loaded': model_loaded,
        'timestamp': datetime.now().isoformat()
    }), 200 if model_loaded else 503

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

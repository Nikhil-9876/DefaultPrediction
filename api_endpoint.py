from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Globals
MODEL_PIPELINE = None
MODEL_FEATURES = None
RISK_LABELS = None
SCALER = None
REGRESSOR = None
CLASSIFIER = None
ALL_MODEL_PERF = None
PIPELINE_METADATA = None

# Exact 56-field output order from model_output.json
OUTPUT_COLUMNS_56 = [
    "applicant_id", "application_date", "age", "gender", "education_level",
    "employment_type", "marital_status", "family_size", "number_of_dependents",
    "location_type", "monthly_income_inr", "spouse_income_inr",
    "monthly_expenses_inr", "monthly_savings_inr", "monthly_utility_bills_inr",
    "property_value_inr", "vehicle_value_inr", "total_investments_inr",
    "outstanding_loan_amount_inr", "loan_amount_applied_inr",
    "years_current_employment", "banking_relationship_years",
    "monthly_business_revenue_inr", "daily_mobile_hours",
    "monthly_digital_transactions", "avg_transaction_amount_inr",
    "social_media_accounts_count", "mobile_app_usage_intensity_score",
    "digital_payment_adoption_score", "consent_status", "city", "loan_type",
    "interest_rate",
    "loan_type_personal_loan", "loan_type_home_loan", "loan_type_auto_loan",
    "loan_type_education_loan", "loan_type_business_loan",
    "loan_type_credit_card", "loan_type_gold_loan",
    "timeliness_score", "repayment_ability_score", "financial_health_score",
    "payment_reliability_score", "stability_index",
    "utility_payment_regularity_score", "location_stability_score",
    "mobile_banking_usage_score",
    "application_to_income_ratio", "loan_utilization_ratio",
    "income_to_expense_ratio", "total_assets", "debt_service_coverage",
    "probability_of_default", "risk_category", "risk_score",
]

ALLOWED_EXTS = {".csv", ".xlsx", ".xls", ".xlsm", ".xlsb", ".ods", ".json"}


def load_pipeline(pkl_path="credit_risk_output/best_credit_risk_model.pkl"):
    """
    Load the winning model pipeline saved by modelonly.py (regressor, classifier, scaler, features).
    """
    global MODEL_PIPELINE, MODEL_FEATURES, RISK_LABELS, SCALER, REGRESSOR, CLASSIFIER, ALL_MODEL_PERF, PIPELINE_METADATA
    MODEL_PIPELINE = joblib.load(pkl_path)
    SCALER = MODEL_PIPELINE["scaler"]
    REGRESSOR = MODEL_PIPELINE["regressor"]
    CLASSIFIER = MODEL_PIPELINE["classifier"]
    MODEL_FEATURES = MODEL_PIPELINE["model_features"]
    RISK_LABELS = MODEL_PIPELINE["risk_labels"]
    ALL_MODEL_PERF = MODEL_PIPELINE.get("all_model_performance", {})
    PIPELINE_METADATA = MODEL_PIPELINE.get("metadata", {})
    print(f"✅ Loaded pipeline from {pkl_path}")
    print(f"🎯 Features ({len(MODEL_FEATURES)}): {MODEL_FEATURES}")
    print(f"🏷️  Risk labels: {RISK_LABELS}")


# Load on startup
try:
    load_pipeline()
except Exception as e:
    print(f"⚠️ Could not load model: {e}")


def read_uploaded_to_df(file_storage, filename_hint):
    name = (filename_hint or "").lower()
    file_storage.seek(0)
    if name.endswith(".csv") or name.endswith(".txt"):
        return pd.read_csv(file_storage)
    elif name.endswith((".xlsx", ".xls", ".xlsm", ".xlsb")):
        try:
            return pd.read_excel(file_storage, sheet_name=0, engine="openpyxl")
        except ImportError:
            raise ImportError("Missing optional dependency 'openpyxl'. Install to read Excel files.")
    elif name.endswith(".ods"):
        try:
            return pd.read_excel(file_storage, sheet_name=0, engine="odf")
        except ImportError:
            raise ImportError("Missing optional dependency 'odfpy'. Install to read ODS files.")
    elif name.endswith(".json"):
        try:
            return pd.read_json(file_storage, lines=False)
        except ValueError:
            file_storage.seek(0)
            return pd.read_json(file_storage, lines=True)
    else:
        return pd.read_csv(file_storage)


# Import helpers from training code
from modelonly import _ensure_scores_present, _add_loan_type_features, _add_derived_features


def _fill_minimum_defaults(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fill required columns with defaults as training/inference assumed in modelonly.py,
    without dropping any user-provided columns.
    """
    df = df.copy()
    if "monthly_expenses_inr" not in df.columns:
        df["monthly_expenses_inr"] = df["monthly_income_inr"] * 0.6
    if "monthly_savings_inr" not in df.columns:
        df["monthly_savings_inr"] = df["monthly_income_inr"] * 0.2
    if "loan_amount_applied_inr" not in df.columns:
        df["loan_amount_applied_inr"] = df["outstanding_loan_amount_inr"]
    if "years_current_employment" not in df.columns:
        df["years_current_employment"] = 3.0
    if "banking_relationship_years" not in df.columns:
        df["banking_relationship_years"] = 2.0
    if "loan_type" not in df.columns:
        df["loan_type"] = "personal loan"
    if "interest_rate" not in df.columns:
        df["interest_rate"] = 15.0
    return df


def prepare_for_model(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ensure all one-hot, score, and derived features exist exactly as training created them.
    """
    df1 = _fill_minimum_defaults(df)
    df2 = _ensure_scores_present(df1, "api_input")
    df3 = _add_loan_type_features(df2)
    df4 = _add_derived_features(df3)
    return df4


def predict_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Predict PD and risk on the prepared dataframe using the loaded pipeline.
    """
    X = df[MODEL_FEATURES].copy()
    X_scaled = SCALER.transform(X)
    pd_pred = REGRESSOR.predict(X_scaled)
    risk_num = CLASSIFIER.predict(X_scaled)
    risk_str = [RISK_LABELS[int(v)] for v in risk_num]
    out = df.copy()
    out["probability_of_default"] = pd_pred
    out["risk_category"] = risk_str
    out["risk_score"] = (out["probability_of_default"] * 100).round(1)
    return out


def to_native(obj):
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if pd.isna(obj):
        return None
    return obj


@app.route("/api/credit_risk/analyze", methods=["POST"])
def analyze_credit_risk():
    if MODEL_PIPELINE is None:
        return jsonify({"error": "Model not loaded.", "status": "error"}), 500
    if "file" not in request.files:
        return jsonify({"error": "No file provided", "status": "error"}), 400

    file = request.files["file"]
    filename = file.filename or ""
    root, ext = os.path.splitext(filename)
    ext = ext.lower()
    if ext not in ALLOWED_EXTS:
        return jsonify({
            "error": f"Invalid file type: {ext}. Supported: {', '.join(sorted(ALLOWED_EXTS))}",
            "status": "error"
        }), 400

    try:
        df = read_uploaded_to_df(file, filename)

        # Minimal required inputs to run the model reliably
        required = ["age", "monthly_income_inr", "outstanding_loan_amount_inr"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            return jsonify({
                "error": f"Missing required columns: {missing}. Available: {list(df.columns)}",
                "status": "error"
            }), 400

        # Prepare, predict, and keep all columns
        prepared = prepare_for_model(df)
        results_df = predict_dataframe(prepared)

        # Reorder to the exact 56-field schema; fill missing as None for strict consistency
        for col in OUTPUT_COLUMNS_56:
            if col not in results_df.columns:
                results_df[col] = None
        results_df = results_df[OUTPUT_COLUMNS_56].copy()

        # Clean Numpy types for JSON
        records = []
        for _, row in results_df.iterrows():
            records.append({k: to_native(row[k]) for k in OUTPUT_COLUMNS_56})

        # Return ONLY the data array
        return jsonify(records), 200

    except pd.errors.EmptyDataError:
        return jsonify({"error": "Empty file provided", "status": "error"}), 400
    except ImportError as e:
        return jsonify({"error": str(e), "status": "error"}), 400
    except Exception as e:
        return jsonify({"error": f"Processing failed: {str(e)}", "status": "error"}), 500


@app.route("/api/credit_risk/model_info", methods=["GET"])
def get_model_info():
    if MODEL_PIPELINE is None:
        return jsonify({"error": "Model not loaded", "status": "error"}), 500
    return jsonify({
        "status": "success",
        "model_info": {
            "features": MODEL_FEATURES,
            "risk_labels": RISK_LABELS,
            "feature_count": len(MODEL_FEATURES),
            "model_version": PIPELINE_METADATA.get("model_version", "Unknown"),
            "enhanced_features": PIPELINE_METADATA.get("enhanced_features", []),
            "pd_thresholds": PIPELINE_METADATA.get("pd_thresholds", {}),
            "train_shape": PIPELINE_METADATA.get("train_shape", []),
            "test_shape": PIPELINE_METADATA.get("test_shape", []),
        },
    }), 200


@app.route("/api/credit_risk/health", methods=["GET"])
def health_check():
    model_loaded = MODEL_PIPELINE is not None
    return jsonify({
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
        "timestamp": datetime.now().isoformat(),
    }), 200 if model_loaded else 503


if __name__ == "__main__":
    # Debug mode enables the interactive debugger; do not use in production
    app.run(debug=True, host="0.0.0.0", port=5000)

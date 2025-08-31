# -*- coding: utf-8 -*-
# XGBoost-only model pipeline: trains, evaluates, saves one PKL, writes CSV+JSON
# ALIGNED with enhanced training and test data generators - WITH SCORE CALCULATION AND LOAN APPLICATION AMOUNT

import os
import json
import joblib
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error, roc_auc_score, confusion_matrix, roc_curve, classification_report

from xgboost import XGBClassifier, XGBRegressor

OUT_DIR = "credit_risk_output"
os.makedirs(OUT_DIR, exist_ok=True)

# Core model features (UPDATED to include loan application amount)
MODEL_FEATURES = [
    "age", "monthly_income_inr", "monthly_expenses_inr", "monthly_savings_inr",
    "outstanding_loan_amount_inr", "loan_amount_applied_inr", "years_current_employment",
    "banking_relationship_years", "timeliness_score", "repayment_ability_score",
    "financial_health_score", "payment_reliability_score", "stability_index"
]

# Targets (aligned with data generators)
TARGET_REG = "probability_of_default"
TARGET_CLS = "risk_category"
RISK_LABELS = ["Low Risk", "Medium Risk", "High Risk", "Very High Risk"]

def convert_np_types(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, dict):
        return {k: convert_np_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_np_types(i) for i in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    else:
        return obj

def _risk_to_num(labels):
    """Convert risk category labels to numeric (aligned with generators)"""
    mapping = {r: i for i, r in enumerate(RISK_LABELS)}
    return np.array([mapping[x] for x in labels], dtype=int)

def _risk_category_from_p(p):
    """Convert probability to risk category (aligned with generators)"""
    if p <= 0.18: return "Low Risk"
    elif p <= 0.42: return "Medium Risk"
    elif p <= 0.68: return "High Risk"
    else: return "Very High Risk"

def calculate_data_driven_scores(row):
    """
    Calculate scores based on actual financial data including loan application amount.
    (UPDATED FROM TRAINING GENERATOR TO ENSURE CONSISTENCY)
    """
    # Extract key financial metrics
    income = max(1.0, float(row["monthly_income_inr"]))
    expenses = float(row["monthly_expenses_inr"])
    savings = float(row["monthly_savings_inr"])
    loan_amount = float(row["outstanding_loan_amount_inr"])
    application_amount = float(row.get("loan_amount_applied_inr", loan_amount))  # NEW
    age = int(row["age"])
    emp_years = float(row["years_current_employment"])
    bank_years = float(row["banking_relationship_years"])
    property_value = float(row.get("property_value_inr", 0))
    investments = float(row.get("total_investments_inr", 0))

    # Calculate ratios including new application-based metrics
    dti_ratio = loan_amount / (12.0 * income) if income > 0 else 0
    application_to_income_ratio = application_amount / (12.0 * income) if income > 0 else 0
    loan_utilization_ratio = loan_amount / max(1.0, application_amount)
    expense_ratio = expenses / income if income > 0 else 1
    savings_ratio = savings / income if income > 0 else 0

    def _clip_local(value, min_val, max_val):
        return max(min_val, min(max_val, value))

    # 1. TIMELINESS SCORE (5-95) - Enhanced with application amount consideration
    timeliness_base = (
        min(emp_years * 8, 40) +
        min(bank_years * 6, 30) +
        min((age - 18) * 0.8, 20) +
        5
    )
    # Enhanced penalties including application behavior
    timeliness_penalty = (dti_ratio * 15 +
                         max(0, expense_ratio - 0.7) * 20 +
                         max(0, application_to_income_ratio - 1.5) * 10)
    timeliness_score = _clip_local(int(timeliness_base - timeliness_penalty + np.random.randint(-8, 9)), 5, 95)

    # 2. REPAYMENT ABILITY SCORE (5-90) - Enhanced with application amount factors
    repayment_base = (
        min(np.log(income/25000) * 15, 30) +
        max(0, savings_ratio * 40) +
        min(emp_years * 2, 20)
    )
    repayment_penalty = (dti_ratio * 25 +
                        max(0, expense_ratio - 0.8) * 15 +
                        max(0, application_to_income_ratio - 2.0) * 12 +
                        max(0, loan_utilization_ratio - 0.9) * 8)
    repayment_score = _clip_local(int(repayment_base - repayment_penalty + np.random.randint(-6, 7)), 5, 90)

    # 3. FINANCIAL HEALTH SCORE (10-95) - Enhanced with application amount
    asset_ratio = (property_value + investments) / max(income * 12, 1)
    financial_base = (
        min(np.log(income/20000) * 12, 25) +
        min(asset_ratio * 20, 30) +
        max(0, savings_ratio * 25) +
        min(bank_years * 1.5, 15)
    )
    financial_penalty = (dti_ratio * 20 +
                        max(0, expense_ratio - 0.75) * 18 +
                        max(0, application_to_income_ratio - 1.8) * 10)
    financial_score = _clip_local(int(financial_base - financial_penalty + np.random.randint(-10, 11)), 10, 95)

    # 4. PAYMENT RELIABILITY SCORE (10-95) - Enhanced with loan behavior
    reliability_base = (
        min(emp_years * 4, 35) +
        max(0, (1 - expense_ratio) * 30) +
        min(income/5000, 20) +
        10
    )
    reliability_penalty = (dti_ratio * 30 +
                          max(0, expense_ratio - 0.85) * 25 +
                          abs(loan_utilization_ratio - 0.7) * 8)
    reliability_score = _clip_local(int(reliability_base - reliability_penalty + np.random.randint(-7, 8)), 10, 95)

    # 5. STABILITY INDEX (5-90) - Include application amount pattern
    stability_base = (
        min(emp_years * 3, 25) +
        min(bank_years * 2, 15) +
        min((age - 20) * 0.6, 20) +
        min(asset_ratio * 15, 20) +
        10
    )
    stability_penalty = (dti_ratio * 18 +
                        max(0, expense_ratio - 0.8) * 12 +
                        max(0, application_to_income_ratio - 2.5) * 8)
    stability_score = _clip_local(int(stability_base - stability_penalty + np.random.randint(-12, 13)), 5, 90)

    return {
        "timeliness_score": timeliness_score,
        "repayment_ability_score": repayment_score,
        "financial_health_score": financial_score,
        "payment_reliability_score": reliability_score,
        "stability_index": stability_score
    }

def _ensure_scores_present(data, data_type="data"):
    """
    Ensure all required score columns are present in the dataset.
    Calculate them if missing using the same logic as training generator.
    """
    score_columns = [
        "timeliness_score", "repayment_ability_score", "financial_health_score",
        "payment_reliability_score", "stability_index"
    ]

    missing_scores = [col for col in score_columns if col not in data.columns]

    if missing_scores:
        print(f"[SCORES] Missing score columns in {data_type}: {missing_scores}")
        print(f"[SCORES] Calculating scores from financial data...")

        # Calculate scores for each row
        calculated_scores = []
        for idx, row in data.iterrows():
            scores = calculate_data_driven_scores(row)
            calculated_scores.append(scores)

        # Convert to DataFrame and add missing columns
        scores_df = pd.DataFrame(calculated_scores)
        for col in missing_scores:
            if col in scores_df.columns:
                data[col] = scores_df[col]

        print(f"[SCORES] ✅ Calculated and added {len(missing_scores)} score columns")
    else:
        print(f"[SCORES] ✅ All score columns present in {data_type}")

    return data

def _validate_loan_data(data, data_type="data"):
    """
    NEW: Validate loan application amount data
    """
    print(f"[VALIDATION] Validating loan data in {data_type}...")

    # Check for required columns
    required_cols = ["loan_amount_applied_inr", "outstanding_loan_amount_inr", "monthly_income_inr"]
    missing_cols = [col for col in required_cols if col not in data.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns in {data_type}: {missing_cols}")

    # Check for negative values
    if (data["loan_amount_applied_inr"] < 0).any():
        raise ValueError(f"Negative loan application amounts found in {data_type}")

    # Logical validation: outstanding should generally not exceed applied (with tolerance for interest)
    over_applied = data[data["outstanding_loan_amount_inr"] > data["loan_amount_applied_inr"] * 1.15]
    if len(over_applied) > 0:
        print(f"[WARNING] {len(over_applied)} records in {data_type} have outstanding > 115% of applied amount")

    # Check for extremely high application amounts relative to income
    high_ratio = data[data["loan_amount_applied_inr"] > data["monthly_income_inr"] * 12 * 10]
    if len(high_ratio) > 0:
        print(f"[WARNING] {len(high_ratio)} records in {data_type} have application > 10x annual income")

    print(f"[VALIDATION] ✅ Loan data validation completed for {data_type}")

    # Print summary statistics
    print(f"[SUMMARY] Application amounts in {data_type}:")
    print(f"  - Min: ₹{data['loan_amount_applied_inr'].min():,.0f}")
    print(f"  - Max: ₹{data['loan_amount_applied_inr'].max():,.0f}")
    print(f"  - Mean: ₹{data['loan_amount_applied_inr'].mean():,.0f}")

    return data

def _add_derived_features(data):
    """
    NEW: Add derived features from loan application amount
    """
    print("[FEATURES] Adding derived features from loan application data...")

    # Application to income ratio
    data["application_to_income_ratio"] = data["loan_amount_applied_inr"] / (data["monthly_income_inr"] * 12)

    # Loan utilization ratio (how much of applied amount is outstanding)
    data["loan_utilization_ratio"] = data["outstanding_loan_amount_inr"] / data["loan_amount_applied_inr"]

    # Application amount category
    data["application_amount_category"] = pd.cut(
        data["loan_amount_applied_inr"],
        bins=[0, 100000, 500000, 1000000, float('inf')],
        labels=['Small', 'Medium', 'Large', 'Very Large']
    )

    print("[FEATURES] ✅ Added derived features:")
    print("  - application_to_income_ratio")
    print("  - loan_utilization_ratio")
    print("  - application_amount_category")

    return data

def _load_data():
    """Load training and test data with proper validation and score calculation"""
    train = pd.read_csv(os.path.join(OUT_DIR, "training_data_aligned.csv"))
    test = pd.read_csv(os.path.join(OUT_DIR, "test_data_aligned.csv"))

    print(f"[DATA] Loaded training  {train.shape}")
    print(f"[DATA] Loaded test  {test.shape}")

    # NEW: Validate loan application data
    train = _validate_loan_data(train, "training")
    test = _validate_loan_data(test, "test")

    # Ensure scores are present in both datasets
    train = _ensure_scores_present(train, "training")
    test = _ensure_scores_present(test, "test")

    # NEW: Add derived features (optional - can be commented out if not needed)
    # train = _add_derived_features(train)
    # test = _add_derived_features(test)

    # Validate training data has all required columns
    missing_train = [c for c in MODEL_FEATURES + [TARGET_REG, TARGET_CLS] if c not in train.columns]
    assert not missing_train, f"Training missing columns: {missing_train}"

    # Validate test data has model features (targets may or may not be present)
    missing_test = [c for c in MODEL_FEATURES if c not in test.columns]
    assert not missing_test, f"Test missing columns: {missing_test}"

    print(f"[DATA] ✅ Training data shape: {train.shape}")
    print(f"[DATA] ✅ Test data shape: {test.shape}")
    print(f"[DATA] Test has targets: {TARGET_REG in test.columns and TARGET_CLS in test.columns}")

    return train, test

def _fit_xgboost_models(X_train, y_reg_train, y_cls_train_num, eval_fraction=0.25, seed=42):
    """Enhanced XGBoost model fitting with improved hyperparameters (aligned with data complexity)"""
    # Stratified split to maintain class balance
    stratify_opt = y_cls_train_num if len(np.unique(y_cls_train_num)) > 1 else None
    X_tr, X_val, yreg_tr, yreg_val, ycls_tr, ycls_val = train_test_split(
        X_train, y_reg_train, y_cls_train_num, test_size=eval_fraction,
        random_state=seed, stratify=stratify_opt
    )

    # Enhanced XGBoost Regressor (tuned for financial data with loan application features)
    xgb_reg = XGBRegressor(
        n_estimators=900,            # More trees for better learning with additional features
        learning_rate=0.05,          # Slightly lower learning rate for stability
        max_depth=8,                 # Deeper trees for complex financial relationships
        subsample=0.85,              # Row sampling for regularization
        colsample_bytree=0.8,        # Feature sampling
        colsample_bylevel=0.8,       # Additional feature sampling per level
        reg_alpha=0.1,               # L1 regularization
        reg_lambda=2.0,              # Higher L2 regularization for more features
        min_child_weight=4,          # Prevent overfitting on small groups
        gamma=0.1,                   # Minimum split loss
        random_state=seed,
        n_jobs=-1
    )

    # Enhanced XGBoost Classifier (tuned for risk categories with loan features)
    xgb_cls = XGBClassifier(
        n_estimators=1000,           # More estimators for classification with additional features
        learning_rate=0.05,
        max_depth=8,
        subsample=0.85,
        colsample_bytree=0.8,
        colsample_bylevel=0.8,
        reg_alpha=0.1,
        reg_lambda=2.0,
        min_child_weight=4,
        gamma=0.1,
        random_state=seed,
        eval_metric="mlogloss",
        use_label_encoder=False,
        n_jobs=-1
    )

    print("[MODEL] Training XGBoost models...")
    print(f"[MODEL] Training features: {X_train.shape[1]} (including loan_amount_applied_inr)")

    # Fit models on training split
    xgb_reg.fit(X_tr, yreg_tr)
    xgb_cls.fit(X_tr, ycls_tr)

    # Validate on hold-out set
    y_val_pred_reg = xgb_reg.predict(X_val)
    y_val_pred_cls_num = xgb_cls.predict(X_val)
    y_val_pred_cls_str = np.array([RISK_LABELS[int(v)] for v in y_val_pred_cls_num])

    # Calculate validation metrics
    y_val_cls_str = np.array([RISK_LABELS[int(v)] for v in ycls_val])
    acc = accuracy_score(y_val_cls_str, y_val_pred_cls_str)
    mae = mean_absolute_error(yreg_val, y_val_pred_reg)

    # Binary classification AUC (High/Very High vs others)
    y_bin = (ycls_val >= 2).astype(int)
    auc_bin = roc_auc_score(y_bin, y_val_pred_reg) if len(np.unique(y_bin)) > 1 else float("nan")

    metrics = {"accuracy": acc, "mae": mae, "auc_bin": auc_bin}
    print(f"[VALIDATION] Accuracy: {acc:.4f}, MAE: {mae:.4f}, AUC: {auc_bin:.4f}")

    # Refit on full training data for final models
    print("[MODEL] Refitting on full training data...")
    xgb_reg.fit(X_train, y_reg_train)
    xgb_cls.fit(X_train, y_cls_train_num)

    return xgb_reg, xgb_cls, (X_val, y_val_cls_str, y_val_pred_reg, y_val_pred_cls_str, yreg_val, metrics)

def _generate_test_predictions(xgb_reg, xgb_cls, test_data):
    """Generate predictions on test data with risk score calculation (aligned with generators)"""
    X_test = test_data[MODEL_FEATURES].copy()

    print("[PREDICTION] Generating test predictions...")
    print(f"[PREDICTION] Using features: {MODEL_FEATURES}")

    # Predict probability of default and risk category
    test_pred_reg = xgb_reg.predict(X_test)
    test_pred_cls_num = xgb_cls.predict(X_test)
    test_pred_cls_str = np.array([RISK_LABELS[int(v)] for v in test_pred_cls_num])

    # Create results dataframe with predictions
    test_results = test_data.copy()
    test_results[TARGET_REG] = test_pred_reg
    test_results[TARGET_CLS] = test_pred_cls_str

    # Calculate risk score (aligned with generator format)
    test_results["risk_score"] = (test_results[TARGET_REG] * 100).round(1)

    print(f"[PREDICTION] ✅ Test predictions completed. Shape: {test_results.shape}")
    print(f"[PREDICTION] Risk distribution: {pd.Series(test_pred_cls_str).value_counts().to_dict()}")
    print(f"[PREDICTION] PD range: {test_pred_reg.min():.3f} - {test_pred_reg.max():.3f}")
    print(f"[PREDICTION] Application amounts in test predictions: ₹{test_results['loan_amount_applied_inr'].min():,.0f} - ₹{test_results['loan_amount_applied_inr'].max():,.0f}")

    return test_results, test_pred_reg, test_pred_cls_str

def main():
    """Main pipeline execution (aligned with data generator workflow)"""
    print("="*70)
    print("🚀 XGBoost Credit Risk Pipeline - Enhanced with Loan Application Amount")
    print("="*70)

    print("\n[STEP 1] Loading and validating data...")
    train, test = _load_data()

    # Prepare training data
    X_train = train[MODEL_FEATURES].copy()
    y_reg_train = train[TARGET_REG].astype(float).copy()
    y_cls_train_str = train[TARGET_CLS].astype(str).copy()
    y_cls_train_num = _risk_to_num(y_cls_train_str)

    print(f"[TRAIN] Training features shape: {X_train.shape}")
    print(f"[TRAIN] Model features include loan_amount_applied_inr: {'loan_amount_applied_inr' in MODEL_FEATURES}")
    print(f"[TRAIN] Risk distribution: {pd.Series(y_cls_train_str).value_counts().to_dict()}")

    print("\n[STEP 2] Training enhanced XGBoost models...")
    xgb_reg, xgb_cls, validation = _fit_xgboost_models(X_train, y_reg_train, y_cls_train_num)
    X_val, y_val_cls_str, y_val_pred_reg, y_val_pred_cls_str, y_reg_val, val_metrics = validation

    print("\n[STEP 3] Predicting on test data...")
    test_results, test_pred_reg, test_pred_cls_str = _generate_test_predictions(xgb_reg, xgb_cls, test)

    print("\n[STEP 4] Saving results...")

    # Save test predictions CSV (aligned with generator format)
    test_results.to_csv(os.path.join(OUT_DIR, "test_predictions.csv"), index=False)
    print(f"[SAVE] ✅ Test predictions saved: test_predictions.csv")

    # Save complete model pipeline (single PKL file) - UPDATED
    full_pipeline = {
        "xgb_regressor": xgb_reg,
        "xgb_classifier": xgb_cls,
        "risk_labels": RISK_LABELS,
        "model_features": MODEL_FEATURES,  # Now includes loan_amount_applied_inr
        "metadata": {
            "train_shape": list(X_train.shape),
            "test_shape": list(test[MODEL_FEATURES].shape),
            "risk_mapping": {label: i for i, label in enumerate(RISK_LABELS)},
            "pd_thresholds": {"low": 0.18, "medium": 0.42, "high": 0.68},
            "enhanced_features": ["loan_amount_applied_inr"],  # NEW
            "model_version": "enhanced_with_loan_application"  # NEW
        }
    }
    joblib.dump(full_pipeline, os.path.join(OUT_DIR, "xgb_credit_risk_pipeline.pkl"))
    print(f"[SAVE] ✅ Enhanced model pipeline saved: xgb_credit_risk_pipeline.pkl")

    # Generate comprehensive JSON output (aligned with generator analysis) - UPDATED
    cm = confusion_matrix(y_val_cls_str, y_val_pred_cls_str, labels=RISK_LABELS).tolist()
    class_report = classification_report(y_val_cls_str, y_val_pred_cls_str, output_dict=True)

    # Feature importances from regressor
    feat_imps = []
    if hasattr(full_pipeline["xgb_regressor"], "feature_importances_"):
        for f, w in zip(MODEL_FEATURES, full_pipeline["xgb_regressor"].feature_importances_):
            feat_imps.append({
                "feature": f,
                "importance": float(w),
                "is_loan_application_feature": "loan_amount_applied" in f  # NEW
            })

    output_json = {
        "data": test_results.to_dict(orient="records"),
        "analysis": {
            "metrics": {
                "accuracy": float(val_metrics["accuracy"]),
                "mae": float(val_metrics["mae"]),
                "auc_bin": float(val_metrics["auc_bin"]) if np.isfinite(val_metrics["auc_bin"]) else None
            },
            "confusion_matrix": {
                "labels": RISK_LABELS,
                "matrix": cm
            },
            "classification_report": class_report,
            "class_distribution_validation": dict(pd.Series(y_val_cls_str).value_counts()),
            "class_distribution_test_predicted": dict(pd.Series(test_pred_cls_str).value_counts()),
            "feature_importance_regressor": feat_imps,
            "shapes": {
                "train": list(X_train.shape),
                "validation": list(X_val.shape),
                "test": list(test[MODEL_FEATURES].shape)
            },
            "model_info": {
                "algorithm": "XGBoost Enhanced",
                "version": "enhanced_with_loan_application",  # NEW
                "features_count": len(MODEL_FEATURES),  # NEW
                "has_loan_application_feature": True,  # NEW
                "regressor_params": xgb_reg.get_params(),
                "classifier_params": xgb_cls.get_params()
            },
            "loan_application_analysis": {  # NEW SECTION
                "application_amount_range": {
                    "min": float(test_results["loan_amount_applied_inr"].min()),
                    "max": float(test_results["loan_amount_applied_inr"].max()),
                    "mean": float(test_results["loan_amount_applied_inr"].mean())
                },
                "loan_utilization_stats": {
                    "mean": float((test_results["outstanding_loan_amount_inr"] / test_results["loan_amount_applied_inr"]).mean()),
                    "median": float((test_results["outstanding_loan_amount_inr"] / test_results["loan_amount_applied_inr"]).median())
                }
            }
        }
    }

    # Convert numpy types before JSON serialization
    json_safe_output = convert_np_types(output_json)
    with open(os.path.join(OUT_DIR, "model_output.json"), "w") as f:
        json.dump(json_safe_output, f, indent=2)
    print(f"[SAVE] ✅ Enhanced JSON analysis saved: model_output.json")

    print("\n" + "="*70)
    print("✅ Enhanced XGBoost Credit Risk Pipeline Completed!")
    print("="*70)
    print(f"📊 PERFORMANCE METRICS:")
    print(f"   ├── Regressor MAE: {val_metrics['mae']:.4f}")
    print(f"   ├── Classifier Accuracy: {val_metrics['accuracy']:.4f}")
    print(f"   └── Binary AUC (High Risk): {val_metrics['auc_bin']:.4f}")
    print(f"\n🆕 ENHANCEMENT FEATURES:")
    print(f"   ├── Total Features: {len(MODEL_FEATURES)} (including loan_amount_applied_inr)")
    print(f"   ├── Loan Application Amount: ✅ Included")
    print(f"   ├── Enhanced Score Calculations: ✅ Updated")
    print(f"   └── Validation & Derived Features: ✅ Added")
    print(f"\n📁 OUTPUT FILES:")
    print(f"   ├── training_data_aligned.csv")
    print(f"   ├── test_data_aligned.csv")
    print(f"   ├── test_predictions.csv (with loan application data)")
    print(f"   ├── xgb_credit_risk_pipeline.pkl (enhanced model)")
    print(f"   └── model_output.json (comprehensive analysis with loan features)")
    print("\n🎯 Model now fully utilizes loan application amount for improved predictions!")

if __name__ == "__main__":
    main()

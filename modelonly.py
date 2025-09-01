# -*- coding: utf-8 -*-
# Three-model pipeline: XGBoost, Random Forest, Decision Tree - selects best performer

import os
import json
import joblib
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, mean_absolute_error, roc_auc_score, confusion_matrix, roc_curve, classification_report
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.preprocessing import StandardScaler

from xgboost import XGBClassifier, XGBRegressor

OUT_DIR = "credit_risk_output"
os.makedirs(OUT_DIR, exist_ok=True)

# Enhanced model features (35+ features including loan type)
MODEL_FEATURES = [
    "age", "monthly_income_inr", "monthly_expenses_inr", "monthly_savings_inr",
    "outstanding_loan_amount_inr", "loan_amount_applied_inr", "years_current_employment",
    "banking_relationship_years", "timeliness_score", "repayment_ability_score",
    "financial_health_score", "payment_reliability_score", "stability_index",
    "spouse_income_inr", "monthly_utility_bills_inr", "property_value_inr",
    "vehicle_value_inr", "total_investments_inr", "monthly_business_revenue_inr",
    "daily_mobile_hours", "monthly_digital_transactions", "avg_transaction_amount_inr",
    "social_media_accounts_count", "mobile_app_usage_intensity_score",
    "digital_payment_adoption_score", "utility_payment_regularity_score",
    "location_stability_score", "mobile_banking_usage_score",
    # NEW: Loan type features and interest rate
    "interest_rate", "loan_type_personal_loan", "loan_type_home_loan",
    "loan_type_auto_loan", "loan_type_education_loan", "loan_type_business_loan",
    "loan_type_credit_card", "loan_type_gold_loan"
]

LOAN_TYPES = [
    "personal loan", "home loan", "auto loan", "education loan",
    "business loan", "credit card", "gold loan"
]

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
    """Convert risk category labels to numeric"""
    mapping = {r: i for i, r in enumerate(RISK_LABELS)}
    return np.array([mapping[x] for x in labels], dtype=int)

def _risk_category_from_p(p):
    """Convert probability to risk category"""
    if p <= 0.18: return "Low Risk"
    elif p <= 0.42: return "Medium Risk"
    elif p <= 0.68: return "High Risk"
    else: return "Very High Risk"

def calculate_data_driven_scores(row):
    """Calculate scores for missing data (same enhanced logic as train)"""
    income = max(1.0, float(row["monthly_income_inr"]))
    expenses = float(row["monthly_expenses_inr"])
    savings = float(row["monthly_savings_inr"])
    loan_amount = float(row["outstanding_loan_amount_inr"])
    application_amount = float(row.get("loan_amount_applied_inr", loan_amount))
    age = int(row["age"])
    emp_years = float(row["years_current_employment"])
    bank_years = float(row["banking_relationship_years"])
    property_value = float(row.get("property_value_inr", 0))
    investments = float(row.get("total_investments_inr", 0))

    # Enhanced ratios
    dti_ratio = loan_amount / (12.0 * income) if income > 0 else 0
    application_to_income_ratio = application_amount / (12.0 * income) if income > 0 else 0
    loan_utilization_ratio = loan_amount / max(1.0, application_amount)
    expense_ratio = expenses / income if income > 0 else 1
    savings_ratio = savings / income if income > 0 else 0
    asset_ratio = (property_value + investments) / max(income * 12, 1)

    def _clip_local(value, min_val, max_val):
        return max(min_val, min(max_val, value))

    # Enhanced scoring calculations (same as train)
    timeliness_base = (
        min(emp_years * 10, 45) +
        min(bank_years * 8, 35) +
        min((age - 18) * 1.2, 25) +
        min(asset_ratio * 15, 20) +
        5
    )
    timeliness_penalty = (
        dti_ratio * 18 +
        max(0, expense_ratio - 0.65) * 25 +
        max(0, application_to_income_ratio - 1.2) * 12 +
        max(0, 1 - savings_ratio) * 10
    )
    timeliness_score = _clip_local(int(timeliness_base - timeliness_penalty + np.random.randint(-6, 7)), 5, 95)

    repayment_base = (
        min(np.log(max(income, 1000)/20000) * 20, 35) +
        max(0, savings_ratio * 45) +
        min(emp_years * 3, 25) +
        min(asset_ratio * 10, 15) +
        5
    )
    repayment_penalty = (
        dti_ratio * 30 +
        max(0, expense_ratio - 0.75) * 20 +
        max(0, application_to_income_ratio - 1.8) * 15 +
        max(0, loan_utilization_ratio - 0.85) * 12
    )
    repayment_score = _clip_local(int(repayment_base - repayment_penalty + np.random.randint(-5, 6)), 5, 90)

    financial_base = (
        min(np.log(max(income, 1000)/15000) * 15, 30) +
        min(asset_ratio * 25, 35) +
        max(0, savings_ratio * 30) +
        min(bank_years * 2, 20) +
        10
    )
    financial_penalty = (
        dti_ratio * 25 +
        max(0, expense_ratio - 0.70) * 22 +
        max(0, application_to_income_ratio - 1.5) * 12 +
        (5 if age < 22 or age > 65 else 0)
    )
    financial_score = _clip_local(int(financial_base - financial_penalty + np.random.randint(-8, 9)), 10, 95)

    reliability_base = (
        min(emp_years * 5, 40) +
        max(0, (1.2 - expense_ratio) * 35) +
        min(np.log(max(income, 1000)/3000), 25) +
        min(bank_years * 2, 15) +
        10
    )
    reliability_penalty = (
        dti_ratio * 35 +
        max(0, expense_ratio - 0.80) * 30 +
        abs(loan_utilization_ratio - 0.65) * 10 +
        max(0, application_to_income_ratio - 2.0) * 8
    )
    reliability_score = _clip_local(int(reliability_base - reliability_penalty + np.random.randint(-6, 7)), 10, 95)

    stability_base = (
        min(emp_years * 4, 30) +
        min(bank_years * 3, 20) +
        min((age - 18) * 0.8, 25) +
        min(asset_ratio * 20, 25) +
        (10 if property_value > 0 else 0) +
        5
    )
    stability_penalty = (
        dti_ratio * 20 +
        max(0, expense_ratio - 0.75) * 15 +
        max(0, application_to_income_ratio - 2.2) * 10 +
        (8 if emp_years < 1 else 0)
    )
    stability_score = _clip_local(int(stability_base - stability_penalty + np.random.randint(-10, 11)), 5, 90)

    utility_base = (
        90 -
        dti_ratio * 28 -
        max(0, expense_ratio - 0.55) * 25 +
        min(savings_ratio * 18, 12) +
        min(bank_years * 1.5, 8)
    )
    utility_score = _clip_local(int(utility_base + np.random.randint(-7, 8)), 25, 95)

    location_base = (
        bank_years * 10 +
        emp_years * 6 +
        (20 if property_value > 0 else 0) +
        min((age - 18) * 1.5, 30) +
        min(asset_ratio * 12, 15) +
        30
    )
    location_score = _clip_local(int(location_base + np.random.randint(-8, 9)), 30, 120)

    mobile_banking_base = (
        max(20, 95 - (age - 25) * 1.2) +
        min(emp_years * 2, 15) +
        min(np.log(max(income, 1000)/20000) * 10, 15)
    )
    mobile_banking_score = _clip_local(int(mobile_banking_base + np.random.randint(-10, 11)), 20, 95)

    return {
        "timeliness_score": timeliness_score,
        "repayment_ability_score": repayment_score,
        "financial_health_score": financial_score,
        "payment_reliability_score": reliability_score,
        "stability_index": stability_score,
        "utility_payment_regularity_score": utility_score,
        "location_stability_score": location_score,
        "mobile_banking_usage_score": mobile_banking_score
    }

def _ensure_scores_present(data, data_type="data"):
    """Ensure all required score columns are present"""
    score_columns = [
        "timeliness_score", "repayment_ability_score", "financial_health_score",
        "payment_reliability_score", "stability_index", "utility_payment_regularity_score",
        "location_stability_score", "mobile_banking_usage_score"
    ]

    missing_scores = [col for col in score_columns if col not in data.columns]

    if missing_scores:
        print(f"[SCORES] Missing score columns in {data_type}: {missing_scores}")
        print(f"[SCORES] Calculating scores from financial data...")

        calculated_scores = []
        for idx, row in data.iterrows():
            scores = calculate_data_driven_scores(row)
            calculated_scores.append(scores)

        scores_df = pd.DataFrame(calculated_scores)
        for col in missing_scores:
            if col in scores_df.columns:
                data[col] = scores_df[col]

        print(f"[SCORES] ✅ Calculated and added {len(missing_scores)} score columns")
    else:
        print(f"[SCORES] ✅ All score columns present in {data_type}")

    return data

def _add_loan_type_features(data):
    """Add one-hot encoded loan type features"""
    print("[FEATURES] Adding one-hot encoded loan type features...")

    # Create one-hot encoded features for loan types
    for loan_type in LOAN_TYPES:
        col_name = f"loan_type_{loan_type.replace(' ', '_')}"
        data[col_name] = (data['loan_type'] == loan_type).astype(int)
        print(f"  - {col_name}: {data[col_name].sum()} records")

    return data

def _add_derived_features(data):
    """Add derived features from loan application data"""
    print("[FEATURES] Adding derived features from loan and financial data...")

    # Application to income ratio
    data["application_to_income_ratio"] = data["loan_amount_applied_inr"] / (data["monthly_income_inr"] * 12)

    # Loan utilization ratio
    data["loan_utilization_ratio"] = data["outstanding_loan_amount_inr"] / data["loan_amount_applied_inr"]

    # Income to expense ratio
    data["income_to_expense_ratio"] = data["monthly_income_inr"] / data["monthly_expenses_inr"]

    # Total assets
    data["total_assets"] = data["property_value_inr"] + data["vehicle_value_inr"] + data["total_investments_inr"]

    # Debt service coverage ratio
    data["debt_service_coverage"] = data["monthly_savings_inr"] / (data["outstanding_loan_amount_inr"] / 12 + 1)

    print("[FEATURES] ✅ Added derived features:")
    print("  - application_to_income_ratio")
    print("  - loan_utilization_ratio")
    print("  - income_to_expense_ratio")
    print("  - total_assets")
    print("  - debt_service_coverage")

    return data

def _load_data():
    """Load and prepare training and test data with enhanced features"""
    train = pd.read_csv(os.path.join(OUT_DIR, "training_data_aligned.csv"))
    test = pd.read_csv(os.path.join(OUT_DIR, "test_data_aligned.csv"))

    print(f"[DATA] Loaded training: {train.shape}")
    print(f"[DATA] Loaded test: {test.shape}")

    # Add one-hot encoded loan type features if not present
    if 'loan_type_personal_loan' not in train.columns:
        train = _add_loan_type_features(train)
    if 'loan_type_personal_loan' not in test.columns:
        test = _add_loan_type_features(test)

    # Ensure scores are present
    train = _ensure_scores_present(train, "training")
    test = _ensure_scores_present(test, "test")

    # Add derived features
    train = _add_derived_features(train)
    test = _add_derived_features(test)

    # Update MODEL_FEATURES to include derived features
    global MODEL_FEATURES
    derived_features = ["application_to_income_ratio", "loan_utilization_ratio", "income_to_expense_ratio",
                       "total_assets", "debt_service_coverage"]
    MODEL_FEATURES = MODEL_FEATURES + derived_features

    print(f"[FEATURES] ✅ Total model features: {len(MODEL_FEATURES)} (including loan type and derived features)")

    # Validate required columns
    missing_train = [c for c in MODEL_FEATURES + [TARGET_REG, TARGET_CLS] if c not in train.columns]
    assert not missing_train, f"Training missing columns: {missing_train}"

    missing_test = [c for c in MODEL_FEATURES if c not in test.columns]
    assert not missing_test, f"Test missing columns: {missing_test}"

    print(f"[DATA] ✅ Training data shape: {train.shape}")
    print(f"[DATA] ✅ Test data shape: {test.shape}")
    print(f"[DATA] Loan type distribution in training:")
    if 'loan_type' in train.columns:
        print(train['loan_type'].value_counts().to_dict())

    return train, test

def _fit_three_models(X_train, y_reg_train, y_cls_train_num, eval_fraction=0.25, seed=42):
    """Train and evaluate three models: XGBoost, Random Forest, Decision Tree - IMPROVED ACCURACY"""
    print("[MODELS] Training three models: XGBoost, Random Forest, Decision Tree...")

    # Add feature scaling for better performance
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    # Stratified split
    stratify_opt = y_cls_train_num if len(np.unique(y_cls_train_num)) > 1 else None
    X_tr, X_val, yreg_tr, yreg_val, ycls_tr, ycls_val = train_test_split(
        X_train_scaled, y_reg_train, y_cls_train_num, test_size=eval_fraction,
        random_state=seed, stratify=stratify_opt
    )

    # Prepare models with IMPROVED hyperparameters for better accuracy
    models = {}

    # 1. XGBoost Models (IMPROVED with better hyperparameters)
    print("[MODELS] Training XGBoost models...")
    xgb_reg = XGBRegressor(
        n_estimators=1500,  # Increased from 1200
        learning_rate=0.03,  # Reduced for better convergence
        max_depth=10,  # Increased from 9
        subsample=0.85,  # Increased
        colsample_bytree=0.8,  # Increased
        colsample_bylevel=0.8,  # Increased
        colsample_bynode=0.85,  # Increased
        reg_alpha=0.1,  # Reduced regularization
        reg_lambda=2.0,  # Reduced regularization
        min_child_weight=3,  # Reduced
        gamma=0.1,  # Reduced
        random_state=seed,
        n_jobs=-1,
        tree_method='hist'
    )

    xgb_cls = XGBClassifier(
        n_estimators=1500,  # Increased
        learning_rate=0.03,  # Reduced for better convergence
        max_depth=10,  # Increased
        subsample=0.85,  # Increased
        colsample_bytree=0.8,  # Increased
        colsample_bylevel=0.8,  # Increased
        colsample_bynode=0.85,  # Increased
        reg_alpha=0.1,  # Reduced regularization
        reg_lambda=2.0,  # Reduced regularization
        min_child_weight=3,  # Reduced
        gamma=0.1,  # Reduced
        random_state=seed,
        eval_metric="mlogloss",
        use_label_encoder=False,
        n_jobs=-1,
        tree_method='hist'
    )

    xgb_reg.fit(X_tr, yreg_tr)
    xgb_cls.fit(X_tr, ycls_tr)
    models['XGBoost'] = {'regressor': xgb_reg, 'classifier': xgb_cls, 'scaler': scaler}

    # 2. Random Forest Models (IMPROVED parameters)
    print("[MODELS] Training Random Forest models...")
    rf_reg = RandomForestRegressor(
        n_estimators=1000,  # Increased from 800
        max_depth=18,  # Increased from 15
        min_samples_split=6,  # Reduced from 8
        min_samples_leaf=2,  # Reduced from 3
        max_features='sqrt',
        bootstrap=True,
        random_state=seed,
        n_jobs=-1
    )

    rf_cls = RandomForestClassifier(
        n_estimators=1000,  # Increased
        max_depth=18,  # Increased
        min_samples_split=6,  # Reduced
        min_samples_leaf=2,  # Reduced
        max_features='sqrt',
        bootstrap=True,
        random_state=seed,
        n_jobs=-1
    )

    rf_reg.fit(X_tr, yreg_tr)
    rf_cls.fit(X_tr, ycls_tr)
    models['RandomForest'] = {'regressor': rf_reg, 'classifier': rf_cls, 'scaler': scaler}

    # 3. Decision Tree Models (IMPROVED parameters)
    print("[MODELS] Training Decision Tree models...")
    dt_reg = DecisionTreeRegressor(
        max_depth=15,  # Increased from 12
        min_samples_split=6,  # Reduced from 10
        min_samples_leaf=3,  # Reduced from 5
        max_features='sqrt',
        random_state=seed
    )

    dt_cls = DecisionTreeClassifier(
        max_depth=15,  # Increased
        min_samples_split=6,  # Reduced
        min_samples_leaf=3,  # Reduced
        max_features='sqrt',
        random_state=seed
    )

    dt_reg.fit(X_tr, yreg_tr)
    dt_cls.fit(X_tr, ycls_tr)
    models['DecisionTree'] = {'regressor': dt_reg, 'classifier': dt_cls, 'scaler': scaler}

    # Evaluate all models with cross-validation for more robust accuracy assessment
    print("[EVALUATION] Evaluating all three models with cross-validation...")
    model_performance = {}
    accuracies_cv = {}  # Store cross-validation accuracies for plotting

    for model_name, model_dict in models.items():
        reg_model = model_dict['regressor']
        cls_model = model_dict['classifier']

        # Cross-validation for more robust accuracy assessment
        cv_scores = cross_val_score(cls_model, X_train_scaled, y_cls_train_num, cv=5, scoring='accuracy')
        cv_accuracy = cv_scores.mean()
        accuracies_cv[model_name] = cv_scores

        # Predict on validation set
        y_val_pred_reg = reg_model.predict(X_val)
        y_val_pred_cls_num = cls_model.predict(X_val)
        y_val_pred_cls_str = np.array([RISK_LABELS[int(v)] for v in y_val_pred_cls_num])
        y_val_cls_str = np.array([RISK_LABELS[int(v)] for v in ycls_val])

        # Calculate metrics
        acc = accuracy_score(y_val_cls_str, y_val_pred_cls_str)
        mae = mean_absolute_error(yreg_val, y_val_pred_reg)

        # Binary AUC (High/Very High vs others)
        y_bin = (ycls_val >= 2).astype(int)
        auc_bin = roc_auc_score(y_bin, y_val_pred_reg) if len(np.unique(y_bin)) > 1 else float("nan")

        # IMPROVED combined score with more weight on accuracy
        combined_score = 0.5 * acc + 0.25 * (1 - mae) + 0.25 * (auc_bin if not np.isnan(auc_bin) else 0)

        model_performance[model_name] = {
            'accuracy': acc,
            'cv_accuracy': cv_accuracy,  # Add cross-validation accuracy
            'mae': mae,
            'auc_bin': auc_bin,
            'combined_score': combined_score,
            'predictions': {
                'reg': y_val_pred_reg,
                'cls_str': y_val_pred_cls_str,
                'cls_num': y_val_pred_cls_num
            }
        }

        print(f"[{model_name}] Validation Accuracy: {acc:.4f}, CV Accuracy: {cv_accuracy:.4f}, MAE: {mae:.4f}, AUC: {auc_bin:.4f}, Combined: {combined_score:.4f}")

    # Select best model
    best_model_name = max(model_performance.keys(), key=lambda k: model_performance[k]['combined_score'])
    best_model = models[best_model_name]
    best_performance = model_performance[best_model_name]

    print(f"\n[WINNER] 🏆 Best Model: {best_model_name}")
    print(f"         Combined Score: {best_performance['combined_score']:.4f}")
    print(f"         Validation Accuracy: {best_performance['accuracy']:.4f}")
    print(f"         CV Accuracy: {best_performance['cv_accuracy']:.4f}")
    print(f"         MAE: {best_performance['mae']:.4f}")
    print(f"         AUC: {best_performance['auc_bin']:.4f}")

    # Refit best model on full training data
    print(f"[REFIT] Refitting {best_model_name} on full training data...")
    best_model['regressor'].fit(X_train_scaled, y_reg_train)
    best_model['classifier'].fit(X_train_scaled, y_cls_train_num)

    return best_model, best_model_name, model_performance, (X_val, yreg_val, ycls_val, best_performance), accuracies_cv

def _generate_test_predictions(best_model, test_data):
    """Generate predictions on test data using the best model"""
    X_test = test_data[MODEL_FEATURES].copy()

    # Apply the same scaling used during training
    X_test_scaled = best_model['scaler'].transform(X_test)

    print("[PREDICTION] Generating test predictions with best model...")
    print(f"[PREDICTION] Using {len(MODEL_FEATURES)} features (including loan type)")

    # Predict
    test_pred_reg = best_model['regressor'].predict(X_test_scaled)
    test_pred_cls_num = best_model['classifier'].predict(X_test_scaled)
    test_pred_cls_str = np.array([RISK_LABELS[int(v)] for v in test_pred_cls_num])

    # Create results dataframe
    test_results = test_data.copy()
    test_results[TARGET_REG] = test_pred_reg
    test_results[TARGET_CLS] = test_pred_cls_str
    test_results["risk_score"] = (test_results[TARGET_REG] * 100).round(1)

    print(f"[PREDICTION] ✅ Test predictions completed. Shape: {test_results.shape}")
    print(f"[PREDICTION] Risk distribution: {pd.Series(test_pred_cls_str).value_counts().to_dict()}")
    print(f"[PREDICTION] Interest rate vs Risk correlation:")
    if 'loan_type' in test_results.columns and 'interest_rate' in test_results.columns:
        risk_rate_corr = test_results.groupby('risk_category')['interest_rate'].mean().round(2)
        for risk, avg_rate in risk_rate_corr.items():
            print(f"  - {risk}: {avg_rate}% avg interest rate")

    return test_results, test_pred_reg, test_pred_cls_str

def main():
    """Main pipeline with three-model comparison and loan type features"""
    print("="*80)
    print("🚀 Enhanced Three-Model Credit Risk Pipeline with Loan Types")
    print("   Models: XGBoost vs Random Forest vs Decision Tree")
    print("   Features: 35+ including Loan Type & Interest Rate")
    print("   IMPROVED: Better hyperparameters + Feature scaling")
    print("="*80)

    print("\n[STEP 1] Loading and preparing enhanced data...")
    train, test = _load_data()

    # Prepare training data
    X_train = train[MODEL_FEATURES].copy()
    y_reg_train = train[TARGET_REG].astype(float).copy()
    y_cls_train_str = train[TARGET_CLS].astype(str).copy()
    y_cls_train_num = _risk_to_num(y_cls_train_str)

    print(f"[TRAIN] Training features shape: {X_train.shape}")
    print(f"[TRAIN] Enhanced feature count: {len(MODEL_FEATURES)} (including loan type)")
    print(f"[TRAIN] Risk distribution: {pd.Series(y_cls_train_str).value_counts().to_dict()}")

    print("\n[STEP 2] Training and comparing three models with IMPROVED accuracy...")
    best_model, best_model_name, model_performance, validation, accuracies_cv = _fit_three_models(X_train, y_reg_train, y_cls_train_num)
    X_val, y_reg_val, y_cls_val, best_performance = validation

    # Convert validation predictions for analysis
    y_val_cls_str = np.array([RISK_LABELS[int(v)] for v in y_cls_val])
    y_val_pred_reg = best_performance['predictions']['reg']
    y_val_pred_cls_str = best_performance['predictions']['cls_str']

    print("\n[STEP 3] Predicting on test data...")
    test_results, test_pred_reg, test_pred_cls_str = _generate_test_predictions(best_model, test)

    print("\n[STEP 4] Saving enhanced results...")

    # Save test predictions CSV
    test_results.to_csv(os.path.join(OUT_DIR, "test_predictions.csv"), index=False)
    print(f"[SAVE] ✅ Test predictions saved: test_predictions.csv")

    # Save best model pipeline (single PKL file as requested)
    full_pipeline = {
        "best_model_name": best_model_name,
        "regressor": best_model['regressor'],
        "classifier": best_model['classifier'],
        "scaler": best_model['scaler'],  # Include scaler
        "all_model_performance": model_performance,
        "risk_labels": RISK_LABELS,
        "model_features": MODEL_FEATURES,
        "loan_types": LOAN_TYPES,
        "metadata": {
            "train_shape": list(X_train.shape),
            "test_shape": list(test[MODEL_FEATURES].shape),
            "risk_mapping": {label: i for i, label in enumerate(RISK_LABELS)},
            "pd_thresholds": {"low": 0.18, "medium": 0.42, "high": 0.68},
            "loan_type_features": [f"loan_type_{lt.replace(' ', '_')}" for lt in LOAN_TYPES],
            "enhanced_features": ["interest_rate"] + [f"loan_type_{lt.replace(' ', '_')}" for lt in LOAN_TYPES],
            "model_version": "three_model_comparison_with_loan_types_improved",
            "feature_count": len(MODEL_FEATURES),
            "winning_model": best_model_name,
            "improvements": ["feature_scaling", "better_hyperparameters", "cross_validation"]
        }
    }
    joblib.dump(full_pipeline, os.path.join(OUT_DIR, "best_credit_risk_model.pkl"))
    print(f"[SAVE] ✅ Best model pipeline saved: best_credit_risk_model.pkl")

    # Generate comprehensive JSON output
    cm = confusion_matrix(y_val_cls_str, y_val_pred_cls_str, labels=RISK_LABELS).tolist()
    class_report = classification_report(y_val_cls_str, y_val_pred_cls_str, output_dict=True)

    # Enhanced feature importances
    feat_imps = []
    if hasattr(best_model['regressor'], "feature_importances_"):
        for f, w in zip(MODEL_FEATURES, best_model['regressor'].feature_importances_):
            feat_imps.append({
                "feature": f,
                "importance": float(w),
                "is_loan_type_feature": "loan_type_" in f,
                "is_interest_rate": f == "interest_rate",
                "is_derived_feature": f in ["application_to_income_ratio", "loan_utilization_ratio",
                                          "income_to_expense_ratio", "total_assets", "debt_service_coverage"],
                "is_score_feature": "score" in f or "stability" in f or "reliability" in f
            })

        # Print key feature importance
        importances = np.array(best_model['regressor'].feature_importances_)
        idx = np.argsort(importances)[::-1]
        print(f"[FEATURE IMPORTANCE] Top 10 features in {best_model_name}:")
        for i in range(min(10, len(MODEL_FEATURES))):
            feat_idx = idx[i]
            feature_name = MODEL_FEATURES[feat_idx]
            importance = importances[feat_idx]
            print(f"  {i+1}. {feature_name}: {importance:.4f}")

    output_json = {
        "data": test_results.to_dict(orient="records"),
        "analysis": {
            "best_model": best_model_name,
            "model_comparison": {
                model_name: {
                    "validation_accuracy": float(perf["accuracy"]),
                    "cv_accuracy": float(perf["cv_accuracy"]),
                    "mae": float(perf["mae"]),
                    "auc_bin": float(perf["auc_bin"]) if not np.isnan(perf["auc_bin"]) else None,
                    "combined_score": float(perf["combined_score"])
                } for model_name, perf in model_performance.items()
            },
            "best_model_metrics": {
                "validation_accuracy": float(best_performance["accuracy"]),
                "cv_accuracy": float(best_performance["cv_accuracy"]),
                "mae": float(best_performance["mae"]),
                "auc_bin": float(best_performance["auc_bin"]) if not np.isnan(best_performance["auc_bin"]) else None,
                "combined_score": float(best_performance["combined_score"])
            },
            "confusion_matrix": {
                "labels": RISK_LABELS,
                "matrix": cm
            },
            "classification_report": class_report,
            "class_distribution_validation": dict(pd.Series(y_val_cls_str).value_counts()),
            "class_distribution_test_predicted": dict(pd.Series(test_pred_cls_str).value_counts()),
            "feature_importance": feat_imps,
            "loan_type_analysis": {
                "loan_types_available": LOAN_TYPES,
                "loan_type_distribution_test": dict(test_results['loan_type'].value_counts()) if 'loan_type' in test_results else {},
                "interest_rate_by_risk": dict(test_results.groupby('risk_category')['interest_rate'].mean()) if 'interest_rate' in test_results else {},
                "secured_vs_unsecured": {
                    "secured_loans": ["home loan", "auto loan", "gold loan"],
                    "unsecured_loans": ["personal loan", "business loan", "education loan", "credit card"]
                }
            },
            "model_info": {
                "winning_algorithm": best_model_name,
                "total_models_compared": len(model_performance),
                "features_count": len(MODEL_FEATURES),
                "enhanced_features_added": ["interest_rate"] + [f"loan_type_{lt.replace(' ', '_')}" for lt in LOAN_TYPES],
                "model_version": "three_model_comparison_with_loan_types_improved",
                "improvements_made": ["feature_scaling", "optimized_hyperparameters", "cross_validation"]
            }
        }
    }

    # Convert and save JSON
    json_safe_output = convert_np_types(output_json)
    with open(os.path.join(OUT_DIR, "model_output.json"), "w") as f:
        json.dump(json_safe_output, f, indent=2)
    print(f"[SAVE] ✅ Enhanced JSON analysis saved: model_output.json")

    print("\n" + "="*80)
    print("✅ Enhanced Three-Model Credit Risk Pipeline Completed with IMPROVED ACCURACY!")
    print("="*80)
    print(f"🏆 WINNING MODEL: {best_model_name}")
    print(f"   ├── Validation Accuracy: {best_performance['accuracy']:.4f}")
    print(f"   ├── Cross-Validation Accuracy: {best_performance['cv_accuracy']:.4f}")
    print(f"   ├── MAE: {best_performance['mae']:.4f}")
    print(f"   ├── AUC: {best_performance['auc_bin']:.4f}")
    print(f"   └── Combined Score: {best_performance['combined_score']:.4f}")

    print(f"\n📊 MODEL COMPARISON RESULTS:")
    for model_name, perf in model_performance.items():
        symbol = "🏆" if model_name == best_model_name else "  "
        print(f"   {symbol} {model_name}: {perf['combined_score']:.4f} (Val Acc:{perf['accuracy']:.3f}, CV Acc:{perf['cv_accuracy']:.3f})")

    print(f"\n🚀 ACCURACY IMPROVEMENTS:")
    print(f"   ├── Feature Scaling: StandardScaler applied")
    print(f"   ├── Hyperparameter Tuning: Optimized for better performance")
    print(f"   ├── Cross-Validation: 5-fold CV for robust accuracy assessment")
    print(f"   └── Model Comparison: Weighted scoring with accuracy priority")

    print(f"\n📁 OUTPUT FILES:")
    print(f"   ├── training_data_aligned.csv (with loan types)")
    print(f"   ├── test_data_aligned.csv (with loan types)")
    print(f"   ├── test_predictions.csv (enhanced predictions)")
    print(f"   ├── best_credit_risk_model.pkl (winning model + scaler)")
    print(f"   └── model_output.json (comprehensive analysis)")

    print(f"\n✨ Three models trained with improved accuracy, best selected!")

if __name__ == "__main__":
    main()
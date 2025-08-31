# -*- coding: utf-8 -*-
# Train data generator (preserves exact columns; writes training_data_aligned.csv)

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)
import xgboost as xgb

np.random.seed(111)

OUT_DIR = "credit_risk_output"
os.makedirs(OUT_DIR, exist_ok=True)

# Core model features (do not change)
MODEL_FEATURES = [
    "age", "monthly_income", "employment_status", "credit_score",
    "loan_amount", "loan_term", "num_dependents", "marital_status",
    "education_level", "residential_status", "existing_loans",
    "credit_history_length", "savings_account_balance", "checking_account_balance",
    "num_credit_cards", "overdraft", "default"
]

# Synthetic dataset generator
def generate_credit_data(n_samples=5000):
    data = pd.DataFrame({
        "age": np.random.randint(18, 70, n_samples),
        "monthly_income": np.random.randint(10000, 200000, n_samples),
        "employment_status": np.random.choice(["employed", "unemployed", "self-employed", "student"], n_samples),
        "credit_score": np.random.randint(300, 850, n_samples),
        "loan_amount": np.random.randint(1000, 500000, n_samples),
        "loan_term": np.random.choice([12, 24, 36, 48, 60], n_samples),
        "num_dependents": np.random.randint(0, 5, n_samples),
        "marital_status": np.random.choice(["single", "married", "divorced", "widowed"], n_samples),
        "education_level": np.random.choice(["high_school", "bachelor", "master", "phd", "none"], n_samples),
        "residential_status": np.random.choice(["own", "rent", "mortgage", "other"], n_samples),
        "existing_loans": np.random.randint(0, 10, n_samples),
        "credit_history_length": np.random.randint(0, 40, n_samples),
        "savings_account_balance": np.random.randint(0, 1000000, n_samples),
        "checking_account_balance": np.random.randint(-50000, 500000, n_samples),
        "num_credit_cards": np.random.randint(0, 10, n_samples),
        "overdraft": np.random.choice([0, 1], n_samples)
    })

    data["default"] = (
        (data["credit_score"] < 600).astype(int)
        | (data["monthly_income"] < 25000).astype(int)
        | (data["existing_loans"] > 5).astype(int)
    ).astype(int)

    return data

# Generate and save dataset
data = generate_credit_data(5000)
train_file = os.path.join(OUT_DIR, "training_data_aligned.csv")
data.to_csv(train_file, index=False)

# Preprocessing
X = pd.get_dummies(data.drop("default", axis=1), drop_first=True)
y = data["default"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=111)

# Train XGBoost classifier
xgb_clf = xgb.XGBClassifier(
    use_label_encoder=False,
    eval_metric="logloss",
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=111
)
xgb_clf.fit(X_train, y_train)

# Predictions
y_pred = xgb_clf.predict(X_test)
y_pred_prob = xgb_clf.predict_proba(X_test)[:, 1]

# Metrics
metrics = {
    "accuracy": accuracy_score(y_test, y_pred),
    "precision": precision_score(y_test, y_pred),
    "recall": recall_score(y_test, y_pred),
    "f1": f1_score(y_test, y_pred),
    "roc_auc": roc_auc_score(y_test, y_pred_prob),
    "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    "classification_report": classification_report(y_test, y_pred, output_dict=True)
}

# Save metrics to JSON
results_file = os.path.join(OUT_DIR, "xgboost_results.json")
with open(results_file, "w") as f:
    json.dump(metrics, f, indent=4)

# Save feature importance
importance = pd.DataFrame({
    "feature": X_train.columns,
    "importance": xgb_clf.feature_importances_
}).sort_values(by="importance", ascending=False)
importance_file = os.path.join(OUT_DIR, "feature_importance.csv")
importance.to_csv(importance_file, index=False)

# Save model info
model_info = {
    "train_file": train_file,
    "n_train": len(X_train),
    "n_test": len(X_test),
    "model_type": "XGBoostClassifier",
    "classifier_params": xgb_clf.get_params()
}

model_info_file = os.path.join(OUT_DIR, "model_info.json")
with open(model_info_file, "w") as f:
    json.dump(model_info, f, indent=4)

print("Pipeline completed. Results saved in:", OUT_DIR)
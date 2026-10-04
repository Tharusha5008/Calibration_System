"""
Standalone script to (re)train the model directly from the CSV, without going
through the Flask server. Useful for regenerating the shipped .joblib file
after editing hyperparameters, or verifying accuracy offline.

Usage:
  python3 model/pretrain_from_csv.py ../backend/database/calibration_dataset.csv
"""
import sys
import os
import json
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, accuracy_score

NUMERIC_COLS = ['nominal_value', 'mpe_tolerance', 'instrument_age_months', 'days_since_last_calibration',
                'usage_hours_since_last_cal', 'ambient_temperature_c', 'ambient_humidity_pct']
CATEGORICAL_COLS = ['equipment_type', 'previous_calibration_result']
FEATURE_COLS = NUMERIC_COLS + CATEGORICAL_COLS
TARGET = 'error_pct_of_tolerance'
CALIBRATION_THRESHOLD = 1.0


def build_pipeline():
    pre = ColumnTransformer([('cat', OneHotEncoder(handle_unknown='ignore'), CATEGORICAL_COLS)], remainder='passthrough')
    return Pipeline([
        ('pre', pre),
        ('model', RandomForestRegressor(n_estimators=120, max_depth=11, min_samples_leaf=5, random_state=42, n_jobs=-1)),
    ])


def main(csv_path):
    df = pd.read_csv(csv_path)
    X = df[FEATURE_COLS]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipe = build_pipeline()
    pipe.fit(X_train, y_train)
    pred = pipe.predict(X_test)
    mae = mean_absolute_error(y_test, pred)
    accuracy = accuracy_score(y_test >= CALIBRATION_THRESHOLD, pred >= CALIBRATION_THRESHOLD)
    print(f"Held-out MAE: {mae:.5f} | Derived classification accuracy: {accuracy:.4f}")

    pipe_full = build_pipeline()
    pipe_full.fit(X, y)

    out_dir = os.path.dirname(__file__)
    joblib.dump(pipe_full, os.path.join(out_dir, 'error_pct_regressor.joblib'), compress=3)
    with open(os.path.join(out_dir, 'training_metrics.json'), 'w') as f:
        json.dump({"trained_rows": len(df), "mean_absolute_error": mae, "derived_classification_accuracy": accuracy}, f, indent=2)
    print(f"Saved model to {out_dir}/error_pct_regressor.joblib")


if __name__ == '__main__':
    csv_path = sys.argv[1] if len(sys.argv) > 1 else '../backend/database/calibration_dataset.csv'
    main(csv_path)

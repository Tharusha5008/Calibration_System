"""
AI microservice for calibration prediction — trained on calibration_dataset.csv.

Unlike a noisy real-world label, this dataset's `needs_calibration` flag is a
clean derived threshold: needs_calibration == (error_pct_of_tolerance >= 1.0).
So a single RandomForestRegressor predicting error_pct_of_tolerance is enough;
needs_calibration is then just "predicted value >= 1.0" — no separate
classifier needed (see ai-service/README.md for the analysis behind this).

Endpoints:
  POST /train    body: { rows: [ {..calibration_dataset.csv columns..}, ... ] }
  POST /predict  body: { equipmentType, standardReference, nominalValue, mpeTolerance,
                          measuredValue, instrumentAgeMonths, daysSinceLastCalibration,
                          usageHoursSinceLastCal, ambientTemperatureC, ambientHumidityPct,
                          previousCalibrationResult }
  GET  /status
"""
import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, accuracy_score

app = Flask(__name__)
CORS(app)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
MODEL_PATH = os.path.join(MODEL_DIR, "error_pct_regressor.joblib")

NUMERIC_COLS = [
    "nominal_value",
    "mpe_tolerance",
    "instrument_age_months",
    "days_since_last_calibration",
    "usage_hours_since_last_cal",
    "ambient_temperature_c",
    "ambient_humidity_pct",
]
CATEGORICAL_COLS = ["equipment_type", "previous_calibration_result"]
FEATURE_COLS = NUMERIC_COLS + CATEGORICAL_COLS
TARGET_COL = "error_pct_of_tolerance"     # fraction; 1.0 == 100% of tolerance consumed
CALIBRATION_THRESHOLD = 1.0

RENAME_MAP = {
    "equipmentType": "equipment_type",
    "standardReference": "standard_reference",
    "nominalValue": "nominal_value",
    "mpeTolerance": "mpe_tolerance",
    "measuredValue": "measured_value",
    "instrumentAgeMonths": "instrument_age_months",
    "daysSinceLastCalibration": "days_since_last_calibration",
    "usageHoursSinceLastCal": "usage_hours_since_last_cal",
    "ambientTemperatureC": "ambient_temperature_c",
    "ambientHumidityPct": "ambient_humidity_pct",
    "previousCalibrationResult": "previous_calibration_result",
    "errorPctOfTolerance": "error_pct_of_tolerance",
    "needsCalibration": "needs_calibration",
}

_cache = {"model": None, "trained_rows": 0, "mae": None, "accuracy": None}


def _build_pipeline():
    pre = ColumnTransformer(
        transformers=[("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_COLS)],
        remainder="passthrough",
    )
    return Pipeline([
        ("pre", pre),
        ("model", RandomForestRegressor(n_estimators=120, max_depth=11, min_samples_leaf=5, random_state=42, n_jobs=-1)),
    ])


def _prepare_dataframe(rows):
    df = pd.DataFrame(rows).rename(columns=RENAME_MAP)
    for col in NUMERIC_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    if "previous_calibration_result" in df.columns:
        df["previous_calibration_result"] = df["previous_calibration_result"].fillna("pass")
    return df


def _load_model_if_present():
    if _cache["model"] is None and os.path.exists(MODEL_PATH):
        _cache["model"] = joblib.load(MODEL_PATH)


@app.route("/train", methods=["POST"])
def train():
    payload = request.get_json(force=True)
    rows = payload.get("rows", [])
    if not rows:
        return jsonify({"message": "rows[] is required"}), 400

    df = _prepare_dataframe(rows)
    missing = [c for c in FEATURE_COLS + [TARGET_COL] if c not in df.columns]
    if missing:
        return jsonify({"message": f"Missing columns in dataset: {missing}"}), 400

    df = df.dropna(subset=FEATURE_COLS + [TARGET_COL])
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    pipeline = _build_pipeline()
    mae = None
    accuracy = None

    if len(df) >= 20:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        pipeline.fit(X_train, y_train)
        pred = pipeline.predict(X_test)
        mae = float(mean_absolute_error(y_test, pred))
        # Derived classification accuracy: does the threshold rule on our prediction
        # match the threshold rule on the true value?
        accuracy = float(accuracy_score(y_test >= CALIBRATION_THRESHOLD, pred >= CALIBRATION_THRESHOLD))
    else:
        pipeline.fit(X, y)

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH, compress=3)

    _cache.update({"model": pipeline, "trained_rows": len(df), "mae": mae, "accuracy": accuracy})

    return jsonify({
        "trained_rows": len(df),
        "mean_absolute_error": mae,
        "derived_classification_accuracy": accuracy,
    })


@app.route("/predict", methods=["POST"])
def predict():
    _load_model_if_present()
    if _cache["model"] is None:
        return jsonify({"message": "Model has not been trained yet. Upload a dataset via /train first."}), 400

    payload = request.get_json(force=True)
    df = _prepare_dataframe([payload])

    defaults = {
        "ambient_temperature_c": 22.0,
        "ambient_humidity_pct": 45.0,
        "usage_hours_since_last_cal": 500.0,
        "previous_calibration_result": "pass",
        "days_since_last_calibration": 0,
    }
    for col, default in defaults.items():
        if col not in df.columns or pd.isna(df[col]).any():
            df[col] = default

    X = df[FEATURE_COLS]
    predicted_fraction = float(_cache["model"].predict(X)[0])
    predicted_error_pct = round(predicted_fraction * 100, 2)
    needs_calibration = predicted_fraction >= CALIBRATION_THRESHOLD

    return jsonify({
        "predicted_error_pct": predicted_error_pct,   # % of the allowed tolerance already used
        "needs_calibration": needs_calibration,
        "margin_pct": round((1 - predicted_fraction) * 100, 2),  # headroom left before the limit (negative = over)
    })


@app.route("/status", methods=["GET"])
def status():
    _load_model_if_present()
    return jsonify({
        "model_trained": _cache["model"] is not None,
        "trained_rows": _cache["trained_rows"],
        "mean_absolute_error": _cache["mae"],
        "derived_classification_accuracy": _cache["accuracy"],
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5001)), debug=True)

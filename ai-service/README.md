# AI Calibration Prediction Service

Python/Flask microservice used by the Node backend to train and query the
calibration-error prediction model, trained on `calibration_dataset.csv`.

## Why one model, not a classifier + regressor
In this dataset, `needs_calibration` is a **clean derived threshold**, not a
noisy real-world outcome:
```
needs_calibration == (error_pct_of_tolerance >= 1.0)
```
(verified directly against the CSV — the minimum `error_pct_of_tolerance`
among rows where `needs_calibration == 1` is exactly `1.0`.) So a single
`RandomForestRegressor` predicting `error_pct_of_tolerance` is enough —
`needs_calibration` is just "predicted value ≥ 1.0" applied after the fact,
with no separate classifier or confidence score needed.

## Pretrained model included
`model/error_pct_regressor.joblib` is already trained on the full
24,000-row `calibration_dataset.csv` you provided, so `/predict` works
immediately. Held-out (20%) performance:

| Metric | Value |
|---|---|
| Mean Absolute Error (fraction of tolerance) | ≈0.191 |
| Derived classification accuracy (≥1.0 threshold) | ≈0.916 |

Uses `n_estimators=120, max_depth=11, min_samples_leaf=5`, saved with
`joblib` compression (~5.5MB). See `model/training_metrics.json` for the
exact numbers from the last training run.

To retrain from scratch:
```bash
python3 model/pretrain_from_csv.py ../backend/database/calibration_dataset.csv
```

## Run the service
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```
Runs on http://localhost:5001 by default.

## Endpoints
- `POST /train` — body: `{ "rows": [ {equipment_type, standard_reference, unit, nominal_value, measured_value, measured_error, mpe_tolerance, error_pct_of_tolerance, needs_calibration, instrument_age_months, days_since_last_calibration, usage_hours_since_last_cal, ambient_temperature_c, ambient_humidity_pct, previous_calibration_result}, ... ] }` — retrains and overwrites the `.joblib` file.
- `POST /predict` — body (camelCase from the Node backend): `{ equipmentType, nominalValue, mpeTolerance, measuredValue, instrumentAgeMonths, daysSinceLastCalibration, usageHoursSinceLastCal, ambientTemperatureC, ambientHumidityPct, previousCalibrationResult }` → `{ predicted_error_pct, needs_calibration, margin_pct }`
  - `predicted_error_pct`: % of the allowed tolerance the reading is predicted to consume (100 = right at the limit)
  - `margin_pct`: headroom left before the limit (negative = predicted over the limit)
- `GET /status` — whether the model is loaded, rows trained on, and held-out metrics

## Ideas to improve accuracy further
- Gradient boosting (XGBoost/LightGBM) instead of a random forest
- Hyperparameter search (the current settings were chosen mainly to keep
  the shipped file small, not tuned for best accuracy)
- The dataset's per-type-only columns (`grade`, `tool_type`,
  `accuracy_class`, `max_volume_ul`, etc.) aren't currently used as model
  features — they're stored as `type_attributes` JSONB but only ~1/12 of
  rows have each one populated, so they'd need type-specific submodels or
  careful imputation to use well.

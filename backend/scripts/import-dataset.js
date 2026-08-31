const fs = require('fs');const path = require('path');
const { parse } = require('csv-parse');
const pool = require('../src/config/db');

const CSV_PATH = path.join(__dirname, '../database/calibration_dataset.csv');

function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const TYPE_ATTRIBUTE_COLS = [
  'grade', 'mpe_tolerance_pct', 'verification_interval_e', 'accuracy_class',
  'full_scale_bar', 'tool_type', 'max_volume_ul', 'instrument_class',
];

async function importEquipmentCatalog(rows) {
  const byType = {};
  for (const r of rows) {
    if (!byType[r.equipment_type]) byType[r.equipment_type] = [];
    byType[r.equipment_type].push(r);
  }

  console.log(`Deriving equipment catalog for ${Object.keys(byType).length} equipment types...`);
  for (const [type, typeRows] of Object.entries(byType)) {
    const nominalMedian = median(typeRows.map((r) => Number(r.nominal_value)));
    const toleranceMedian = median(typeRows.map((r) => Number(r.mpe_tolerance)));
    const ageMedian = Math.round(median(typeRows.map((r) => Number(r.instrument_age_months))));
    const unit = typeRows[0].unit;
    const standardReference = typeRows[0].standard_reference;

    const attrs = {};
    for (const col of TYPE_ATTRIBUTE_COLS) {
      const withValue = typeRows.find((r) => r[col] !== '' && r[col] !== undefined);
      if (withValue) attrs[col] = withValue[col];
    }

    await pool.query(
      `INSERT INTO equipment
        (equipment_type, standard_reference, unit, nominal_value, mpe_tolerance, instrument_age_months, type_attributes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (equipment_type) DO NOTHING`,
      [type, standardReference, unit, nominalMedian, toleranceMedian, ageMedian, JSON.stringify(attrs)]
    );
    console.log(`  ${type}: nominal≈${nominalMedian} ${unit}, tolerance≈${toleranceMedian} ${unit}`);
  }
}

async function importTrainingData(rows) {
  console.log(`Importing ${rows.length} historical readings into calibration_dataset...`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let count = 0;
    for (const r of rows) {
      const attrs = {};
      for (const col of TYPE_ATTRIBUTE_COLS) {
        if (r[col] !== '' && r[col] !== undefined) attrs[col] = r[col];
      }
      await client.query(
        `INSERT INTO calibration_dataset
          (equipment_type, standard_reference, unit, nominal_value, measured_value, measured_error,
           mpe_tolerance, error_pct_of_tolerance, needs_calibration, instrument_age_months,
           days_since_last_calibration, usage_hours_since_last_cal, ambient_temperature_c,
           ambient_humidity_pct, previous_calibration_result, type_attributes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          r.equipment_type, r.standard_reference, r.unit, r.nominal_value, r.measured_value,
          r.measured_error, r.mpe_tolerance, r.error_pct_of_tolerance, r.needs_calibration === '1',
          r.instrument_age_months, r.days_since_last_calibration, r.usage_hours_since_last_cal,
          r.ambient_temperature_c, r.ambient_humidity_pct, r.previous_calibration_result,
          JSON.stringify(attrs),
        ]
      );
      count += 1;
      if (count % 5000 === 0) console.log(`  ...${count} rows`);
    }
    await client.query('COMMIT');
    console.log('Training data import complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

(async () => {
  try {
    const rows = await readCsv(CSV_PATH);
    await importEquipmentCatalog(rows);
    await importTrainingData(rows);
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
})();
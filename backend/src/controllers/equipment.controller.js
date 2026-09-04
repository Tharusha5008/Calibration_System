const pool = require('../config/db');
const typeGuides = require('../config/equipment-type-guides');

// One row per equipment TYPE — the picker lists each type exactly once.
async function listEquipment(req, res) {
  const { rows } = await pool.query('SELECT * FROM equipment ORDER BY equipment_type');
  const equipment = rows.map((r) => ({ ...r, guide: typeGuides[r.equipment_type] || null }));
  res.json({ equipment });
}

async function getEquipment(req, res) {
  const { rows } = await pool.query('SELECT * FROM equipment WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Equipment not found' });
  res.json({ equipment: { ...rows[0], guide: typeGuides[rows[0].equipment_type] || null } });
}

async function createEquipment(req, res) {
  const {
    equipmentType, standardReference, unit, nominalValue, mpeTolerance,
    instrumentAgeMonths, typeAttributes, imageUrl,
  } = req.body;

  if (!equipmentType || !standardReference || !unit || nominalValue === undefined || mpeTolerance === undefined) {
    return res.status(400).json({ message: 'equipmentType, standardReference, unit, nominalValue and mpeTolerance are required' });
  }
  if (!typeGuides[equipmentType]) {
    return res.status(400).json({ message: Unknown equipmentType "${equipmentType}". Must be one the trained types: ${Object.keys(typeGuides).join(', ')} });
  }

  const { rows } = await pool.query(
    `INSERT INTO equipment
      (equipment_type, standard_reference, unit, nominal_value, mpe_tolerance,
       instrument_age_months, type_attributes, image_url, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (equipment_type) DO UPDATE SET
       standard_reference = EXCLUDED.standard_reference,
       unit = EXCLUDED.unit,
       nominal_value = EXCLUDED.nominal_value,
       mpe_tolerance = EXCLUDED.mpe_tolerance,
       updated_at = NOW()
     RETURNING *`,
    [
      equipmentType, standardReference, unit, nominalValue, mpeTolerance,
      instrumentAgeMonths || 12, JSON.stringify(typeAttributes || {}), imageUrl || null, req.user.id,
    ]
  );
  res.status(201).json({ equipment: rows[0] });
}

async function updateEquipment(req, res) {
  const { id } = req.params;
  const { standardReference, unit, nominalValue, mpeTolerance, instrumentAgeMonths, typeAttributes, imageUrl } = req.body;

  const { rows } = await pool.query(
    `UPDATE equipment SET
       standard_reference = COALESCE($1, standard_reference),
       unit = COALESCE($2, unit),
       nominal_value = COALESCE($3, nominal_value),
       mpe_tolerance = COALESCE($4, mpe_tolerance),
       instrument_age_months = COALESCE($5, instrument_age_months),
       type_attributes = COALESCE($6, type_attributes),
       image_url = COALESCE($7, image_url),
       updated_at = NOW()
     WHERE id = $8 RETURNING *`,
    [standardReference, unit, nominalValue, mpeTolerance, instrumentAgeMonths, typeAttributes ? JSON.stringify(typeAttributes) : null, imageUrl, id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Equipment not found' });
  res.json({ equipment: rows[0] });
}

async function deleteEquipment(req, res) {
  await pool.query('DELETE FROM equipment WHERE id = $1', [req.params.id]);
  res.status(204).send();
}

module.exports = { listEquipment, getEquipment, createEquipment, updateEquipment, deleteEquipment };
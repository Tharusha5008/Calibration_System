CREATE TYPE user_role AS ENUM ('admin', 'user', 'technician');
CREATE TYPE request_status AS ENUM (
  'pending_review',
  'token_booked',
  'technician_accepted',
  'equipment_handed_over',
  'calibration_in_progress',
  'calibrated_released',
  'certificate_pending_approval',
  'certificate_approved',
  'certificate_rejected',
  'closed'
);
CREATE TYPE prev_result AS ENUM ('pass', 'fail', 'adjusted');

CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  full_name       VARCHAR(150) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            user_role NOT NULL DEFAULT 'user',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE equipment (
  id                       SERIAL PRIMARY KEY,
  equipment_type            VARCHAR(60) UNIQUE NOT NULL,
  standard_reference          VARCHAR(150) NOT NULL,
  unit                          VARCHAR(20) NOT NULL,
  nominal_value                 NUMERIC(14,4) NOT NULL,
  mpe_tolerance                  NUMERIC(14,5) NOT NULL,
  instrument_age_months           INTEGER NOT NULL DEFAULT 12,  
  type_attributes                  JSONB NOT NULL DEFAULT '{}',
  image_url                         TEXT,
  last_calibrated_at                 TIMESTAMP,
  created_by                          INTEGER REFERENCES users(id),
  created_at                           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at                           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE calibration_dataset (
  id                              SERIAL PRIMARY KEY,
  equipment_type                  VARCHAR(60) NOT NULL,
  standard_reference               VARCHAR(150) NOT NULL,
  unit                              VARCHAR(20) NOT NULL,
  nominal_value                     NUMERIC(14,4) NOT NULL,
  measured_value                     NUMERIC(14,4) NOT NULL,
  measured_error                      NUMERIC(14,5) NOT NULL,
  mpe_tolerance                        NUMERIC(14,5) NOT NULL,
  error_pct_of_tolerance                NUMERIC(8,5) NOT NULL,
  needs_calibration                      BOOLEAN NOT NULL,
  instrument_age_months                   INTEGER NOT NULL,
  days_since_last_calibration              INTEGER NOT NULL,
  usage_hours_since_last_cal                NUMERIC(8,2) NOT NULL,
  ambient_temperature_c                      NUMERIC(5,2) NOT NULL,
  ambient_humidity_pct                        NUMERIC(5,2) NOT NULL,
  previous_calibration_result                  prev_result NOT NULL,
  type_attributes                               JSONB NOT NULL DEFAULT '{}',
  uploaded_by                                    INTEGER REFERENCES users(id),
  uploaded_at                                     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE calibration_requests (
  id                      SERIAL PRIMARY KEY,
  tracking_token           VARCHAR(20) UNIQUE NOT NULL,
  equipment_id              INTEGER NOT NULL REFERENCES equipment(id),
  requested_by               INTEGER NOT NULL REFERENCES users(id),
  assigned_technician_id      INTEGER REFERENCES users(id),

  measured_value                NUMERIC(14,4) NOT NULL,
  usage_hours_since_last_cal     NUMERIC(8,2),
  ambient_temperature_c           NUMERIC(5,2),
  ambient_humidity_pct             NUMERIC(5,2),
  previous_calibration_result       prev_result,

  predicted_error_pct                NUMERIC(8,4),
  needs_calibration                    BOOLEAN,

  status                                  request_status NOT NULL DEFAULT 'pending_review',
  status_history                          JSONB NOT NULL DEFAULT '[]',
  created_at                              TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at                              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE certificates (
  id                       SERIAL PRIMARY KEY,
  calibration_request_id    INTEGER UNIQUE NOT NULL REFERENCES calibration_requests(id),
  certificate_number          VARCHAR(30) UNIQUE NOT NULL,
  issued_by_technician_id      INTEGER NOT NULL REFERENCES users(id),
  final_measured_value          NUMERIC(14,4),
  final_error_pct                NUMERIC(8,4),
  result                           VARCHAR(20) NOT NULL,
  remarks                           TEXT,
  approval_status                   VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by_admin_id                INTEGER REFERENCES users(id),
  approved_at                          TIMESTAMP,
  issued_at                             TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_status ON calibration_requests(status);
CREATE INDEX idx_requests_technician ON calibration_requests(assigned_technician_id);
CREATE INDEX idx_dataset_type ON calibration_dataset(equipment_type);
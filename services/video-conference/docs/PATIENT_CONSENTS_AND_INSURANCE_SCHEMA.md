# Patient Consents & Insurance – DB Design

## Overview

- **Consents:** Terms & Privacy, Telehealth, Marketing (3 types)
- **Insurance:** eGK / German health insurance fields for billing and auth

---

## 1. Consents

### Table: `user_consents`

Stores consent records with audit trail (accepted_at, version, ip).

| Column        | Type     | Nullable | Description |
|---------------|----------|----------|-------------|
| id            | UUID     | No       | PK |
| user_id       | UUID     | No       | FK → users, CASCADE |
| consent_type  | String   | No       | TERMS, PRIVACY, TELEHEALTH, MARKETING |
| accepted      | Boolean  | No       | true = accepted, false = declined |
| accepted_at   | DateTime | Yes      | When accepted (null if declined) |
| version       | String   | Yes      | e.g. "1.0" (which version was shown) |
| ip_address    | String   | Yes      | Client IP (audit) |
| created_at    | DateTime | No       | |

**Constraints:**
- `UNIQUE (user_id, consent_type)` — one record per user per consent type (update on re-consent)
- Index on `(user_id)` for lookups

**Consent types:**

| Type      | Mandatory | Description |
|-----------|-----------|-------------|
| TERMS     | Yes       | Terms of Service |
| PRIVACY   | Yes       | Privacy Policy |
| TELEHEALTH| Yes       | Telehealth consent (for telemedicine) |
| MARKETING | No        | Marketing communications (optional) |

---

### Registration payload (consents)

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirm_password": "SecurePass123!",
  "consents": {
    "terms": true,
    "privacy": true,
    "telehealth": true,
    "marketing": false
  }
}
```

**Stored as:**

| user_id | consent_type | accepted | accepted_at           |
|---------|---------------|----------|------------------------|
| uuid-1  | TERMS         | true     | 2026-02-27 10:30:00   |
| uuid-1  | PRIVACY       | true     | 2026-02-27 10:30:00   |
| uuid-1  | TELEHEALTH    | true     | 2026-02-27 10:30:00   |
| uuid-1  | MARKETING     | false    | null                  |

---

## 2. Insurance (eGK / German Health Card)

### Table: `patient_insurance`

One row per patient (1:1). Optional; filled during onboarding.

| Column                    | Type     | Nullable | Description |
|---------------------------|----------|----------|-------------|
| id                        | UUID     | No       | PK |
| patient_id                | UUID     | No       | FK → patients, CASCADE, UNIQUE |
| insured_person_full_name  | String   | Yes      | Full name from eGK/chip |
| date_of_birth             | Date     | Yes      | DOB from eGK |
| insurance_number          | String   | Yes      | Versichertennummer / eGK-ID (billing/auth key) |
| insurance_provider_name   | String   | Yes      | e.g. TK, AOK |
| insurance_provider_id     | String   | Yes      | Rufzeichen / provider code |
| card_access_number        | String   | Yes      | 6-digit CAN for secure queries |
| insured_status            | String   | Yes      | e.g. family_member, self_insured |
| validity_start            | Date     | Yes      | Insurance validity start |
| validity_end              | Date     | Yes      | Insurance validity end |
| created_at                | DateTime | No       | |
| updated_at                | DateTime | No       | |

**Indexes:**
- `UNIQUE (patient_id)` — one insurance record per patient
- `(insurance_number)` — lookup by Versichertennummer (if needed for billing)

---

### Field mapping (eGK / gesund.bund)

| DB column                 | eGK / Source        | Notes |
|---------------------------|---------------------|-------|
| insured_person_full_name  | Full name (chip)    | From eGK visible/chip data |
| date_of_birth             | DOB (chip)         | |
| insurance_number          | Versichertennummer / eGK-ID | Main key for billing/auth |
| insurance_provider_name   | Provider name       | e.g. TK, AOK |
| insurance_provider_id    | Rufzeichen / code  | Provider ID |
| card_access_number       | 6-digit CAN        | For secure queries |
| insured_status           | Status             | Family member, validity, etc. |
| validity_start           | Validity start     | |
| validity_end             | Validity end       | |

---

## 3. Provider license (for reference)

Provider license is stored in `providers`:

| Column         | Type   | Table    | Description |
|----------------|--------|----------|-------------|
| license_number | String | providers| Doctor license number |

No separate table; one field per provider.

---

## 4. Entity relationship

```
users
  ├── user_consents (1:N)     [TERMS, PRIVACY, TELEHEALTH, MARKETING]
  └── patients (1:1)
        └── patient_insurance (1:1)   [eGK / insurance details]

providers
  └── license_number (column)
```

---

## 5. SQL summary

### user_consents

```sql
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  accepted BOOLEAN NOT NULL,
  accepted_at TIMESTAMPTZ,
  version VARCHAR(20),
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, consent_type)
);
CREATE INDEX ix_user_consents_user_id ON user_consents(user_id);
```

### patient_insurance

```sql
CREATE TABLE patient_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  insured_person_full_name VARCHAR(255),
  date_of_birth DATE,
  insurance_number VARCHAR(50),
  insurance_provider_name VARCHAR(100),
  insurance_provider_id VARCHAR(20),
  card_access_number VARCHAR(6),
  insured_status VARCHAR(50),
  validity_start DATE,
  validity_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_patient_insurance_insurance_number ON patient_insurance(insurance_number);
```

---

## 6. Consent check at registration

Before creating the user:

- `terms` = true
- `privacy` = true
- `telehealth` = true
- `marketing` = optional (true/false)

Reject registration if any mandatory consent is false.

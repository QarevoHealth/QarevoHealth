"""Patient seeder."""

from datetime import date

from src.models import PatientDB, UserDB


def seed_patients(db, tenants):
    """Create users and patients."""
    patients_data = [
        ("John Smith", "john.smith@email.com", "+1-555-3001", "1990-05-15", "male", "PAT-001"),
        ("Maria Garcia", "maria.garcia@email.com", "+1-555-3002", "1985-11-22", "female", "PAT-002"),
        ("Robert Wilson", "robert.wilson@email.com", "+1-555-3003", "1978-03-08", "male", "PAT-003"),
        ("Lisa Anderson", "lisa.anderson@email.com", "+1-555-3004", "1992-07-30", "female", "PAT-004"),
        ("James Brown", "james.brown@email.com", "+1-555-3005", "1980-01-12", "male", "PAT-005"),
    ]
    patients_created = []
    for i, (name, email, phone, dob_str, gender, ext_id) in enumerate(patients_data):
        tenant = tenants[i % len(tenants)]
        dob = date(*map(int, dob_str.split("-"))) if dob_str else None
        user = UserDB(
            full_name=name,
            tenant_id=tenant.id,
            role="PATIENT",
            email=email,
            phone=phone,
            password_hash="",
            status="ACTIVE",
        )
        db.add(user)
        db.flush()
        patient = PatientDB(
            user_id=user.id,
            full_name=name,
            date_of_birth=dob,
            gender=gender,
            external_patient_id=ext_id,
        )
        db.add(patient)
        patients_created.append(patient)
    db.commit()
    print(f"  Created {len(patients_created)} patients")
    return patients_created

import pytest
from ..template_registry import TEMPLATE_REGISTRY, render_template

def test_consultation_note_rendering():
    metadata = TEMPLATE_REGISTRY["consultation_note_v1"]
    inputs = {
        "patient_name": "John Doe",
        "doctor_notes": "Patient is recovering well.",
        "verified_fields": "Heart rate, Blood pressure"
    }
    
    output = render_template(metadata, inputs)
    
    # Assert output match expected snapshot
    expected = "# Consultation Note\n\nPatient: John Doe\nNotes: Patient is recovering well.\nVerified: Heart rate, Blood pressure"
    assert output == expected
    
    # Assert prohibited phrases are not present
    for claim in metadata.prohibited_claims:
        assert claim not in output

def test_patient_summary_rendering():
    metadata = TEMPLATE_REGISTRY["patient_summary_v1"]
    inputs = {
        "patient_name": "Jane Smith",
        "age": "30",
        "doctor_summary": "Overall healthy condition."
    }
    
    output = render_template(metadata, inputs)
    
    # Assert output match expected snapshot
    expected = "# Patient Summary\n\nPatient: Jane Smith\nAge: 30\nSummary: Overall healthy condition."
    assert output == expected
    
    # Assert prohibited phrases are not present
    for claim in metadata.prohibited_claims:
        assert claim not in output

def test_prohibited_claims_detection():
    # This test verifies that our "prohibited phrases are not present" check works
    # by intentionally injecting a prohibited claim and asserting failure (manually in this case)
    metadata = TEMPLATE_REGISTRY["consultation_note_v1"]
    inputs = {
        "patient_name": "John Doe",
        "doctor_notes": "This is a miracle cure!",
        "verified_fields": "None"
    }
    
    output = render_template(metadata, inputs)
    
    # Check if ANY prohibited claim is present
    found_claims = [claim for claim in metadata.prohibited_claims if claim in output]
    assert "miracle cure" in found_claims

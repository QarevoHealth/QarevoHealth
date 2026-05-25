from pydantic import BaseModel
from typing import List, Dict

class TemplateMetadata(BaseModel):
    template_id: str
    version: str
    pack_id: str
    output_type: str
    allowed_inputs: List[str]
    prohibited_claims: List[str]
    placeholders: Dict[str, str]
    content: str

def render_template(metadata: TemplateMetadata, inputs: Dict[str, str]) -> str:
    rendered = metadata.content
    for key, value in inputs.items():
        placeholder = f"{{{{{key}}}}}"
        rendered = rendered.replace(placeholder, value)
    return rendered

TEMPLATE_REGISTRY: Dict[str, TemplateMetadata] = {
    "consultation_note_v1": TemplateMetadata(
        template_id="consultation_note",
        version="v1",
        pack_id="standard",
        output_type="markdown",
        allowed_inputs=["patient_name", "doctor_notes", "verified_fields"],
        prohibited_claims=["miracle cure", "guaranteed result"],
        placeholders={
            "patient_name": "Full name of the patient",
            "doctor_notes": "Clinical notes from the doctor",
            "verified_fields": "List of verified medical fields"
        },
        content="# Consultation Note\n\nPatient: {{patient_name}}\nNotes: {{doctor_notes}}\nVerified: {{verified_fields}}"
    ),
    "patient_summary_v1": TemplateMetadata(
        template_id="patient_summary",
        version="v1",
        pack_id="standard",
        output_type="markdown",
        allowed_inputs=["patient_name", "age", "doctor_summary"],
        prohibited_claims=["100% success"],
        placeholders={
            "patient_name": "Full name of the patient",
            "age": "Age of the patient",
            "doctor_summary": "Summary of the patient's condition"
        },
        content="# Patient Summary\n\nPatient: {{patient_name}}\nAge: {{age}}\nSummary: {{doctor_summary}}"
    )
}

# Template Service

This service manages the registration and rendering of medical document templates for the QarevoHealth platform.

## Overview

The template service provides a registry of predefined templates (Consultation Notes, Patient Summaries, etc.) along with metadata for validation and rendering logic.

## Metadata Fields

Each template is defined using the `TemplateMetadata` model:

| Field | Type | Description |
| :--- | :--- | :--- |
| `template_id` | `str` | Unique identifier for the template (e.g., `consultation_note`). |
| `version` | `str` | Version string (e.g., `v1`). |
| `pack_id` | `str` | ID of the template pack this belongs to. |
| `output_type` | `str` | Format of the rendered output (e.g., `markdown`, `text`). |
| `allowed_inputs`| `List[str]` | List of keys permitted as inputs for rendering. |
| `prohibited_claims`| `List[str]` | Phrases that must not appear in the final rendered output. |
| `placeholders` | `Dict[str, str]`| Mapping of placeholder keys to human-readable descriptions. |
| `content` | `str` | The actual template body containing `{{placeholder}}` markers. |

## Placeholders

Templates use double curly braces for placeholders. For example:
`"Patient Name: {{patient_name}}"`

When calling `render_template`, provide a dictionary where keys match the placeholder names:
```python
inputs = {"patient_name": "John Doe"}
```

## How to Add New Templates

1. Open `services/templates/template_registry.py`.
2. Add a new entry to the `TEMPLATE_REGISTRY` dictionary.
3. Ensure all fields in `TemplateMetadata` are populated.
4. Define your placeholders in both the `content` string and the `placeholders` description dictionary.

Example:
```python
"new_template_v1": TemplateMetadata(
    template_id="new_template",
    version="v1",
    pack_id="standard",
    output_type="markdown",
    allowed_inputs=["field_1"],
    prohibited_claims=["illegal phrase"],
    placeholders={"field_1": "Description of field 1"},
    content="This is a new template with {{field_1}}"
)
```

## Running Tests

Tests are located in the `tests/` directory and use `pytest`. To run them from the project root:

```powershell
python -m pytest services/templates/tests/
```

The tests verify:
- Correct rendering of templates with sample inputs.
- Matching output against expected snapshots.
- Absence of prohibited phrases in the rendered output.

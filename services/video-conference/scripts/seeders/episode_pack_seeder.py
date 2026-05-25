"""Episode pack seeder."""

from src.models import EpisodePackDB, EpisodePackVersionDB


# Dermatology Patient Intake Episode Pack schema definition
DERMATOLOGY_PACK_SCHEMA = {
    "sections": [
        {
            "section_key": "about_consultation",
            "title": "About This Consultation",
            "fields": [
                {
                    "key": "chief_complaint",
                    "display_type": "text",
                    "required": True,
                    "prompt": "What's the main reason for your consultation today?",
                    "validation": {
                        "max_length": 500
                    }
                },
                {
                    "key": "duration",
                    "display_type": "single-select",
                    "required": True,
                    "prompt": "How long have you been experiencing this?",
                    "options": [
                        "less than a day",
                        "1-3 days",
                        "4-7 days",
                        "1-2 weeks",
                        "2-4 weeks",
                        "1-3 months",
                        "longer than 3 months"
                    ]
                },
                {
                    "key": "severity_self_assessment",
                    "display_type": "scale",
                    "required": True,
                    "prompt": "How would you rate the severity right now?",
                    "validation": {
                        "min": 1,
                        "max": 10
                    },
                    "anchors": {
                        "1": "barely noticeable",
                        "10": "extremely severe"
                    }
                }
            ]
        },
        {
            "section_key": "dermatology_specialty",
            "title": "Specialty-Specific Section — Dermatology Pack",
            "subsections": [
                {
                    "subsection_key": "where",
                    "title": "Where",
                    "fields": [
                        {
                            "key": "body_location",
                            "display_type": "body diagram / interactive image with selectable regions",
                            "required": True,
                            "description": "Patient taps where the issue is."
                        },
                        {
                            "key": "affected_area_size",
                            "display_type": "single-select",
                            "required": False,
                            "prompt": "Roughly how big is the affected area?",
                            "options": [
                                "smaller than a coin",
                                "palm-sized",
                                "larger",
                                "multiple areas",
                                "hard to say"
                            ]
                        },
                        {
                            "key": "is_it_spreading",
                            "display_type": "single-select",
                            "required": True,
                            "prompt": "Is it spreading?",
                            "options": [
                                "yes — quickly",
                                "yes — slowly",
                                "no, staying the same",
                                "no, getting smaller",
                                "not sure"
                            ]
                        }
                    ]
                },
                {
                    "subsection_key": "how_it_looks",
                    "title": "How It Looks",
                    "fields": [
                        {
                            "key": "appearance_features",
                            "display_type": "multi-select",
                            "required": True,
                            "prompt": "How would you describe how it looks?",
                            "options": [
                                "red",
                                "pink",
                                "brown",
                                "white",
                                "yellow",
                                "blackish",
                                "scaly",
                                "cracked",
                                "blistered",
                                "swollen",
                                "dry",
                                "oozing",
                                "crusted"
                            ]
                        },
                        {
                            "key": "symptoms_at_skin",
                            "display_type": "multi-select",
                            "required": False,
                            "prompt": "How does it feel?",
                            "options": [
                                "itchy",
                                "painful",
                                "burning",
                                "numb",
                                "no sensation",
                                "sore to touch",
                                "tight"
                            ]
                        },
                        {
                            "key": "appearance_changes",
                            "display_type": "single-select",
                            "required": False,
                            "prompt": "How has it changed over time?",
                            "options": [
                                "getting worse",
                                "getting better",
                                "staying the same",
                                "coming and going"
                            ]
                        }
                    ]
                },
                {
                    "subsection_key": "triggers_and_patterns",
                    "title": "Triggers and Patterns",
                    "fields": [
                        {
                            "key": "suspected_triggers",
                            "display_type": "text",
                            "required": False,
                            "prompt": "Anything you think may have caused or worsened it?"
                        },
                        {
                            "key": "worse_at_specific_times",
                            "display_type": "multi-select",
                            "required": False,
                            "prompt": "Worse at any particular times?",
                            "options": [
                                "mornings",
                                "evenings",
                                "nights",
                                "after eating",
                                "during work",
                                "when stressed",
                                "in heat",
                                "in cold",
                                "when wet",
                                "dry environments"
                            ]
                        },
                        {
                            "key": "previous_similar_episodes",
                            "display_type": "single-select",
                            "required": False,
                            "prompt": "Have you had this kind of problem before?",
                            "options": [
                                "no",
                                "yes — first time long ago",
                                "yes — recently",
                                "yes — recurring"
                            ]
                        }
                    ]
                },
                {
                    "subsection_key": "photos",
                    "title": "Photos",
                    "fields": [
                        {
                            "key": "photos",
                            "display_type": "file upload",
                            "required": False,
                            "prompt": "Upload photos if helpful",
                            "validation": {
                                "max_files": 3
                            }
                        },
                        {
                            "key": "photo_guidance_acknowledged",
                            "display_type": "checkbox",
                            "required": "conditional",
                            "description": "Patient sees \"How to take a good clinical photo\" guidance and acknowledges it.",
                            "conditional": {
                                "description": "Required when uploading photos."
                            }
                        }
                    ]
                }
            ]
        },
        {
            "section_key": "medical_context",
            "title": "Your Medical Context",
            "fields": [
                {
                    "key": "current_medications",
                    "display_type": "text or structured list",
                    "required": False,
                    "prompt": "Are you currently taking any medications? Include prescriptions, over-the-counter, supplements."
                },
                {
                    "key": "allergies",
                    "display_type": "text + checkboxes",
                    "required": False,
                    "prompt": "Known allergies (medications, foods, environmental)",
                    "note": "Common allergens may be available as quick-select options; final quick-select values were not supplied."
                },
                {
                    "key": "existing_conditions",
                    "display_type": "multi-select + text",
                    "required": False,
                    "prompt": "Any existing medical conditions?",
                    "supplied_quick_select_examples": [
                        "diabetes",
                        "hypertension",
                        "asthma",
                        "heart disease",
                        "depression",
                        "other"
                    ],
                    "note": "These are examples only; final options may differ."
                },
                {
                    "key": "recent_medical_history",
                    "display_type": "text",
                    "required": False,
                    "prompt": "Any recent illnesses, surgeries, or hospitalizations?"
                },
                {
                    "key": "pregnancy_status",
                    "display_type": "single-select",
                    "required": "conditional",
                    "prompt": "Are you pregnant or breastfeeding?",
                    "options": [
                        "yes",
                        "no",
                        "not sure",
                        "not applicable",
                        "prefer not to say"
                    ],
                    "conditional": {
                        "description": "Shown only if patient is biologically able.",
                        "implementation_status": "pending_confirmation"
                    },
                    "note": "The exact backend rule for determining applicability was not supplied."
                }
            ]
        },
        {
            "section_key": "lifestyle_context",
            "title": "Lifestyle Context",
            "fields": [
                {
                    "key": "smoking",
                    "display_type": "single-select",
                    "required": False,
                    "prompt": "Do you smoke?",
                    "options": [
                        "never",
                        "former",
                        "current — light",
                        "current — regular",
                        "current — heavy"
                    ]
                },
                {
                    "key": "alcohol",
                    "display_type": "single-select",
                    "required": False,
                    "prompt": "How often do you drink alcohol?",
                    "options": [
                        "never",
                        "occasionally",
                        "weekly",
                        "daily",
                        "prefer not to say"
                    ]
                }
            ]
        },
        {
            "section_key": "consultation_goals",
            "title": "What You Hope to Achieve",
            "fields": [
                {
                    "key": "consultation_goals",
                    "display_type": "multi-select",
                    "required": True,
                    "prompt": "What do you hope to get from this consultation?",
                    "options": [
                        "understanding the cause",
                        "treatment recommendations",
                        "prescription",
                        "referral to specialist",
                        "second opinion",
                        "sick note",
                        "reassurance",
                        "other"
                    ]
                },
                {
                    "key": "prior_attempts",
                    "display_type": "text",
                    "required": False,
                    "prompt": "What have you tried so far to address this?"
                },
                {
                    "key": "additional_notes",
                    "display_type": "text",
                    "required": False,
                    "prompt": "Anything else the doctor should know?"
                }
            ]
        },
        {
            "section_key": "practical_details",
            "title": "Practical Details",
            "fields": [
                {
                    "key": "insurance_type",
                    "display_type": "single-select",
                    "required": True,
                    "options": [
                        "statutory",
                        "private",
                        "self-pay"
                    ]
                },
                {
                    "key": "insurance_provider",
                    "display_type": "text",
                    "required": "conditional",
                    "description": "Name of insurer.",
                    "conditional": {
                        "description": "Required if insurance applies.",
                        "implementation_status": "pending_confirmation"
                    },
                    "note": "The supplied definition does not specify whether this applies to statutory, private, or both."
                },
                {
                    "key": "insurance_number",
                    "display_type": "text",
                    "required": "conditional",
                    "description": "For billing.",
                    "conditional": {
                        "description": "Required if insurance applies.",
                        "implementation_status": "pending_confirmation"
                    },
                    "note": "The supplied definition does not specify whether this applies to statutory, private, or both."
                },
                {
                    "key": "preferred_language",
                    "display_type": "single-select",
                    "required": "pending_confirmation",
                    "description": "Language for consultation.",
                    "note": "German default, possibly English fallback. Exact options/default and whether required were not supplied."
                },
                {
                    "key": "consent_data_processing",
                    "display_type": "checkbox",
                    "required": True,
                    "description": "Agreement to data processing terms."
                },
                {
                    "key": "consent_ai_assistance",
                    "display_type": "checkbox",
                    "required": False,
                    "description": "Agreement to AI-assisted documentation.",
                    "note": "Optional with default; the default value was not supplied."
                }
            ]
        }
    ]
}


def seed_episode_packs(db):
    """Create initial Episode Pack and Episode Pack Version, ensuring idempotency."""
    # Check if Dermatology pack already exists
    existing_pack = db.query(EpisodePackDB).filter_by(
        key="dermatology_patient_intake"
    ).first()

    if existing_pack:
        # Pack exists; check if version v1 exists
        existing_version = db.query(EpisodePackVersionDB).filter_by(
            episode_pack_id=existing_pack.id,
            version="v1"
        ).first()
        if existing_version:
            print("  Dermatology Patient Intake Episode Pack and version v1 already exist, skipping.")
            return [existing_pack]
        else:
            # Create missing version for existing pack
            version = EpisodePackVersionDB(
                episode_pack_id=existing_pack.id,
                version="v1",
                schema_json=DERMATOLOGY_PACK_SCHEMA
            )
            db.add(version)
            db.commit()
            print(f"  Created missing Episode Pack version 'v1' for existing pack '{existing_pack.name}'.")
            return [existing_pack]

    # Create Episode Pack (doesn't exist)
    pack = EpisodePackDB(
        key="dermatology_patient_intake",
        name="Dermatology Patient Intake Episode Pack",
        description="Patient intake form for dermatology consultations"
    )
    db.add(pack)
    db.flush()  # Ensure pack has ID before creating version

    # Create Episode Pack Version
    version = EpisodePackVersionDB(
        episode_pack_id=pack.id,
        version="v1",
        schema_json=DERMATOLOGY_PACK_SCHEMA
    )
    db.add(version)
    db.commit()

    print(f"  Created Episode Pack '{pack.name}' (key: {pack.key}, version: {version.version})")
    return [pack]

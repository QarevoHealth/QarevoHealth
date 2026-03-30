"""Load notification templates (emails, sms) from notifications folder."""

from pathlib import Path


def _get_notifications_root() -> Path:
    """Notifications folder at project root (alongside src)."""
    return Path(__file__).resolve().parent.parent.parent / "notifications"


def _render(content: str, context: dict) -> str:
    """Replace {{key}} placeholders with context values."""
    for key, value in context.items():
        content = content.replace(f"{{{{{key}}}}}", str(value))
    return content


def load_email_template(template_name: str, context: dict) -> tuple[str, str, str | None]:
    """
    Load email template from notifications/emails/{template_name}/.
    Returns (subject, html_body, text_body).
    Placeholders: {{key}} replaced with context[key].
    """
    base = _get_notifications_root() / "emails" / template_name

    def _load(path: Path) -> str:
        if not path.exists():
            return ""
        return _render(path.read_text(encoding="utf-8"), context)

    subject = _load(base / "subject.txt").strip()
    html_body = _load(base / "body.html")
    text_path = base / "body.txt"
    text_body = _load(text_path) if text_path.exists() else None

    return subject, html_body, text_body if text_body else None


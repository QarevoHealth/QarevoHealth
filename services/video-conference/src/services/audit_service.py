"""Audit log service - write security events to audit_logs table."""

from sqlalchemy.orm import Session

from src.models import AuditLogDB


def write_audit_log(
    db: Session,
    event_type: str,
    event_category: str,
    success: bool,
    actor_user_id=None,
    target_user_id=None,
    tenant_id=None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    endpoint: str | None = None,
    http_method: str | None = None,
    failure_reason: str | None = None,
    extra_data: dict | None = None,
    commit: bool = False,
) -> None:
    """
    Write an audit log entry. Never raises — audit failures must not break main flow.

    Args:
        commit: Pass True on failure paths where the use case raises HTTPException
                immediately after (so the audit is persisted before the raise).
                On success paths, leave False — the audit row is committed with the
                main db.commit() call in the use case.
    """
    try:
        record = AuditLogDB(
            event_type=event_type,
            event_category=event_category,
            actor_user_id=actor_user_id,
            target_user_id=target_user_id,
            tenant_id=tenant_id,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            http_method=http_method,
            success=success,
            failure_reason=failure_reason,
            extra_data=extra_data,
        )
        db.add(record)
        if commit:
            db.commit()
    except Exception:
        pass

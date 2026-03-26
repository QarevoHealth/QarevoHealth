"""Audit log model - immutable record of security and system events."""

import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.constants.audit import AuditEventCategory, AuditEventType
from src.database import Base

__all__ = ["AuditLogDB", "AuditEventCategory", "AuditEventType"]


class AuditLogDB(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    event_type = Column(String(60), nullable=False)
    event_category = Column(String(20), nullable=False)

    actor_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="SET NULL"), nullable=True, index=True)
    consultation_id = Column(UUID(as_uuid=True), ForeignKey("consultations.id", ondelete="SET NULL"), nullable=True)
    video_session_id = Column(UUID(as_uuid=True), ForeignKey("video_sessions.id", ondelete="SET NULL"), nullable=True)

    resource_type = Column(String(50), nullable=True)
    resource_id = Column(UUID(as_uuid=True), nullable=True)

    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    endpoint = Column(String(255), nullable=True)
    http_method = Column(String(10), nullable=True)

    request_id = Column(String(100), nullable=True)
    trace_id = Column(String(100), nullable=True)

    success = Column(Boolean, nullable=False)
    failure_reason = Column(Text, nullable=True)
    extra_data = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    actor = relationship("UserDB", foreign_keys=[actor_user_id], backref="audit_logs_as_actor")
    target = relationship("UserDB", foreign_keys=[target_user_id], backref="audit_logs_as_target")

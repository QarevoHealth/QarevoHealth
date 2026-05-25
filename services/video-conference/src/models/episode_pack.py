"""Episode pack models."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class EpisodePackDB(Base):
    """Episode pack definition."""

    __tablename__ = "episode_packs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(100), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    versions = relationship("EpisodePackVersionDB", back_populates="episode_pack")


class EpisodePackVersionDB(Base):
    """Episode pack version definition."""

    __tablename__ = "episode_pack_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    episode_pack_id = Column(UUID(as_uuid=True), ForeignKey("episode_packs.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(String(50), nullable=False)
    schema_json = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    patient_intakes = relationship("PatientIntakeDB", back_populates="episode_pack_version")

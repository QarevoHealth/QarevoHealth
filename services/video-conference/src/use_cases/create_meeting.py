"""Create meeting use case."""

from sqlalchemy.orm import Session
from src.models import Session, SessionDB


class CreateMeetingUseCase:
    """Use case to create a meeting with host and attendee."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def execute(self, host_id: str, attendee_id: str) -> Session:
        """Create a new meeting session."""
        # Create session
        session = Session.create(host_id=host_id, attendee_id=attendee_id)
        
        # Save to database
        db_session = SessionDB(
            id=session.id,
            host_id=session.host_id,
            participants=[
                {"user_id": p.user_id, "role": p.role}
                for p in session.participants
            ],
            status=session.status
        )
        
        self.db.add(db_session)
        self.db.commit()
        self.db.refresh(db_session)
        
        return session

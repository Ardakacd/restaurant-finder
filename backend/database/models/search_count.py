from sqlalchemy import String, Integer, DateTime, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from .base import Base

class PlaceSearchCountModel(Base):
    __tablename__ = "place_search_counts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    place_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    search_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_searched: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint("search_count >= 0", name="check_search_count_nonnegative"),
        Index("idx_search_count", search_count.desc()),  
    )

    def __repr__(self):
        return f"<PlaceSearchCountModel(id={self.id}, place_id='{self.place_id}', search_count={self.search_count})>"

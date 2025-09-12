from sqlalchemy import String, DateTime, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from .base import Base


class FavoritePlaceModel(Base):
    __tablename__ = "favorite_places"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # 🔹 Foreign key to users table
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 🔹 Place ID (Google Maps Place ID or similar)
    place_id: Mapped[str] = mapped_column(String(255), nullable=False)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("UserModel", backref="favorite_places")

    __table_args__ = (
        UniqueConstraint("user_id", "place_id", name="uq_user_place"),
    )

    def __repr__(self):
        return f"<FavoritePlaceModel(id={self.id}, user_id={self.user_id}, place_id='{self.place_id}')>"

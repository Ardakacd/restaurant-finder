from typing import List
from pydantic import BaseModel
from functionalities.search.models import CafeResponse


class FavoriteResponse(BaseModel):
    """Response model for favorite operations"""
    success: bool
    message: str


class FavoritesListResponse(BaseModel):
    """Response model for getting user favorites"""
    cafes: List[CafeResponse]
    total: int

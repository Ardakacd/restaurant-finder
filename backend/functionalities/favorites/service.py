from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from database import get_async_db
from utils.jwt import get_user_id_from_token
from .adapter import FavoritesAdapter
from .models import FavoritesListResponse

logger = logging.getLogger(__name__)


class FavoritesService:
    """
    Service layer for favorites functionality.
    
    Handles business logic for favorite operations including
    authentication and data validation.
    """
    
    def __init__(self, favorites_adapter: FavoritesAdapter):
        self.favorites_adapter = favorites_adapter
    
    async def get_user_favorites(self, token: str) -> FavoritesListResponse:
        """
        Get all favorite places for the authenticated user.
        
        Args:
            token: JWT access token
            
        Returns:
            FavoritesListResponse with list of favorite cafes
            
        Raises:
            HTTPException: If token is invalid or user not found
        """
        try:
            user_id = get_user_id_from_token(token)
            
            if not user_id:
                raise ValueError("Invalid token: missing user_id")
            
            cafes = await self.favorites_adapter.get_user_favorites(user_id)
            
            return FavoritesListResponse(
                cafes=cafes,
                total=len(cafes)
            )
            
        except Exception as e:
            logger.error(f"Error getting user favorites: {e}")
            raise
    
    async def toggle_favorite(self, token: str, place_id: str) -> bool:
        """
        Toggle favorite status for a place.
        
        Args:
            token: JWT access token
            place_id: Google Places API place ID
            
        Returns:
            True if added to favorites, False if removed
            
        Raises:
            HTTPException: If token is invalid or operation fails
        """
        try:
            user_id = get_user_id_from_token(token)
            
            if not user_id:
                raise ValueError("Invalid token: missing user_id")
            
            return await self.favorites_adapter.toggle_favorite(user_id, place_id)
            
        except Exception as e:
            logger.error(f"Error toggling favorite for place {place_id}: {e}")
            raise
    
    async def is_favorite(self, token: str, place_id: str) -> bool:
        """
        Check if a place is favorited by the authenticated user.
        
        Args:
            token: JWT access token
            place_id: Google Places API place ID
            
        Returns:
            True if place is favorited, False otherwise
            
        Raises:
            HTTPException: If token is invalid
        """
        try:
            user_id = get_user_id_from_token(token)
            
            if not user_id:
                raise ValueError("Invalid token: missing user_id")
            
            return await self.favorites_adapter.is_favorite(user_id, place_id)
            
        except Exception as e:
            logger.error(f"Error checking if place {place_id} is favorite: {e}")
            raise


def get_favorites_service(
        db: AsyncSession = Depends(get_async_db),
) -> FavoritesService:
    favorites_adapter = FavoritesAdapter(db)
    return FavoritesService(favorites_adapter)

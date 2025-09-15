import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .service import FavoritesService, get_favorites_service
from .models import FavoritesListResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/favorites", tags=["favorites"])
security = HTTPBearer()


@router.post("/toggle", response_model=bool)
async def toggle_favorite(
    place_id: str, 
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    favorites_service: FavoritesService = Depends(get_favorites_service)
):
    """
    Toggle favorite status for a place.
    
    Args:
        place_id: Google Places API place ID
        credentials: JWT token from Authorization header
        
    Returns:
        True if added to favorites, False if removed from favorites
    """
    logger.info(f"Toggle favorite attempt for place: {place_id}")
    try:
        token = credentials.credentials
        result = await favorites_service.toggle_favorite(token, place_id)
        logger.info(f"Toggle favorite successful for place: {place_id}, result: {result}")
        return result
    except HTTPException as e:
        logger.error(f"HTTP error during toggle favorite: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during toggle favorite: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/", response_model=FavoritesListResponse)
async def get_user_favorites(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    favorites_service: FavoritesService = Depends(get_favorites_service)
):
    """
    Get all favorite places for the authenticated user.
    
    Args:
        credentials: JWT token from Authorization header
        
    Returns:
        FavoritesListResponse containing list of favorite cafes with full details
    """
    logger.info("Get user favorites attempt")
    try:
        token = credentials.credentials
        result = await favorites_service.get_user_favorites(token)
        logger.info(f"Get user favorites successful, found {result.total} favorites")
        return result
    except HTTPException as e:
        logger.error(f"HTTP error during get user favorites: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during get user favorites: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/check", response_model=bool)
async def is_favorite(
    place_id: str, 
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    favorites_service: FavoritesService = Depends(get_favorites_service)
):
    """
    Check if a place is favorited by the authenticated user.
    
    Args:
        place_id: Google Places API place ID
        credentials: JWT token from Authorization header
        
    Returns:
        True if place is favorited, False otherwise
    """
    logger.info(f"Check if place is favorite attempt for place: {place_id}")
    try:
        token = credentials.credentials
        result = await favorites_service.is_favorite(token, place_id)
        logger.info(f"Check if place is favorite successful for place: {place_id}, result: {result}")
        return result
    except HTTPException as e:
        logger.error(f"HTTP error during check if place is favorite: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during check if place is favorite: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

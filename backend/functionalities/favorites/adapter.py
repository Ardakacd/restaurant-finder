from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import select, delete
import logging
import httpx
from database import FavoritePlaceModel
from functionalities.search.models import CafeResponse, PriceRange, OpeningHours, PriceDetail
from config import settings

logger = logging.getLogger(__name__)


class FavoritesAdapter:
    """
    Favorites adapter for database operations.
    
    This adapter provides async interface for favorite place CRUD operations
    with proper error handling and session management.
    """
    
    def __init__(self, session: AsyncSession):
        self.db: AsyncSession = session

    async def get_user_favorites(self, user_id: int) -> List[CafeResponse]:
        """
        Get all favorite places for a given user with full cafe details.
        
        Args:
            user_id: Internal user ID
            
        Returns:
            List of CafeResponse objects (empty if none)
        """
        try:
            stmt = select(FavoritePlaceModel.place_id).where(FavoritePlaceModel.user_id == user_id)
            result = await self.db.execute(stmt)
            place_ids = result.scalars().all()

            cafes = []
            
            for place_id in place_ids:
                try:
                    URL = f"https://places.googleapis.com/v1/places/{place_id}"
                    
                    HEADERS = {
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": settings.GOOGLE_API_KEY,
                        "X-Goog-FieldMask": "id,displayName,rating,formattedAddress,internationalPhoneNumber,googleMapsUri,businessStatus,primaryType,priceRange,currentOpeningHours,photos,allowsDogs,delivery,reservable,servesBreakfast,servesLunch,servesDinner,servesVegetarianFood"
                    }
                    
                    with httpx.Client() as client:
                        response = client.get(URL, headers=HEADERS)
                        if response.status_code == 200:
                            place_data = response.json()
                            cafe = self._convert_to_cafe_response(place_data)
                            cafes.append(cafe)
                        else:
                            logger.warning(f"Failed to fetch place {place_id}: {response.status_code}")
                            
                except Exception as e:
                    logger.warning(f"Failed to fetch place {place_id}: {e}")
                    continue
            
            return cafes

        except SQLAlchemyError as e:
            logger.error(f"Database error retrieving favorites for user {user_id}: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error retrieving favorites for user {user_id}: {e}")
            return []

    async def add_favorite(self, user_id: int, place_id: str) -> bool:
        """
        Add a place to user's favorites.
        
        Returns True if added, False if already exists or error.
        """
        try:
            new_fav = FavoritePlaceModel(user_id=user_id, place_id=place_id)
            self.db.add(new_fav)
            await self.db.commit()
            return True

        except IntegrityError:
            # duplicate entry
            await self.db.rollback()
            return False

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error adding favorite for user {user_id}, place {place_id}: {e}")
            return False

    async def remove_favorite(self, user_id: int, place_id: str) -> bool:
        """
        Remove a place from user's favorites.
        Returns True if deleted, False if not found or error.
        """
        try:
            stmt = delete(FavoritePlaceModel).where(
                FavoritePlaceModel.user_id == user_id,
                FavoritePlaceModel.place_id == place_id
            ).returning(FavoritePlaceModel.id)
            
            result = await self.db.execute(stmt)
            await self.db.commit()

            return result.rowcount > 0

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error removing favorite for user {user_id}, place {place_id}: {e}")
            return False

    async def is_favorite(self, user_id: int, place_id: str) -> bool:
        """
        Check if a user has already favorited a place.
        Returns True if exists, False otherwise.
        """
        try:
            stmt = select(FavoritePlaceModel).where(
                FavoritePlaceModel.user_id == user_id,
                FavoritePlaceModel.place_id == place_id
            )
            result = await self.db.execute(stmt)
            fav = result.scalar_one_or_none()
            return fav is not None

        except Exception as e:
            logger.error(f"Error checking favorite for user {user_id}, place {place_id}: {e}")
            return False

    async def toggle_favorite(self, user_id: int, place_id: str) -> bool:
        """
        Toggle a favorite: add if not exists, remove if exists.
        Returns True if added, False if removed.
        """
        if await self.is_favorite(user_id, place_id):
            await self.remove_favorite(user_id, place_id)
            return False  
        else:
            await self.add_favorite(user_id, place_id)
            return True

    def _convert_to_cafe_response(self, place_data: dict) -> CafeResponse:
        """
        Convert Google Places API response to CafeResponse model
        """
        place_id = place_data.get("id")
        
        display_name = place_data.get("displayName", {})
        name = display_name.get("text") 
        
        return CafeResponse(
            id=place_id,
            name=name,
            rating=place_data.get("rating"),
            address=place_data.get("formattedAddress"),
            phone=place_data.get("internationalPhoneNumber"),
            google_maps_uri=place_data.get("googleMapsUri"),
            business_status=place_data.get("businessStatus"),
            primary_type=place_data.get("primaryType").replace("_", " ") if place_data.get("primaryType") else None,
            price_range=self._convert_price_range(place_data.get("priceRange")),
            opening_hours=self._convert_opening_hours(place_data.get("currentOpeningHours")),
            photos=self._convert_photos(place_data.get("photos")),
            allows_dogs=place_data.get("allowsDogs"),
            delivery=place_data.get("delivery"),
            reservable=place_data.get("reservable"),
            serves_breakfast=place_data.get("servesBreakfast"),
            serves_lunch=place_data.get("servesLunch"),
            serves_dinner=place_data.get("servesDinner"),
            serves_vegetarian_food=place_data.get("servesVegetarianFood")
        )
     
    def _convert_price_range(self, price_range_data) -> Optional[PriceRange]:
        """Convert price range data to PriceRange model"""
        if not price_range_data:
            return None
        
        try:
            start_price = None
            end_price = None
            
            if "startPrice" in price_range_data:
                start_data = price_range_data["startPrice"]
                start_price = PriceDetail(
                    currencyCode=start_data.get("currencyCode", ""),
                    units=start_data.get("units", "")
                )
            
            if "endPrice" in price_range_data:
                end_data = price_range_data["endPrice"]
                end_price = PriceDetail(
                    currencyCode=end_data.get("currencyCode", ""),
                    units=end_data.get("units", "")
                )
            
            return PriceRange(startPrice=start_price, endPrice=end_price)
        except Exception:
            return None
    
    def _convert_opening_hours(self, opening_hours_data) -> Optional[OpeningHours]:
        """Convert opening hours data to OpeningHours model"""
        if not opening_hours_data:
            return None
        
        try:
            return OpeningHours(
                openNow=opening_hours_data.get("openNow"),
                weekdayDescriptions=opening_hours_data.get("weekdayDescriptions"),
            )
        except Exception:
            return None
    
    def _convert_photos(self, photos_data) -> Optional[List[str]]:
        """Convert photos data to list of photo URLs"""
        if not photos_data or not isinstance(photos_data, list):
            return None
        
        try:
            photos = []
            for photo_data in photos_data:
                if isinstance(photo_data, dict) and "name" in photo_data:
                    name = photo_data.get("name")
                    photo_url = f"https://places.googleapis.com/v1/{name}/media?key={settings.GOOGLE_API_KEY}&maxHeightPx=600&maxWidthPx=600"
                    photos.append(photo_url)
            
            return photos if photos else None
        except Exception:
            return None

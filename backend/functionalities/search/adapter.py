from typing import List, Optional
import logging
from .models import CafeResponse, PriceRange, OpeningHours, PriceDetail
from fastapi import HTTPException
import httpx
from config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, func, select
from sqlalchemy.dialects.postgresql import insert
from database.models.search_count import PlaceSearchCountModel
logger = logging.getLogger(__name__)


class SearchAdapter:
    def __init__(self, session: AsyncSession):
        self.db: AsyncSession = session
    
    async def search(self, query: str, fields: dict) -> List[CafeResponse]:
        try:
            URL = "https://places.googleapis.com/v1/places:searchText"

            HEADERS = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": settings.GOOGLE_API_KEY,
                "X-Goog-FieldMask": "places.id,places.internationalPhoneNumber,places.formattedAddress,places.rating,places.googleMapsUri,places.businessStatus,places.priceLevel,places.displayName,places.currentOpeningHours,places.primaryType,places.priceRange,places.photos,places.allowsDogs,places.outdoorSeating,places.liveMusic,places.menuForChildren,places.servesCocktails,places.servesDessert,places.servesCoffee,places.goodForChildren,places.restroom,places.goodForGroups,places.goodForWatchingSports,places.paymentOptions,places.accessibilityOptions,places.delivery,places.dineIn,places.reservable,places.servesBreakfast,places.servesLunch,places.servesDinner,places.servesBeer,places.servesWine,places.servesBrunch,places.servesVegetarianFood"
            }

            payload = {
                "textQuery": query
            }

            with httpx.Client() as client:
                response = client.post(URL, headers=HEADERS, json=payload)
                data = response.json()
                data = data['places']

                filtered_data = self._filter_places(data, fields)
                
                cafes = []
                for place_data in filtered_data:
                    try:
                        cafe = self._convert_to_cafe_response(place_data)
                        cafes.append(cafe)
                    except Exception as e:
                        logger.warning(f"Failed to convert place data to CafeResponse: {e}")
                        continue


                place_ids = [cafe.id for cafe in cafes]
                await self.add_to_place_search_count(place_ids)
                
                return cafes

        except HTTPException as e:
            raise
        except Exception as e:
            logger.error(f'Error has occurred: {e}')
            return []

    async def add_to_place_search_count(self, place_ids: List[str]) -> bool:
        try:
            stmt = insert(PlaceSearchCountModel).values([
                {"place_id": pid, "search_count": 1} for pid in place_ids
            ])
            stmt = stmt.on_conflict_do_update(
                index_elements=["place_id"],
                set_={
                    "search_count": PlaceSearchCountModel.search_count + 1,
                    "last_searched": func.now()
                }
            )
            await self.db.execute(stmt)
            await self.db.commit()
            return True
        except Exception as e:
            logger.error(f"Error has occurred: {e}")
            return False

    async def get_top_places(self, limit: int = 10):
        try:    
            stmt = select(PlaceSearchCountModel.place_id).order_by(desc(PlaceSearchCountModel.search_count)).limit(limit)
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
        except Exception as e:
            logger.error(f'Error has occurred: {e}')
            return []

    async def get_places_by_ids(self, place_ids: List[str]):
        try:
            URL = "https://places.googleapis.com/v1/places:searchText"

            HEADERS = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": settings.GOOGLE_API_KEY,
                "X-Goog-FieldMask": "places.id,places.internationalPhoneNumber,places.formattedAddress,places.rating,places.googleMapsUri,places.businessStatus,places.priceLevel,places.displayName,places.currentOpeningHours,places.primaryType,places.priceRange,places.photos,places.allowsDogs,places.outdoorSeating,places.liveMusic,places.menuForChildren,places.servesCocktails,places.servesDessert,places.servesCoffee,places.goodForChildren,places.restroom,places.goodForGroups,places.goodForWatchingSports,places.paymentOptions,places.accessibilityOptions,places.delivery,places.dineIn,places.reservable,places.servesBreakfast,places.servesLunch,places.servesDinner,places.servesBeer,places.servesWine,places.servesBrunch,places.servesVegetarianFood"
            }

            payload = {
                "textQuery": query
            }

            with httpx.Client() as client:
                response = client.post(URL, headers=HEADERS, json=payload)
                data = response.json()
                data = data['places']

                filtered_data = self._filter_places(data, fields)
                
                cafes = []
                for place_data in filtered_data:
                    try:
                        cafe = self._convert_to_cafe_response(place_data)
                        cafes.append(cafe)
                    except Exception as e:
                        logger.warning(f"Failed to convert place data to CafeResponse: {e}")
                        continue


                place_ids = [cafe.id for cafe in cafes]
                await self.add_to_place_search_count(place_ids)
                
                return cafes

        except HTTPException as e:
            raise
        except Exception as e:
            logger.error(f'Error has occurred: {e}')
            return []

    def _filter_places(self, places: List[dict], fields: dict) -> List[dict]:
        """
        Filter places based on fields criteria.
        Only apply filtering for keys present in fields.
        If a key is not in fields, all values are acceptable.
        """
        if not fields:
            return places
        
        filtered_places = []
        
        for place in places:
            matches_criteria = True
            
            for field_key, field_value in fields.items():
                if not self._matches_field_criteria(place, field_key, field_value):
                    matches_criteria = False
                    break
            
            if matches_criteria:
                filtered_places.append(place)
        
        return filtered_places
    
    def _matches_field_criteria(self, place: dict, field_key: str, field_value) -> bool:
        """
        Check if a place matches the criteria for a specific field.
        Handles complex fields like rating, currentOpeningHours, priceRange, etc.
        """
        if field_key == "rating":
            place_rating = place.get("rating")
            if place_rating is None:
                return False
            
            if isinstance(field_value, dict):
                if "min" in field_value and place_rating < field_value["min"]:
                    return False
                if "max" in field_value and place_rating > field_value["max"]:
                    return False
                return True
            else:
                return place_rating >= field_value
        
        elif field_key == "currentOpeningHours":
            if isinstance(field_value, dict) and "openNow" in field_value:
                opening_hours = place.get("currentOpeningHours", {})
                place_open_now = opening_hours.get("openNow", False)
                return place_open_now == field_value["openNow"]
            return True
        
        elif field_key == "priceRange":
            if isinstance(field_value, dict):
                place_price_range = place.get("priceRange", {})
                
                place_start_data = place_price_range.get("startPrice", {})
                place_end_data = place_price_range.get("endPrice", {})
                
                if not place_start_data or not place_end_data:
                    return True
                
                try:
                    place_start_price = float(place_start_data.get("units", 0))
                    place_end_price = float(place_end_data.get("units", 0))
                    
                    user_start_price = None
                    user_end_price = None
                    
                    if "startPrice" in field_value:
                        user_start_price = float(field_value["startPrice"]["units"])
                    if "endPrice" in field_value:
                        user_end_price = float(field_value["endPrice"]["units"])
                    
                    
                    if user_end_price is not None and user_start_price is None:
                        return place_start_price <= user_end_price
                    
                    
                    elif user_start_price is not None and user_end_price is None:
                        return place_end_price >= user_start_price
                    
                    elif user_start_price is not None and user_end_price is not None:
                        return place_start_price <= user_end_price and user_start_price <= place_end_price
                    
                    return True
                    
                except (ValueError, TypeError):
                    return True
                
            return True
        
        elif field_key == "paymentOptions":
            if isinstance(field_value, dict):
                place_payment_options = place.get("paymentOptions", {})
                for payment_key, payment_value in field_value.items():
                    place_payment_value = place_payment_options.get(payment_key)
                    if place_payment_value != payment_value:
                        return False
                return True
            return True
        
        elif field_key == "accessibilityOptions":
            if isinstance(field_value, dict):
                place_accessibility = place.get("accessibilityOptions", {})
                for access_key, access_value in field_value.items():
                    place_access_value = place_accessibility.get(access_key)
                    if place_access_value != access_value:
                        return False
                return True
            return True
        
        else:
            place_value = place.get(field_key)
            
            if isinstance(field_value, list):
                return place_value in field_value
            else:
                return place_value == field_value
    
    def _convert_to_cafe_response(self, place_data: dict) -> CafeResponse:
        """
        Convert Google Places API response to CafeResponse model with useful fields
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
            primary_type=place_data.get("primaryType").replace("_", " "),
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
    
    def _convert_photos(self, photos_data) -> Optional[List]:
        """Convert photos data to Photo models list"""
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
   
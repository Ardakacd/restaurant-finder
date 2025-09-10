from enum import Enum
from typing import List, Optional
from pydantic import BaseModel

class SearchRequest(BaseModel):
    query: str

# Fields with limited values
class BusinessStatus(str, Enum):
    OPERATIONAL = "OPERATIONAL"
    CLOSED_TEMPORARILY = "CLOSED_TEMPORARILY"
    CLOSED_PERMANENTLY = "CLOSED_PERMANENTLY"

class PriceLevel(str, Enum):
    PRICE_LEVEL_FREE = "PRICE_LEVEL_FREE"
    PRICE_LEVEL_INEXPENSIVE = "PRICE_LEVEL_INEXPENSIVE"
    PRICE_LEVEL_MODERATE = "PRICE_LEVEL_MODERATE"
    PRICE_LEVEL_EXPENSIVE = "PRICE_LEVEL_EXPENSIVE"
    PRICE_LEVEL_VERY_EXPENSIVE = "PRICE_LEVEL_VERY_EXPENSIVE"

#class PrimaryType(str, Enum):
#    CAFE = "cafe"
#    RESTAURANT = "restaurant"
#    BAR = "bar"
#    COFFEE_SHOP = "coffee_shop"
#    DESSERT_RESTAURANT = "dessert_restaurant"
#    CHOCOLATE_SHOP = "chocolate_shop"

class PaymentOption(str, Enum):
    CREDIT_CARD = "acceptsCreditCards"
    DEBIT_CARD = "acceptsDebitCards"
    CASH_ONLY = "acceptsCashOnly"
    NFC = "acceptsNfc"

class AccessibilityOption(str, Enum):
    PARKING = "wheelchairAccessibleParking"
    ENTRANCE = "wheelchairAccessibleEntrance"
    SEATING = "wheelchairAccessibleSeating"


# Nested models
class DisplayName(BaseModel):
    text: str
    languageCode: str

class DateInfo(BaseModel):
    year: int
    month: int
    day: int

class TimePeriod(BaseModel):
    day: int
    hour: int
    minute: int
    date: Optional[DateInfo]
    truncated: Optional[bool] = False

class Period(BaseModel):
    open: TimePeriod
    close: TimePeriod

class OpeningHours(BaseModel):
    openNow: Optional[bool] = None
    weekdayDescriptions: Optional[List[str]] = None

class PriceDetail(BaseModel):
    currencyCode: str
    units: str

class PriceRange(BaseModel):
    startPrice: Optional[PriceDetail]
    endPrice: Optional[PriceDetail]

class PaymentOptions(BaseModel):
    acceptsCreditCards: Optional[bool] = None
    acceptsDebitCards: Optional[bool] = None
    acceptsCashOnly: Optional[bool] = None
    acceptsNfc: Optional[bool] = None

class AccessibilityOptions(BaseModel):
    wheelchairAccessibleParking: Optional[bool] = None
    wheelchairAccessibleEntrance: Optional[bool] = None
    wheelchairAccessibleSeating: Optional[bool] = None
    wheelchairAccessibleRestroom: Optional[bool] = None

# Photo model for place photos
class Photo(BaseModel):
    name: str
    widthPx: Optional[int] = None
    heightPx: Optional[int] = None
    authorAttributions: Optional[List[str]] = None

# Full Place model for internal processing
class Place(BaseModel):
    internationalPhoneNumber: Optional[str] = None
    formattedAddress: Optional[str] = None
    rating: Optional[float] = None
    googleMapsUri: Optional[str] = None
    businessStatus: Optional[BusinessStatus] = None
    priceLevel: Optional[PriceLevel] = None
    displayName: Optional[DisplayName] = None
    currentOpeningHours: Optional[OpeningHours] = None
    primaryType: Optional[str] = None
    priceRange: Optional[PriceRange] = None
    photos: Optional[List[Photo]] = None
    allowsDogs: Optional[bool] = None
    outdoorSeating: Optional[bool] = None
    liveMusic: Optional[bool] = None
    menuForChildren: Optional[bool] = None
    servesCocktails: Optional[bool] = None
    servesDessert: Optional[bool] = None
    servesCoffee: Optional[bool] = None
    goodForChildren: Optional[bool] = None
    restroom: Optional[bool] = None
    goodForGroups: Optional[bool] = None
    goodForWatchingSports: Optional[bool] = None
    paymentOptions: Optional[PaymentOptions] = None
    accessibilityOptions: Optional[AccessibilityOptions] = None
    delivery: Optional[bool] = None
    dineIn: Optional[bool] = None
    reservable: Optional[bool] = None
    servesBreakfast: Optional[bool] = None
    servesLunch: Optional[bool] = None
    servesDinner: Optional[bool] = None
    servesBeer: Optional[bool] = None
    servesWine: Optional[bool] = None
    servesBrunch: Optional[bool] = None
    servesVegetarianFood: Optional[bool] = None

# Response model with useful Google Places API fields
class CafeResponse(BaseModel):
    id: str                                    
    name: str                                  # displayName.text
    rating: Optional[float] = None
    address: Optional[str] = None              
    phone: Optional[str] = None                
    google_maps_uri: Optional[str] = None      
    business_status: Optional[str] = None      
    primary_type: Optional[str] = None         
    price_range: Optional[PriceRange] = None   
    opening_hours: Optional[OpeningHours] = None
    photos: Optional[List[str]] = None       
    allows_dogs: Optional[bool] = None         
    delivery: Optional[bool] = None            
    reservable: Optional[bool] = None          
    serves_breakfast: Optional[bool] = None    
    serves_lunch: Optional[bool] = None        
    serves_dinner: Optional[bool] = None
    serves_vegetarian_food: Optional[bool] = None       

class SearchResponse(BaseModel):
    cafes: List[CafeResponse]
    total: int

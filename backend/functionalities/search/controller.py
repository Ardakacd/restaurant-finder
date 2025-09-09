import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from .models import Place
from .service import SearchService, get_search_service

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["search"])
security = HTTPBearer()


@router.post("", response_model=List[Place])
async def search(query: str, search_service: SearchService = Depends(get_search_service)):
    try:

        result = await search_service.search(query)

        return result
       
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

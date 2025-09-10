import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from .models import SearchResponse, SearchRequest
from .service import SearchService, get_search_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["search"])
security = HTTPBearer()

@router.post("", response_model=SearchResponse)
async def search(query: SearchRequest, search_service: SearchService = Depends(get_search_service)):
    try:

        cafes = await search_service.search(query.query)
        
        return SearchResponse(
            cafes=cafes,
            total=len(cafes)
        )
       
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

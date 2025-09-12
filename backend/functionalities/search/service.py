import logging
from .adapter import SearchAdapter
from fastapi import HTTPException, status
from .models import CafeResponse
from typing import List
from agent.agent import Agent
from database.config import get_async_db
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

logger = logging.getLogger(__name__)

class SearchService:
    def __init__(self, search_adapter: SearchAdapter):
        self.search_adapter = search_adapter

    async def search(self, query: str) -> List[CafeResponse]:
        
        try:
            agent = Agent()
            response = agent.generate_response(query)
            if response is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bir hata oluştu"
                )
            fields = response['fields']
                
            logger.info(f"SearchService: Search attempt for query: {query}")
            
            return await self.search_adapter.search(query, fields)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"SearchService: Unexpected error during search for {query}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Sunucu hatası"
            )

    async def get_top_places(self, limit: int = 10):
        try:
            return await self.search_adapter.get_top_places(limit)
        except Exception:
            raise

def get_search_service(db: AsyncSession = Depends(get_async_db)) -> SearchService:
    search_adapter = SearchAdapter(db)
    return SearchService(search_adapter)



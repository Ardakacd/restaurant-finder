import logging
from .adapter import SearchAdapter
from fastapi import HTTPException, status
from .models import Place
from typing import List
from agent.agent import Agent

logger = logging.getLogger(__name__)

class SearchService:
    def __init__(self, search_adapter: SearchAdapter):
        self.search_adapter = search_adapter

    async def search(self, query: str) -> List[Place]:
        
        try:
            agent = Agent()
            response = agent.generate_response(query)
            if response is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bir hata oluştu"
                )
            query = response['searchQuery']
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

def get_search_service() -> SearchService:
    search_adapter = SearchAdapter()
    return SearchService(search_adapter)



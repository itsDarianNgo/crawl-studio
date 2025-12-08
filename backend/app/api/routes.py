from fastapi import APIRouter, Depends

from app.api.dependencies import get_crawl_service
from app.core.crawler import CrawlService
from app.schemas.request import CrawlRequest
from app.schemas.response import CrawlResponse

router = APIRouter()


@router.post("/crawl", response_model=CrawlResponse)
async def crawl(request: CrawlRequest, service: CrawlService = Depends(get_crawl_service)) -> CrawlResponse:
    return await service.crawl(request)

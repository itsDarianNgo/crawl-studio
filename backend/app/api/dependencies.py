from functools import lru_cache

from app.core.crawler import CrawlService


@lru_cache
def get_crawl_service() -> CrawlService:
    return CrawlService()

import asyncio
from typing import ClassVar, Optional

from crawl4ai import AsyncWebCrawler

from ..schemas.request import CrawlRequest
from ..schemas.response import CrawlResponse


class CrawlService:
    _instance: ClassVar[Optional["CrawlService"]] = None
    _initialized: bool = False

    def __new__(cls) -> "CrawlService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if not self._initialized:
            self.semaphore = asyncio.Semaphore(3)
            self.__class__._initialized = True

    @classmethod
    def get_instance(cls) -> "CrawlService":
        return cls()

    async def crawl(self, request: CrawlRequest) -> CrawlResponse:
        async with self.semaphore:
            try:
                async with AsyncWebCrawler(verbose=True) as crawler:
                    result = await crawler.arun(
                        url=str(request.url),
                        screenshot=True,
                        css_selector=request.css_selector,
                        word_count_threshold=request.word_count_threshold,
                        bypass_cache=request.bypass_cache,
                        magic=True,
                    )

                print(
                    f"DEBUG: Crawl Result - Screenshot Length: {len(result.screenshot) if result.screenshot else 'None'}"
                )

                metadata = getattr(result, "metadata", {}) or {}
                html_content = getattr(result, "html", None)
                markdown_content = getattr(result, "markdown", "")

                return CrawlResponse(
                    markdown=markdown_content,
                    html=html_content,
                    screenshot_base64=result.screenshot,
                    metadata=metadata,
                    success=True,
                    error_message=None,
                )
            except Exception as exc:  # noqa: BLE001
                return CrawlResponse(
                    markdown="",
                    html=None,
                    screenshot_base64=None,
                    metadata={},
                    success=False,
                    error_message=str(exc),
                )

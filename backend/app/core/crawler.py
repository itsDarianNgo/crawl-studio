import asyncio
import base64
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
                        screenshot=request.screenshot,
                        css_selector=request.css_selector,
                        word_count_threshold=request.word_count_threshold,
                        bypass_cache=request.bypass_cache,
                    )

                screenshot_base64 = None
                if request.screenshot:
                    screenshot_data = getattr(result, "screenshot", None)
                    if screenshot_data:
                        if isinstance(screenshot_data, bytes):
                            screenshot_base64 = base64.b64encode(screenshot_data).decode("utf-8")
                        elif isinstance(screenshot_data, str):
                            screenshot_base64 = screenshot_data

                metadata = getattr(result, "metadata", {}) or {}
                html_content = getattr(result, "html", None)
                markdown_content = getattr(result, "markdown", "")

                return CrawlResponse(
                    markdown=markdown_content,
                    html=html_content,
                    screenshot_base64=screenshot_base64,
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

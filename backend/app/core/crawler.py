import asyncio
import os
from typing import ClassVar, Optional

from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig
from crawl4ai.content_filter_strategy import PruningContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.extraction_strategy import LLMExtractionStrategy
from crawl4ai.llm_config import LLMConfig

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
            self.browser_config = BrowserConfig(
                headless=True,
                viewport_width=1920,
                viewport_height=1080,
                verbose=True,
            )
            self.__class__._initialized = True

    @classmethod
    def get_instance(cls) -> "CrawlService":
        return cls()

    async def crawl(self, request: CrawlRequest) -> CrawlResponse:
        async with self.semaphore:
            try:
                md_generator = None
                extraction_strategy = None
                if request.smart_mode:
                    prune_filter = PruningContentFilter(
                        threshold=0.5,
                        threshold_type="fixed",
                        min_word_threshold=30,
                    )
                    md_generator = DefaultMarkdownGenerator(
                        content_filter=prune_filter
                    )

                if request.instruction:
                    provider = os.getenv("LLM_PROVIDER", "openai/gpt-4o-mini")
                    api_token = request.api_token or os.getenv("OPENAI_API_KEY")
                    extraction_instruction = (
                        "Extract structured data as JSON matching this description: "
                        f"{request.instruction}"
                    )
                    llm_config = LLMConfig(
                        provider=provider,
                        api_token=api_token,
                        instruction=extraction_instruction,
                        extraction_type="block",
                    )
                    extraction_strategy = LLMExtractionStrategy(config=llm_config)

                run_config = CrawlerRunConfig(
                    screenshot=True,
                    cache_mode=CacheMode.BYPASS
                    if request.bypass_cache
                    else CacheMode.ENABLED,
                    word_count_threshold=request.word_count_threshold,
                    css_selector=request.css_selector,
                    markdown_generator=md_generator,
                    extraction_strategy=extraction_strategy,
                )

                async with AsyncWebCrawler(
                    verbose=True, config=self.browser_config
                ) as crawler:
                    result = await crawler.arun(
                        url=str(request.url),
                        config=run_config,
                    )

                print(
                    f"DEBUG: Crawl Result - Screenshot Length: {len(result.screenshot) if result.screenshot else 'None'}"
                )
                print(f"DEBUG: Result Attributes: {dir(result)}")
                print(f"DEBUG: Screenshot Field: {result.screenshot is not None}")

                metadata = getattr(result, "metadata", {}) or {}
                html_content = getattr(result, "html", None)
                markdown_content = getattr(result, "markdown", "")
                extracted_content = getattr(result, "extracted_content", None)

                return CrawlResponse(
                    markdown=markdown_content,
                    html=html_content,
                    screenshot_base64=result.screenshot,
                    metadata=metadata,
                    extracted_content=extracted_content,
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

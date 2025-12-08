import asyncio
import os
import json
from typing import ClassVar, Optional, Dict, Any, List

from pydantic import BaseModel, Field

from crawl4ai import (
    AsyncWebCrawler,
    BrowserConfig,
    CrawlerRunConfig,
    CacheMode,
    LLMConfig,
)
from crawl4ai.content_filter_strategy import PruningContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.extraction_strategy import LLMExtractionStrategy

from ..schemas.request import CrawlRequest
from ..schemas.response import CrawlResponse


class ExtractedData(BaseModel):
    items: List[Dict[str, Any]] = Field(
        ..., description="List of extracted items with named keys (e.g. name, price)"
    )


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
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
            )
            self.__class__._initialized = True

    @classmethod
    def get_instance(cls) -> "CrawlService":
        return cls()

    async def crawl(self, request: CrawlRequest) -> CrawlResponse:
        async with self.semaphore:
            try:
                # 1. SETUP PRUNING (Safer than BM25)
                prune_filter = PruningContentFilter(
                    threshold=0.45,
                    threshold_type="fixed",
                    min_word_threshold=10,
                )
                md_generator = DefaultMarkdownGenerator(content_filter=prune_filter)

                # 2. SETUP LLM (If instruction provided)
                extraction_strategy = None
                if request.instruction:
                    api_token = request.api_token or os.getenv("OPENAI_API_KEY")
                    if not api_token:
                        print(
                            "WARN: OPENAI_API_KEY is not set; LLM extraction will likely fail."
                        )
                        api_token = "MISSING_API_KEY"

                    llm_config = LLMConfig(
                        provider="openai/gpt-4o-mini",
                        api_token=api_token,
                    )
                    extraction_strategy = LLMExtractionStrategy(
                        llm_config=llm_config,
                        instruction=request.instruction,
                        extraction_type="block",  # Flexible block extraction
                        verbose=True,
                    )

                # 3. RUN CONFIG (The "PWA Tank" Settings)
                run_config = CrawlerRunConfig(
                    extraction_strategy=extraction_strategy,
                    markdown_generator=md_generator,
                    scan_full_page=True,
                    scroll_delay=2.0,  # Slow scroll for image loading
                    wait_for_images=True,  # Wait for pixels
                    wait_until="domcontentloaded",
                    page_timeout=120000,  # 2 Minutes
                    screenshot=True,
                    screenshot_height_threshold=20000,
                    magic=True,
                    remove_overlay_elements=True,  # Remove cookie banners
                    cache_mode=CacheMode.BYPASS
                    if request.bypass_cache
                    else CacheMode.ENABLED,
                    word_count_threshold=request.word_count_threshold,
                    css_selector=request.css_selector,
                )

                # 4. BROWSER CONFIG
                async with AsyncWebCrawler(config=self.browser_config) as crawler:
                    result = await crawler.arun(
                        url=str(request.url),
                        config=run_config,
                    )

                # 5. RESULT MAPPING (Prefer Fit Markdown)
                final_markdown = ""
                if result.markdown:
                    if (
                        hasattr(result.markdown, "fit_markdown")
                        and result.markdown.fit_markdown
                    ):
                        final_markdown = result.markdown.fit_markdown
                    elif (
                        hasattr(result.markdown, "raw_markdown")
                        and result.markdown.raw_markdown
                    ):
                        final_markdown = result.markdown.raw_markdown
                    else:
                        final_markdown = str(result.markdown)

                extracted_data = result.extracted_content
                if extracted_data and not isinstance(extracted_data, str):
                    try:
                        extracted_data = json.dumps(extracted_data, indent=2)
                    except TypeError:
                        extracted_data = str(extracted_data)

                return CrawlResponse(
                    markdown=final_markdown or "",
                    html=str(result.html)[:500] if result.html else "",
                    screenshot_base64=result.screenshot,
                    metadata=result.metadata or {},
                    extracted_content=extracted_data,
                    success=result.success,
                    error_message=result.error_message,
                )

            except Exception as exc:  # noqa: BLE001
                print(f"Crawl Failed: {exc}")
                return CrawlResponse(
                    markdown="",
                    html="",
                    screenshot_base64=None,
                    metadata={},
                    extracted_content=None,
                    success=False,
                    error_message=str(exc),
                )

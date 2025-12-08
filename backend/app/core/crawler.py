import asyncio
import os
from typing import Any, ClassVar, Dict, List, Optional

from crawl4ai import (
    AsyncWebCrawler,
    BrowserConfig,
    CacheMode,
    CrawlerRunConfig,
    LLMConfig,
)
from crawl4ai.content_filter_strategy import BM25ContentFilter
from crawl4ai.extraction_strategy import LLMExtractionStrategy
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from pydantic import BaseModel, Field

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
                if request.instruction:
                    bm25_filter = BM25ContentFilter(
                        user_query=request.instruction,
                        bm25_threshold=1.0,
                    )
                    md_generator = DefaultMarkdownGenerator(content_filter=bm25_filter)
                else:
                    md_generator = DefaultMarkdownGenerator()

                extraction_strategy = None
                if request.instruction:
                    provider = os.getenv("LLM_PROVIDER", "openai/gpt-4o-mini")
                    api_token = request.api_token or os.getenv("OPENAI_API_KEY")
                    if not api_token:
                        print(
                            "WARN: OPENAI_API_KEY is not set; LLM extraction will likely fail."
                        )
                        api_token = "MISSING_API_KEY"

                    llm_config = LLMConfig(
                        provider=provider,
                        api_token=api_token,
                    )

                    extraction_strategy = LLMExtractionStrategy(
                        llm_config=llm_config,
                        instruction=(
                            f"{request.instruction}. Return a list of objects with descriptive keys."
                        ),
                        schema=ExtractedData.model_json_schema(),
                        extraction_type="schema",
                        input_format="fit_markdown",
                        verbose=True,
                    )

                run_config = CrawlerRunConfig(
                    extraction_strategy=extraction_strategy,
                    markdown_generator=md_generator,
                    scan_full_page=True,
                    scroll_delay=1.0,
                    wait_for_images=True,
                    wait_until="domcontentloaded",
                    page_timeout=120000,
                    screenshot=True,
                    screenshot_height_threshold=20000,
                    magic=True,
                    cache_mode=CacheMode.BYPASS
                    if request.bypass_cache
                    else CacheMode.ENABLED,
                    word_count_threshold=request.word_count_threshold,
                    css_selector=request.css_selector,
                    remove_overlay_elements=True,
                )

                async with AsyncWebCrawler(config=self.browser_config, verbose=True) as crawler:
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
                html_content_raw = getattr(result, "html", None)
                markdown_content_raw = getattr(result, "markdown", "")
                extracted_content = getattr(result, "extracted_content", None)

                final_markdown = ""
                if markdown_content_raw:
                    if (
                        hasattr(markdown_content_raw, "fit_markdown")
                        and markdown_content_raw.fit_markdown
                    ):
                        final_markdown = markdown_content_raw.fit_markdown
                    elif (
                        hasattr(markdown_content_raw, "raw_markdown")
                        and markdown_content_raw.raw_markdown
                    ):
                        final_markdown = markdown_content_raw.raw_markdown
                    else:
                        final_markdown = str(markdown_content_raw)

                html_content = str(html_content_raw) if html_content_raw else ""

                return CrawlResponse(
                    markdown=final_markdown,
                    html=html_content,
                    screenshot_base64=result.screenshot if result.screenshot else None,
                    metadata=metadata,
                    extracted_content=extracted_content,
                    success=bool(getattr(result, "success", True)),
                    error_message=getattr(result, "error_message", None),
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

import asyncio
import base64
import io
import json
import os
from typing import Any, ClassVar, Dict, List, Optional

from PIL import Image

from pydantic import BaseModel, Field

from crawl4ai import (
    AsyncWebCrawler,
    BrowserConfig,
    CacheMode,
    CrawlerRunConfig,
    LLMConfig,
)
from crawl4ai.extraction_strategy import LLMExtractionStrategy
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator

from ..schemas.request import CrawlRequest
from ..schemas.response import CrawlResponse


class ExtractedItem(BaseModel):
    index: int
    data: Dict[str, Any] = Field(
        ..., description="The extracted item with descriptive keys (e.g. name, price, date)"
    )


class ExtractedList(BaseModel):
    items: List[ExtractedItem]


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
                        instruction=(
                            f"{request.instruction}. Map extracted data to the 'data' "
                            "dictionary with clear keys."
                        ),
                        schema=ExtractedList.model_json_schema(),
                        extraction_type="schema",
                        verbose=True,
                    )

                md_generator = DefaultMarkdownGenerator()

                run_config = CrawlerRunConfig(
                    extraction_strategy=extraction_strategy,
                    markdown_generator=md_generator,
                    excluded_tags=["nav", "footer", "header", "aside", "script", "style"],
                    scan_full_page=True,
                    scroll_delay=2.0,
                    wait_for_images=True,
                    wait_until="domcontentloaded",
                    page_timeout=120000,
                    screenshot=True,
                    magic=True,
                    cache_mode=CacheMode.BYPASS if request.bypass_cache else CacheMode.ENABLED,
                    word_count_threshold=request.word_count_threshold,
                    css_selector=request.css_selector,
                )

                async with AsyncWebCrawler(config=self.browser_config) as crawler:
                    result = await crawler.arun(
                        url=str(request.url),
                        config=run_config,
                    )

                optimized_screenshot = None
                if result.screenshot:
                    try:
                        image_data = base64.b64decode(result.screenshot)
                        img = Image.open(io.BytesIO(image_data))

                        if img.mode in ("RGBA", "P"):
                            img = img.convert("RGB")

                        max_width = 1920
                        if img.width > max_width:
                            ratio = max_width / float(img.width)
                            new_height = int(float(img.height) * ratio)
                            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

                        buffer = io.BytesIO()
                        img.save(buffer, format="JPEG", quality=60, optimize=True)
                        optimized_screenshot = base64.b64encode(buffer.getvalue()).decode("utf-8")
                    except Exception as exc:  # noqa: BLE001
                        print(f"Image optimization failed: {exc}")
                        optimized_screenshot = result.screenshot

                final_markdown = ""
                if result.markdown:
                    if hasattr(result.markdown, "raw_markdown") and result.markdown.raw_markdown:
                        final_markdown = result.markdown.raw_markdown
                    else:
                        final_markdown = str(result.markdown)

                extracted_data = result.extracted_content
                if isinstance(extracted_data, str):
                    try:
                        extracted_data = json.loads(extracted_data)
                    except Exception:  # noqa: BLE001
                        pass

                return CrawlResponse(
                    markdown=final_markdown or "",
                    html=str(result.html)[:500] if result.html else "",
                    screenshot_base64=optimized_screenshot,
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

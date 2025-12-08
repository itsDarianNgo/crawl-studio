from typing import Optional

from pydantic import BaseModel, Field, HttpUrl, field_validator


class CrawlRequest(BaseModel):
    url: HttpUrl
    word_count_threshold: int = Field(default=10)
    css_selector: Optional[str] = None
    screenshot: bool = True
    bypass_cache: bool = True
    smart_mode: bool = True
    instruction: Optional[str] = None
    api_token: Optional[str] = None

    @field_validator("word_count_threshold")
    @classmethod
    def validate_word_count_threshold(cls, value: int) -> int:
        if value < 0:
            raise ValueError("word_count_threshold must be non-negative")
        return value

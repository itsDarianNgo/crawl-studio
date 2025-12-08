from typing import Any, Dict, Optional
from pydantic import BaseModel


class CrawlResponse(BaseModel):
    markdown: str
    html: Optional[str] = None
    screenshot_base64: Optional[str] = None
    metadata: Dict[str, Any]
    success: bool
    error_message: Optional[str] = None

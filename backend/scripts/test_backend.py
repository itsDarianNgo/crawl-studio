"""Basic integration test for the CrawlStudio backend API."""

import asyncio
from typing import Any, Dict

import httpx

BASE_URL = "http://127.0.0.1:8000"
HEALTH_ENDPOINT = f"{BASE_URL}/health"
CRAWL_ENDPOINT = f"{BASE_URL}/api/v1/crawl"


async def wait_for_health(timeout: float = 30.0, interval: float = 1.0) -> None:
    """Poll the health endpoint until the service is ready or timeout expires."""
    deadline = asyncio.get_event_loop().time() + timeout
    async with httpx.AsyncClient() as client:
        while True:
            try:
                response = await client.get(HEALTH_ENDPOINT, timeout=5.0)
                if response.status_code == 200:
                    return
            except httpx.HTTPError:
                pass

            if asyncio.get_event_loop().time() >= deadline:
                raise TimeoutError("Service did not become healthy within the expected time.")

            await asyncio.sleep(interval)


def validate_response(payload: Dict[str, Any]) -> None:
    """Validate the crawl response payload and raise AssertionError on failure."""
    assert payload.get("success") is True, "Expected success flag to be True"
    markdown = payload.get("markdown")
    assert isinstance(markdown, str) and markdown.strip(), "Markdown content is empty"
    screenshot = payload.get("screenshot_base64")
    assert screenshot is not None and isinstance(screenshot, str), "Screenshot is missing"
    print(f"Screenshot base64 (first 50 chars): {screenshot[:50]}")


async def run_test() -> None:
    await wait_for_health()

    request_body = {
        "url": "https://example.com",
        "word_count_threshold": 10,
        "screenshot": True,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(CRAWL_ENDPOINT, json=request_body, timeout=60.0)
        if response.status_code != 200:
            raise AssertionError(f"Unexpected status code: {response.status_code}")

        payload = response.json()
        validate_response(payload)

    print("✅ Backend Test Passed!")


if __name__ == "__main__":
    try:
        asyncio.run(run_test())
    except Exception as exc:  # noqa: BLE001
        print(f"❌ Backend Test Failed: {exc}")

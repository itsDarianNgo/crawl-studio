import sys
import asyncio
import uvicorn

if __name__ == "__main__":
    # Force Windows to use the ProactorEventLoop (Required for Playwright)
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        print("✅ Windows ProactorEventLoop Policy Activated")

    # CRITICAL: reload=False ensures we stay in this process where the policy is applied.
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False, loop="asyncio")

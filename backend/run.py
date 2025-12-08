import sys
import asyncio
import uvicorn

if __name__ == "__main__":
    # Force Windows to use the ProactorEventLoop (Required for Playwright)
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        print("✅ Windows ProactorEventLoop Policy Activated")

    # Run Uvicorn with loop="asyncio" to respect the policy
    # We disable reload for now to isolate the process, but you can enable it if it works.
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True, loop="asyncio")

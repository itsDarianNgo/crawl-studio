import subprocess
import sys
import time
import os
import signal


def run_app():
    # 1. Define paths
    ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
    BACKEND_SCRIPT = os.path.join(ROOT_DIR, "backend", "run.py")
    FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

    print(f"🚀 Starting CrawlStudio from {ROOT_DIR}...")
    print(f"🐍 Using Python: {sys.executable}")

    # 2. Start Backend
    # We pass the environment variables to ensure it inherits the venv
    backend_process = subprocess.Popen(
        [sys.executable, BACKEND_SCRIPT],
        cwd=ROOT_DIR,
        env=os.environ.copy()
    )
    print(f"✅ Backend started (PID: {backend_process.pid})")

    # Give backend a moment to fail if it's going to fail (e.g. port in use)
    time.sleep(2)
    if backend_process.poll() is not None:
        print("❌ Backend crashed immediately! Check logs above.")
        return

    # 3. Start Frontend
    # Use 'npm.cmd' on Windows, 'npm' on Unix
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_process = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
        env=os.environ.copy()
    )
    print(f"✅ Frontend started (PID: {frontend_process.pid})")

    print("\n--- App Running at http://localhost:5173 ---")
    print("--- Press Ctrl+C to Stop ---\n")

    try:
        # Keep main script alive
        while True:
            time.sleep(1)
            # Check if processes are still alive
            if backend_process.poll() is not None:
                print("❌ Backend process died unexpectedly.")
                break
            if frontend_process.poll() is not None:
                print("❌ Frontend process died unexpectedly.")
                break
    except KeyboardInterrupt:
        print("\n🚕 Stopping CrawlStudio...")
    finally:
        # Cleanup
        backend_process.terminate()
        frontend_process.terminate()
        print("👋 Goodbye!")


if __name__ == "__main__":
    run_app()

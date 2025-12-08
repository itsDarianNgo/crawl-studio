import platform
import signal
import subprocess
import sys
import time
from pathlib import Path


def launch_process(command, cwd=None):
    is_windows = platform.system().lower().startswith("win")
    return subprocess.Popen(
        command,
        cwd=cwd,
        shell=is_windows,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def main():
    project_root = Path(__file__).parent

    backend_cmd = [sys.executable, "backend/run.py"]
    frontend_cmd = ["npm", "run", "dev"]

    backend_proc = launch_process(backend_cmd, cwd=project_root)
    frontend_proc = launch_process(frontend_cmd, cwd=project_root / "frontend")

    print("Backend and frontend processes started. Press Ctrl+C to stop.")

    try:
        while True:
            if backend_proc.poll() is not None:
                print("Backend process exited. Shutting down...")
                break
            if frontend_proc.poll() is not None:
                print("Frontend process exited. Shutting down...")
                break
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nShutting down processes...")
        for proc in (backend_proc, frontend_proc):
            if proc and proc.poll() is None:
                try:
                    if platform.system().lower().startswith("win"):
                        proc.send_signal(signal.CTRL_BREAK_EVENT)
                    else:
                        proc.terminate()
                except Exception:
                    pass
    finally:
        for proc in (backend_proc, frontend_proc):
            if proc and proc.poll() is None:
                proc.kill()


if __name__ == "__main__":
    main()

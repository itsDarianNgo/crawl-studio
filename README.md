# CrawlStudio

A modern visual interface for the `crawl4ai` library. CrawlStudio pairs a local FastAPI backend with a Vite/React frontend to let you iterate on selectors, capture screenshots, and review extracted Markdown/JSON instantly.

## Features
- **Smart Mode (Pruning)** to automatically remove navigation, ads, and noise before generating Markdown.
- **Screenshot Capture** for a live visual alongside extracted content.
- **History (IndexedDB)** so you can revisit previous crawls with stored screenshots and options.
- **Markdown/JSON Export** with copy/download helpers and syntax highlighting.

## Installation
1. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Install Playwright browsers (required for screenshots):
   ```bash
   playwright install
   ```
3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

## Usage
From the project root, launch both backend and frontend:
```bash
python start.py
```

The frontend dev server (Vite) will proxy API calls to the FastAPI backend running on localhost.

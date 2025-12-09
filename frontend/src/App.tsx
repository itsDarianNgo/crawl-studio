import { useEffect, useMemo, useState } from "react";
import { FileJson, Globe, Loader2, Sparkles } from "lucide-react";
import { crawlUrl, CrawlResponse, CrawlRequest } from "./lib/api";
import { cn } from "./lib/utils";
import { CodeViewer } from "./components/CodeViewer";
import { Sidebar } from "./components/Sidebar";
import {
  clearHistory,
  getHistory,
  HistoryItem,
  saveCrawl,
} from "./lib/storage";

const DEFAULT_OPTIONS: Partial<CrawlRequest> = {
  screenshot: true,
  bypass_cache: true,
  smart_mode: true,
  word_count_threshold: 10,
};

function App() {
  const [url, setUrl] = useState("https://example.com");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CrawlResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"markdown" | "json">("markdown");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [options, setOptions] = useState<Partial<CrawlRequest>>(DEFAULT_OPTIONS);

  useEffect(() => {
    (async () => {
      const stored = await getHistory();
      setHistory(stored);
    })();
  }, []);

  const refreshHistory = async () => {
    const stored = await getHistory();
    setHistory(stored);
    return stored;
  };

  const screenshotSrc = useMemo(() => {
    if (!result?.screenshot_base64) return null;
    const hasPrefix = result.screenshot_base64.startsWith("data:image");
    return hasPrefix
      ? result.screenshot_base64
      : `data:image/png;base64,${result.screenshot_base64}`;
  }, [result]);

  const handleCrawl = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const request: CrawlRequest = {
        url,
        instruction: prompt || undefined,
        ...DEFAULT_OPTIONS,
        ...options,
      };
      const response = await crawlUrl(request);

      setResult(response);
      setView(request.instruction ? "json" : "markdown");
      if (!response.success) {
        setError(response.error_message ?? "Crawl failed");
      } else {
        await saveCrawl(url, request, response);
        const list = await refreshHistory();
        setActiveHistoryId(list[0]?.id ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setActiveHistoryId(item.id);
    setUrl(item.url);
    setPrompt(item.options.instruction ?? "");
    setOptions({
      ...DEFAULT_OPTIONS,
      ...item.options,
    });
    setResult(item);
    setView(item.options.instruction ? "json" : "markdown");
    setError(null);
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
    setActiveHistoryId(null);
  };

  const codeContent =
    view === "markdown"
      ? result?.markdown || "No markdown returned."
      : JSON.stringify(result?.extracted_content ?? result ?? {}, null, 2);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar
        history={history}
        onSelect={handleSelectHistory}
        onClear={handleClearHistory}
        activeId={activeHistoryId ?? undefined}
      />

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Globe className="h-5 w-5 text-blue-400" />
              <span>CrawlStudio</span>
            </div>
            <div className="flex flex-col gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a URL to crawl"
              />
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="e.g., Extract all product names and prices."
              />
              <div className="flex justify-end">
                <button
                  onClick={handleCrawl}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Magic Crawl
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex-1 max-w-6xl space-y-6 px-4 py-8">
          {error && (
            <div className="rounded border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-300">Screenshot</h2>
              <div className="relative h-[calc(100vh-12rem)] overflow-y-auto rounded-lg border border-slate-800 bg-slate-900">
                {isLoading ? (
                  <div className="h-full w-full animate-pulse bg-slate-800/60" />
                ) : screenshotSrc ? (
                  <img src={screenshotSrc} alt="Page screenshot" className="block h-auto w-full" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                    No screenshot yet
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  className={cn(
                    "inline-flex items-center gap-2 rounded px-3 py-1 text-sm font-medium",
                    view === "markdown"
                      ? "bg-slate-800 text-blue-300"
                      : "text-slate-300 hover:bg-slate-800/60"
                  )}
                  onClick={() => setView("markdown")}
                >
                  <Globe className="h-4 w-4" /> Markdown
                </button>
                <button
                  className={cn(
                    "inline-flex items-center gap-2 rounded px-3 py-1 text-sm font-medium",
                    view === "json"
                      ? "bg-slate-800 text-blue-300"
                      : "text-slate-300 hover:bg-slate-800/60"
                  )}
                  onClick={() => setView("json")}
                >
                  <FileJson className="h-4 w-4" /> JSON
                </button>
              </div>

              <CodeViewer content={codeContent} language={view} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

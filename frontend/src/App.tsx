import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { FileJson, Globe, Loader2, Play } from "lucide-react";
import { crawlUrl, CrawlResponse } from "./lib/api";
import { cn } from "./lib/utils";

function App() {
  const [url, setUrl] = useState("https://example.com");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CrawlResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"markdown" | "json">("markdown");

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
      const response = await crawlUrl({
        url,
        screenshot: true,
        bypass_cache: true,
        word_count_threshold: 10,
      });

      setResult(response);
      if (!response.success) {
        setError(response.error_message ?? "Crawl failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Globe className="h-5 w-5 text-blue-400" />
            <span>CrawlStudio</span>
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded border border-slate-700 bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a URL to crawl"
          />
          <button
            onClick={handleCrawl}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Crawl
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {error && (
          <div className="rounded border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-300">Screenshot</h2>
            <div className="relative aspect-video overflow-hidden rounded-md border border-slate-800 bg-slate-900">
              {isLoading ? (
                <div className="h-full w-full animate-pulse bg-slate-800/60" />
              ) : screenshotSrc ? (
                <img
                  src={screenshotSrc}
                  alt="Page screenshot"
                  className="h-full w-full object-cover"
                />
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

            {view === "markdown" ? (
              <div className="prose prose-invert max-w-none prose-headings:text-slate-50 prose-p:text-slate-200 prose-a:text-blue-400 prose-strong:text-slate-50">
                {result ? (
                  <ReactMarkdown>{result.markdown || "No markdown returned."}</ReactMarkdown>
                ) : (
                  <p className="text-sm text-slate-400">Run a crawl to see results.</p>
                )}
              </div>
            ) : (
              <pre className="max-h-[70vh] overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-200">
                {result ? JSON.stringify(result, null, 2) : "No data yet."}
              </pre>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

import { useMemo, useState } from "react";
import { FileJson, Globe, Loader2, Play, Settings } from "lucide-react";
import { crawlUrl, CrawlResponse, CrawlRequest } from "./lib/api";
import { cn } from "./lib/utils";
import { SettingsPanel } from "./components/SettingsPanel";
import { CodeViewer } from "./components/CodeViewer";

function App() {
  const [url, setUrl] = useState("https://example.com");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CrawlResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"markdown" | "json">("markdown");
  const [showSettings, setShowSettings] = useState(false);
  const [options, setOptions] = useState<
    Pick<
      CrawlRequest,
      "css_selector" | "word_count_threshold" | "bypass_cache" | "screenshot"
    >
  >({
    css_selector: "",
    word_count_threshold: 10,
    bypass_cache: true,
    screenshot: true,
  });

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
        ...options,
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

  const codeContent =
    view === "markdown"
      ? result?.markdown || "No markdown returned."
      : JSON.stringify(result ?? {}, null, 2);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Globe className="h-5 w-5 text-blue-400" />
            <span>CrawlStudio</span>
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 min-w-[240px] rounded border border-slate-700 bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a URL to crawl"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 shadow hover:border-blue-500 hover:text-blue-300"
            >
              <Settings className="h-4 w-4" /> Settings
            </button>
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
        </div>
        {showSettings && (
          <div className="mx-auto max-w-6xl px-4 pb-4">
            <SettingsPanel options={options} onChange={setOptions} />
          </div>
        )}
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

            <CodeViewer content={codeContent} language={view} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

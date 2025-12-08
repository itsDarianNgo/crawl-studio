import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeViewerProps {
  content: string;
  language: "markdown" | "json";
}

export function CodeViewer({ content, language }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const formattedContent = useMemo(() => {
    if (language !== "json") return content;
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch (err) {
      return content;
    }
  }, [content, language]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedContent);
    setCopied(true);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = language === "json" ? "crawl-result.json" : "crawl-result.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative group rounded border border-slate-800 bg-slate-950/60">
      <div className="absolute right-3 top-3 z-10 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 hover:border-blue-500 hover:text-blue-300"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 hover:border-blue-500 hover:text-blue-300"
        >
          <Download className="h-3 w-3" /> Download
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers
        wrapLines
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          fontSize: "14px",
          lineHeight: "1.5",
          background: "#1e1e1e",
          padding: "1.5rem",
        }}
      >
        {formattedContent}
      </SyntaxHighlighter>
    </div>
  );
}

export default CodeViewer;

import { useEffect, useState } from "react";
import { Copy, Download, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = language === "json" ? "crawl-result.json" : "crawl-result.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative max-h-[70vh] overflow-auto rounded border border-slate-800 bg-slate-950">
      <div className="absolute right-3 top-3 flex gap-2">
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
        style={atomOneDark}
        customStyle={{ margin: 0, paddingTop: "3rem", background: "transparent" }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}

export default CodeViewer;

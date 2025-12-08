import { ChangeEvent, useState } from "react";
import { CrawlRequest } from "../lib/api";
import { SchemaBuilder } from "./SchemaBuilder";

interface SettingsPanelProps {
  options: Pick<
    CrawlRequest,
    | "css_selector"
    | "word_count_threshold"
    | "bypass_cache"
    | "smart_mode"
    | "extraction_schema"
  >;
  onChange: (options: SettingsPanelProps["options"]) => void;
}

export function SettingsPanel({ options, onChange }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<"general" | "extraction">(
    "general"
  );

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
    key: keyof SettingsPanelProps["options"]
  ) => {
    const value =
      event.target.type === "checkbox"
        ? (event.target as HTMLInputElement).checked
        : event.target.value;

    onChange({
      ...options,
      [key]: event.target.type === "number" ? Number(value) : value,
    });
  };

  const handleSchemaChange = (schema: Record<string, unknown> | null) => {
    onChange({
      ...options,
      extraction_schema: schema || undefined,
    });
  };

  return (
    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`rounded px-3 py-1 text-sm font-semibold ${
            activeTab === "general"
              ? "bg-slate-800 text-blue-300"
              : "text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("extraction")}
          className={`rounded px-3 py-1 text-sm font-semibold ${
            activeTab === "extraction"
              ? "bg-slate-800 text-blue-300"
              : "text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          Extraction
        </button>
      </div>

      {activeTab === "general" ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-medium text-slate-100">
              <span>Smart Mode (Auto-Remove Ads/Nav)</span>
              <input
                type="checkbox"
                checked={options.smart_mode ?? true}
                onChange={(e) => handleInputChange(e, "smart_mode")}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-medium text-slate-100">
              <span>Bypass Cache</span>
              <input
                type="checkbox"
                checked={options.bypass_cache ?? true}
                onChange={(e) => handleInputChange(e, "bypass_cache")}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <details className="group rounded border border-slate-800 bg-slate-950/40 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-200">
              Advanced Configuration (CSS Selectors)
            </summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">CSS Selector</label>
                <input
                  type="text"
                  value={options.css_selector ?? ""}
                  onChange={(e) => handleInputChange(e, "css_selector")}
                  placeholder="article.content"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-400">
                  Optional. E.g., "article.content" to scrape only that element.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Word Count Threshold</label>
                <input
                  type="number"
                  min={0}
                  value={options.word_count_threshold ?? 10}
                  onChange={(e) => handleInputChange(e, "word_count_threshold")}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </details>
        </div>
      ) : (
        <SchemaBuilder
          onChange={handleSchemaChange}
          initialSchema={options.extraction_schema ?? null}
        />
      )}
    </div>
  );
}

export default SettingsPanel;

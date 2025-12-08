import { ChangeEvent } from "react";
import { CrawlRequest } from "../lib/api";

interface SettingsPanelProps {
  options: Pick<
    CrawlRequest,
    "css_selector" | "word_count_threshold" | "bypass_cache" | "screenshot"
  >;
  onChange: (options: SettingsPanelProps["options"]) => void;
}

export function SettingsPanel({ options, onChange }: SettingsPanelProps) {
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

  return (
    <div className="mt-4 grid gap-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-3">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200">CSS Selector</label>
        <input
          type="text"
          value={options.css_selector ?? ""}
          onChange={(e) => handleInputChange(e, "css_selector")}
          placeholder="article.content"
          className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
      <div className="flex items-center gap-3 rounded border border-slate-800 bg-slate-950/40 px-3 py-2">
        <input
          id="bypass_cache"
          type="checkbox"
          checked={options.bypass_cache ?? true}
          onChange={(e) => handleInputChange(e, "bypass_cache")}
          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="bypass_cache" className="text-sm text-slate-200">
          Bypass Cache
        </label>
      </div>
    </div>
  );
}

export default SettingsPanel;

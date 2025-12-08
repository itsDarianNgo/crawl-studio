import { History, Trash2 } from "lucide-react";
import { HistoryItem } from "../lib/storage";
import { cn } from "../lib/utils";

interface SidebarProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  activeId?: string;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

function truncate(text: string, max = 42): string {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export function Sidebar({ history, onSelect, onClear, activeId }: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <History className="h-4 w-4 text-blue-400" />
          <span>History</span>
        </div>
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs font-medium text-slate-200 hover:border-red-500 hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {history.length === 0 ? (
          <div className="rounded border border-dashed border-slate-800 bg-slate-950/40 px-3 py-4 text-center text-xs text-slate-400">
            No history yet. Run a crawl to see entries here.
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={cn(
                "w-full rounded border px-3 py-2 text-left transition",
                activeId === item.id
                  ? "border-blue-500 bg-slate-800 text-blue-100"
                  : "border-slate-800 bg-slate-950/40 text-slate-100 hover:border-blue-500/50 hover:bg-slate-800/60"
              )}
            >
              <div className="truncate text-sm font-semibold">{truncate(item.url)}</div>
              <div className="text-xs text-slate-400">{formatTime(item.createdAt)}</div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

export default Sidebar;

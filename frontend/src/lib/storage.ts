import { get, set } from "idb-keyval";
import { CrawlRequest, CrawlResponse } from "./api";

export interface HistoryItem extends CrawlResponse {
  id: string;
  url: string;
  createdAt: number;
  options: CrawlRequest;
}

const HISTORY_KEY = "crawl-history";
const HISTORY_LIMIT = 20;

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}`;
}

export async function getHistory(): Promise<HistoryItem[]> {
  const existing = await get<HistoryItem[]>(HISTORY_KEY);
  return existing ?? [];
}

export async function saveCrawl(
  url: string,
  options: CrawlRequest,
  result: CrawlResponse
): Promise<void> {
  const history = await getHistory();
  const newItem: HistoryItem = {
    id: generateId(),
    url,
    createdAt: Date.now(),
    options,
    ...result,
  };

  const updated = [newItem, ...history].slice(0, HISTORY_LIMIT);
  await set(HISTORY_KEY, updated);
}

export async function clearHistory(): Promise<void> {
  await set(HISTORY_KEY, []);
}

import axios from "axios";

export interface CrawlRequest {
  url: string;
  screenshot?: boolean;
  css_selector?: string;
  word_count_threshold?: number;
  bypass_cache?: boolean;
  smart_mode?: boolean;
}

export interface CrawlResponse {
  markdown: string;
  html?: string | null;
  screenshot_base64?: string | null;
  metadata?: Record<string, unknown>;
  success: boolean;
  error_message?: string | null;
}

export async function crawlUrl(request: CrawlRequest): Promise<CrawlResponse> {
  const { data } = await axios.post<CrawlResponse>("/api/v1/crawl", request);
  return data;
}

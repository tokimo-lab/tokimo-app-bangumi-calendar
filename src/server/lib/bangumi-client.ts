/**
 * Bangumi (bgm.tv) API v0 客户端
 * 文档: https://bangumi.github.io/api/
 *
 * 主要用于番剧/动漫元数据：简介、评分、演职人员等
 * 公开 API 无需认证，带 access token 可提升请求限额
 */

import { notifyApiCall } from "./api-usage-counter";

export interface BangumiConfig {
  accessToken?: string;
  baseUrl?: string;
  userAgent?: string;
}

/** 条目类型 */
export type BangumiSubjectType =
  | 1 // 书籍
  | 2 // 动画
  | 3 // 音乐
  | 4 // 游戏
  | 6; // 真人

/** 搜索结果项 */
export interface BangumiSearchItem {
  id: number;
  type: BangumiSubjectType;
  name: string;
  name_cn: string;
  summary?: string;
  /** 旧 GET 搜索 API 字段 */
  air_date?: string;
  /** POST 搜索 API 字段（优先使用） */
  date?: string;
  platform?: string;
  rank?: number;
  eps?: number;
  total_episodes?: number;
  volumes?: number;
  rating?: {
    rank?: number;
    score: number;
    total: number;
  };
  collection?: {
    doing?: number;
    wish?: number;
    collect?: number;
    on_hold?: number;
    dropped?: number;
  };
  images?: {
    large?: string;
    medium?: string;
    small?: string;
    grid?: string;
    common?: string;
  };
}

/** 条目详情 */
export interface BangumiSubjectDetail {
  id: number;
  type: BangumiSubjectType;
  name: string;
  name_cn: string;
  summary?: string;
  air_date?: string;
  total_episodes?: number;
  rating?: {
    score: number;
    total: number;
    rank?: number;
  };
  images?: {
    large?: string;
    medium?: string;
    small?: string;
    grid?: string;
    common?: string;
  };
  tags?: Array<{ name: string; count: number }>;
  infobox?: Array<{ key: string; value: unknown }>;
}

interface CacheEntry<T = unknown> {
  data: T;
  expireAt: number;
}

const DEFAULT_CACHE_TTL = 60 * 60 * 1000; // 60 分钟
const BANGUMI_BASE_URL = "https://api.bgm.tv/v0";
const DEFAULT_USER_AGENT = "my-media/1.0 (https://github.com/example/my-media)";

export class BangumiClient {
  private accessToken?: string;
  private baseUrl: string;
  private userAgent: string;

  private cache = new Map<string, CacheEntry>();
  private inflight = new Map<string, Promise<unknown>>();
  private cacheTtl: number;

  constructor(config: BangumiConfig & { cacheTtl?: number }) {
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl || BANGUMI_BASE_URL;
    this.userAgent = config.userAgent || DEFAULT_USER_AGENT;
    this.cacheTtl = config.cacheTtl ?? DEFAULT_CACHE_TTL;
  }

  clearCache(): void {
    this.cache.clear();
    this.inflight.clear();
  }

  get cacheSize(): number {
    return this.cache.size;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "User-Agent": this.userAgent,
      "Content-Type": "application/json",
    };
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  private async cachedRequest<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expireAt > Date.now()) {
      return cached.data as T;
    }
    if (cached) {
      this.cache.delete(cacheKey);
    }

    const existing = this.inflight.get(cacheKey);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = (async () => {
      const data = await fetcher();
      this.cache.set(cacheKey, {
        data,
        expireAt: Date.now() + this.cacheTtl,
      });
      return data;
    })();

    this.inflight.set(cacheKey, promise);

    try {
      return await promise;
    } finally {
      this.inflight.delete(cacheKey);
    }
  }

  /** 搜索条目 */
  async search(
    keyword: string,
    type: BangumiSubjectType = 2,
    limit = 10,
  ): Promise<BangumiSearchItem[]> {
    return this.cachedRequest(
      `search:${keyword}:${type}:${limit}`,
      async () => {
        const url = new URL(`${this.baseUrl}/search/subjects`);
        url.searchParams.set("keyword", keyword);
        url.searchParams.set("type", String(type));
        url.searchParams.set("limit", String(limit));

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(
            `Bangumi API error: ${response.status} ${response.statusText}`,
          );
        }

        notifyApiCall("bangumi");

        const data = (await response.json()) as {
          data?: BangumiSearchItem[];
          list?: BangumiSearchItem[];
        };
        return data.data ?? data.list ?? [];
      },
    );
  }

  /** 按类型浏览热门条目（POST /v0/search/subjects，支持非动画类型） */
  async browseSubjects(
    type: BangumiSubjectType,
    limit = 100,
  ): Promise<BangumiSearchItem[]> {
    return this.cachedRequest(`browse:${type}:${limit}`, async () => {
      const response = await fetch(`${this.baseUrl}/search/subjects`, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify({
          keyword: "",
          filter: { type: [type], nsfw: false },
          sort: "heat",
          limit,
          offset: 0,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new Error(
          `Bangumi API error: ${response.status} ${response.statusText}`,
        );
      }

      notifyApiCall("bangumi");

      const data = (await response.json()) as {
        data?: BangumiSearchItem[];
      };
      return data.data ?? [];
    });
  }

  /** 获取条目详情 */
  async getSubject(id: number): Promise<BangumiSubjectDetail | null> {
    return this.cachedRequest(`subject:${id}`, async () => {
      const response = await fetch(`${this.baseUrl}/subjects/${id}`, {
        headers: this.buildHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(
          `Bangumi API error: ${response.status} ${response.statusText}`,
        );
      }

      notifyApiCall("bangumi");

      return (await response.json()) as BangumiSubjectDetail;
    });
  }

  /** 测试连接：搜索一个知名动漫（新世纪福音战士 id=1） */
  async testConnection(): Promise<boolean> {
    try {
      const subject = await this.getSubject(1);
      return subject !== null;
    } catch (_e) {
      return false;
    }
  }
}

/** 默认单例（无需 access token 的公开请求） */
export const bangumiClient = new BangumiClient({});

/**
 * Bangumi 每日放送服务
 *
 * 从 https://api.bgm.tv/calendar 获取当日放送列表，结果缓存 1 小时。
 * 非动画类型通过 Bangumi 搜索 API 获取热门条目。
 */

import type {
  BangumiCalendarOutput,
  BangumiSubjectListOutput,
  BangumiSubjectType,
} from "@tokiomo/types";
import { bangumiClient } from "../../lib/bangumi-client";
import { logger } from "../../lib/logger";

const BGMTV_CALENDAR_URL = "https://api.bgm.tv/calendar";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const WEEKDAY_CN: Record<number, string> = {
  1: "星期一",
  2: "星期二",
  3: "星期三",
  4: "星期四",
  5: "星期五",
  6: "星期六",
  7: "星期日",
};

const WEEKDAY_EN: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

interface CacheEntry {
  data: BangumiCalendarOutput;
  fetchedAt: number;
}

interface SubjectListCacheEntry {
  data: BangumiSubjectListOutput;
  fetchedAt: number;
}

let cache: CacheEntry | null = null;
const subjectListCache = new Map<string, SubjectListCacheEntry>();

// Raw Bangumi calendar item shape (subset we care about)
interface RawBangumiItem {
  id: number;
  url?: string;
  name?: string;
  name_cn?: string;
  summary?: string;
  air_date?: string;
  air_weekday?: number;
  images?: {
    large?: string;
    common?: string;
    medium?: string;
    small?: string;
    grid?: string;
  };
  rating?: {
    total?: number;
    score?: number;
  };
  rank?: number;
  collection?: {
    doing?: number;
  };
}

interface RawBangumiDay {
  weekday: {
    id: number;
    cn?: string;
    en?: string;
    ja?: string;
  };
  items: RawBangumiItem[];
}

export class BangumiCalendarService {
  async getCalendar(): Promise<BangumiCalendarOutput> {
    // Return cached result if still fresh
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      return cache.data;
    }

    try {
      const response = await fetch(BGMTV_CALENDAR_URL, {
        headers: {
          "User-Agent":
            "tokimo/1.0 (https://github.com/tokimo-lab/tokimo) contact@example.com",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new Error(`Bangumi API responded with ${response.status}`);
      }

      const raw: RawBangumiDay[] = (await response.json()) as RawBangumiDay[];

      const data: BangumiCalendarOutput = raw.map((day) => ({
        weekday: day.weekday.id,
        weekdayCn: WEEKDAY_CN[day.weekday.id] ?? day.weekday.cn ?? "",
        weekdayEn: WEEKDAY_EN[day.weekday.id] ?? day.weekday.en ?? "",
        items: (day.items ?? []).map((item) => ({
          id: item.id,
          name: item.name ?? "",
          nameCn: item.name_cn ?? item.name ?? "",
          summary: item.summary,
          airDate: item.air_date,
          airWeekday: item.air_weekday ?? day.weekday.id,
          images: item.images,
          rating: item.rating
            ? { total: item.rating.total, score: item.rating.score }
            : undefined,
          rank: item.rank,
          doing: item.collection?.doing,
          url: item.url,
        })),
      }));

      cache = { data, fetchedAt: Date.now() };
      return data;
    } catch (err) {
      logger.error(
        "BangumiCalendarService",
        `Failed to fetch Bangumi calendar: ${String(err)}`,
      );
      // Return stale cache if available, otherwise empty
      if (cache) return cache.data;
      return [];
    }
  }

  /** 按类型获取热门条目（书籍/游戏/音乐/三次元），缓存 1 小时 */
  async getSubjectList(
    type: BangumiSubjectType,
    platform?: string,
  ): Promise<BangumiSubjectListOutput> {
    const cacheKey = `${type}:${platform ?? "all"}`;
    const cached = subjectListCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const items = await bangumiClient.browseSubjects(type, 100);
      const filteredItems = platform
        ? items.filter((item) => item.platform === platform)
        : items;
      const data: BangumiSubjectListOutput = filteredItems.map((item) => ({
        id: item.id,
        name: item.name ?? "",
        nameCn: item.name_cn ?? item.name ?? "",
        summary: item.summary,
        airDate: item.date ?? item.air_date,
        airWeekday: 0,
        platform: item.platform,
        eps: item.total_episodes ?? item.eps,
        volumes: item.volumes,
        images: item.images,
        rating: item.rating
          ? { total: item.rating.total, score: item.rating.score }
          : undefined,
        rank: item.rating?.rank ?? item.rank,
        doing: item.collection?.doing,
        collect: item.collection?.collect,
        url: `https://bgm.tv/subject/${item.id}`,
      }));

      subjectListCache.set(cacheKey, { data, fetchedAt: Date.now() });
      return data;
    } catch (err) {
      logger.error(
        "BangumiCalendarService",
        `Failed to fetch subject list (type=${type}, platform=${platform ?? "all"}): ${String(err)}`,
      );
      const stale = subjectListCache.get(cacheKey);
      if (stale) return stale.data;
      return [];
    }
  }
}

export const bangumiCalendarService = new BangumiCalendarService();

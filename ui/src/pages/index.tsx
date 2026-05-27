/**
 * Bangumi 每日放送页面
 *
 * 支持切换类别：动画（按星期分组日历）/ 书籍 / 游戏 / 音乐 / 日剧 / 欧美剧 / 华语剧
 *
 * API: calls host server at /api/apps/bangumi/calendar and /api/apps/bangumi/subjects
 */

import { useQuery } from "@tanstack/react-query";
import { cn, Empty, Skeleton, Tabs } from "@tokimo/ui";
import { useState } from "react";
import { useT } from "../TranslatorContext";
import type { BangumiAnime, BangumiCalendarDay } from "../types";
import BangumiAnimeCard from "./BangumiAnimeCard";

// JS Date.getDay(): 0=Sun, 1=Mon … 6=Sat → Bangumi: 1=Mon … 7=Sun
function getTodayBangumiWeekday(): number {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

interface BangumiCategory {
  key: string;
  labelKey: string;
  type: number;
  platform?: string;
}

const SUBJECT_CATEGORIES: BangumiCategory[] = [
  { key: "anime", type: 2, labelKey: "typeAnime" },
  { key: "book", type: 1, labelKey: "typeBook" },
  { key: "game", type: 4, labelKey: "typeGame" },
  { key: "music", type: 3, labelKey: "typeMusic" },
  { key: "jp-drama", type: 6, labelKey: "typeJpDrama", platform: "日剧" },
  {
    key: "western-drama",
    type: 6,
    labelKey: "typeWesternDrama",
    platform: "欧美剧",
  },
  { key: "cn-drama", type: 6, labelKey: "typeCnDrama", platform: "华语剧" },
];

const SKELETON_GRID = (
  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
    {Array.from({ length: 20 }, (_, i) => `skeleton-${i}`).map((key) => (
      <div key={key} className="flex flex-col gap-2">
        <Skeleton className="aspect-[2/3] rounded-xl w-full" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
    ))}
  </div>
);

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function unwrap<T>(resp: Response, label: string): Promise<T> {
  if (!resp.ok) throw new Error(`${label} fetch failed: ${resp.status}`);
  const body = (await resp.json()) as ApiEnvelope<T>;
  if (!body.success || body.data === undefined) {
    throw new Error(`${label} api error: ${body.error ?? "unknown"}`);
  }
  return body.data;
}

async function fetchCalendar(): Promise<BangumiCalendarDay[]> {
  const resp = await fetch("/api/apps/bangumi/calendar", {
    credentials: "same-origin",
  });
  return unwrap<BangumiCalendarDay[]>(resp, "calendar");
}

async function fetchSubjectList(
  subjectType: number,
  platform?: string,
): Promise<BangumiAnime[]> {
  const params = new URLSearchParams({ subjectType: String(subjectType) });
  if (platform) params.set("platform", platform);
  const resp = await fetch(`/api/apps/bangumi/subjects?${params}`, {
    credentials: "same-origin",
  });
  return unwrap<BangumiAnime[]>(resp, "subjects");
}

function AnimeCalendar() {
  const t = useT();
  const todayWeekday = getTodayBangumiWeekday();

  const { data, isError, isLoading } = useQuery({
    queryKey: ["bangumi", "calendar"],
    queryFn: fetchCalendar,
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) return SKELETON_GRID;
  if (isError) {
    return <Empty description={t("loadFailed")} />;
  }

  const tabItems = (data ?? []).map((day) => {
    const isToday = day.weekday === todayWeekday;
    return {
      key: String(day.weekday),
      label: (
        <span className={isToday ? "font-bold text-accent" : undefined}>
          {day.weekdayCn}
          {isToday && (
            <span className="ml-1 text-[10px] bg-accent text-white rounded px-1">
              {t("today")}
            </span>
          )}
        </span>
      ),
      children: (
        <div className="pt-4">
          {day.items.length === 0 ? (
            <Empty description={t("noItems")} />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3">
              {day.items.map((anime) => (
                <BangumiAnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          )}
        </div>
      ),
    };
  });

  if (tabItems.length === 0) {
    return <Empty description={t("loadFailed")} />;
  }

  return (
    <Tabs
      items={tabItems}
      defaultActiveKey={String(todayWeekday)}
      destroyInactiveTabPane
    />
  );
}

function SubjectList({ type, platform }: { type: number; platform?: string }) {
  const t = useT();

  const { data, isError, isLoading } = useQuery({
    queryKey: ["bangumi", "subjects", type, platform],
    queryFn: () => fetchSubjectList(type, platform),
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) return SKELETON_GRID;
  if (isError) {
    return <Empty description={t("loadFailed")} />;
  }

  if (!data || data.length === 0) {
    return <Empty description={t("noTrending")} />;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3">
      {data.map((item) => (
        <BangumiAnimeCard key={item.id} anime={item} subjectType={type} />
      ))}
    </div>
  );
}

export default function BangumiCalendarPage() {
  const t = useT();
  const [activeCategoryKey, setActiveCategoryKey] = useState("anime");
  const activeCategory =
    SUBJECT_CATEGORIES.find((item) => item.key === activeCategoryKey) ??
    SUBJECT_CATEGORIES[0];

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-neutral-100">{t("title")}</h1>
        <span className="text-xs text-fg-muted">{t("poweredBy")}</span>
      </div>

      {/* Category selector */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {SUBJECT_CATEGORIES.map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveCategoryKey(key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 select-none cursor-pointer",
              activeCategoryKey === key
                ? "bg-accent text-white"
                : "bg-neutral-700/60 text-neutral-300 hover:bg-neutral-600/60",
            )}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeCategory.type === 2 ? (
        <AnimeCalendar />
      ) : (
        <>
          <p className="text-xs text-fg-muted mb-3">{t("trending")}</p>
          <SubjectList
            type={activeCategory.type}
            platform={activeCategory.platform}
          />
        </>
      )}
    </div>
  );
}

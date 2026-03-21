/**
 * Bangumi 每日放送页面
 *
 * 支持切换类别：动画（按星期分组日历）/ 书籍 / 游戏 / 音乐 / 日剧 / 欧美剧 / 华语剧
 */

import { cn, Empty, Skeleton, Tabs } from "@tokiomo/components";
import type { BangumiSubjectType } from "@tokiomo/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "../../../lib/trpc";
import BangumiAnimeCard from "./BangumiAnimeCard";

const ns = "media.bangumiCalendar";

// JS Date.getDay(): 0=Sun, 1=Mon … 6=Sat → Bangumi: 1=Mon … 7=Sun
function getTodayBangumiWeekday(): number {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

interface BangumiCategory {
  key: string;
  labelKey: string;
  type: BangumiSubjectType;
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

function AnimeCalendar() {
  const { t } = useTranslation();
  const todayWeekday = getTodayBangumiWeekday();

  const { data, isError, isLoading } =
    trpc.bangumiCalendar.getCalendar.useQuery(undefined, {
      staleTime: 60 * 60 * 1000,
    });

  if (isLoading) return SKELETON_GRID;
  if (isError) {
    return <Empty description={t(`${ns}.loadFailed`)} />;
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
              {t(`${ns}.today`)}
            </span>
          )}
        </span>
      ),
      children: (
        <div className="pt-4">
          {day.items.length === 0 ? (
            <Empty description={t(`${ns}.noItems`)} />
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
    return <Empty description={t(`${ns}.loadFailed`)} />;
  }

  return (
    <Tabs
      items={tabItems}
      defaultActiveKey={String(todayWeekday)}
      destroyInactiveTabPane
    />
  );
}

function SubjectList({
  type,
  platform,
}: {
  type: BangumiSubjectType;
  platform?: string;
}) {
  const { t } = useTranslation();

  const { data, isError, isLoading } =
    trpc.bangumiCalendar.getSubjectList.useQuery(
      { subjectType: type, platform },
      { staleTime: 60 * 60 * 1000 },
    );

  if (isLoading) return SKELETON_GRID;
  if (isError) {
    return <Empty description={t(`${ns}.loadFailed`)} />;
  }

  if (!data || data.length === 0) {
    return <Empty description={t(`${ns}.noTrending`)} />;
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
  const { t } = useTranslation();
  const [activeCategoryKey, setActiveCategoryKey] = useState("anime");
  const activeCategory =
    SUBJECT_CATEGORIES.find((item) => item.key === activeCategoryKey) ??
    SUBJECT_CATEGORIES[0];

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-neutral-100">
          {t(`${ns}.title`)}
        </h1>
        <span className="text-xs text-neutral-500">{t(`${ns}.poweredBy`)}</span>
      </div>

      {/* Category selector */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {SUBJECT_CATEGORIES.map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveCategoryKey(key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 select-none",
              activeCategoryKey === key
                ? "bg-accent text-white"
                : "bg-neutral-700/60 text-neutral-300 hover:bg-neutral-600/60",
            )}
          >
            {t(`${ns}.${labelKey}`)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeCategory.type === 2 ? (
        <AnimeCalendar />
      ) : (
        <>
          <p className="text-xs text-neutral-500 mb-3">{t(`${ns}.trending`)}</p>
          <SubjectList
            type={activeCategory.type}
            platform={activeCategory.platform}
          />
        </>
      )}
    </div>
  );
}

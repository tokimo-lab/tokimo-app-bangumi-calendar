/**
 * Bangumi 每日放送页面
 *
 * 从 Bangumi API 获取本周每日放送列表，按星期几分 Tab 展示，今天默认选中。
 */

import { Empty, Skeleton, Tabs } from "@acme/components";
import { useTranslation } from "react-i18next";
import { trpc } from "../../../lib/trpc";
import BangumiAnimeCard from "./BangumiAnimeCard";

const ns = "media.bangumiCalendar";

// JS Date.getDay(): 0=Sun, 1=Mon … 6=Sat → Bangumi: 1=Mon … 7=Sun
function getTodayBangumiWeekday(): number {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

export default function BangumiCalendarPage() {
  const { t } = useTranslation();
  const todayWeekday = getTodayBangumiWeekday();

  const { data, isLoading } = trpc.bangumiCalendar.getCalendar.useQuery(
    undefined,
    { staleTime: 60 * 60 * 1000 },
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-semibold text-neutral-100 mb-4">
          {t(`${ns}.title`)}
        </h1>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {Array.from({ length: 16 }, (_, i) => `skeleton-${i}`).map((key) => (
            <div key={key} className="flex flex-col gap-2">
              <Skeleton className="aspect-[2/3] rounded-xl w-full" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
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

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-100">
          {t(`${ns}.title`)}
        </h1>
        <span className="text-xs text-neutral-500">{t(`${ns}.poweredBy`)}</span>
      </div>

      {tabItems.length === 0 ? (
        <Empty description={t(`${ns}.loadFailed`)} />
      ) : (
        <Tabs
          items={tabItems}
          defaultActiveKey={String(todayWeekday)}
          destroyInactiveTabPane
        />
      )}
    </div>
  );
}

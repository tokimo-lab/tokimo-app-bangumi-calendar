/**
 * Bangumi 每日放送 - 单部番剧卡片
 */

import { StarOutlined, Tooltip } from "@acme/components";
import type { BangumiAnime } from "@acme/types";
import { useTranslation } from "react-i18next";

interface BangumiAnimeCardProps {
  anime: BangumiAnime;
}

const ns = "media.bangumiCalendar";

export default function BangumiAnimeCard({ anime }: BangumiAnimeCardProps) {
  const { t } = useTranslation();

  const posterUrl =
    anime.images?.large || anime.images?.common || anime.images?.medium || null;

  const displayTitle = anime.nameCn || anime.name;
  const originalTitle =
    anime.nameCn && anime.name !== anime.nameCn ? anime.name : null;
  const score = anime.rating?.score;
  const scoreColor =
    score === undefined
      ? "text-neutral-400"
      : score >= 8
        ? "text-yellow-400"
        : score >= 6
          ? "text-green-400"
          : "text-neutral-400";

  return (
    <a
      href={anime.url ?? `https://bgm.tv/subject/${anime.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl overflow-hidden bg-neutral-800/60 hover:bg-neutral-700/60 transition-colors duration-150 flex flex-col shadow hover:shadow-lg"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-neutral-900 overflow-hidden flex-shrink-0">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3 text-center text-neutral-500 text-xs">
            {displayTitle}
          </div>
        )}

        {/* Score badge */}
        {score !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-6 pb-1 px-2 flex items-center gap-1">
            <StarOutlined className={`w-3 h-3 ${scoreColor}`} />
            <span className={`text-xs font-bold ${scoreColor}`}>
              {score.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 flex flex-col gap-0.5 flex-1">
        <Tooltip title={displayTitle} placement="top">
          <p className="text-sm font-medium text-neutral-100 leading-snug line-clamp-2 min-h-[2.5rem]">
            {displayTitle}
          </p>
        </Tooltip>

        {originalTitle && (
          <p className="text-[11px] text-neutral-400 truncate">
            {originalTitle}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          {anime.airDate && (
            <span className="text-[11px] text-neutral-500">
              {anime.airDate}
            </span>
          )}
          {anime.doing !== undefined && anime.doing > 0 && (
            <Tooltip title={t(`${ns}.watching`)} placement="top">
              <span className="text-[11px] text-blue-400 ml-auto">
                {anime.doing >= 1000
                  ? `${(anime.doing / 1000).toFixed(1)}k`
                  : anime.doing}{" "}
                {t(`${ns}.watching`)}
              </span>
            </Tooltip>
          )}
        </div>
      </div>
    </a>
  );
}

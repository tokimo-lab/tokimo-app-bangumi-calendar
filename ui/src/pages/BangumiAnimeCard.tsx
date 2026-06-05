/**
 * Bangumi 条目卡片（动画/书籍/游戏/音乐/三次元通用）
 */

import { StarOutlined, Tooltip } from "@tokimo/ui";
import { useT } from "../TranslatorContext";
import type { BangumiAnime } from "../types";

interface BangumiAnimeCardProps {
  anime: BangumiAnime;
  subjectType?: number;
}

function formatCount(n: number): string {
  return n >= 10000
    ? `${(n / 10000).toFixed(1)}w`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}k`
      : String(n);
}

export default function BangumiAnimeCard({
  anime,
  subjectType = 2,
}: BangumiAnimeCardProps) {
  const t = useT();

  const posterUrl =
    anime.images?.large || anime.images?.common || anime.images?.medium || null;

  const displayTitle = anime.nameCn || anime.name;
  const originalTitle =
    anime.nameCn && anime.name !== anime.nameCn ? anime.name : null;
  const score = anime.rating?.score;
  const scoreColor =
    score === undefined
      ? "text-fg-muted"
      : score >= 8
        ? "text-yellow-400"
        : score >= 6
          ? "text-green-400"
          : "text-fg-muted";

  const doingLabelKey =
    subjectType === 1
      ? "reading"
      : subjectType === 3
        ? "listening"
        : subjectType === 4
          ? "playing"
          : "watching";

  const episodeInfo = (() => {
    if (subjectType === 1 && anime.volumes && anime.volumes > 0)
      return `${anime.volumes} ${t("volumes")}`;
    if (subjectType !== 1 && anime.eps && anime.eps > 0)
      return `${anime.eps} ${t("episodes")}`;
    return null;
  })();

  return (
    <a
      href={anime.url ?? `https://bgm.tv/subject/${anime.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl overflow-hidden bg-neutral-800/60 hover:bg-neutral-700/60 transition-colors duration-150 flex flex-col shadow hover:shadow-lg"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-[var(--color-fill-skeleton)] overflow-hidden flex-shrink-0">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3 text-center text-fg-muted text-xs">
            {displayTitle}
          </div>
        )}

        {anime.platform && (
          <div className="absolute top-1.5 left-1.5">
            <span className="text-[10px] bg-black/60 text-neutral-300 rounded px-1.5 py-0.5">
              {anime.platform}
            </span>
          </div>
        )}

        {score !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-6 pb-1 px-2 flex items-center gap-1">
            <StarOutlined className={`w-3 h-3 ${scoreColor}`} />
            <span className={`text-xs font-bold ${scoreColor}`}>
              {score.toFixed(1)}
            </span>
            {anime.rank && (
              <span className="ml-auto text-[10px] text-fg-muted">
                #{anime.rank}
              </span>
            )}
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
          <p className="text-[11px] text-fg-muted truncate">{originalTitle}</p>
        )}

        <div className="mt-auto pt-1 flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            {anime.airDate && (
              <span className="text-[11px] text-fg-muted">{anime.airDate}</span>
            )}
            {episodeInfo && (
              <span className="text-[11px] text-fg-muted ml-auto">
                {episodeInfo}
              </span>
            )}
          </div>
          {anime.doing !== undefined && anime.doing > 0 && (
            <Tooltip title={t(doingLabelKey)} placement="top">
              <span className="text-[11px] text-blue-400">
                {formatCount(anime.doing)} {t(doingLabelKey)}
              </span>
            </Tooltip>
          )}
          {anime.collect !== undefined && anime.collect > 0 && (
            <span className="text-[11px] text-fg-muted">
              {formatCount(anime.collect)} {t("collected")}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

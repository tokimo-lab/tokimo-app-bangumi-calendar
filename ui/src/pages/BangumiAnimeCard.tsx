/**
 * Bangumi 条目卡片（动画/书籍/游戏/音乐/三次元通用）
 */

import { StarOutlined, Tooltip } from "@tokiomo/components";
import { useTranslation } from "react-i18next";
import type { BangumiAnime } from "../../../generated/rust-api";

interface BangumiAnimeCardProps {
  anime: BangumiAnime;
  subjectType?: number;
}

const ns = "media.bangumiCalendar";

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

  // 根据类别决定"在看/在读/在玩/在听"标签 key
  const doingLabelKey =
    subjectType === 1
      ? `${ns}.reading`
      : subjectType === 3
        ? `${ns}.listening`
        : subjectType === 4
          ? `${ns}.playing`
          : `${ns}.watching`;

  // 卡片底部：集数/卷数信息
  const episodeInfo = (() => {
    if (subjectType === 1 && anime.volumes && anime.volumes > 0)
      return `${anime.volumes} ${t(`${ns}.volumes`)}`;
    if (subjectType !== 1 && anime.eps && anime.eps > 0)
      return `${anime.eps} ${t(`${ns}.episodes`)}`;
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
      <div className="relative aspect-[2/3] bg-[var(--bg-skeleton)] overflow-hidden flex-shrink-0">
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

        {/* Platform badge（书籍/游戏/三次元） */}
        {anime.platform && (
          <div className="absolute top-1.5 left-1.5">
            <span className="text-[10px] bg-black/60 text-neutral-300 rounded px-1.5 py-0.5">
              {anime.platform}
            </span>
          </div>
        )}

        {/* Score badge */}
        {score !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-6 pb-1 px-2 flex items-center gap-1">
            <StarOutlined className={`w-3 h-3 ${scoreColor}`} />
            <span className={`text-xs font-bold ${scoreColor}`}>
              {score.toFixed(1)}
            </span>
            {anime.rank && (
              <span className="ml-auto text-[10px] text-neutral-400">
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
          <p className="text-[11px] text-neutral-400 truncate">
            {originalTitle}
          </p>
        )}

        <div className="mt-auto pt-1 flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            {anime.airDate && (
              <span className="text-[11px] text-neutral-500">
                {anime.airDate}
              </span>
            )}
            {episodeInfo && (
              <span className="text-[11px] text-neutral-500 ml-auto">
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
            <span className="text-[11px] text-neutral-500">
              {formatCount(anime.collect)} {t(`${ns}.collected`)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

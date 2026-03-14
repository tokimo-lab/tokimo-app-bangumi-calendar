import { z } from "zod";

// Bangumi 封面图片
export const BangumiImagesSchema = z.object({
  large: z.string().optional(),
  common: z.string().optional(),
  medium: z.string().optional(),
  small: z.string().optional(),
  grid: z.string().optional(),
});
export type BangumiImages = z.infer<typeof BangumiImagesSchema>;

// Bangumi 评分
export const BangumiRatingSchema = z.object({
  total: z.number().optional(),
  score: z.number().optional(),
});
export type BangumiRating = z.infer<typeof BangumiRatingSchema>;

// 单部番剧条目
export const BangumiAnimeSchema = z.object({
  id: z.number(),
  name: z.string(),
  nameCn: z.string(),
  summary: z.string().optional(),
  airDate: z.string().optional(),
  airWeekday: z.number(), // 1=Mon … 7=Sun
  images: BangumiImagesSchema.optional(),
  rating: BangumiRatingSchema.optional(),
  rank: z.number().optional(),
  doing: z.number().optional(), // 在看人数
  url: z.string().optional(),
});
export type BangumiAnime = z.infer<typeof BangumiAnimeSchema>;

// 每日放送（按星期几分组）
export const BangumiCalendarDaySchema = z.object({
  weekday: z.number(), // 1=Mon … 7=Sun
  weekdayCn: z.string(), // 星期一 … 星期日
  weekdayEn: z.string(), // Mon … Sun
  items: z.array(BangumiAnimeSchema),
});
export type BangumiCalendarDay = z.infer<typeof BangumiCalendarDaySchema>;

// tRPC query output
export const BangumiCalendarOutputSchema = z.array(BangumiCalendarDaySchema);
export type BangumiCalendarOutput = z.infer<typeof BangumiCalendarOutputSchema>;

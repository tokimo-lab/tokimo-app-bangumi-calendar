import { z } from "zod";

// 条目类型：1=书籍 2=动画 3=音乐 4=游戏 6=三次元
export const BangumiSubjectTypeSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(6),
]);
export type BangumiSubjectType = z.infer<typeof BangumiSubjectTypeSchema>;

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

// 单部条目（动画/书籍/游戏/音乐/三次元通用）
export const BangumiAnimeSchema = z.object({
  id: z.number(),
  name: z.string(),
  nameCn: z.string(),
  summary: z.string().optional(),
  airDate: z.string().optional(),
  airWeekday: z.number(), // 1=Mon … 7=Sun，非动画为 0
  platform: z.string().optional(), // 漫画/游戏/TV 等
  eps: z.number().optional(), // 集数
  volumes: z.number().optional(), // 卷数（书籍）
  images: BangumiImagesSchema.optional(),
  rating: BangumiRatingSchema.optional(),
  rank: z.number().optional(),
  doing: z.number().optional(), // 在看/在读/在玩人数
  collect: z.number().optional(), // 看过/读过/玩过人数
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

// tRPC query output（动画每日放送）
export const BangumiCalendarOutputSchema = z.array(BangumiCalendarDaySchema);
export type BangumiCalendarOutput = z.infer<typeof BangumiCalendarOutputSchema>;

// 非动画类别浏览：平铺列表
export const BangumiSubjectListOutputSchema = z.array(BangumiAnimeSchema);
export type BangumiSubjectListOutput = z.infer<
  typeof BangumiSubjectListOutputSchema
>;

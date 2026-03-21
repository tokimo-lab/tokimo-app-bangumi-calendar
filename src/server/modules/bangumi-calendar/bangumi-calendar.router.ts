/**
 * Bangumi 每日放送 tRPC 路由
 */

import {
  BangumiCalendarOutputSchema,
  BangumiSubjectListOutputSchema,
  BangumiSubjectTypeSchema,
} from "@tokiomo/types";
import { z } from "zod";
import { protectedProcedure } from "../../trpc/middlewares";
import { router } from "../../trpc/trpc";
import { bangumiCalendarService } from "./bangumi-calendar.service";

export const bangumiCalendarRouter = router({
  getCalendar: protectedProcedure
    .output(BangumiCalendarOutputSchema)
    .query(async () => {
      return bangumiCalendarService.getCalendar();
    }),

  getSubjectList: protectedProcedure
    .input(
      z.object({
        subjectType: BangumiSubjectTypeSchema,
        platform: z.string().min(1).optional(),
      }),
    )
    .output(BangumiSubjectListOutputSchema)
    .query(async ({ input }) => {
      return bangumiCalendarService.getSubjectList(
        input.subjectType,
        input.platform,
      );
    }),
});

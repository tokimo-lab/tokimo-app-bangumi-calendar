/**
 * Bangumi 每日放送 tRPC 路由
 */

import { BangumiCalendarOutputSchema } from "@acme/types";
import { protectedProcedure } from "../../trpc/middlewares";
import { router } from "../../trpc/trpc";
import { bangumiCalendarService } from "./bangumi-calendar.service";

export const bangumiCalendarRouter = router({
  getCalendar: protectedProcedure
    .output(BangumiCalendarOutputSchema)
    .query(async () => {
      return bangumiCalendarService.getCalendar();
    }),
});

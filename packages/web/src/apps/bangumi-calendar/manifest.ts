import { Clapperboard } from "lucide-react";
import type { AppManifest } from "../_framework/types";

export const manifest: AppManifest = {
  id: "bangumi-calendar",
  category: "system",
  defaultSize: { width: 1100, height: 750 },
  icon: Clapperboard,
  image: "/page-icons/bangumi-calendar.png",
  color: "#ec4899",
  appName: "dashboard.menu.bangumiCalendar",
  order: 30,
  component: () => import("./pages"),
};

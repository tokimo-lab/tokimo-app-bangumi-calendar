import type { AppManifest } from "../_framework/types";

export const manifest: AppManifest = {
  id: "bangumi-calendar",
  name: "Bangumi Calendar",
  category: "system",
  pageIds: ["bangumi-calendar"],
  defaultSize: { width: 1100, height: 750 },
  component: () => import("./pages"),
};

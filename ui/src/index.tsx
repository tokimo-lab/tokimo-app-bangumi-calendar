import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Dispose } from "@tokimo/sdk";
import { defineApp, makeTranslator } from "@tokimo/sdk";
import {
  ConfigProvider,
  ToastProvider,
  enUS as uiEnUS,
  zhCN as uiZhCN,
} from "@tokimo/ui";
import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { enUS, zhCN } from "./i18n";
import { TranslatorProvider } from "./TranslatorContext";
import "./index.css";
import BangumiCalendarPage from "./pages";

export default defineApp({
  id: "bangumi-calendar",
  manifest: {
    id: "bangumi-calendar",
    appName: "Bangumi Calendar",
    icon: "Clapperboard",
    color: "#ec4899",
    windowType: "bangumi-calendar",
    defaultSize: { width: 1100, height: 750 },
    category: "app",
  },
  mount(container, ctx): Dispose {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
    });
    const locale = ctx.locale.startsWith("zh") ? uiZhCN : uiEnUS;
    const t = makeTranslator({ "zh-CN": zhCN, "en-US": enUS }, ctx.locale);
    const root: Root = createRoot(container);

    root.render(
      <StrictMode>
        <TranslatorProvider value={t}>
          <QueryClientProvider client={queryClient}>
            <ConfigProvider locale={locale}>
              <ToastProvider>
                <BangumiCalendarPage />
              </ToastProvider>
            </ConfigProvider>
          </QueryClientProvider>
        </TranslatorProvider>
      </StrictMode>,
    );
    return () => root.unmount();
  },
});

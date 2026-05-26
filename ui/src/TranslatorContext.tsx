import { createContext, useContext } from "react";

export type Translator = (key: string, fallback?: string) => string;

const TranslatorContext = createContext<Translator>((key) => key);

export const TranslatorProvider = TranslatorContext.Provider;

export function useT(): Translator {
  return useContext(TranslatorContext);
}

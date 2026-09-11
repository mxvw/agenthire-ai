import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "agenthire.saved-jobs";

const SavedContext = createContext<{
  saved: string[];
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
}>({ saved: [], toggle: () => {}, isSaved: () => false });

export function SavedJobsProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setSaved(JSON.parse(raw) as string[]);
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const toggle = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      window.localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  return <SavedContext.Provider value={{ saved, toggle, isSaved }}>{children}</SavedContext.Provider>;
}

export function useSavedJobs() {
  return useContext(SavedContext);
}

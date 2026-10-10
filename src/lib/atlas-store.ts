import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Hit } from "@/lib/scan";
import type { ImportedRepo } from "@/lib/github-import";

type AtlasState = {
  hits: Hit[];
  lastScanAt: string | null;
  setHits: (hits: Hit[]) => void;
  importedRepos: ImportedRepo[];
  addImported: (repo: ImportedRepo) => void;
  removeImported: (id: string) => void;
  clearImported: () => void;
};

export const useAtlas = create<AtlasState>()(
  persist(
    (set, get) => ({
      hits: [],
      lastScanAt: null,
      setHits: (hits) =>
        set({
          hits,
          lastScanAt: new Date().toISOString(),
        }),
      importedRepos: [],
      addImported: (repo) => {
        const existing = get().importedRepos.filter((r) => r.id !== repo.id);
        set({ importedRepos: [repo, ...existing] });
      },
      removeImported: (id) =>
        set({ importedRepos: get().importedRepos.filter((r) => r.id !== id) }),
      clearImported: () => set({ importedRepos: [] }),
    }),
    {
      name: "atlas-forge-store",
      partialize: (s) => ({ importedRepos: s.importedRepos }),
    },
  ),
);

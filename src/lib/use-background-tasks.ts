import { useEffect, useState, useCallback } from "react";
import {
  bgTasks,
  getBgTasksSnapshot,
  type BgTask,
  type BgTaskKind,
} from "@/lib/background-tasks";

export function useBackgroundTasks() {
  const [snap, setSnap] = useState(getBgTasksSnapshot);

  useEffect(() => {
    bgTasks.hydrate();
    setSnap(getBgTasksSnapshot());
    return bgTasks.subscribe(() => setSnap(getBgTasksSnapshot()));
  }, []);

  const enqueue = useCallback(
    (
      kind: BgTaskKind | string,
      input: Record<string, unknown> | undefined,
      runner: (
        task: BgTask,
        update: (patch: Partial<BgTask>) => void,
      ) => Promise<unknown>,
    ) => bgTasks.enqueue(kind, input, runner),
    [],
  );

  const cancel = useCallback((id: string) => bgTasks.cancel(id), []);
  const clearFinished = useCallback(() => bgTasks.clearFinished(), []);

  return {
    tasks: snap.tasks,
    stats: snap.stats,
    enqueue,
    cancel,
    clearFinished,
  };
}

import { useEffect, useState, useCallback } from "react";
import {
  bgTasks,
  getBgTasksSnapshot,
  type BgRunner,
  type BgTaskKind,
  type EnqueueOptions,
} from "@/lib/background-tasks";

export function useBackgroundTasks() {
  const [snap, setSnap] = useState(getBgTasksSnapshot);

  useEffect(() => {
    bgTasks.hydrate();
    setSnap(getBgTasksSnapshot());
    return bgTasks.subscribe(() => setSnap(getBgTasksSnapshot()));
  }, []);

  const enqueue = useCallback(
    (kind: BgTaskKind | string, runner: BgRunner, opts?: EnqueueOptions) =>
      bgTasks.enqueue(kind, runner, opts),
    [],
  );

  const enqueueBatch = useCallback(
    (
      items: Array<{
        kind: BgTaskKind | string;
        runner: BgRunner;
        opts?: EnqueueOptions;
      }>,
    ) => bgTasks.enqueueBatch(items),
    [],
  );

  const cancel = useCallback((id: string) => bgTasks.cancel(id), []);
  const clearFinished = useCallback(() => bgTasks.clearFinished(), []);
  const setMaxConcurrent = useCallback(
    (n: number) => bgTasks.setMaxConcurrent(n),
    [],
  );

  return {
    tasks: snap.tasks,
    stats: snap.stats,
    active: snap.active,
    enqueue,
    enqueueBatch,
    cancel,
    clearFinished,
    setMaxConcurrent,
  };
}

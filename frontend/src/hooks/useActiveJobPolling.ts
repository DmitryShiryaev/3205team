import { useEffect } from 'react';
import { useJobsStore } from '../store/jobsStore';
import { isTerminalJobStatus } from '../types/job';

const POLL_INTERVAL_MS = 1800;

export function useActiveJobPolling(): void {
  const activeJobId = useJobsStore((state) => state.activeJobId);
  const status = useJobsStore((state) => state.activeJob?.status);
  const pollActiveJob = useJobsStore((state) => state.pollActiveJob);

  useEffect(() => {
    if (!activeJobId || !status || isTerminalJobStatus(status)) {
      return;
    }

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async (): Promise<void> => {
      await pollActiveJob(controller.signal);
      if (!controller.signal.aborted) {
        timer = setTimeout(() => {
          void tick();
        }, POLL_INTERVAL_MS);
      }
    };

    timer = setTimeout(() => {
      void tick();
    }, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [activeJobId, status, pollActiveJob]);
}

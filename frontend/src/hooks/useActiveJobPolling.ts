import { useEffect } from 'react';
import { useJobsStore } from '../store/jobsStore';
import { shouldPollJob } from '../types/job';

const POLL_INTERVAL_MS = 1800;

export function useActiveJobPolling(): void {
  const activeJobId = useJobsStore((state) => state.activeJobId);
  const shouldPoll = useJobsStore((state) =>
    Boolean(state.activeJobId && shouldPollJob(state.activeJob)),
  );
  const pollActiveJob = useJobsStore((state) => state.pollActiveJob);

  useEffect(() => {
    if (!activeJobId || !shouldPoll) {
      return;
    }

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async (): Promise<void> => {
      await pollActiveJob(controller.signal);
      if (controller.signal.aborted) {
        return;
      }

      if (!shouldPollJob(useJobsStore.getState().activeJob)) {
        return;
      }

      timer = setTimeout(() => {
        void tick();
      }, POLL_INTERVAL_MS);
    };

    void tick();

    return () => {
      controller.abort();
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [activeJobId, shouldPoll, pollActiveJob]);
}

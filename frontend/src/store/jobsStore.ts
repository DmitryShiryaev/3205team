import { create } from 'zustand';
import {
  cancelJob,
  createJob,
  fetchJob,
  fetchJobs,
  toErrorMessage,
} from '../api/jobs';
import { STATUS, type Job, type JobSummary } from '../types/job';

type JobsState = {
  jobs: JobSummary[];
  activeJobId: string | null;
  activeJob: Job | null;
  jobsLoading: boolean;
  jobsError: string | null;
  detailsLoading: boolean;
  detailsError: string | null;
  creating: boolean;
  cancelling: boolean;
  loadJobs: () => Promise<void>;
  selectJob: (id: string) => Promise<void>;
  createJobFromUrls: (urls: string[]) => Promise<boolean>;
  cancelActiveJob: () => Promise<void>;
  pollActiveJob: (signal: AbortSignal) => Promise<void>;
};

function replaceJob(jobs: JobSummary[], job: Job): JobSummary[] {
  let success = 0;
  let error = 0;
  for (const item of job.items) {
    if (item.status === STATUS.SUCCESS) {
      success += 1;
    } else if (item.status === STATUS.ERROR) {
      error += 1;
    }
  }

  const summary: JobSummary = {
    id: job.id,
    createdAt: job.createdAt,
    status: job.status,
    stats: {
      total: job.items.length,
      success,
      error,
    },
  };

  const exists = jobs.some((item) => item.id === job.id);
  if (!exists) {
    return [summary, ...jobs];
  }

  return jobs.map((item) => (item.id === job.id ? summary : item));
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  activeJobId: null,
  activeJob: null,
  jobsLoading: false,
  jobsError: null,
  detailsLoading: false,
  detailsError: null,
  creating: false,
  cancelling: false,

  loadJobs: async () => {
    set({ jobsLoading: true, jobsError: null });
    try {
      const jobs = await fetchJobs();
      set({ jobs, jobsLoading: false });
    } catch (error) {
      set({ jobsError: toErrorMessage(error), jobsLoading: false });
    }
  },

  selectJob: async (id: string) => {
    set({
      activeJobId: id,
      detailsLoading: true,
      detailsError: null,
    });

    try {
      const job = await fetchJob(id);
      if (get().activeJobId !== id) {
        return;
      }
      set({ activeJob: job, detailsLoading: false });
    } catch (error) {
      if (get().activeJobId !== id) {
        return;
      }
      set({
        activeJob: null,
        detailsLoading: false,
        detailsError: toErrorMessage(error),
      });
    }
  },

  createJobFromUrls: async (urls: string[]) => {
    set({ creating: true, jobsError: null });
    try {
      const { jobId } = await createJob(urls);
      await get().loadJobs();
      await get().selectJob(jobId);
      return true;
    } catch (error) {
      set({ jobsError: toErrorMessage(error) });
      return false;
    } finally {
      set({ creating: false });
    }
  },

  cancelActiveJob: async () => {
    const id = get().activeJobId;
    if (!id) {
      return;
    }

    set({ cancelling: true, detailsError: null });
    try {
      const job = await cancelJob(id);
      if (get().activeJobId !== id) {
        return;
      }
      set({
        activeJob: job,
        jobs: replaceJob(get().jobs, job),
        cancelling: false,
      });
    } catch (error) {
      if (get().activeJobId !== id) {
        return;
      }
      set({
        cancelling: false,
        detailsError: toErrorMessage(error),
      });
    }
  },

  pollActiveJob: async (signal: AbortSignal) => {
    const id = get().activeJobId;
    if (!id) {
      return;
    }

    try {
      const [jobs, job] = await Promise.all([
        fetchJobs(signal),
        fetchJob(id, signal),
      ]);
      if (signal.aborted || get().activeJobId !== id) {
        return;
      }
      set({ jobs, activeJob: job, detailsError: null });
    } catch (error) {
      if (signal.aborted || get().activeJobId !== id) {
        return;
      }
      const message = toErrorMessage(error);
      if (message) {
        set({ detailsError: message });
      }
    }
  },
}));

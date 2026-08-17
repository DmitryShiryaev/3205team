import { create } from 'zustand';

type JobsState = {
  jobs: unknown[];
  activeJobId: string | null;
  activeJob: unknown | null;
  jobsLoading: boolean;
  jobsError: string | null;
  detailsLoading: boolean;
  detailsError: string | null;
  creating: boolean;
  cancelling: boolean;
};

export const useJobsStore = create<JobsState>(() => ({
  jobs: [],
  activeJobId: null,
  activeJob: null,
  jobsLoading: false,
  jobsError: null,
  detailsLoading: false,
  detailsError: null,
  creating: false,
  cancelling: false,
}));

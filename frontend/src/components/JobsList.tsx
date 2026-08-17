import { useJobsStore } from '../store/jobsStore';
import { StatusBadge } from './StatusBadge';

function shortId(id: string): string {
  return id.slice(0, 8);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('ru');
}

export function JobsList() {
  const jobs = useJobsStore((state) => state.jobs);
  const activeJobId = useJobsStore((state) => state.activeJobId);
  const jobsLoading = useJobsStore((state) => state.jobsLoading);
  const jobsError = useJobsStore((state) => state.jobsError);
  const selectJob = useJobsStore((state) => state.selectJob);

  return (
    <section>
      <h2>Задания</h2>
      {jobsError && <p className="error">{jobsError}</p>}
      {jobsLoading && jobs.length === 0 ? (
        <p>Загрузка…</p>
      ) : jobs.length === 0 ? (
        <p>Пока нет заданий</p>
      ) : (
        <ul className="jobs-list">
          {jobs.map((job) => (
            <li key={job.id}>
              <button
                type="button"
                className={job.id === activeJobId ? 'active' : undefined}
                onClick={() => {
                  void selectJob(job.id);
                }}
              >
                <span className="job-id">{shortId(job.id)}</span>
                <StatusBadge status={job.status} />
                <span>
                  {job.stats.success}/{job.stats.error}/{job.stats.total}
                </span>
                <span className="job-date">{formatDate(job.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

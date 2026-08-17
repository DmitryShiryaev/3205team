import { useJobsStore } from '../store/jobsStore';
import { isTerminalJobStatus, processedCount } from '../types/job';
import { StatusBadge } from './StatusBadge';
import { UrlRow } from './UrlRow';

export function JobDetails() {
  const job = useJobsStore((state) => state.activeJob);
  const detailsLoading = useJobsStore((state) => state.detailsLoading);
  const detailsError = useJobsStore((state) => state.detailsError);
  const cancelling = useJobsStore((state) => state.cancelling);
  const cancelActiveJob = useJobsStore((state) => state.cancelActiveJob);

  if (!job && detailsLoading) {
    return (
      <section>
        <h2>Детали</h2>
        <p>Загрузка…</p>
      </section>
    );
  }

  if (!job) {
    return (
      <section>
        <h2>Детали</h2>
        {detailsError ? (
          <p className="error">{detailsError}</p>
        ) : (
          <p>Выберите задание</p>
        )}
      </section>
    );
  }

  const canCancel = !isTerminalJobStatus(job.status);

  return (
    <section>
      <div className="details-header">
        <h2>Детали</h2>
        {canCancel && (
          <button
            type="button"
            disabled={cancelling}
            onClick={() => {
              void cancelActiveJob();
            }}
          >
            {cancelling ? 'Отмена…' : 'Отменить задание'}
          </button>
        )}
      </div>
      {detailsError && <p className="error">{detailsError}</p>}
      <p>
        <StatusBadge status={job.status} />{' '}
        {processedCount(job)} из {job.items.length} обработано
      </p>
      <p className="job-id-full">{job.id}</p>
      <table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Статус</th>
            <th>HTTP</th>
            <th>Ошибка</th>
            <th>Время</th>
          </tr>
        </thead>
        <tbody>
          {job.items.map((item, index) => (
            <UrlRow key={`${item.url}-${String(index)}`} item={item} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

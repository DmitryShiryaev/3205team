import { STATUS, type JobStatus, type UrlStatus } from '../types/job';

const LABELS: Record<JobStatus | UrlStatus, string> = {
  [STATUS.PENDING]: 'ожидает',
  [STATUS.IN_PROGRESS]: 'в работе',
  [STATUS.COMPLETED]: 'завершено',
  [STATUS.CANCELLED]: 'отменено',
  [STATUS.FAILED]: 'сбой',
  [STATUS.SUCCESS]: 'успех',
  [STATUS.ERROR]: 'ошибка',
};

type StatusBadgeProps = {
  status: JobStatus | UrlStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status status-${status}`}>{LABELS[status]}</span>;
}

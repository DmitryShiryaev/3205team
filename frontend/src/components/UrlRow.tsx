import { formatDateTime, type UrlItem } from '../types/job';
import { StatusBadge } from './StatusBadge';

type UrlRowProps = {
  item: UrlItem;
};

export function UrlRow({ item }: UrlRowProps) {
  return (
    <tr>
      <td className="url-cell">{item.url}</td>
      <td>
        <StatusBadge status={item.status} />
      </td>
      <td>{item.httpStatus ?? '—'}</td>
      <td>{item.error ?? '—'}</td>
      <td className="time-cell">
        {item.startedAt ? formatDateTime(item.startedAt) : '—'}
      </td>
      <td className="time-cell">
        {item.finishedAt ? formatDateTime(item.finishedAt) : '—'}
      </td>
      <td>{item.durationMs != null ? `${item.durationMs} мс` : '—'}</td>
    </tr>
  );
}

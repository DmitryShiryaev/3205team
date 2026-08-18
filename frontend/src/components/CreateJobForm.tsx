import { useState, type FormEvent } from 'react';
import { useJobsStore } from '../store/jobsStore';
import { MAX_JOB_URLS, parseUrlLines } from '../types/job';

export function CreateJobForm() {
  const creating = useJobsStore((state) => state.creating);
  const jobsError = useJobsStore((state) => state.jobsError);
  const createJobFromUrls = useJobsStore((state) => state.createJobFromUrls);
  const [text, setText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const urls = parseUrlLines(text);

    if (urls.length === 0) {
      setFormError('Добавьте хотя бы один URL');
      return;
    }

    if (urls.length > MAX_JOB_URLS) {
      setFormError(`Не больше ${MAX_JOB_URLS} URL за раз`);
      return;
    }

    setFormError(null);
    void createJobFromUrls(urls).then((created) => {
      if (created) {
        setText('');
      }
    });
  };

  return (
    <section>
      <h2>Новое задание</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="urls">URL, по одному на строку</label>
        <textarea
          id="urls"
          rows={6}
          value={text}
          disabled={creating}
          placeholder={'https://yandex.ru\nhttps://example.org'}
          onChange={(event) => setText(event.target.value)}
        />
        {(formError || jobsError) && (
          <p className="error">{formError ?? jobsError}</p>
        )}
        <button type="submit" disabled={creating}>
          {creating ? 'Запуск…' : 'Запустить проверку'}
        </button>
      </form>
    </section>
  );
}

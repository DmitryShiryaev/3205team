const API_BASE = '/api';

export async function createJob(urls: string[]): Promise<{ jobId: string }> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create job: ${res.status}`);
  }

  return res.json();
}

export async function fetchJobs(): Promise<unknown[]> {
  const res = await fetch(`${API_BASE}/jobs`);

  if (!res.ok) {
    throw new Error(`Failed to fetch jobs: ${res.status}`);
  }

  return res.json();
}

export async function fetchJob(id: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/jobs/${id}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch job: ${res.status}`);
  }

  return res.json();
}

export async function cancelJob(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${id}`, { method: 'DELETE' });

  if (!res.ok) {
    throw new Error(`Failed to cancel job: ${res.status}`);
  }
}

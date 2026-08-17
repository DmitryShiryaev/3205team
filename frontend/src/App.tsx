import { useEffect } from 'react';
import { CreateJobForm } from './components/CreateJobForm';
import { JobDetails } from './components/JobDetails';
import { JobsList } from './components/JobsList';
import { useActiveJobPolling } from './hooks/useActiveJobPolling';
import { useJobsStore } from './store/jobsStore';

function App() {
  const loadJobs = useJobsStore((state) => state.loadJobs);
  useActiveJobPolling();

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  return (
    <main>
      <h1>Проверка URL</h1>
      <CreateJobForm />
      <div className="layout">
        <JobsList />
        <JobDetails />
      </div>
    </main>
  );
}

export default App;

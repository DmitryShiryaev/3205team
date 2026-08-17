import { CreateJobForm } from './components/CreateJobForm';
import { JobDetails } from './components/JobDetails';
import { JobsList } from './components/JobsList';

function App() {
  return (
    <main>
      <h1>URL checker</h1>
      <CreateJobForm />
      <JobsList />
      <JobDetails />
    </main>
  );
}

export default App;

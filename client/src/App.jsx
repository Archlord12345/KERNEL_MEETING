import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LinearProgress } from '@mui/material';
import AppLayout from './components/layout/AppLayout.jsx';

const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const JoinMeetingPage = lazy(() => import('./pages/JoinMeetingPage.jsx'));
const CreateMeetingPage = lazy(() => import('./pages/CreateMeetingPage.jsx'));
const MeetingPage = lazy(() => import('./pages/MeetingPage.jsx'));

function App() {
  return (
    <AppLayout>
      <Suspense fallback={<LinearProgress sx={{ width: '100%' }} />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/join" element={<JoinMeetingPage />} />
          <Route path="/create" element={<CreateMeetingPage />} />
          <Route path="/meeting/:roomId" element={<MeetingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

export default App;

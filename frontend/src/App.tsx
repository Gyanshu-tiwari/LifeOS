import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LifeOSProvider } from './context/LifeOSContext';
import { AppLayout } from './components/layout/AppLayout';

// Page Imports
import { HomePage } from './pages/HomePage';
import { GoalsPage } from './pages/GoalsPage';
import { CreateGoalPage } from './pages/CreateGoalPage';
import { GoalDetailsPage } from './pages/GoalDetailsPage';
import { PlanPage } from './pages/PlanPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AgentsPage } from './pages/AgentsPage';
import { ResearchPage } from './pages/ResearchPage';
import { MapsPage } from './pages/MapsPage';
import { VerificationPage } from './pages/VerificationPage';
import { ActionCenterPage } from './pages/ActionCenterPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';

export const App: React.FC = () => {
  return (
    <LifeOSProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="goals/new" element={<CreateGoalPage />} />
            <Route path="goals/:id" element={<GoalDetailsPage />} />
            <Route path="goals/:id/plan" element={<PlanPage />} />
            <Route path="planning" element={<PlanPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="research" element={<ResearchPage />} />
            <Route path="maps" element={<MapsPage />} />
            <Route path="verification" element={<VerificationPage />} />
            <Route path="actions" element={<ActionCenterPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LifeOSProvider>
  );
};

export default App;

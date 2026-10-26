import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, ProtectedRoute } from './auth';

// Layouts
import AppLayout from './components/layout/AppLayout';
import PlanLayout from './components/layout/PlanLayout';

// Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CreateActivityPage from './pages/CreateActivityPage';
import PlanGenerationPage from './pages/PlanGenerationPage';
import PlanOverviewPage from './pages/PlanOverviewPage';
import TasksPage from './pages/TasksPage';
import JourneyPage from './pages/JourneyPage';
import PlacesPage from './pages/PlacesPage';
import PackingPage from './pages/PackingPage';
import ItineraryPage from './pages/ItineraryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import { ToastProvider } from './context/ToastContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Router>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/create" element={<CreateActivityPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/plans/:id/generating" element={<PlanGenerationPage />} />
              </Route>
              <Route element={<PlanLayout />}>
                <Route path="/plans/:id" element={<PlanOverviewPage />} />
                <Route path="/plans/:id/tasks" element={<TasksPage />} />
                <Route path="/plans/:id/journey" element={<JourneyPage />} />
                <Route path="/plans/:id/places" element={<PlacesPage />} />
                <Route path="/plans/:id/packing" element={<PackingPage />} />
                <Route path="/plans/:id/itinerary" element={<ItineraryPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;

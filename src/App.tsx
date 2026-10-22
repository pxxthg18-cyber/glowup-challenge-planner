import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChallengeProvider } from './context/ChallengeContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { AuthPage } from './pages/AuthPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { HabitsPage } from './pages/HabitsPage';
import { GoalsPage } from './pages/GoalsPage';
import { CalendarPage } from './pages/CalendarPage';
import { JournalPage } from './pages/JournalPage';
import { FocusPage } from './pages/FocusPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { VisionBoardPage } from './pages/VisionBoardPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9879B] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChallengeProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Route */}
              <Route path="/auth" element={<AuthPage />} />

              {/* Protected App Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Rule 5: Show Template Gallery as primary screen */}
                <Route index element={<Navigate to="/templates" replace />} />
                <Route path="templates" element={<TemplatesPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="habits" element={<HabitsPage />} />
                <Route path="goals" element={<GoalsPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="journal" element={<JournalPage />} />
                <Route path="focus" element={<FocusPage />} />
                <Route path="reports" element={<AnalyticsPage />} />
                <Route path="vision" element={<VisionBoardPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </BrowserRouter>
        </ChallengeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

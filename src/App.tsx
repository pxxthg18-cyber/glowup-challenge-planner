import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
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
import { LifeGoalsPage } from './pages/LifeGoalsPage';
import { SelfCarePage } from './pages/SelfCarePage';
import { LifeBalancePage } from './pages/LifeBalancePage';
import { FoodTrackerPage } from './pages/FoodTrackerPage';
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
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#F2DDE3] text-[#C9879B] flex items-center justify-center animate-pulse">
          <Sparkles className="w-5 h-5 fill-[#C9879B]" />
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-[#C9879B] border-t-transparent animate-spin" />
        <span className="text-xs text-[#77727B] font-medium">Authenticating GlowUp Studio...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#F2DDE3] text-[#C9879B] flex items-center justify-center animate-pulse">
          <Sparkles className="w-5 h-5 fill-[#C9879B]" />
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-[#C9879B] border-t-transparent animate-spin" />
        <span className="text-xs text-[#77727B] font-medium">Authenticating GlowUp Studio...</span>
      </div>
    );
  }

  if (user) {
    const rawFrom = (location.state as any)?.from?.pathname;
    const destination = rawFrom && rawFrom !== '/' && rawFrom !== '/auth' ? rawFrom : '/dashboard';
    return <Navigate to={destination} replace />;
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
              <Route
                path="/auth"
                element={
                  <AuthRoute>
                    <AuthPage />
                  </AuthRoute>
                }
              />

              {/* Protected App Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Authenticated home is the Dashboard */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="templates" element={<TemplatesPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="habits" element={<HabitsPage />} />
                <Route path="goals" element={<GoalsPage />} />
                <Route path="life-goals" element={<LifeGoalsPage />} />
                <Route path="self-care" element={<SelfCarePage />} />
                <Route path="life-balance" element={<LifeBalancePage />} />
                <Route path="life_balance" element={<Navigate to="/life-balance" replace />} />
                <Route path="food-tracker" element={<FoodTrackerPage />} />
                <Route path="food_tracker" element={<Navigate to="/food-tracker" replace />} />
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

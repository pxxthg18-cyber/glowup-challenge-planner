import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { ChallengeWizardModal } from '../challenge/ChallengeWizardModal';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen lg:h-screen bg-[#FAF7F2] flex lg:overflow-hidden">
      {/* Desktop sidebar (fixed/sticky on desktop, hidden on mobile) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenCreateModal={() => setIsWizardOpen(true)}
      />

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenCreateTask={() => navigate('/tasks')}
          onOpenCreateHabit={() => navigate('/habits')}
          onOpenCreateJournal={() => navigate('/journal')}
        />

        {/* Page content — scrolls independently while sidebar and header stay fixed */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8 lg:overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation — hidden on lg+ */}
      <MobileBottomNav />

      {/* Global Challenge Wizard Modal */}
      <ChallengeWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => navigate('/dashboard')}
      />
    </div>
  );
};

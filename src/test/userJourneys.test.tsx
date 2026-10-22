import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ChallengeProvider } from '../context/ChallengeContext';
import { TemplatesPage } from '../pages/TemplatesPage';
import { DashboardPage } from '../pages/DashboardPage';
import { storageRepository } from '../services/storageRepository';

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChallengeProvider>
          <BrowserRouter>
            {ui}
          </BrowserRouter>
        </ChallengeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('User Journeys & UI Verification', () => {
  const testUser = {
    id: 'user_testjourney_at_example_com',
    email: 'testjourney@example.com',
    full_name: 'Journey Tester',
    avatar_url: null,
    bio: null,
    preferred_theme: 'light' as const,
    focus_daily_target_minutes: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
    // Simulate authenticated user for all UI tests
    storageRepository.setCurrentUser(testUser);
  });

  it('renders the Challenge Template Gallery with curated templates and search', async () => {
    renderWithProviders(<TemplatesPage />);

    // Check title
    expect(screen.getByText(/Choose Your Glow-Up Challenge/i)).toBeInTheDocument();

    // Verify presence of templates
    expect(screen.getByText(/7-Day Soft Reset/i)).toBeInTheDocument();
    expect(screen.getByText(/30-Day Glow-Up Challenge/i)).toBeInTheDocument();

    // Test search filter
    const searchInput = screen.getByPlaceholderText(/Search templates/i);
    fireEvent.change(searchInput, { target: { value: 'Detox' } });

    await waitFor(() => {
      expect(screen.getByText(/14-Day Digital Detox/i)).toBeInTheDocument();
      expect(screen.queryByText(/7-Day Soft Reset/i)).not.toBeInTheDocument();
    });
  });

  it('allows creating and launching a custom 35-day challenge with dynamic milestones', async () => {
    renderWithProviders(<TemplatesPage />);

    // Click "+ Create Custom Challenge"
    const createBtn = screen.getByRole('button', { name: /Create Custom Challenge/i });
    fireEvent.click(createBtn);

    // Verify modal opened
    expect(screen.getByText(/Challenge Basics & Duration/i)).toBeInTheDocument();

    // Verify arbitrary days input exists and set to 35
    const daysInput = screen.getByDisplayValue('30');
    fireEvent.change(daysInput, { target: { value: '35' } });
    expect(screen.getByDisplayValue('35')).toBeInTheDocument();

    // Step to Next
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    // Step 2: Goals & Habits
    expect(screen.getByText(/Personalize Goals, Habits & Tasks/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 3: Milestones & Launch
    expect(screen.getByText(/Generated Milestones for 35-Day Duration/i)).toBeInTheDocument();

    // Launch
    const launchBtn = screen.getByRole('button', { name: /Launch My Glow-Up/i });
    fireEvent.click(launchBtn);

    // Confirm that the challenge was created in storage with 35 days
    const active = storageRepository.getActiveChallenge();
    expect(active).toBeDefined();
    expect(active?.duration_days).toBe(35);
  });

  it('renders Dashboard with active challenge, allows checking tasks & habits directly', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Seed an active challenge first
    const challenge = storageRepository.createChallenge({
      title: 'Active Radiance Sprint',
      category: 'Holistic',
      duration_days: 21,
      start_date: today,
      custom_tasks: [
        { title: 'Morning Affirmation Journal', day_number: 1, category: 'Mindset', priority: 'high', estimated_minutes: 15 },
      ],
      custom_habits: [
        { title: 'Drink 2.5L Water', frequency_type: 'daily', scheduled_days: [0, 1, 2, 3, 4, 5, 6], category: 'Hydration' },
      ],
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Active Radiance Sprint/i)).toBeInTheDocument();
      expect(screen.getByText(/Morning Affirmation Journal/i)).toBeInTheDocument();
      expect(screen.getByText(/Drink 2.5L Water/i)).toBeInTheDocument();
    });

    // Toggle task
    const taskItem = screen.getByText(/Morning Affirmation Journal/i);
    fireEvent.click(taskItem);

    await waitFor(() => {
      const tasks = storageRepository.getTasks(challenge.id);
      expect(tasks[0].status).toBe('completed');
    });
  });
});

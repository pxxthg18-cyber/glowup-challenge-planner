import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { Challenge } from '../types/database';

interface ChallengeContextType {
  activeChallenge: Challenge | null;
  challenges: Challenge[];
  isLoading: boolean;
  hasActiveChallenge: boolean;
  refreshChallenges: () => Promise<void>;
  setActiveChallenge: (id: string) => Promise<void>;
  createChallenge: (data: Parameters<typeof api.createChallenge>[0]) => Promise<Challenge>;
  updateChallenge: (id: string, updates: Partial<Challenge>) => Promise<Challenge>;
  deleteChallenge: (id: string) => Promise<void>;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

export const ChallengeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenge, setActiveChallengeState] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshChallenges = useCallback(async () => {
    try {
      const all = await api.getChallenges();
      setChallenges(all);
      const active = await api.getActiveChallenge();
      setActiveChallengeState(active);
    } catch (err) {
      console.error('Error refreshing challenges:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshChallenges();
  }, [refreshChallenges]);

  const setActiveChallenge = async (id: string) => {
    await api.setActiveChallenge(id);
    const found = challenges.find(c => c.id === id);
    if (found) {
      setActiveChallengeState(found);
    } else {
      await refreshChallenges();
    }
  };

  const createChallenge = async (data: Parameters<typeof api.createChallenge>[0]) => {
    const created = await api.createChallenge(data);
    await refreshChallenges();
    setActiveChallengeState(created);
    return created;
  };

  const updateChallenge = async (id: string, updates: Partial<Challenge>) => {
    const updated = await api.updateChallenge(id, updates);
    await refreshChallenges();
    return updated;
  };

  const deleteChallenge = async (id: string) => {
    await api.deleteChallenge(id);
    await refreshChallenges();
  };

  return (
    <ChallengeContext.Provider
      value={{
        activeChallenge,
        challenges,
        isLoading,
        hasActiveChallenge: Boolean(activeChallenge),
        refreshChallenges,
        setActiveChallenge,
        createChallenge,
        updateChallenge,
        deleteChallenge,
      }}
    >
      {children}
    </ChallengeContext.Provider>
  );
};

export const useChallenge = () => {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error('useChallenge must be used within a ChallengeProvider');
  }
  return context;
};

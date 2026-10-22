import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { api } from '../services/api';
import { storageRepository } from '../services/storageRepository';
import { Profile } from '../types/database';

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isCloudConnected: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password?: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch (err) {
      console.error('Error fetching auth profile:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // One-time migration: wipe any stale auto-seeded demo session from older builds
    // so browsers that previously loaded the app don't inherit Elena Rostova's account.
    const rawUser = localStorage.getItem('glowup_user');
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        if (
          parsed?.id === 'demo-user-001' ||
          parsed?.email === 'demo@glowup.local' ||
          parsed?.email === 'elena.rostova@glowup.local'
        ) {
          localStorage.removeItem('glowup_user');
        }
      } catch {
        localStorage.removeItem('glowup_user');
      }
    }

    fetchProfile();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, _session) => {
        await fetchProfile();
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase && password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Local mode multi-user sign in with unique isolation per email
        const normalized = email.trim().toLowerCase();
        const existing = storageRepository.findAccountByEmail(normalized);

        let profile: Profile;
        if (existing) {
          profile = existing;
        } else {
          const userId = 'user_' + normalized.replace(/[^a-z0-9]/g, '_');
          profile = {
            id: userId,
            email: normalized,
            full_name: normalized.split('@')[0],
            avatar_url: null,
            bio: 'Embracing my transformative glow-up journey.',
            preferred_theme: 'light',
            focus_daily_target_minutes: 60,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          storageRepository.saveAccount(profile);
        }

        storageRepository.setCurrentUser(profile);
        setUser(profile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password?: string, fullName?: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase && password) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || email.split('@')[0] },
          },
        });
        if (error) throw error;
      } else {
        const normalized = email.trim().toLowerCase();
        const userId = 'user_' + normalized.replace(/[^a-z0-9]/g, '_');
        const profile: Profile = {
          id: userId,
          email: normalized,
          full_name: fullName || normalized.split('@')[0],
          avatar_url: null,
          bio: 'Ready to glow up.',
          preferred_theme: 'light',
          focus_daily_target_minutes: 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        storageRepository.saveAccount(profile);
        storageRepository.setCurrentUser(profile);
        setUser(profile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      storageRepository.setCurrentUser(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const updated = await api.updateProfile(updates);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isCloudConnected: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

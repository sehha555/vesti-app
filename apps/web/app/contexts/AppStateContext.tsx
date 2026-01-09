'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PageType = 'home' | 'wardrobe' | 'explore' | 'store' | 'profile' | 'tryon' | 'checkout' | 'discount' | 'trending' | 'upload' | 'login' | 'broadcast' | 'calendar' | 'cpwranking' | 'delivery' | 'notification' | 'payment-methods';

export type LoadingState = 'loading' | 'ready' | 'error';

interface AppStateContextType {
  // Page state
  currentPage: PageType | null;
  previousPage: PageType;
  setCurrentPage: (page: PageType) => void;
  navigationDirection: 'forward' | 'back';

  // Loading state
  loadingState: LoadingState;

  // Auth state
  isAuthenticated: boolean;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

const pageHierarchy: Record<PageType, number> = {
  'login': 0,
  'home': 1,
  'wardrobe': 1,
  'explore': 1,
  'store': 1,
  'profile': 1,
  'tryon': 2,
  'checkout': 2,
  'discount': 2,
  'trending': 2,
  'upload': 2,
  'broadcast': 2,
  'calendar': 2,
  'cpwranking': 2,
  'delivery': 2,
  'notification': 2,
  'payment-methods': 2,
};

interface AppStateProviderProps {
  children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [currentPage, setCurrentPageState] = useState<PageType | null>(null);
  const [previousPage, setPreviousPage] = useState<PageType>('login');
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'back'>('forward');
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth session on mount
  useEffect(() => {
    const checkAuthSession = () => {
      try {
        const hasAuthStatus = document.cookie.includes('sb-auth-status=authenticated');
        setIsAuthenticated(hasAuthStatus);

        if (hasAuthStatus) {
          setCurrentPageState('home');
        } else {
          setCurrentPageState('login');
        }
        setLoadingState('ready');
      } catch (error) {
        console.error('[AppStateProvider] Auth check failed:', error);
        setCurrentPageState('login');
        setLoadingState('error');
      }
    };

    checkAuthSession();
  }, []);

  const setCurrentPage = (newPage: PageType) => {
    const currentLevel = pageHierarchy[currentPage || 'login'];
    const newLevel = pageHierarchy[newPage];
    setNavigationDirection(newLevel > currentLevel ? 'forward' : 'back');
    setPreviousPage(currentPage || 'login');
    setCurrentPageState(newPage);
  };

  const value: AppStateContextType = {
    currentPage,
    previousPage,
    setCurrentPage,
    navigationDirection,
    loadingState,
    isAuthenticated,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextType {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

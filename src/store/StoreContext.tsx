import React, { createContext, useContext } from 'react';
import { useStore, type StoreType } from './useStore';

const StoreContext = createContext<StoreType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStoreContext() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStoreContext must be used inside StoreProvider');
  return ctx;
}

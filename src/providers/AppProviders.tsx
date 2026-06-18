import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { AuthProvider } from '../context/AuthContext';
import { queryClient, asyncStoragePersister } from '../queries/queryClient';
import { useUploadQueue } from '../lib/uploadQueue';
import { useSettingsStore } from '../store/settingsStore';
import { ThemeProvider } from '../theme/ThemeContext';
import { UploadProgressBanner } from '../components/UploadProgressBanner';
import { ErrorBoundary } from '../components/ErrorBoundary';

function StoreHydrator({ children }: { children: React.ReactNode }) {
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateUpload = useUploadQueue((s) => s.hydrate);

  React.useEffect(() => {
    void hydrateSettings();
    void hydrateUpload();
  }, [hydrateSettings, hydrateUpload]);

  return (
    <>
      <UploadProgressBanner />
      {children}
    </>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.state.status === 'success',
        },
      }}
    >
      <AuthProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <StoreHydrator>{children}</StoreHydrator>
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Wake up the Render server immediately on app load.
// Render free tier sleeps after 15 min of inactivity and takes ~50s to wake up.
// Pinging /health now means the server is ready by the time the user clicks login.
fetch(`${import.meta.env.VITE_API_URL ?? ''}/health`).catch(() => {});

// Configure TanStack Query with sensible defaults.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on 4xx errors — they're client-side problems, not transient.
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number })?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* BrowserRouter enables client-side routing via React Router v6 */}
      <BrowserRouter>
        {/* AuthProvider makes the current user available to all components */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);

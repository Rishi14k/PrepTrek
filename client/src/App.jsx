import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'text-xs font-semibold shadow-lg',
            style: {
              borderRadius: '12px',
              background: '#0f172a',
              color: '#ffffff',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

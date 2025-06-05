import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import './i18n';

const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <Toaster position="top-right" />
        {isAuthenticated ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <LoginForm onSuccess={handleAuthSuccess} />
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;
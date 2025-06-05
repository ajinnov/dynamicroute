import React, { useState } from 'react';
import Layout from './Layout';
import DashboardPage from '../pages/Dashboard';
import DomainsPage from '../pages/DomainsPage';
import AWSAccountsPage from '../pages/AWSAccountsPage';
import SlackAccountsPage from '../pages/SlackAccountsPage';
import UsersPage from '../pages/UsersPage';
import SettingsPage from '../pages/SettingsPage';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onPageChange={setCurrentPage} />;
      case 'domains':
        return <DomainsPage />;
      case 'aws-accounts':
        return <AWSAccountsPage />;
      case 'slack-accounts':
        return <SlackAccountsPage />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onPageChange={setCurrentPage} />;
    }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      onPageChange={setCurrentPage} 
      onLogout={handleLogout}
    >
      {renderCurrentPage()}
    </Layout>
  );
};

export default Dashboard;
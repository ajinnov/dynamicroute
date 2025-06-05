import React from 'react';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { dashboardAPI, domainsAPI, awsAccountsAPI } from '../services/api';
import { 
  GlobeAltIcon, 
  CheckCircleIcon, 
  CloudIcon, 
  ComputerDesktopIcon 
} from '@heroicons/react/24/outline';

interface DashboardProps {
  onPageChange?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onPageChange }) => {
  const { t } = useTranslation();
  const { data: stats } = useQuery('dashboard-stats', dashboardAPI.getStats);
  const { data: domains } = useQuery('domains', domainsAPI.list);
  const { data: awsAccounts } = useQuery('aws-accounts', awsAccountsAPI.list);

  const statsData = [
    {
      name: t('dashboard.total_domains'),
      value: stats?.data.total_domains || 0,
      icon: GlobeAltIcon,
      color: 'bg-indigo-500',
    },
    {
      name: t('dashboard.active_domains'),
      value: stats?.data.active_domains || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: t('dashboard.aws_accounts'),
      value: stats?.data.total_aws_accounts || 0,
      icon: CloudIcon,
      color: 'bg-yellow-500',
    },
    {
      name: t('dashboard.public_ip'),
      value: stats?.data.current_ipv4 || 'N/A',
      icon: ComputerDesktopIcon,
      color: 'bg-blue-500',
      isIP: true,
    },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((item, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${item.color} rounded-md flex items-center justify-center`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className={`text-lg font-medium text-gray-900 ${item.isIP ? 'text-sm' : ''}`}>
                      {item.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Domains */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {t('dashboard.recent_domains')}
            </h3>
            {domains?.data.length === 0 ? (
              <div className="text-center py-6">
                <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('dashboard.no_domains')}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t('dashboard.get_started')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {domains?.data.slice(0, 5).map((domain) => (
                  <div key={domain.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{domain.name}</p>
                      <p className="text-sm text-gray-500">
                        {domain.current_ip || t('dashboard.ip_not_defined')} • Type {domain.record_type}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      domain.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {domain.is_active ? t('common.active') : t('common.inactive')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AWS Accounts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {t('dashboard.aws_accounts')}
            </h3>
            {awsAccounts?.data.length === 0 ? (
              <div className="text-center py-6">
                <CloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No AWS accounts</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add your AWS credentials to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {awsAccounts?.data.map((account) => (
                  <div key={account.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-500">
                        Region: {account.region} • ID: {account.access_key_id.substring(0, 10)}...
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t('dashboard.connected')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {t('dashboard.quick_actions')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button 
                onClick={() => onPageChange?.('domains')}
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 hover:shadow-lg transition-shadow text-left"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-600 ring-4 ring-white">
                    <GlobeAltIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    {t('dashboard.add_domain')}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {t('dashboard.add_domain_description')}
                  </p>
                </div>
                <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="m11.293 17.293 1.414 1.414L19.414 12l-6.707-6.707-1.414 1.414L15.586 11H6v2h9.586l-4.293 4.293z" />
                  </svg>
                </span>
              </button>

              <button 
                onClick={() => onPageChange?.('aws-accounts')}
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 hover:shadow-lg transition-shadow text-left"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-600 ring-4 ring-white">
                    <CloudIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    {t('dashboard.add_aws_account')}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {t('dashboard.add_aws_account_description')}
                  </p>
                </div>
                <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="m11.293 17.293 1.414 1.414L19.414 12l-6.707-6.707-1.414 1.414L15.586 11H6v2h9.586l-4.293 4.293z" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
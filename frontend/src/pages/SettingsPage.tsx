import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { dashboardAPI, settingsAPI, SettingsResponse } from '../services/api';
import { 
  ClockIcon, 
  GlobeAltIcon, 
  ComputerDesktopIcon,
  InformationCircleIcon,
  PencilIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface EditableSettingProps {
  settingKey: string;
  title: string;
  description: string;
  value: any;
  type: 'number' | 'array';
  onUpdate: (key: string, value: any) => void;
  onReset: (key: string) => void;
  isLoading: boolean;
}

const EditableSetting: React.FC<EditableSettingProps> = ({
  settingKey,
  title,
  description,
  value,
  type,
  onUpdate,
  onReset,
  isLoading
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    let processedValue = editValue;
    
    if (type === 'array') {
      // Convert textarea string to array
      processedValue = editValue
        .split('\n')
        .map((url: string) => url.trim())
        .filter((url: string) => url.length > 0);
    } else if (type === 'number') {
      processedValue = parseInt(editValue);
    }
    
    onUpdate(settingKey, processedValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleReset = () => {
    onReset(settingKey);
    setIsEditing(false);
  };

  const displayValue = type === 'array' 
    ? (Array.isArray(value) ? value.join('\n') : '') 
    : value;

  React.useEffect(() => {
    setEditValue(displayValue);
  }, [displayValue]);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-indigo-600 hover:text-indigo-900"
                  title={t('common.edit')}
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  title={t('settings.reset_to_default')}
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
                  title={t('common.save')}
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleCancel}
                  className="text-red-600 hover:text-red-900"
                  title={t('common.cancel')}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        
        {isEditing ? (
          <div className="space-y-2">
            {type === 'array' ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={t('settings.one_url_per_line')}
              />
            ) : (
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
              />
            )}
          </div>
        ) : (
          <div className="bg-gray-50 p-3 rounded-md">
            {type === 'array' ? (
              <ul className="space-y-1">
                {Array.isArray(value) && value.map((item: string, index: number) => (
                  <li key={index} className="text-sm text-gray-700 font-mono">• {item}</li>
                ))}
              </ul>
            ) : (
              <span className="text-sm font-mono text-gray-900">
                {value} {settingKey.includes('interval') ? t('settings.seconds') : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery('settings', settingsAPI.getAll);
  const { data: stats } = useQuery('dashboard-stats', dashboardAPI.getStats);

  const updateMutation = useMutation(
    ({ key, value }: { key: string; value: any }) => settingsAPI.update(key, { value }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings');
        toast.success(t('settings.setting_updated'));
      },
      onError: () => {
        toast.error(t('settings.update_error'));
      }
    }
  );

  const resetMutation = useMutation(
    (key: string) => settingsAPI.reset(key),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings');
        toast.success(t('settings.setting_reset'));
      },
      onError: () => {
        toast.error(t('settings.reset_error'));
      }
    }
  );

  const handleUpdate = (key: string, value: any) => {
    updateMutation.mutate({ key, value });
  };

  const handleReset = (key: string) => {
    resetMutation.mutate(key);
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">{t('settings.title')}</h1>
          <p className="mt-2 text-sm text-gray-700">
            {t('settings.description')}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* System Status - Full Width */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {t('settings.system_status')}
            </h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <dt className="flex items-center justify-center text-sm font-medium text-gray-500 mb-2">
                  <ClockIcon className="mr-2 h-5 w-5" />
                  {t('settings.current_refresh_interval')}
                </dt>
                <dd className="text-sm text-gray-900 font-mono">
                  {settings?.data['scheduler.refresh_interval']?.value || 300} {t('settings.seconds')}
                </dd>
              </div>
              <div className="text-center">
                <dt className="flex items-center justify-center text-sm font-medium text-gray-500 mb-2">
                  <GlobeAltIcon className="mr-2 h-5 w-5" />
                  {t('settings.current_ipv4')}
                </dt>
                <dd className="text-sm text-gray-900 font-mono">
                  {stats?.data.current_ipv4 || t('dashboard.ip_not_defined')}
                </dd>
              </div>
              <div className="text-center">
                <dt className="flex items-center justify-center text-sm font-medium text-gray-500 mb-2">
                  <GlobeAltIcon className="mr-2 h-5 w-5" />
                  {t('settings.current_ipv6')}
                </dt>
                <dd className="text-sm text-gray-900 font-mono">
                  {stats?.data.current_ipv6 || t('dashboard.ip_not_defined')}
                </dd>
              </div>
              <div className="text-center">
                <dt className="flex items-center justify-center text-sm font-medium text-gray-500 mb-2">
                  <ComputerDesktopIcon className="mr-2 h-5 w-5" />
                  {t('settings.scheduler_status')}
                </dt>
                <dd className="flex justify-center">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {t('common.active')}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* IP Sources - Two columns */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* IPv4 Sources */}
          {settings?.data['ip_detection.ipv4_sources'] && (
            <EditableSetting
              settingKey="ip_detection.ipv4_sources"
              title={t('settings.ipv4_sources')}
              description={t('settings.ipv4_sources_description')}
              value={settings.data['ip_detection.ipv4_sources'].value}
              type="array"
              onUpdate={handleUpdate}
              onReset={handleReset}
              isLoading={updateMutation.isLoading || resetMutation.isLoading}
            />
          )}

          {/* IPv6 Sources */}
          {settings?.data['ip_detection.ipv6_sources'] && (
            <EditableSetting
              settingKey="ip_detection.ipv6_sources"
              title={t('settings.ipv6_sources')}
              description={t('settings.ipv6_sources_description')}
              value={settings.data['ip_detection.ipv6_sources'].value}
              type="array"
              onUpdate={handleUpdate}
              onReset={handleReset}
              isLoading={updateMutation.isLoading || resetMutation.isLoading}
            />
          )}
        </div>

        {/* Refresh Interval - Full Width */}
        {settings?.data['scheduler.refresh_interval'] && (
          <EditableSetting
            settingKey="scheduler.refresh_interval"
            title={t('settings.dns_check_interval')}
            description={t('settings.dns_check_interval_description')}
            value={settings.data['scheduler.refresh_interval'].value}
            type="number"
            onUpdate={handleUpdate}
            onReset={handleReset}
            isLoading={updateMutation.isLoading || resetMutation.isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { Domain, awsAccountsAPI, slackAccountsAPI } from '../services/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DomainFormData {
  name: string;
  zone_id: string;
  record_type: 'A' | 'AAAA';
  ttl: number;
  aws_account_id: number;
  slack_account_id: number | '';
  is_active: boolean;
}

interface EditDomainModalProps {
  domain: Domain;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Domain>) => void;
  isLoading: boolean;
}

const EditDomainModal: React.FC<EditDomainModalProps> = ({
  domain,
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const { t } = useTranslation();
  const { data: awsAccounts } = useQuery('aws-accounts', awsAccountsAPI.list);
  const { data: slackAccounts } = useQuery('slack-accounts', slackAccountsAPI.list);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DomainFormData>();

  useEffect(() => {
    if (isOpen && domain) {
      reset({
        name: domain.name,
        zone_id: domain.zone_id,
        record_type: domain.record_type,
        ttl: domain.ttl,
        aws_account_id: domain.aws_account_id,
        slack_account_id: domain.slack_account_id || '',
        is_active: domain.is_active
      });
    }
  }, [isOpen, domain, reset]);

  const handleFormSubmit = (data: DomainFormData) => {
    const payload = {
      ...data,
      slack_account_id: data.slack_account_id === '' ? undefined : data.slack_account_id
    };
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {t('domains.edit_domain')}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('domains.domain_name')}
                  </label>
                  <input
                    {...register('name', { required: `${t('domains.domain_name')} is required` })}
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('domains.zone_id')}
                  </label>
                  <input
                    {...register('zone_id', { required: `${t('domains.zone_id')} is required` })}
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.zone_id && <p className="mt-1 text-sm text-red-600">{errors.zone_id.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('domains.record_type')}
                  </label>
                  <select
                    {...register('record_type', { required: `${t('domains.record_type')} is required` })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="A">A (IPv4)</option>
                    <option value="AAAA">AAAA (IPv6)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('domains.ttl')}
                  </label>
                  <input
                    {...register('ttl', { required: `${t('domains.ttl')} is required`, valueAsNumber: true })}
                    type="number"
                    min={60}
                    max={86400}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('domains.aws_account')}
                  </label>
                  <select
                    {...register('aws_account_id', { required: `${t('domains.aws_account')} is required`, valueAsNumber: true })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select AWS account</option>
                    {awsAccounts?.data.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.region})
                      </option>
                    ))}
                  </select>
                  {errors.aws_account_id && <p className="mt-1 text-sm text-red-600">{errors.aws_account_id.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('domains.slack_notifications')}
                  </label>
                  <select
                    {...register('slack_account_id')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">{t('domains.no_notification')}</option>
                    {slackAccounts?.data.filter(account => account.is_active).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center">
                    <input
                      {...register('is_active')}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      {t('domains.enable_monitoring')}
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-md">
                <p className="text-sm text-yellow-700">
                  {t('domains.record_type_warning')}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? `${t('common.update')}...` : t('common.update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDomainModal;
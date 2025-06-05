import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Domain, awsAccountsAPI, slackAccountsAPI, hostedZonesAPI, HostedZone } from '../services/api';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface DomainFormData {
  name: string;
  zone_id: string; // Keep for backward compatibility
  hosted_zone_id?: string; // New field for hosted zone selection
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
  const queryClient = useQueryClient();
  const [useHostedZones, setUseHostedZones] = useState(false);
  
  const { data: awsAccounts } = useQuery('aws-accounts', awsAccountsAPI.list);
  const { data: slackAccounts } = useQuery('slack-accounts', slackAccountsAPI.list);
  const { data: hostedZones } = useQuery('hosted-zones', hostedZonesAPI.list);
  
  const refreshHostedZonesMutation = useMutation(hostedZonesAPI.refresh, {
    onSuccess: () => {
      queryClient.invalidateQueries('hosted-zones');
      toast.success('Hosted zones refreshed successfully!');
    },
    onError: (error: any) => {
      toast.error(`Error refreshing hosted zones: ${error.response?.data?.detail || error.message}`);
    }
  });
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<DomainFormData>();
  const selectedAwsAccountId = watch('aws_account_id');

  useEffect(() => {
    if (isOpen && domain) {
      // Check if domain has hosted_zone_id (new format) or only zone_id (legacy)
      const hasHostedZone = domain.hosted_zone_id !== undefined;
      setUseHostedZones(hasHostedZone);
      
      reset({
        name: domain.name,
        zone_id: domain.zone_id,
        hosted_zone_id: domain.hosted_zone_id || '',
        record_type: domain.record_type,
        ttl: domain.ttl,
        aws_account_id: domain.aws_account_id,
        slack_account_id: domain.slack_account_id || '',
        is_active: domain.is_active
      });
    }
  }, [isOpen, domain, reset]);

  const handleRefreshHostedZones = () => {
    if (selectedAwsAccountId) {
      refreshHostedZonesMutation.mutate({ aws_account_id: selectedAwsAccountId });
    } else {
      toast.error('Please select an AWS account first');
    }
  };

  const handleFormSubmit = (data: DomainFormData) => {
    const payload: any = {
      ...data,
      slack_account_id: data.slack_account_id === '' ? undefined : data.slack_account_id
    };
    
    // If using hosted zones, set zone_id from the selected hosted zone
    if (useHostedZones && data.hosted_zone_id) {
      payload.zone_id = data.hosted_zone_id;
    }
    
    onSubmit(payload);
  };

  // Filter hosted zones by selected AWS account
  const filteredHostedZones = hostedZones?.data?.filter(zone => 
    zone.aws_account_id === selectedAwsAccountId
  ) || [];

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
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      {useHostedZones ? 'Hosted Zone' : t('domains.zone_id')}
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setUseHostedZones(!useHostedZones)}
                        className="text-xs text-indigo-600 hover:text-indigo-500"
                      >
                        {useHostedZones ? 'Manual entry' : 'Use hosted zones'}
                      </button>
                      {useHostedZones && (
                        <button
                          type="button"
                          onClick={handleRefreshHostedZones}
                          disabled={!selectedAwsAccountId || refreshHostedZonesMutation.isLoading}
                          className="text-indigo-600 hover:text-indigo-500 disabled:text-gray-400"
                          title="Refresh hosted zones from AWS"
                        >
                          <ArrowPathIcon className={`h-4 w-4 ${refreshHostedZonesMutation.isLoading ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {useHostedZones ? (
                    <select
                      {...register('hosted_zone_id', { required: 'Hosted zone is required' })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Select a hosted zone...</option>
                      {filteredHostedZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} ({zone.id}) - {zone.record_count} records
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...register('zone_id', { required: `${t('domains.zone_id')} is required` })}
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Z1D633PJN98FT9"
                    />
                  )}
                  
                  {useHostedZones ? (
                    <>
                      {errors.hosted_zone_id && <p className="mt-1 text-sm text-red-600">{errors.hosted_zone_id.message}</p>}
                      {!selectedAwsAccountId && (
                        <p className="mt-1 text-sm text-gray-500">Select an AWS account to see hosted zones</p>
                      )}
                      {selectedAwsAccountId && filteredHostedZones.length === 0 && (
                        <p className="mt-1 text-sm text-gray-500">
                          No hosted zones found. Click refresh to load from AWS.
                        </p>
                      )}
                    </>
                  ) : (
                    errors.zone_id && <p className="mt-1 text-sm text-red-600">{errors.zone_id.message}</p>
                  )}
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
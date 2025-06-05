import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { domainsAPI, awsAccountsAPI, slackAccountsAPI, hostedZonesAPI, Domain, HostedZone } from '../services/api';
import { PlusIcon, TrashIcon, ArrowPathIcon, PencilIcon } from '@heroicons/react/24/outline';
import EditDomainModal from '../components/EditDomainModal';

interface DomainFormData {
  name: string;
  zone_id: string;
  hosted_zone_id?: number | '';
  record_type: 'A' | 'AAAA';
  ttl: number;
  aws_account_id: number;
  slack_account_id: number | '';
}

const DomainsPage: React.FC = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [useHostedZones, setUseHostedZones] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: domains, isLoading } = useQuery('domains', domainsAPI.list);
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

  const createMutation = useMutation(domainsAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('domains');
      queryClient.invalidateQueries('dashboard-stats');
      toast.success(t('domains.domain_added'));
      setShowForm(false);
      reset();
    },
    onError: () => {
      toast.error(t('domains.add_error'));
    }
  });

  const deleteMutation = useMutation(domainsAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('domains');
      queryClient.invalidateQueries('dashboard-stats');
      toast.success(t('domains.domain_deleted'));
    },
    onError: () => {
      toast.error(t('domains.delete_error'));
    }
  });

  const updateIPMutation = useMutation(domainsAPI.updateIP, {
    onSuccess: () => {
      queryClient.invalidateQueries('domains');
      toast.success(t('domains.ip_updated'));
    },
    onError: () => {
      toast.error(t('domains.ip_update_error'));
    }
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<Domain> }) => domainsAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('domains');
        queryClient.invalidateQueries('dashboard-stats');
        toast.success(t('domains.domain_updated'));
        setEditingDomain(null);
      },
      onError: () => {
        toast.error(t('domains.update_error'));
      }
    }
  );

  const handleRefreshHostedZones = () => {
    if (selectedAwsAccountId) {
      refreshHostedZonesMutation.mutate({ aws_account_id: selectedAwsAccountId });
    } else {
      toast.error('Please select an AWS account first');
    }
  };

  const onSubmit = (data: DomainFormData) => {
    const payload: any = {
      ...data,
      slack_account_id: data.slack_account_id === '' ? undefined : data.slack_account_id,
      is_active: true
    };
    
    // If using hosted zones, set zone_id from the selected hosted zone
    if (useHostedZones && data.hosted_zone_id) {
      payload.zone_id = data.hosted_zone_id;
    }
    
    createMutation.mutate(payload);
  };

  // Filter hosted zones by selected AWS account
  const filteredHostedZones = hostedZones?.data?.filter(zone => 
    zone.aws_account_id === selectedAwsAccountId
  ) || [];

  const handleDelete = (id: number) => {
    if (confirm(t('domains.delete_confirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleUpdateIP = (id: number) => {
    updateIPMutation.mutate(id);
  };

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
  };

  const handleEditSubmit = (data: Partial<Domain>) => {
    if (editingDomain) {
      updateMutation.mutate({ id: editingDomain.id, data });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Gestion des domaines</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez vos domaines et sous-domaines pour la surveillance DNS automatique.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Ajouter un domaine
          </button>
        </div>
      </div>

      {/* Add Domain Form */}
      {showForm && (
        <div className="mt-6 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Nouveau domaine
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom du domaine
                  </label>
                  <input
                    {...register('name', { required: 'Le nom est requis' })}
                    type="text"
                    placeholder="exemple.com ou sub.exemple.com"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      {useHostedZones ? 'Hosted Zone' : 'Zone ID Route53'}
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
                      {...register('hosted_zone_id', { required: 'Hosted zone is required', valueAsNumber: true })}
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
                      {...register('zone_id', { required: 'La zone ID est requise' })}
                      type="text"
                      placeholder="Z1PA6795UKMFR9"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    Type d'enregistrement
                  </label>
                  <select
                    {...register('record_type', { required: 'Le type est requis' })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="A">A (IPv4)</option>
                    <option value="AAAA">AAAA (IPv6)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    TTL (secondes)
                  </label>
                  <input
                    {...register('ttl', { required: 'Le TTL est requis', valueAsNumber: true })}
                    type="number"
                    defaultValue={300}
                    min={60}
                    max={86400}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Compte AWS
                  </label>
                  <select
                    {...register('aws_account_id', { required: 'Le compte AWS est requis', valueAsNumber: true })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Sélectionner un compte AWS</option>
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
                    Notifications Slack (optionnel)
                  </label>
                  <select
                    {...register('slack_account_id')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Aucune notification</option>
                    {slackAccounts?.data.filter(account => account.is_active).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Recevez une notification Slack lors des changements d'IP
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {createMutation.isLoading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Domains List */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domaine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP actuelle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dernière MAJ
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {domains?.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Aucun domaine configuré. Cliquez sur "Ajouter un domaine" pour commencer.
                      </td>
                    </tr>
                  ) : (
                    domains?.data.map((domain: Domain) => (
                      <tr key={domain.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {domain.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {domain.record_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {domain.current_ip || 'Non définie'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            domain.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {domain.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {domain.last_updated 
                            ? new Date(domain.last_updated).toLocaleString('fr-FR')
                            : 'Jamais'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(domain)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleUpdateIP(domain.id)}
                            disabled={updateIPMutation.isLoading}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                            title="Mettre à jour l'IP"
                          >
                            <ArrowPathIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(domain.id)}
                            disabled={deleteMutation.isLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Supprimer"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Domain Modal */}
      {editingDomain && (
        <EditDomainModal
          domain={editingDomain}
          isOpen={!!editingDomain}
          onClose={() => setEditingDomain(null)}
          onSubmit={handleEditSubmit}
          isLoading={updateMutation.isLoading}
        />
      )}
    </div>
  );
};

export default DomainsPage;
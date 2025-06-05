import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { awsAccountsAPI, AWSAccount } from '../services/api';
import { PlusIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface AWSAccountFormData {
  name: string;
  access_key_id: string;
  secret_access_key: string;
  region: string;
}

const AWSAccountsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showSecrets, setShowSecrets] = useState<{[key: number]: boolean}>({});
  const queryClient = useQueryClient();
  
  const { data: accounts, isLoading } = useQuery('aws-accounts', awsAccountsAPI.list);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AWSAccountFormData>();

  const createMutation = useMutation(awsAccountsAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('aws-accounts');
      queryClient.invalidateQueries('dashboard-stats');
      toast.success('Compte AWS ajouté avec succès !');
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'ajout du compte AWS');
    }
  });

  const deleteMutation = useMutation(awsAccountsAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('aws-accounts');
      queryClient.invalidateQueries('dashboard-stats');
      toast.success('Compte AWS supprimé avec succès !');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const onSubmit = (data: AWSAccountFormData) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce compte AWS ?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleSecretVisibility = (accountId: number) => {
    setShowSecrets(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const regions = [
    'eu-west-3',
    'eu-west-1',
    'eu-west-2',
    'eu-central-1',
    'us-east-1',
    'us-east-2', 
    'us-west-1',
    'us-west-2',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'ap-northeast-2',
    'ap-south-1',
    'sa-east-1',
    'ca-central-1'
  ];

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Comptes AWS</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez vos credentials AWS Route53 pour la gestion automatique des DNS.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Ajouter un compte AWS
          </button>
        </div>
      </div>

      {/* Add Account Form */}
      {showForm && (
        <div className="mt-6 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Nouveau compte AWS
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Ajoutez vos credentials AWS avec les permissions Route53 pour la gestion DNS automatique.
              </p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Nom du compte
                  </label>
                  <input
                    {...register('name', { required: 'Le nom est requis' })}
                    type="text"
                    placeholder="Compte principal AWS"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Access Key ID
                  </label>
                  <input
                    {...register('access_key_id', { required: 'L\'Access Key ID est requis' })}
                    type="text"
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.access_key_id && <p className="mt-1 text-sm text-red-600">{errors.access_key_id.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Secret Access Key
                  </label>
                  <input
                    {...register('secret_access_key', { required: 'La Secret Access Key est requise' })}
                    type="password"
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.secret_access_key && <p className="mt-1 text-sm text-red-600">{errors.secret_access_key.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Région AWS
                  </label>
                  <select
                    {...register('region', { required: 'La région est requise' })}
                    defaultValue="eu-west-3"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-md">
                <div className="text-sm text-yellow-700">
                  <p className="font-medium mb-2">Permissions IAM requises :</p>
                  <div className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                    <pre>{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:ListHostedZones",
        "route53:GetHostedZone",
        "route53:ListResourceRecordSets",
        "route53:ChangeResourceRecordSets"
      ],
      "Resource": "*"
    }
  ]
}`}</pre>
                  </div>
                  <p className="mt-2 text-xs">
                    💡 Copiez cette politique JSON et attachez-la à votre utilisateur IAM AWS
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
                  {createMutation.isLoading ? 'Validation...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accounts List */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom du compte
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access Key ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Région
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts?.data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Aucun compte AWS configuré. Cliquez sur "Ajouter un compte AWS" pour commencer.
                      </td>
                    </tr>
                  ) : (
                    accounts?.data.map((account: AWSAccount) => (
                      <tr key={account.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {account.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          <div className="flex items-center space-x-2">
                            <span>
                              {showSecrets[account.id] 
                                ? account.access_key_id 
                                : `${account.access_key_id.substring(0, 8)}${'*'.repeat(12)}`
                              }
                            </span>
                            <button
                              onClick={() => toggleSecretVisibility(account.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {showSecrets[account.id] ? (
                                <EyeSlashIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.region}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Connecté
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(account.id)}
                            disabled={deleteMutation.isLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
    </div>
  );
};

export default AWSAccountsPage;
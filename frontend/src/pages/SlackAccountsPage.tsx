import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { slackAccountsAPI, SlackAccount, SlackAccountCreateData } from '../services/api';
import { 
  PlusIcon, 
  TrashIcon, 
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const SlackAccountsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: accounts, isLoading } = useQuery('slack-accounts', slackAccountsAPI.list);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SlackAccountCreateData>();

  const createMutation = useMutation(slackAccountsAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('slack-accounts');
      toast.success('Compte Slack ajouté avec succès !');
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'ajout du compte Slack');
    }
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: { is_active: boolean } }) => 
      slackAccountsAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('slack-accounts');
        toast.success('Compte Slack mis à jour !');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
      }
    }
  );

  const testMutation = useMutation(slackAccountsAPI.test, {
    onSuccess: () => {
      toast.success('Test webhook réussi ! Vérifiez votre canal Slack.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Échec du test webhook');
    }
  });

  const deleteMutation = useMutation(slackAccountsAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('slack-accounts');
      toast.success('Compte Slack supprimé !');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  });

  const onSubmit = (data: SlackAccountCreateData) => {
    createMutation.mutate(data);
  };

  const handleToggleActive = (account: SlackAccount) => {
    updateMutation.mutate({
      id: account.id,
      data: { is_active: !account.is_active }
    });
  };

  const handleTest = (account: SlackAccount) => {
    testMutation.mutate(account.id);
  };

  const handleDelete = (account: SlackAccount) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le compte Slack "${account.name}" ?`)) {
      deleteMutation.mutate(account.id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Comptes Slack</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configurez vos webhooks Slack pour recevoir des notifications de changement d'IP.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Ajouter un compte Slack
          </button>
        </div>
      </div>

      {/* Add Account Form */}
      {showForm && (
        <div className="mt-6 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Nouveau compte Slack
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Ajoutez un webhook Slack pour recevoir des notifications automatiques lors des changements d'IP.
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
                    placeholder="Production Slack"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    URL du webhook Slack
                  </label>
                  <input
                    {...register('webhook_url', { 
                      required: 'L\'URL du webhook est requise',
                      pattern: {
                        value: /^https:\/\/hooks\.slack\.com\/services\/.*$/,
                        message: 'L\'URL doit être un webhook Slack valide'
                      }
                    })}
                    type="url"
                    placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm font-mono text-xs"
                  />
                  {errors.webhook_url && <p className="mt-1 text-sm text-red-600">{errors.webhook_url.message}</p>}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-2">📖 Comment obtenir un webhook Slack :</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Allez sur <code>api.slack.com/apps</code></li>
                    <li>Créez une nouvelle app ou sélectionnez une app existante</li>
                    <li>Allez dans "Incoming Webhooks" et activez-les</li>
                    <li>Cliquez sur "Add New Webhook to Workspace"</li>
                    <li>Sélectionnez le canal et copiez l'URL générée</li>
                  </ol>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {createMutation.isLoading ? 'Test en cours...' : 'Ajouter et tester'}
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
                      Compte
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Webhook URL
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
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        Aucun compte Slack configuré. Cliquez sur "Ajouter un compte Slack" pour commencer.
                      </td>
                    </tr>
                  ) : (
                    accounts?.data.map((account: SlackAccount) => (
                      <tr key={account.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {account.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {account.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          <div className="max-w-xs truncate">
                            {account.webhook_url}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(account)}
                            disabled={updateMutation.isLoading}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              account.is_active 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            } disabled:opacity-50`}
                          >
                            {account.is_active ? (
                              <>
                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                Actif
                              </>
                            ) : (
                              <>
                                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                Inactif
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleTest(account)}
                            disabled={testMutation.isLoading}
                            className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                            title="Tester le webhook"
                          >
                            <PlayIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(account)}
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

export default SlackAccountsPage;
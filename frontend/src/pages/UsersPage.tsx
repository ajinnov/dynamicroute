import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { usersAPI, UserData, UserCreateData } from '../services/api';
import { 
  PlusIcon, 
  TrashIcon, 
  UserIcon, 
  ShieldCheckIcon,
  ShieldExclamationIcon 
} from '@heroicons/react/24/outline';

const UsersPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: users, isLoading } = useQuery('users', usersAPI.list);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserCreateData>();

  const createMutation = useMutation(usersAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      toast.success('Utilisateur créé avec succès !');
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    }
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: { is_active: boolean } }) => 
      usersAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('Utilisateur mis à jour !');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
      }
    }
  );

  const deleteMutation = useMutation(usersAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      toast.success('Utilisateur supprimé !');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  });

  const onSubmit = (data: UserCreateData) => {
    createMutation.mutate(data);
  };

  const handleToggleActive = (user: UserData) => {
    updateMutation.mutate({
      id: user.id,
      data: { is_active: !user.is_active }
    });
  };

  const handleDelete = (user: UserData) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ?`)) {
      deleteMutation.mutate(user.id);
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
          <h1 className="text-xl font-semibold text-gray-900">Gestion des utilisateurs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez les comptes utilisateurs ayant accès à DynamicRoute53.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Ajouter un utilisateur
          </button>
        </div>
      </div>

      {/* Add User Form */}
      {showForm && (
        <div className="mt-6 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Nouvel utilisateur
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom d'utilisateur
                  </label>
                  <input
                    {...register('username', { required: 'Le nom d\'utilisateur est requis' })}
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Adresse email
                  </label>
                  <input
                    {...register('email', { 
                      required: 'L\'email est requis',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Adresse email invalide'
                      }
                    })}
                    type="email"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mot de passe
                  </label>
                  <input
                    {...register('password', { 
                      required: 'Le mot de passe est requis',
                      minLength: {
                        value: 6,
                        message: 'Le mot de passe doit contenir au moins 6 caractères'
                      }
                    })}
                    type="password"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
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
                  {createMutation.isLoading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
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
                  {users?.data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        Aucun utilisateur trouvé. Créez le premier utilisateur.
                      </td>
                    </tr>
                  ) : (
                    users?.data.map((user: UserData) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-gray-500" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(user)}
                            disabled={updateMutation.isLoading}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.is_active 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            } disabled:opacity-50`}
                          >
                            {user.is_active ? (
                              <>
                                <ShieldCheckIcon className="w-3 h-3 mr-1" />
                                Actif
                              </>
                            ) : (
                              <>
                                <ShieldExclamationIcon className="w-3 h-3 mr-1" />
                                Inactif
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(user)}
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

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 p-4 rounded-md">
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-2">💡 Création d'utilisateurs via CLI :</p>
          <div className="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono">
            docker-compose exec backend python -m app.cli create-user &lt;username&gt; &lt;email&gt;
          </div>
          <p className="mt-2 text-xs">
            Vous pouvez également créer des utilisateurs directement depuis le serveur.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
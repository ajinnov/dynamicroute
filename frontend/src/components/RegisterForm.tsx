import React from 'react';
import { useForm } from 'react-hook-form';
import { authAPI, RegisterData } from '../services/api';
import toast from 'react-hot-toast';

interface RegisterFormProps {
  onSuccess: () => void;
  onToggleMode: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onToggleMode }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterData>();

  const onSubmit = async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data);
      localStorage.setItem('token', response.data.access_token);
      toast.success('Compte créé avec succès !');
      onSuccess();
    } catch (error) {
      toast.error('Échec de l\'inscription');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            DynamicRoute53
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Créer un nouveau compte
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="username" className="sr-only">
              Nom d'utilisateur
            </label>
            <input
              {...register('username', { required: 'Le nom d\'utilisateur est requis' })}
              type="text"
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nom d'utilisateur"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className="sr-only">
              Email
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
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Adresse email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
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
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Mot de passe"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Inscription...' : 'S\'inscrire'}
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-indigo-600 hover:text-indigo-500"
            >
              Déjà un compte ? Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
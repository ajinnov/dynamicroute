import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { authAPI, LoginData } from '../services/api';
import toast from 'react-hot-toast';

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    try {
      const response = await authAPI.login(data);
      localStorage.setItem('token', response.data.access_token);
      toast.success(t('auth.login_success'));
      onSuccess();
    } catch (error) {
      toast.error(t('auth.login_error'));
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
            {t('auth.login')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="username" className="sr-only">
              {t('auth.username')}
            </label>
            <input
              {...register('username', { required: `${t('auth.username')} is required` })}
              type="text"
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={t('auth.username')}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              {t('auth.password')}
            </label>
            <input
              {...register('password', { required: `${t('auth.password')} is required` })}
              type="password"
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={t('auth.password')}
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
              {isSubmitting ? `${t('auth.login')}...` : t('auth.login')}
            </button>
          </div>
          <div className="text-center text-sm text-gray-500">
            <p>Contact administrator to create an account</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
'use client';

import { useState, useEffect } from 'react';
import { User } from '../types';
import { validateUser } from '../lib/users-config';

interface LoginFormProps {
  onLogin: (user: User) => void;
  isLoading: boolean;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30000; // 30 seconds

export default function LoginForm({ onLogin, isLoading }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (isLocked && lockoutTime > 0) {
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, lockoutTime - now);
        setRemainingTime(Math.ceil(remaining / 1000));
        
        if (remaining <= 0) {
          setIsLocked(false);
          setAttempts(0);
          setLockoutTime(0);
          setError('');
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLocked, lockoutTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      return;
    }

    setError('');

    // Simulate processing delay to prevent rapid attempts
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = validateUser(username, password);

    if (user) {
      const userData: User = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        whatsappSessionId: user.whatsappSessionId
      };
      setAttempts(0);
      onLogin(userData);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setLockoutTime(Date.now() + LOCKOUT_DURATION);
        setError(`Demasiados intentos fallidos. Cuenta bloqueada por ${LOCKOUT_DURATION / 1000} segundos.`);
      } else {
        setError(`Credenciales incorrectas. Intentos restantes: ${MAX_ATTEMPTS - newAttempts}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="w-5 h-5 bg-white rounded-lg shadow-inner"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Colombia Productiva
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            Sistema de Gestión de Sostenibilidad
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100/50 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Iniciar Sesión</h2>
              <p className="text-gray-600">Accede a tu espacio de trabajo</p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-800 mb-3">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400 shadow-sm hover:border-gray-300"
                  placeholder="Ingresa tu usuario"
                  required
                  disabled={isLoading || isLocked}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-3">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <div className="w-2 h-3 bg-white rounded-sm"></div>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400 shadow-sm hover:border-gray-300"
                  placeholder="Ingresa tu contraseña"
                  required
                  disabled={isLoading || isLocked}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-50/50 border-2 border-red-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-red-800 text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Lockout Timer */}
            {isLocked && remainingTime > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-orange-50/50 border-2 border-orange-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-orange-800 text-sm font-medium">
                    Cuenta bloqueada. Intenta nuevamente en {remainingTime} segundos.
                  </span>
                </div>
              </div>
            )}

            {/* Attempts Warning */}
            {attempts > 0 && attempts < MAX_ATTEMPTS && !error.includes('Demasiados') && (
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-50/50 border-2 border-yellow-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-yellow-800 text-sm font-medium">
                    {attempts === 1 ? 'Primer intento fallido' : `${attempts} intentos fallidos`}. 
                    Te quedan {MAX_ATTEMPTS - attempts} intentos.
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:from-blue-600 disabled:hover:to-blue-700 active:scale-95"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Iniciando sesión...
                </div>
              ) : isLocked ? (
                'Cuenta Bloqueada'
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center text-sm text-gray-600">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2 shadow-sm"></div>
              <span className="font-medium">Conexión segura protegida</span>
            </div>
          </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600 font-medium">
            Sistema de Gestión de Sostenibilidad - Colombia Productiva
          </p>
          <p className="text-xs text-gray-500 mt-2">
            © 2025 Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
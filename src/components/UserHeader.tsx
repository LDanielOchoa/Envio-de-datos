'use client';

import { User } from '../types';

interface UserHeaderProps {
  user: User;
  onLogout: () => void;
}

export default function UserHeader({ user, onLogout }: UserHeaderProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
          }`}>
            <span className="text-xl">
              {user.role === 'admin' ? '👑' : '👤'}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                user.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role === 'admin' ? 'Administrador' : 'Usuario'}
              </span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">Sesión: {user.whatsappSessionId}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
        >
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
} 
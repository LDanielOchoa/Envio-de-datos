import React, { useEffect } from 'react';

interface ErrorNotificationProps {
  isVisible: boolean;
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function ErrorNotification({
  isVisible,
  title,
  message,
  type = 'error',
  onClose,
  autoClose = true,
  duration = 5000
}: ErrorNotificationProps) {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: '❌',
          iconBg: 'bg-red-500',
          titleColor: 'text-red-900',
          messageColor: 'text-red-700',
          closeColor: 'text-red-400 hover:text-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: '⚠️',
          iconBg: 'bg-yellow-500',
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-700',
          closeColor: 'text-yellow-400 hover:text-yellow-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'ℹ️',
          iconBg: 'bg-blue-500',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-700',
          closeColor: 'text-blue-400 hover:text-blue-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: '📋',
          iconBg: 'bg-gray-500',
          titleColor: 'text-gray-900',
          messageColor: 'text-gray-700',
          closeColor: 'text-gray-400 hover:text-gray-600'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <div className={`${styles.bg} ${styles.border} border-2 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 animate-slide-in-right`}>
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start">
            <div className={`w-10 h-10 ${styles.iconBg} rounded-xl flex items-center justify-center mr-3 flex-shrink-0`}>
              <span className="text-white text-lg">{styles.icon}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-bold ${styles.titleColor} mb-1`}>
                {title}
              </h3>
              <p className={`text-sm ${styles.messageColor} leading-relaxed`}>
                {message}
              </p>
            </div>
            
            <button
              onClick={onClose}
              className={`ml-2 ${styles.closeColor} hover:bg-white hover:bg-opacity-50 rounded-lg p-1 transition-colors duration-200 flex-shrink-0`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Progress bar for auto-close */}
        {autoClose && (
          <div className="h-1 bg-white bg-opacity-30">
            <div 
              className={`h-full ${styles.iconBg} transition-all ease-linear`}
              style={{
                width: '100%',
                animation: `shrink ${duration}ms linear forwards`
              }}
            ></div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
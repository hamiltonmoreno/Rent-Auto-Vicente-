
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notify: (type: NotificationType, message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback((type: NotificationType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`
              pointer-events-auto flex items-start gap-3 min-w-[320px] max-w-sm rounded-lg p-4 shadow-lg border-l-4 transform transition-all duration-300 animate-in slide-in-from-right fade-in
              ${n.type === 'success' ? 'bg-white border-emerald-500 text-slate-800' : ''}
              ${n.type === 'error' ? 'bg-white border-red-500 text-slate-800' : ''}
              ${n.type === 'warning' ? 'bg-white border-amber-500 text-slate-800' : ''}
              ${n.type === 'info' ? 'bg-white border-blue-500 text-slate-800' : ''}
            `}
          >
            <div className="shrink-0 mt-0.5">
              {n.type === 'success' && <CheckCircle size={20} className="text-emerald-500" />}
              {n.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
              {n.type === 'warning' && <AlertTriangle size={20} className="text-amber-500" />}
              {n.type === 'info' && <Info size={20} className="text-blue-500" />}
            </div>
            
            <p className="flex-1 text-sm font-medium leading-tight">{n.message}</p>
            
            <button 
              onClick={() => removeNotification(n.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

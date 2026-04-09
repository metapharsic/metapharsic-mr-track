import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notificationOrMessage: Omit<Notification, 'id' | 'timestamp' | 'read'> | string, typeOrLink?: NotificationType | string, type?: NotificationType) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('metapharsic_notifications');
    if (saved) {
      return JSON.parse(saved).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
    }
    return [];
  });
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('metapharsic_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notificationOrMessage: Omit<Notification, 'id' | 'timestamp' | 'read'> | string, typeOrLink?: NotificationType | string, type?: NotificationType) => {
    let notification: Omit<Notification, 'id' | 'timestamp' | 'read'>;
    
    if (typeof notificationOrMessage === 'string') {
      notification = {
        title: typeOrLink === 'error' ? 'Error' : typeOrLink === 'success' ? 'Success' : 'Notification',
        message: notificationOrMessage,
        type: (type || typeOrLink || 'info') as NotificationType,
      };
    } else {
      notification = notificationOrMessage;
    }

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        isPanelOpen,
        setIsPanelOpen
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

import React, { useEffect } from 'react';
import { X, Check, Trash2, Bell, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNotifications, NotificationType } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const typeIcons: Record<NotificationType, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle
};

const typeColors: Record<NotificationType, string> = {
  info: 'text-blue-500 bg-blue-50',
  success: 'text-green-500 bg-green-50',
  warning: 'text-amber-500 bg-amber-50',
  error: 'text-red-500 bg-red-50'
};

export default function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    isPanelOpen,
    setIsPanelOpen
  } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-notification-panel]') && !target.closest('[data-notification-trigger]')) {
        setIsPanelOpen(false);
      }
    };

    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPanelOpen, setIsPanelOpen]);

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsPanelOpen(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (!isPanelOpen) return null;

  return (
    <div
      data-notification-panel
      className="fixed right-4 top-16 w-96 max-h-[80vh] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsPanelOpen(false)}
          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
          <button
            onClick={markAllAsRead}
            className="text-xs text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            <Check className="w-3 h-3" />
            Mark all as read
          </button>
          <button
            onClick={clearAll}
            className="text-xs text-slate-600 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear all
          </button>
        </div>
      )}

      <div className="overflow-y-auto max-h-[60vh]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Bell className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = typeIcons[notification.type];
            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 ${
                  !notification.read ? 'bg-blue-50/50' : ''
                } ${notification.link ? 'hover:cursor-pointer' : ''}`}
              >
                <div className="flex gap-3">
                  <div className={`p-2 rounded-lg ${typeColors[notification.type]} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-medium text-sm ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {notification.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">
                        {formatTime(notification.timestamp)}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

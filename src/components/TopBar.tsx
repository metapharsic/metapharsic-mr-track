import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, Settings, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';

export default function TopBar() {
  const { user, logout, hasPermission } = useAuth();
  const { unreadCount, setIsPanelOpen } = useNotifications();

  if (!user) return null;

  return (
    <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      {/* Left side - empty or can add breadcrumbs later */}
      <div className="flex-1" />

      {/* Right side - User Profile */}
      <div className="flex items-center gap-4">
        {/* User Name & Role */}
        <div className="text-right mr-2">
          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200" />

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button
            data-notification-trigger
            onClick={() => setIsPanelOpen(true)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Settings */}
          {hasPermission('settings.view') && (
            <NavLink
              to="/settings"
              className={({ isActive }) => cn(
                "p-2 rounded-lg transition-colors",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              )}
              title="Settings"
            >
              <Settings size={18} />
            </NavLink>
          )}

          {/* User Management (Admin only) */}
          {hasPermission('users.view') && (
            <NavLink
              to="/users"
              className={({ isActive }) => cn(
                "p-2 rounded-lg transition-colors",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              )}
              title="User Management"
            >
              <Shield size={18} />
            </NavLink>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { locationService } from '../services/locationService';
import { NavLink } from 'react-router-dom';
import { Circle, CircleDashed } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Package,
  Stethoscope,
  TrendingUp,
  Receipt,
  Calendar,
  UserPlus,
  LayoutGrid,
  Bell,
  Settings,
  LogOut,
  FileText,
  BarChart3,
  Search,
  CommandIcon,
  Shield,
  MapPin,
  FileCheck,
  CreditCard
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationPanel from './NotificationPanel';

function GPSToggle({ mrId, mrName }: { mrId: number; mrName: string }) {
  const [tracking, setTracking] = useState(() => locationService.isTracking());
  const [lastLoc, setLastLoc] = useState({ lat: 0, lng: 0 });

  const toggle = () => {
    if (!tracking) {
      locationService.startTracking(mrId, (lat, lng) => setLastLoc({ lat, lng }));
      setTracking(true);
    } else {
      locationService.stopTracking();
      setTracking(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tracking ? (
            <CircleDashed className="w-3 h-3 text-green-400 animate-spin" />
          ) : (
            <Circle className="w-3 h-3 text-slate-500" />
          )}
          <span className="text-xs font-medium">{tracking ? 'GPS Active' : 'Location Off'}</span>
        </div>
        <button
          onClick={toggle}
          className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors",
            tracking
              ? "bg-green-900/50 text-green-400 border border-green-800 hover:bg-green-900"
              : "bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700"
          )}
        >
          {tracking ? 'Stop' : 'Start'}
        </button>
      </div>
      {tracking && lastLoc.lat !== 0 && (
        <p className="text-[10px] text-slate-500">
          {lastLoc.lat.toFixed(4)}, {lastLoc.lng.toFixed(4)}
        </p>
      )}
    </div>
  );
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: 'dashboard.view' },
  { icon: Users, label: 'MR Management', path: '/mrs', permission: 'mrs.view' },
  { icon: Package, label: 'Product Portfolio', path: '/products', permission: 'products.view' },
  { icon: Stethoscope, label: 'Healthcare Directory', path: '/directory', permission: 'directory.view' },
  { icon: TrendingUp, label: 'Sales Tracking', path: '/sales', permission: 'sales.view' },
  { icon: Receipt, label: 'Expense Manager', path: '/expenses', permission: 'expenses.view' },
  { icon: Calendar, label: 'Visit Schedule', path: '/schedule', permission: 'schedule.view' },
  { icon: UserPlus, label: 'Leads Management', path: '/leads', permission: 'leads.view' },
  { icon: LayoutGrid, label: 'MR Dashboard', path: '/mr-dashboard', permission: 'mr-dashboard.view' },
  { icon: BarChart3, label: 'Performance', path: '/performance', permission: 'performance.view' },
  { icon: MapPin, label: 'MR Tracking', path: '/mr-tracking', permission: 'data.view' },
  { icon: MapPin, label: 'Field Tracker', path: '/field-tracker', permission: 'data.view' },
  { icon: FileCheck, label: 'Approvals', path: '/approvals', permission: 'expenses.approve' },
  { icon: CreditCard, label: 'Entity Credits', path: '/entity-credits', permission: 'data.view' },
  { icon: FileText, label: 'Data Management', path: '/data-management', permission: 'data.view' },
];

interface SidebarProps {
  onOpenSearch?: () => void;
}

export default function Sidebar({ onOpenSearch }: SidebarProps) {
  const [isMac, setIsMac] = useState(false);
  const { unreadCount, setIsPanelOpen, isPanelOpen } = useNotifications();
  const { user, logout, hasPermission } = useAuth();

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-blue-400 tracking-tight">Metapharsic</h1>
        <p className="text-xs text-slate-400 uppercase font-semibold mt-1">Lifesciences</p>
      </div>

      {/* AI Search Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          id="open-global-search"
          onClick={onOpenSearch}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '10px',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            cursor: 'pointer',
            color: '#94a3b8',
            fontSize: '13px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.2)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.12)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.25)';
          }}
        >
          <Search size={14} style={{ color: '#6366f1' }} />
          <span style={{ flex: 1, textAlign: 'left' }}>Search everything...</span>
          <kbd style={{
            padding: '1px 6px', borderRadius: '5px',
            background: 'rgba(255,255,255,0.08)',
            color: '#475569', fontSize: '11px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'inherit',
          }}>
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </button>
      </div>
      
      <nav className="flex-1 py-4 px-4 space-y-1 overflow-y-auto">
        {navItems
          .filter(item => hasPermission(item.permission))
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-colors",
                "group-hover:text-blue-400"
              )} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
      </nav>

      {/* User Info */}
      {user && (
        <div className="px-4 py-3 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <img 
              src={user.avatar_url} 
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* GPS Tracking for MR users */}
      {user?.role === 'mr' && user?.mr_id && (
        <div className="px-4 py-3 border-t border-slate-800">
          <GPSToggle mrId={user.mr_id} mrName={user.name} />
        </div>
      )}

      <div className="p-4 border-t border-slate-800 space-y-2 text-sm text-slate-400">
        <button 
          data-notification-trigger
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="flex items-center gap-3 px-4 py-2 w-full hover:text-white transition-colors relative"
        >
          <Bell size={18} />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="absolute right-4 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        {hasPermission('settings.view') && (
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-2 w-full transition-colors",
            isActive ? "text-white bg-slate-800 rounded-lg" : "hover:text-white"
          )}
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
        )}
        {hasPermission('users.view') && (
          <NavLink 
            to="/users"
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-2 w-full transition-colors",
              isActive ? "text-white bg-slate-800 rounded-lg" : "hover:text-white"
            )}
          >
            <Shield size={18} />
            <span>User Management</span>
          </NavLink>
        )}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 w-full text-red-400 hover:text-red-300 transition-colors mt-4"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      <NotificationPanel />
    </div>
  );
}

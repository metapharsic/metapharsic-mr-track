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
  CreditCard,
  Brain,
  ChevronDown,
  ChevronRight
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

// Categorized navigation structure
const navCategories = [
  {
    id: 'dashboards',
    label: 'DASHBOARDS',
    icon: BarChart3,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: 'dashboard.view' },
      { icon: LayoutGrid, label: 'MR Dashboard', path: '/mr-dashboard', permission: 'mr-dashboard.view', roles: ['mr'] },
      { icon: TrendingUp, label: 'Performance', path: '/performance', permission: 'performance.view' },
      { icon: Brain, label: 'AI Performance', path: '/ai-performance', permission: 'data.view' },
    ]
  },
  {
    id: 'team',
    label: 'TEAM MANAGEMENT',
    icon: Users,
    items: [
      { icon: Users, label: 'MR Management', path: '/mrs', permission: 'mrs.view' },
      { icon: MapPin, label: 'Admin Field Monitor', path: '/mr-tracking', permission: 'data.view', roles: ['admin', 'manager'] },
    ]
  },
  {
    id: 'healthcare',
    label: 'HEALTHCARE NETWORK',
    icon: Stethoscope,
    items: [
      { icon: Stethoscope, label: 'Healthcare Directory', path: '/directory', permission: 'directory.view' },
      { icon: CreditCard, label: 'Entity Credits', path: '/entity-credits', permission: 'data.view', roles: ['admin', 'manager'] },
    ]
  },
  {
    id: 'sales',
    label: 'SALES & LEADS',
    icon: TrendingUp,
    items: [
      { icon: TrendingUp, label: 'Sales Tracking', path: '/sales', permission: 'sales.view' },
      { icon: UserPlus, label: 'Leads Management', path: '/leads', permission: 'leads.view' },
      { icon: Calendar, label: 'Daily Call Plan', path: '/schedule', permission: 'schedule.view', roles: ['mr'] },
    ]
  },
  {
    id: 'finances',
    label: 'FINANCES',
    icon: Receipt,
    items: [
      { icon: Receipt, label: 'Expense Manager', path: '/expenses', permission: 'expenses.view' },
      { icon: FileCheck, label: 'Approvals', path: '/approvals', permission: 'expenses.approve' },
    ]
  },
  {
    id: 'field',
    label: 'FIELD OPERATIONS',
    icon: MapPin,
    items: [
      { icon: MapPin, label: 'Field Visit Capture', path: '/field-tracker', permission: 'field-capture.view', roles: ['mr'] },
      { icon: Package, label: 'Product Portfolio', path: '/products', permission: 'products.view' },
    ]
  },
  {
    id: 'admin',
    label: 'ADMIN',
    icon: Shield,
    items: [
      { icon: FileText, label: 'Data Management', path: '/data-management', permission: 'data.view', roles: ['admin', 'manager'] },
    ]
  },
];

interface SidebarProps {
  onOpenSearch?: () => void;
}

export default function Sidebar({ onOpenSearch }: SidebarProps) {
  const [isMac, setIsMac] = useState(false);
  const { unreadCount, setIsPanelOpen, isPanelOpen } = useNotifications();
  const { user, logout, hasPermission } = useAuth();
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

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
      
      {/* Categorized Navigation */}
      <nav className="flex-1 py-2 px-3 space-y-3 overflow-y-auto">
        {navCategories.map((category) => {
          // Filter items based on permissions and roles
          const visibleItems = category.items.filter(item => {
            if (item.roles && user?.role && !item.roles.includes(user.role)) return false;
            return hasPermission(item.permission);
          });

          // Skip category if no visible items
          if (visibleItems.length === 0) return null;

          const isCollapsed = collapsedCategories[category.id];
          const CategoryIcon = category.icon;

          return (
            <div key={category.id}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon size={14} />
                  <span>{category.label}</span>
                </div>
                {isCollapsed ? (
                  <ChevronRight size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              {/* Category Items */}
              <div className={cn(
                "space-y-1 overflow-hidden transition-all duration-200",
                isCollapsed ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
              )}>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ml-2",
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <item.icon size={18} className={cn(
                      "transition-colors",
                      "group-hover:text-blue-400"
                    )} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* GPS Tracking for MR users */}
      {user?.role === 'mr' && user?.mr_id && (
        <div className="px-4 py-3 border-t border-slate-800">
          <GPSToggle mrId={user.mr_id} mrName={user.name} />
        </div>
      )}

      <NotificationPanel />
    </div>
  );
}

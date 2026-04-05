import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, ROLE_PERMISSIONS } from '../contexts/AuthContext';
import { User, UserRole, MR } from '../types';
import { api } from '../services/api';
import {
  Users, Plus, Search, Filter,
  Shield, User as UserIcon, Edit2, Trash2,
  Eye, CheckCircle2, XCircle, Mail, Phone,
  UserCog, X, ArrowUpRight, Key, RefreshCw,
  AlertTriangle, Lock, Unlock, Ban, Activity,
  FileText, BarChart3, ChevronDown, ChevronUp, Calendar
} from 'lucide-react';

const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string; label: string; icon: string }> = {
  admin: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24', label: 'Administrator', icon: '👑' },
  manager: { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa', label: 'Manager', icon: '📋' },
  mr: { bg: '#dcfce7', text: '#166534', border: '#4ade80', label: 'Medical Rep', icon: '💊' },
  viewer: { bg: '#f1f5f9', text: '#475569', border: '#94a3b8', label: 'Viewer', icon: '👁️' },
};

const PERMISSION_GROUPS = [
  { category: 'Dashboard', perms: ['dashboard.view'] },
  { category: 'MR Management', perms: ['mrs.view', 'mrs.create', 'mrs.edit', 'mrs.delete'] },
  { category: 'Products', perms: ['products.view', 'products.create', 'products.edit', 'products.delete'] },
  { category: 'Directory', perms: ['directory.view', 'directory.create', 'directory.edit', 'directory.delete'] },
  { category: 'Sales', perms: ['sales.view', 'sales.create', 'sales.edit', 'sales.delete'] },
  { category: 'Expenses', perms: ['expenses.view', 'expenses.create', 'expenses.edit', 'expenses.approve'] },
  { category: 'Schedule', perms: ['schedule.view', 'schedule.create', 'schedule.edit', 'schedule.delete'] },
  { category: 'Leads', perms: ['leads.view', 'leads.create', 'leads.edit', 'leads.delete'] },
  { category: 'Performance', perms: ['performance.view', 'mr-dashboard.view'] },
  { category: 'Data', perms: ['data.view', 'data.export', 'data.import'] },
  { category: 'Settings', perms: ['settings.view', 'settings.edit'] },
  { category: 'Users', perms: ['users.view', 'users.create', 'users.edit', 'users.delete'] },
  { category: 'Reports', perms: ['reports.view', 'reports.generate'] },
];

type TabType = 'users' | 'roles' | 'permissions';

const PERMISSION_LABELS: Record<string, string> = {
  'dashboard.view': 'View Dashboard',
  'mrs.view': 'View MRs', 'mrs.create': 'Create MRs', 'mrs.edit': 'Edit MRs', 'mrs.delete': 'Delete MRs',
  'products.view': 'View Products', 'products.create': 'Create Products', 'products.edit': 'Edit Products', 'products.delete': 'Delete Products',
  'directory.view': 'View Directory', 'directory.create': 'Create Entries', 'directory.edit': 'Edit Entries', 'directory.delete': 'Delete Entries',
  'sales.view': 'View Sales', 'sales.create': 'Create Sales', 'sales.edit': 'Edit Sales', 'sales.delete': 'Delete Sales',
  'expenses.view': 'View Expenses', 'expenses.create': 'Create Expenses', 'expenses.edit': 'Edit Expenses', 'expenses.approve': 'Approve Expenses',
  'schedule.view': 'View Schedule', 'schedule.create': 'Create Visits', 'schedule.edit': 'Edit Visits', 'schedule.delete': 'Delete Visits',
  'leads.view': 'View Leads', 'leads.create': 'Create Leads', 'leads.edit': 'Edit Leads', 'leads.delete': 'Delete Leads',
  'performance.view': 'View Performance', 'mr-dashboard.view': 'View MR Dashboard',
  'data.view': 'View Data', 'data.export': 'Export Data', 'data.import': 'Import Data',
  'settings.view': 'View Settings', 'settings.edit': 'Edit Settings',
  'users.view': 'View Users', 'users.create': 'Create Users', 'users.edit': 'Edit Users', 'users.delete': 'Delete Users',
  'reports.view': 'View Reports', 'reports.generate': 'Generate Reports',
};

// Toast notification
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  const colors = { success: 'bg-emerald-50 border-emerald-200 text-emerald-800', error: 'bg-red-50 border-red-200 text-red-800', info: 'bg-blue-50 border-blue-200 text-blue-800' };
  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${colors[type]}`}
      style={{ animation: 'slideInRight 0.3s ease' }}>
      <span className="text-lg font-bold">{icons[type]}</span>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
};

export default function UserManagement() {
  const { user: currentUser, users, createUser, updateUser, deleteUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<User | null>(null);
  const [showPermissionEditor, setShowPermissionEditor] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'viewer' as UserRole, password: '' });
  const [resetPassword, setResetPassword] = useState('');
  const [customPerms, setCustomPerms] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [sortField, setSortField] = useState<'name' | 'role' | 'last_login'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [bulkRoleModal, setBulkRoleModal] = useState(false);

  // MR Role Assignment state
  const [mrs, setMrs] = useState<MR[]>([]);
  const [loadingMRs, setLoadingMRs] = useState(false);
  const [selectedMR, setSelectedMR] = useState<MR | null>(null);
  const [showRoleAssignModal, setShowRoleAssignModal] = useState(false);
  const [assignRole, setAssignRole] = useState<UserRole>('mr');
  const [roleAssignSearch, setRoleAssignSearch] = useState('');
  const [roleAssignFilter, setRoleAssignFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  const canCreate = hasPermission('users.create');
  const canEdit = hasPermission('users.edit');
  const canDelete = hasPermission('users.delete');

  useEffect(() => {
    if (activeTab === 'roles') {
      fetchMRs();
    }
  }, [activeTab]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  const fetchMRs = async () => {
    setLoadingMRs(true);
    try {
      const data = await api.mrs.getAll();
      setMrs(data || []);
    } catch {
      console.error('Error fetching MRs');
    }
    setLoadingMRs(false);
  };

  const handleAssignRole = async () => {
    if (!selectedMR) return;
    const existingUser = users.find(u => u.mr_id === selectedMR.id);
    if (existingUser) {
      await updateUser(existingUser.id, { role: assignRole });
      showToast(`Role updated for ${selectedMR.name}`, 'success');
    } else {
      await createUser({
        name: selectedMR.name,
        email: selectedMR.email || `${selectedMR.name.toLowerCase().replace(/\s+/g, '.')}@metapharsic.com`,
        role: assignRole,
        password: 'Metapharsic@123',
        mr_id: selectedMR.id,
      });
      showToast(`User created and role assigned to ${selectedMR.name}`, 'success');
    }
    setShowRoleAssignModal(false);
    setSelectedMR(null);
  };

  const handleSort = (field: 'name' | 'role' | 'last_login') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const getAndSortUsers = () => {
    let list = users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'role') cmp = a.role.localeCompare(b.role);
      else cmp = (a.last_login || '').localeCompare(b.last_login || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  };

  const filteredUsers = getAndSortUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      await updateUser(editingUser.id, { name: formData.name, role: formData.role });
      showToast(`User "${formData.name}" updated`, 'success');
    } else {
      await createUser({ name: formData.name, email: formData.email, role: formData.role, password: formData.password });
      showToast(`User "${formData.name}" created`, 'success');
    }
    setShowAddModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'viewer', password: '' });
  };

  const handleEdit = (u: User) => {
    setEditingUser(u);
    setFormData({ name: u.name, email: u.email, role: u.role, password: '' });
    setShowAddModal(true);
  };

  const handleDeleteUser = async (u: User) => {
    const ok = await deleteUser(u.id);
    if (ok) showToast(`User "${u.name}" deleted`, 'success');
    else showToast('Cannot delete this user', 'error');
    setShowDeleteConfirm(null);
  };

  const handleResetPassword = async () => {
    if (!showPasswordModal || !resetPassword) return;
    showToast(`Password reset for "${showPasswordModal.name}"`, 'success');
    setShowPasswordModal(null);
    setResetPassword('');
  };

  const handleSavePermissions = async (u: User) => {
    await updateUser(u.id, { permissions: customPerms });
    showToast(`Permissions updated for "${u.name}"`, 'success');
    setShowPermissionEditor(null);
  };

  const togglePerm = (p: string) => {
    setCustomPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const togglePermGroup = (groupPerms: string[]) => {
    const selected = groupPerms.filter(p => customPerms.includes(p));
    if (selected.length === groupPerms.length) {
      setCustomPerms(prev => prev.filter(p => !groupPerms.includes(p)));
    } else {
      setCustomPerms(prev => [...new Set([...prev, ...groupPerms])]);
    }
  };

  const permCount = (groupPerms: string[]) => groupPerms.filter(p => customPerms.includes(p)).length;

  const userHasMrAccount = (mr: MR) => users.some(u => u.mr_id === mr.id);

  const filteredMRs = mrs.filter(mr => {
    const matchSearch = mr.name.toLowerCase().includes(roleAssignSearch.toLowerCase());
    const hasAccount = userHasMrAccount(mr);
    const matchFilter = roleAssignFilter === 'all' ||
      (roleAssignFilter === 'assigned' && hasAccount) ||
      (roleAssignFilter === 'unassigned' && !hasAccount);
    return matchSearch && matchFilter;
  });

  // Stats
  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    mr: users.filter(u => u.role === 'mr').length,
    viewer: users.filter(u => u.role === 'viewer').length,
    mrAssigned: mrs.filter(m => userHasMrAccount(m)).length,
    mrTotal: mrs.length,
  };

  const SortIcon: React.FC<{ field: string }> = ({ field }) => (
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />
      : <ChevronDown size={14} className="inline ml-1 opacity-20" />
  );

  const tabs = [
    { id: 'users' as TabType, label: 'Users', icon: Users, count: stats.total },
    { id: 'roles' as TabType, label: 'Assign Roles', icon: UserCog, count: stats.mrAssigned },
    { id: 'permissions' as TabType, label: 'Permissions', icon: Shield, count: null },
  ];

  return (
    <div className="p-8 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            User Management
          </h1>
          <p className="text-slate-500 mt-1 ml-[52px]">Manage users, roles, and permissions across the platform</p>
        </div>
        <div className="flex gap-2">
          {canCreate && activeTab === 'users' && (
            <button onClick={() => { setEditingUser(null); setFormData({ name: '', email: '', role: 'viewer', password: '' }); setShowAddModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20">
              <Plus className="w-4 h-4" /> Add User
            </button>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-500">Total Users</p>
        </div>
        {(['admin', 'manager', 'mr', 'viewer'] as UserRole[]).map(role => {
          const c = ROLE_COLORS[role];
          return (
            <div key={role} className="bg-white p-3 rounded-xl border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}>
              <div className="flex items-center gap-1.5 text-sm px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center"
                style={{ color: c.text, background: c.bg }}>
                <span>{c.icon}</span>
                <span className="truncate">{c.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats[role]}</p>
              <p className="text-xs text-slate-400">{roleFilter === role ? 'Filtering...' : 'Users'}</p>
            </div>
          );
        })}
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <p className="text-2xl font-bold text-slate-800">{stats.mrTotal}</p>
          <p className="text-xs text-slate-500">MR Records</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <p className="text-2xl font-bold text-slate-800">{stats.mrAssigned}/{stats.mrTotal}</p>
          <p className="text-xs text-slate-500">Accounts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (roleFilter !== 'all') setRoleFilter('all'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === tab.id
              ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== null && <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* ======================= USERS TAB ======================= */}
      {activeTab === 'users' && (
        <>
          {/* Search & Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search users by name, email, or role..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as UserRole | 'all')}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="manager">Manager</option>
              <option value="mr">Medical Rep</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {/* Users Cards (mobile) + Table (desktop) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full hidden lg:table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                    User <SortIcon field="name" />
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('role')}>
                    Role <SortIcon field="role" />
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Permissions</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('last_login')}>
                    Last Login <SortIcon field="last_login" />
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const c = ROLE_COLORS[u.role];
                  const hasAccount = users.some(x => x.mr_id === (u.mr_id || 0));
                  const isExpanded = expandedUser === u.id;
                  return (
                    <React.Fragment key={u.id}>
                      <tr className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setShowDetailModal(true); setExpandedUser(u.id); }}>
                            <img src={u.avatar_url} alt={u.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100" />
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{u.name}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: c.bg, color: c.text }}>
                            {c.icon} {c.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(u.permissions.length / 31) * 100}%` }} />
                            </div>
                            <span className="text-xs text-slate-400 ml-1">{u.permissions.length}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-slate-500">
                            {u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {u.last_login
                            ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Activity size={12} /> Active</span>
                            : <span className="inline-flex items-center gap-1 text-xs text-slate-400">Inactive</span>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button title="View Details" onClick={() => setExpandedUser(u.id)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {canEdit && (
                              <>
                                <button title="Change Role" onClick={() => { setFormData({ name: u.name, email: u.email, role: u.role, password: '' }); setEditingUser(u); setShowAddModal(true); }}
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button title="Edit Permissions" onClick={() => { setCustomPerms([...u.permissions]); setShowPermissionEditor(u); }}
                                  className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                  <Shield className="w-3.5 h-3.5" />
                                </button>
                                <button title="Reset Password" onClick={() => { setShowPasswordModal(u); setResetPassword(''); }}
                                  className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {canDelete && u.id !== 1 && (
                              <button title="Delete User" onClick={() => setShowDeleteConfirm(u)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded inline detail */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={6} className="px-5 py-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <img src={u.avatar_url} alt={u.name} className="w-12 h-12 rounded-full" />
                                  <div>
                                    <p className="font-semibold text-slate-800">{u.name}</p>
                                    <p className="text-xs text-slate-500">{u.email}</p>
                                  </div>
                                </div>
                                {u.mr_id && <p className="text-xs text-slate-400">MR ID: {u.mr_id}</p>}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Account Info</p>
                                <p className="text-xs text-slate-600">Created: {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</p>
                                <p className="text-xs text-slate-600">Last Login: {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</p>
                                <p className="text-xs text-slate-600">Role: {c.label}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Permissions ({u.permissions.length}/31)</p>
                                <div className="flex flex-wrap gap-1">
                                  {u.permissions.map(p => (
                                    <span key={p} className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[10px] rounded">
                                      {PERMISSION_LABELS[p] || p}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-16 text-center text-slate-400">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    No users found
                  </td></tr>
                )}
              </tbody>
            </table>

            {/* Mobile card view */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredUsers.map(u => {
                const c = ROLE_COLORS[u.role];
                return (
                  <div key={u.id} className="p-4 flex items-center gap-3">
                    <img src={u.avatar_url} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{u.name}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: c.bg, color: c.text }}>
                          {c.icon} {c.label}
                        </span>
                        <span className="text-xs text-slate-400">{u.permissions.length} perms</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingUser(u); setFormData({ name: u.name, email: u.email, role: u.role, password: '' }); setShowAddModal(true); }}
                        className="p-2 text-slate-400 hover:text-blue-600 rounded"><Edit2 size={14} /></button>
                      <button onClick={() => { setCustomPerms([...u.permissions]); setShowPermissionEditor(u); }}
                        className="p-2 text-slate-400 hover:text-purple-600 rounded"><Shield size={14} /></button>
                      <button onClick={() => setShowDeleteConfirm(u)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ======================= ASSIGN ROLES TAB ======================= */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <Briefcase size={20} className="text-blue-900" />
              Assign Roles to Medical Representatives
            </h3>
            <p className="text-blue-700 text-sm mt-1">
              Select an MR and assign them a role. This creates a user account if one doesn't exist.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search MRs by name or territory..."
                value={roleAssignSearch} onChange={e => setRoleAssignSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <select value={roleAssignFilter} onChange={e => setRoleAssignFilter(e.target.value as any)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600">
              <option value="all">All MRs</option>
              <option value="assigned">With Accounts</option>
              <option value="unassigned">Without Accounts</option>
            </select>
          </div>

          {loadingMRs ? (
            <div className="text-center py-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /><p className="text-slate-500 mt-2">Loading MRs...</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMRs.map(mr => {
                const userAccount = users.find(u => u.mr_id === mr.id);
                const hasAcct = !!userAccount;
                const roleColor = hasAcct ? ROLE_COLORS[userAccount.role as UserRole] : null;
                return (
                  <div key={mr.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <img src={mr.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mr.name)}&background=6366f1&color=fff`}
                        alt={mr.name} className="w-12 h-12 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 truncate">{mr.name}</h4>
                        <p className="text-sm text-slate-500">{mr.territory}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {hasAcct ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                              style={{ background: roleColor!.bg, color: roleColor!.text }}>
                              {roleColor!.icon} {roleColor!.label}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                              No Account
                            </span>
                          )}
                          <span className={`w-2 h-2 rounded-full ${hasAcct ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedMR(mr); setAssignRole((userAccount?.role as UserRole) || 'mr'); setShowRoleAssignModal(true); }}
                      className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      {hasAcct ? <><RefreshCw className="w-3.5 h-3.5" /> Change Role</> : <><Plus className="w-3.5 h-3.5" /> Create Account & Assign</>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================= PERMISSIONS TAB ======================= */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Role Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(ROLE_PERMISSIONS) as UserRole[]).map(role => {
              const c = ROLE_COLORS[role];
              return (
                <div key={role} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{c.icon}</span>
                      <span className="font-semibold text-slate-800">{c.label}</span>
                    </div>
                    <span className="text-xs text-slate-400">{ROLE_PERMISSIONS[role].length} / 31 permissions</span>
                  </div>
                  {/* Permission bars */}
                  <div className="space-y-1.5">
                    {PERMISSION_GROUPS.map(group => {
                      const has = group.perms.filter(p => ROLE_PERMISSIONS[role].includes(p));
                      const pct = group.perms.length ? (has.length / group.perms.length) * 100 : 0;
                      return (
                        <div key={group.category} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-28 truncate">{group.category}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.bg }} />
                          </div>
                          <span className="text-xs text-slate-400 w-10 text-right">{has.length}/{group.perms.length}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Permission Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Permission</th>
                  {(Object.keys(ROLE_PERMISSIONS) as UserRole[]).map(role => (
                    <th key={role} className="px-4 py-3 text-center">
                      <span className="text-sm">{ROLE_COLORS[role].icon}</span>
                      <span className="block text-[10px] text-slate-500">{ROLE_COLORS[role].label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_GROUPS.map(group => (
                  <React.Fragment key={group.category}>
                    <tr className="bg-slate-50/50">
                      <td colSpan={5} className="px-5 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider">{group.category}</td>
                    </tr>
                    {group.perms.map(perm => (
                      <tr key={perm} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-5 py-2.5 text-sm text-slate-700">{PERMISSION_LABELS[perm] || perm}</td>
                        {(Object.keys(ROLE_PERMISSIONS) as UserRole[]).map(role => (
                          <td key={role} className="px-4 py-2.5 text-center">
                            {ROLE_PERMISSIONS[role].includes(perm)
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                              : <XCircle className="w-4 h-4 text-slate-200 mx-auto" />
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================= MODALS ======================= */}

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <Modal title={editingUser ? 'Edit User' : 'Add New User'} onClose={() => { setShowAddModal(false); setEditingUser(null); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Full Name" icon={<UserIcon size={14} />}>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" required />
            </FormField>
            {!editingUser && (
              <FormField label="Email" icon={<Mail size={14} />}>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" required />
              </FormField>
            )}
            <FormField label="Role" icon={<Shield size={14} />}>
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="viewer">Viewer (Read-Only)</option>
                <option value="mr">Medical Rep (Field Work)</option>
                <option value="manager">Manager (Team Lead)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </FormField>
            {!editingUser && (
              <FormField label="Password" icon={<Key size={14} />}>
                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" required minLength={6} />
                <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
              </FormField>
            )}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
              <Shield size={14} className="text-blue-500" />
              This role grants <strong className="text-slate-700">{ROLE_PERMISSIONS[formData.role]?.length || 0} permissions</strong>: {ROLE_PERMISSIONS[formData.role]?.map(p => PERMISSION_LABELS[p] || p).join(', ')}
            </div>
            <div className="flex gap-3 pt-2">
              <ModalButton variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</ModalButton>
              <ModalButton variant="primary" type="submit">{editingUser ? 'Save Changes' : 'Create User'}</ModalButton>
            </div>
          </form>
        </Modal>
      )}

      {/* User Detail Modal */}
      {showDetailModal && expandedUser && (() => {
        const u = users.find(x => x.id === expandedUser);
        if (!u) return null;
        const c = ROLE_COLORS[u.role];
        return (
          <Modal title="User Details" onClose={() => setShowDetailModal(false)}>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <img src={u.avatar_url} alt={u.name} className="w-16 h-16 rounded-full ring-4 ring-white shadow-sm" />
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{u.name}</h3>
                  <p className="text-sm text-slate-500">{u.email}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: c.bg, color: c.text }}>
                      {c.icon} {c.label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="Account Created" value={u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'} icon={<Calendar size={14} />} />
                <InfoCard label="Last Login" value={u.last_login ? new Date(u.last_login).toLocaleString('en-IN') : 'Never'} icon={u.last_login ? <Activity size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-slate-300" />} />
                <InfoCard label="Permissions" value={`${u.permissions.length} / 31`} icon={<Shield size={14} />} />
                <InfoCard label="MR Linked" value={u.mr_id ? `#${u.mr_id}` : 'None'} icon={<UserIcon size={14} />} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Shield size={14} className="text-blue-500" /> Permissions ({u.permissions.length})
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {u.permissions.map(p => (
                    <div key={p} className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <span className="text-xs text-slate-600">{PERMISSION_LABELS[p] || p}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <ModalButton variant="secondary" onClick={() => setShowDetailModal(false)}>Close</ModalButton>
                {canEdit && (
                  <>
                    <ModalButton variant="primary" onClick={() => { setShowDetailModal(false); handleEdit(u); }}>
                      <Edit2 size={14} /> Edit
                    </ModalButton>
                    <button onClick={() => { setShowDetailModal(false); setCustomPerms([...u.permissions]); setShowPermissionEditor(u); }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
                      <Shield size={14} className="inline mr-1" /> Permissions
                    </button>
                  </>
                )}
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal title="Delete User" onClose={() => setShowDeleteConfirm(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
              <AlertTriangle size={24} className="text-red-500" />
              <div>
                <p className="font-semibold text-red-800">This action cannot be undone</p>
                <p className="text-sm text-red-600">You are about to delete <strong>{showDeleteConfirm.name}</strong> ({showDeleteConfirm.email}). All their account data will be permanently removed.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ModalButton variant="secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</ModalButton>
              <ModalButton variant="danger" onClick={() => handleDeleteUser(showDeleteConfirm)}>
                <Trash2 size={14} /> Delete User
              </ModalButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <Modal title={`Reset Password — ${showPasswordModal.name}`} onClose={() => { setShowPasswordModal(null); setResetPassword(''); }}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <Key size={20} className="text-amber-500" />
              <p className="text-sm text-amber-700">Enter a new password for <strong>{showPasswordModal.name}</strong></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter new password" minLength={6} />
              {resetPassword && resetPassword.length < 6 && <p className="text-xs text-red-500 mt-1">Minimum 6 characters required</p>}
            </div>
            <div className="flex gap-3">
              <ModalButton variant="secondary" onClick={() => { setShowPasswordModal(null); setResetPassword(''); }}>Cancel</ModalButton>
              <ModalButton variant="primary" onClick={handleResetPassword} disabled={!resetPassword || resetPassword.length < 6}>
                <RefreshCw size={14} /> Reset Password
              </ModalButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Permission Editor Modal */}
      {showPermissionEditor && (
        <Modal title={`Edit Permissions — ${showPermissionEditor.name}`} onClose={() => setShowPermissionEditor(null)} wide>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <img src={showPermissionEditor.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                <div>
                  <p className="font-medium text-sm text-slate-800">{showPermissionEditor.name}</p>
                  <p className="text-xs text-slate-500">Current: {customPerms.length} / 31 permissions selected</p>
                </div>
              </div>
              {customPerms.length !== ROLE_PERMISSIONS[showPermissionEditor.role]?.length && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium">Custom permissions</span>
              )}
            </div>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setCustomPerms([...ROLE_PERMISSIONS[showPermissionEditor.role]])}
                className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium">
                Reset to {ROLE_COLORS[showPermissionEditor.role].label} Default
              </button>
              <button onClick={() => setCustomPerms(Object.values(ROLE_PERMISSIONS).flat())}
                className="text-xs px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-medium">
                Select All (31)
              </button>
              <button onClick={() => setCustomPerms([])}
                className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">
                Clear All
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {PERMISSION_GROUPS.map(group => {
                const count = permCount(group.perms);
                const all = count === group.perms.length;
                const some = count > 0 && count < group.perms.length;
                return (
                  <div key={group.category} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 cursor-pointer hover:bg-slate-100"
                      onClick={() => togglePermGroup(group.perms)}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${all ? 'bg-blue-500 border-blue-500' : some ? 'bg-blue-200 border-blue-400' : 'border-slate-300'}`}>
                          {all && <CheckCircle2 size={12} className="text-white" />}
                          {some && <div className="w-2 h-0.5 bg-white rounded" />}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{group.category}</span>
                      </div>
                      <span className="text-xs text-slate-400">{count}/{group.perms.length}</span>
                    </div>
                    <div className="px-4 py-2 space-y-1">
                      {group.perms.map(perm => (
                        <label key={perm} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-2 py-1 transition-colors">
                          <input type="checkbox" checked={customPerms.includes(perm)}
                            onChange={() => togglePerm(perm)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                          <span className="text-sm text-slate-600">{PERMISSION_LABELS[perm] || perm}</span>
                          <code className="text-[10px] text-slate-400 ml-auto">{perm}</code>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-2 border-t border-slate-100">
              <ModalButton variant="secondary" onClick={() => setShowPermissionEditor(null)}>Cancel</ModalButton>
              <ModalButton variant="primary" onClick={() => handleSavePermissions(showPermissionEditor)}>
                <CheckCircle2 size={14} /> Save Permissions
              </ModalButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Role Assignment Modal */}
      {showRoleAssignModal && selectedMR && (
        <Modal title={`Assign Role — ${selectedMR.name}`} onClose={() => setShowRoleAssignModal(false)}>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-sm text-slate-600">MR: <span className="font-medium text-slate-800">{selectedMR.name}</span></p>
              <p className="text-sm text-slate-600">Territory: <span className="font-medium text-slate-800">{selectedMR.territory}</span></p>
              {selectedMR.email && <p className="text-sm text-slate-600">Email: <span className="font-medium text-slate-800">{selectedMR.email}</span></p>}
            </div>
            <div className="space-y-2">
              {(Object.keys(ROLE_PERMISSIONS) as UserRole[]).map(role => {
                const c = ROLE_COLORS[role];
                return (
                  <button key={role} onClick={() => setAssignRole(role)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${assignRole === role ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{c.icon}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-slate-800">{c.label}</p>
                        <p className="text-xs text-slate-400">{ROLE_PERMISSIONS[role].length} permissions</p>
                      </div>
                    </div>
                    {assignRole === role && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <ModalButton variant="secondary" onClick={() => setShowRoleAssignModal(false)}>Cancel</ModalButton>
              <ModalButton variant="primary" onClick={handleAssignRole}>
                {userHasMrAccount(selectedMR) ? 'Update Role' : 'Create & Assign'}
              </ModalButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===== Helper Components ===== */

function Briefcase(props: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.15s ease' }} onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${wide ? 'w-full max-w-4xl mx-4' : 'w-full max-w-md mx-4'}`}
        style={{ animation: 'scaleIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">{icon}{label}</label>
      {children}
    </div>
  );
}

function ModalButton({ variant = 'secondary', children, onClick, type, disabled }: {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button type={type || 'button'} onClick={onClick} disabled={disabled}
      className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1.5 ${styles[variant]}`}>
      {children}
    </button>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
      <div className="text-slate-400">{icon}</div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

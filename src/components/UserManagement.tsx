import React, { useState, useEffect } from 'react';
import { useAuth, ROLE_PERMISSIONS } from '../contexts/AuthContext';
import { User, UserRole, MR } from '../types';
import { api } from '../services/api';
import { 
  Users, Plus, Search, Filter, MoreVertical, 
  Shield, User as UserIcon, Edit2, Trash2, 
  CheckCircle2, XCircle, Mail, Phone, UserCog,
  Briefcase, CheckCircle, X
} from 'lucide-react';

const ROLE_COLORS: Record<UserRole, { bg: string; text: string; label: string }> = {
  admin: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Administrator' },
  manager: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Manager' },
  mr: { bg: 'bg-green-100', text: 'text-green-700', label: 'Medical Rep' },
  viewer: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Viewer' }
};

type TabType = 'users' | 'roles' | 'permissions';

export default function UserManagement() {
  const { users, createUser, updateUser, deleteUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'mr' as UserRole,
    password: ''
  });
  
  // MR Role Assignment state
  const [mrs, setMrs] = useState<MR[]>([]);
  const [loadingMRs, setLoadingMRs] = useState(false);
  const [selectedMR, setSelectedMR] = useState<MR | null>(null);
  const [showRoleAssignModal, setShowRoleAssignModal] = useState(false);
  const [assignRole, setAssignRole] = useState<UserRole>('mr');

  const canManageUsers = hasPermission('users.create');

  useEffect(() => {
    if (activeTab === 'roles') {
      fetchMRs();
    }
  }, [activeTab]);

  const fetchMRs = async () => {
    setLoadingMRs(true);
    try {
      const data = await api.mrs.getAll();
      setMrs(data || []);
    } catch (error) {
      console.error('Error fetching MRs:', error);
    }
    setLoadingMRs(false);
  };

  const handleAssignRole = async () => {
    if (!selectedMR) return;
    
    // Find or create user for this MR
    const existingUser = users.find(u => u.mr_id === selectedMR.id);
    
    if (existingUser) {
      await updateUser(existingUser.id, { role: assignRole });
    } else {
      // Create new user account for this MR
      await createUser({
        name: selectedMR.name,
        email: selectedMR.email,
        role: assignRole,
        password: 'password123', // Default password
        mr_id: selectedMR.id
      });
    }
    
    setShowRoleAssignModal(false);
    setSelectedMR(null);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      await updateUser(editingUser.id, { 
        name: formData.name, 
        role: formData.role 
      });
    } else {
      await createUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password
      });
    }
    setShowAddModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'mr', password: '' });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUser(id);
    }
  };

  const tabs = [
    { id: 'users' as TabType, label: 'Users', icon: Users },
    { id: 'roles' as TabType, label: 'Assign Roles', icon: UserCog },
    { id: 'permissions' as TabType, label: 'Permissions', icon: Shield },
  ];

  return (
    <div className="p-8 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 mt-1">Manage users and their roles & permissions</p>
        </div>
        {canManageUsers && activeTab === 'users' && (
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: '', email: '', role: 'mr', password: '' });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {(['admin', 'manager', 'mr', 'viewer'] as UserRole[]).map(role => {
              const count = users.filter(u => u.role === role).length;
              const colors = ROLE_COLORS[role];
              return (
                <div key={role} className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                    <Shield className="w-4 h-4" />
                    {colors.label}
                  </div>
                  <p className="text-2xl font-bold text-slate-800 mt-2">{count}</p>
                  <p className="text-sm text-slate-500">Users</p>
                </div>
              );
            })}
          </div>

          {/* Search */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
              <Filter className="w-5 h-5" />
              Filter
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">User</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Permissions</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Last Login</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const roleColors = ROLE_COLORS[user.role];
                  return (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar_url}
                            alt={user.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-slate-800">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${roleColors.bg} ${roleColors.text}`}>
                          <Shield className="w-3 h-3" />
                          {roleColors.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {user.permissions.length} permissions
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {user.last_login 
                            ? new Date(user.last_login).toLocaleDateString() 
                            : 'Never'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {canManageUsers && (
                            <>
                              <button
                                onClick={() => handleEdit(user)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {user.id !== 1 && (
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Assign Roles Tab Content */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Assign Roles to Medical Representatives
            </h3>
            <p className="text-blue-700 text-sm mt-1">
              Select an MR and assign them a role. This determines what they can access in the system.
            </p>
          </div>

          {loadingMRs ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-500 mt-2">Loading MRs...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mrs.map(mr => {
                const userAccount = users.find(u => u.mr_id === mr.id);
                const currentRole = userAccount?.role || 'none';
                const roleColors = currentRole !== 'none' ? ROLE_COLORS[currentRole as UserRole] : { bg: 'bg-gray-100', text: 'text-gray-600', label: 'No Account' };
                
                return (
                  <div key={mr.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <img
                        src={mr.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mr.name)}&background=6366f1&color=fff`}
                        alt={mr.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 truncate">{mr.name}</h4>
                        <p className="text-sm text-slate-500">{mr.territory}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${roleColors.bg} ${roleColors.text}`}>
                            <Shield className="w-3 h-3" />
                            {roleColors.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedMR(mr);
                          setAssignRole((userAccount?.role as UserRole) || 'mr');
                          setShowRoleAssignModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <UserCog className="w-4 h-4" />
                        {userAccount ? 'Change Role' : 'Assign Role'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Permissions Tab Content */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Permissions</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(ROLE_PERMISSIONS) as UserRole[]).map(role => {
                  const colors = ROLE_COLORS[role];
                  return (
                    <tr key={role} className="border-b border-slate-100">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                          <Shield className="w-4 h-4" />
                          {colors.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {ROLE_PERMISSIONS[role].map(perm => (
                            <span key={perm} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                              {perm}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Administrator</option>
                  <option value="manager">Manager</option>
                  <option value="mr">Medical Representative</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showRoleAssignModal && selectedMR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Assign Role to {selectedMR.name}
            </h2>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600">Territory: <span className="font-medium text-slate-800">{selectedMR.territory}</span></p>
                <p className="text-sm text-slate-600">Email: <span className="font-medium text-slate-800">{selectedMR.email}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Role</label>
                <div className="space-y-2">
                  {(Object.keys(ROLE_PERMISSIONS) as UserRole[]).map(role => {
                    const colors = ROLE_COLORS[role];
                    return (
                      <button
                        key={role}
                        onClick={() => setAssignRole(role)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          assignRole === role
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                          <Shield className="w-3 h-3" />
                          {colors.label}
                        </span>
                        <span className="text-sm text-slate-500">
                          {ROLE_PERMISSIONS[role].length} permissions
                        </span>
                        {assignRole === role && (
                          <CheckCircle className="w-5 h-5 text-blue-500 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRoleAssignModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignRole}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

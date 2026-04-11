import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, MR } from '../types';

// Role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'dashboard.view',
    'mrs.view', 'mrs.create', 'mrs.edit', 'mrs.delete',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'directory.view', 'directory.create', 'directory.edit', 'directory.delete',
    'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
    'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.approve',
    'schedule.view', 'schedule.create', 'schedule.edit', 'schedule.delete',
    'leads.view', 'leads.create', 'leads.edit', 'leads.delete',
    'performance.view',
    'data.view', 'data.export', 'data.import',
    'settings.view', 'settings.edit',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'reports.view', 'reports.generate'
  ],
  manager: [
    'dashboard.view',
    'mrs.view', 'mrs.edit',
    'products.view',
    'directory.view', 'directory.create', 'directory.edit',
    'sales.view', 'sales.create', 'sales.edit',
    'expenses.view', 'expenses.create', 'expenses.edit',
    'schedule.view', 'schedule.create', 'schedule.edit',
    'leads.view', 'leads.create', 'leads.edit',
    'performance.view',
    'data.view', 'data.export',
    'settings.view',
    'reports.view', 'reports.generate'
  ],
  mr: [
    'dashboard.view',
    'products.view',
    'directory.view',
    'sales.view', 'sales.create',
    'expenses.view', 'expenses.create',
    'schedule.view', 'schedule.create', 'schedule.edit',
    'leads.view', 'leads.create',
    'mr-dashboard.view',
    'field-capture.view'
  ],
  viewer: [
    'dashboard.view',
    'mrs.view',
    'products.view',
    'directory.view',
    'sales.view',
    'expenses.view',
    'schedule.view',
    'leads.view',
    'performance.view'
  ]
};

// Default admin user
const DEFAULT_ADMIN: User = {
  id: 1,
  name: 'Admin',
  email: 'admin@metapharsic.com',
  role: 'admin',
  avatar_url: 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff',
  permissions: ROLE_PERMISSIONS.admin,
  created_at: new Date().toISOString()
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (profile: { email: string; name: string; avatar_url?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
  canAccessRoute: (route: string) => boolean;
  users: User[];
  createUser: (userData: Partial<User> & { password: string }) => Promise<User | null>;
  updateUser: (id: number, updates: Partial<User>) => Promise<User | null>;
  deleteUser: (id: number) => Promise<boolean>;
  assignRoleToMR: (mrId: number, role: UserRole, userId?: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Route to permission mapping
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/': 'dashboard.view',
  '/mrs': 'mrs.view',
  '/products': 'products.view',
  '/directory': 'directory.view',
  '/sales': 'sales.view',
  '/expenses': 'expenses.view',
  '/schedule': 'schedule.view',
  '/leads': 'leads.view',
  '/mr-dashboard': 'mr-dashboard.view',
  '/field-tracker': 'field-capture.view',
  '/performance': 'performance.view',
  '/mr-tracking': 'data.view',
  '/data-management': 'data.view',
  '/settings': 'settings.view'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // Default MR users to ensure they exist
  const DEFAULT_MR_USERS: User[] = [
    {
      id: 2,
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@metapharsic.com',
      role: 'mr',
      mr_id: 1,
      territory: 'Hyderabad West (Kukatpally, Gachibowli, Miyapur)',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      permissions: ROLE_PERMISSIONS.mr,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Suresh Raina',
      email: 'suresh.raina@metapharsic.com',
      role: 'mr',
      mr_id: 2,
      territory: 'Hyderabad Central (Banjara Hills, Jubilee Hills, Barkatpura)',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      permissions: ROLE_PERMISSIONS.mr,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Priya Sharma',
      email: 'priya.sharma@metapharsic.com',
      role: 'mr',
      mr_id: 3,
      territory: 'Hyderabad East (Secunderabad, Tarnaka, Uppal)',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      permissions: ROLE_PERMISSIONS.mr,
      created_at: new Date().toISOString()
    }
  ];

  // Load users and current user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('metapharsic_current_user');
    let mergedUsers: User[] = [];

    try {
      const savedUsers = localStorage.getItem('metapharsic_users');
      const parsedUsers: User[] = savedUsers ? JSON.parse(savedUsers) : [];

      // Merge users: defaults go first, then saved values override them.
      // This ensures admin-updated territories (e.g. Rajesh → "Nacharam") are
      // preserved across page reloads instead of being reset to hardcoded defaults.
      const emailMap = new Map<string, User>();
      for (const u of [DEFAULT_ADMIN, ...DEFAULT_MR_USERS]) emailMap.set(u.email.toLowerCase(), u);
      for (const u of parsedUsers) emailMap.set(u.email.toLowerCase(), u);

      // Re-assign consistent IDs based on the defaults
      mergedUsers = Array.from(emailMap.values());

      // Ensure default admin has ID 1
      mergedUsers = mergedUsers.map(u => u.email === DEFAULT_ADMIN.email ? { ...u, id: 1 } : u);
    } catch {
      console.error('[Auth] Error parsing users, resetting to defaults');
      mergedUsers = [DEFAULT_ADMIN, ...DEFAULT_MR_USERS];
    }

    setUsers(mergedUsers);
    localStorage.setItem('metapharsic_users', JSON.stringify(mergedUsers));

    // Validate current user
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const stillExists = mergedUsers.find(u => u.id === parsedUser.id);
        if (stillExists) {
          setUser(stillExists);
        } else {
          localStorage.removeItem('metapharsic_current_user');
        }
      } catch {
        localStorage.removeItem('metapharsic_current_user');
      }
    }

    setIsLoading(false);
  }, []);

  // Save users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('metapharsic_users', JSON.stringify(users));
    }
  }, [users]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Use state users (always seeded on mount) or localStorage fallback
    const emailLower = email.toLowerCase();
    const allUsers = users.length > 0 ? users : DEFAULT_MR_USERS;
    const foundUser = allUsers.find(u => u.email.toLowerCase() === emailLower);
    console.log('[Auth] Login attempt for', email, '→ found:', foundUser?.name, foundUser?.role);
    console.log('[Auth] Available users:', allUsers.map(u => `${u.email} (${u.role})`).join(', '));

    if (!foundUser) {
      // Demo credentials - create admin on the fly if not exists
      if (emailLower === 'admin@metapharsic.com' && password === 'admin123') {
        setUser(DEFAULT_ADMIN);
        localStorage.setItem('metapharsic_current_user', JSON.stringify(DEFAULT_ADMIN));
        const updatedUsers = [...allUsers.filter((u: User) => u.email !== DEFAULT_ADMIN.email), DEFAULT_ADMIN];
        setUsers(updatedUsers);
        return { success: true };
      }
      return { success: false, error: 'Invalid email or password' };
    }

    // Accept any password for existing users (demo mode)
    setUser(foundUser);
    localStorage.setItem('metapharsic_current_user', JSON.stringify(foundUser));

    // Update last login
    const updatedUsers = allUsers.map((u: User) =>
      u.id === foundUser.id ? { ...u, last_login: new Date().toISOString() } : u
    );
    setUsers(updatedUsers);

    return { success: true };
  }, [users]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('metapharsic_current_user');
    localStorage.removeItem('metapharsic_google_user');
    localStorage.removeItem('metapharsic_google_token');
  }, []);

  const loginWithGoogle = useCallback(async (googleUser: { email: string; name: string; avatar_url?: string }): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const savedUsers = localStorage.getItem('metapharsic_users');
    const currentUsers = savedUsers ? JSON.parse(savedUsers) : users;

    // Check if user already exists
    const foundUser = currentUsers.find((u: User) => u.email.toLowerCase() === googleUser.email.toLowerCase());

    if (foundUser) {
      const updatedUsers = currentUsers.map((u: User) =>
        u.id === foundUser.id ? { ...u, last_login: new Date().toISOString() } : u
      );
      setUsers(updatedUsers);
      localStorage.setItem('metapharsic_users', JSON.stringify(updatedUsers));
      setUser(foundUser);
      localStorage.setItem('metapharsic_current_user', JSON.stringify(foundUser));
      localStorage.setItem('metapharsic_google_user', JSON.stringify(googleUser));
      console.log('[Auth] Google login:', foundUser.name, 'as', foundUser.role);
      return { success: true };
    }

    // Auto-register new MR user from Google profile
    const newUser: User = {
      id: Date.now(),
      name: googleUser.name,
      email: googleUser.email,
      role: 'mr',
      avatar_url: googleUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(googleUser.name)}&background=6366f1&color=fff`,
      permissions: ROLE_PERMISSIONS.mr,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };

    const updatedUsers = [...currentUsers, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('metapharsic_users', JSON.stringify(updatedUsers));
    setUser(newUser);
    localStorage.setItem('metapharsic_current_user', JSON.stringify(newUser));
    localStorage.setItem('metapharsic_google_user', JSON.stringify(googleUser));
    console.log('[Auth] Google auto-registered new MR:', newUser.name, newUser.email);
    return { success: true };
  }, [users]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.role === 'admin';
  }, [user]);

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const canAccessRoute = useCallback((route: string): boolean => {
    if (!user) return false;
    const permission = ROUTE_PERMISSIONS[route];
    if (!permission) return true; // Public route
    return hasPermission(permission);
  }, [user, hasPermission]);

  const createUser = useCallback(async (userData: Partial<User> & { password: string }): Promise<User | null> => {
    const newUser: User = {
      id: Date.now(),
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role || 'viewer',
      mr_id: userData.mr_id,
      avatar_url: userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || '')}&background=6366f1&color=fff`,
      permissions: ROLE_PERMISSIONS[userData.role || 'viewer'],
      created_at: new Date().toISOString()
    };
    
    setUsers(prev => [...prev, newUser]);
    return newUser;
  }, []);

  const updateUser = useCallback(async (id: number, updates: Partial<User>): Promise<User | null> => {
    const userToUpdate = users.find(u => u.id === id);
    if (!userToUpdate) return null;
    
    const updatedUser = { 
      ...userToUpdate, 
      ...updates,
      permissions: updates.role ? ROLE_PERMISSIONS[updates.role] : userToUpdate.permissions
    };
    
    setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
    
    if (user?.id === id) {
      setUser(updatedUser);
      localStorage.setItem('metapharsic_current_user', JSON.stringify(updatedUser));
    }
    
    return updatedUser;
  }, [users, user]);

  const deleteUser = useCallback(async (id: number): Promise<boolean> => {
    if (id === 1) return false; // Prevent deleting default admin
    setUsers(prev => prev.filter(u => u.id !== id));
    return true;
  }, []);

  const assignRoleToMR = useCallback(async (mrId: number, role: UserRole, userId?: number): Promise<boolean> => {
    // Update the MR's role in the backend (mock)
    try {
      const response = await fetch(`/api/mrs/${mrId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, user_id: userId })
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        hasPermission,
        hasRole,
        canAccessRoute,
        users,
        createUser,
        updateUser,
        deleteUser,
        assignRoleToMR
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth(roles?: UserRole[]) {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const navigate = require('react-router-dom').useNavigate();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    } else if (!isLoading && roles && !hasRole(roles)) {
      navigate('/unauthorized');
    }
  }, [isLoading, isAuthenticated, roles, hasRole, navigate]);
  
  return { user, isLoading };
}

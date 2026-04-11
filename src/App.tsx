import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Lazy load components with error boundaries
const Sidebar = lazy(() => import('./components/Sidebar'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const MRManagement = lazy(() => import('./components/MRManagement'));
const ProductPortfolio = lazy(() => import('./components/ProductPortfolio'));
const HealthcareDirectory = lazy(() => import('./components/HealthcareDirectory'));
const SalesTracking = lazy(() => import('./components/SalesTracking'));
const ExpenseManager = lazy(() => import('./components/ExpenseManager'));
const DailyCallPlan = lazy(() => import('./components/DailyCallPlan'));
const VisitSchedule = lazy(() => import('./components/VisitSchedule'));
const LeadsManagement = lazy(() => import('./components/LeadsManagement'));
const MRDashboard = lazy(() => import('./components/MRDashboard'));
const DataManagement = lazy(() => import('./components/DataManagement'));
const MRPerformanceDashboard = lazy(() => import('./components/MRPerformanceDashboard'));
const MRTracking = lazy(() => import('./components/MRTracking'));
const MRFieldTracker = lazy(() => import('./components/MRFieldTracker'));
const ApprovalWorkflow = lazy(() => import('./components/ApprovalWorkflow'));
const EntityCredits = lazy(() => import('./components/EntityCredits'));
const GlobalSearch = lazy(() => import('./components/GlobalSearch'));
const AIPerformanceDashboard = lazy(() => import('./components/AIPerformanceDashboard'));
const TopBar = lazy(() => import('./components/TopBar'));
const VoiceAssistant = lazy(() => import('./components/VoiceAssistant'));
const Settings = lazy(() => import('./components/Settings'));
const Login = lazy(() => import('./components/Login'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const DynamicDashboard = lazy(() => import('./components/DynamicDashboard'));

const LoadingFallback = () => (
  <div style={{ 
    padding: '40px', 
    textAlign: 'center', 
    color: '#666',
    fontFamily: 'Arial, sans-serif'
  }}>
    <p style={{ fontSize: '16px' }}>⏳ Loading component...</p>
  </div>
);

const ErrorFallback = ({ error }: { error?: string }) => (
  <div style={{ 
    padding: '40px', 
    textAlign: 'center', 
    color: '#d32f2f',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#ffebee',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column'
  }}>
    <h2 style={{ margin: '0 0 20px 0' }}>⚠️ Component Load Error</h2>
    <p style={{ margin: 0, whiteSpace: 'pre-wrap', textAlign: 'left', maxWidth: '600px' }}>
      {error || 'Failed to load component'}
    </p>
    <button 
      onClick={() => window.location.reload()}
      style={{
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#d32f2f',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
      }}
    >
      Reload Page
    </button>
  </div>
);

export default function App() {
  const useGoogle = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== '';

  const content = (
    <ErrorBoundary onError={() => {}}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );

  return useGoogle
    ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>
    : content;
}

// Protected Route component
function ProtectedRoute({ children, requiredPermission }: { children: React.ReactNode; requiredPermission?: string }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  
  if (isLoading) {
    return <LoadingFallback />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
}

function AppContent() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [globError, setGlobError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleVoiceCommand = (command: string) => {
    if (command === 'open-search') {
      setSearchOpen(true);
    } else if (command === 'close-search') {
      setSearchOpen(false);
    }
  };

  if (globError) {
    return <ErrorFallback error={globError} />;
  }

  // Show login page if not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="relative">
      <div className="min-h-screen bg-slate-50 flex">
        <Suspense fallback={<div style={{ width: '256px', padding: '20px' }}>Loading navigation...</div>}>
          <Sidebar onOpenSearch={() => setSearchOpen(true)} />
        </Suspense>
        
        <main className="flex-1 min-h-screen ml-0 lg:ml-64">
          {/* Top Bar */}
          <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
            <TopBar />
          </Suspense>
          
          {/* Page Content */}
          <div className="p-4 md:p-6 lg:p-8">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
              <Route path="/" element={<ProtectedRoute><DynamicDashboard /></ProtectedRoute>} />
              <Route path="/legacy-dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/mrs" element={<ProtectedRoute requiredPermission="mrs.view"><MRManagement /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute requiredPermission="products.view"><ProductPortfolio /></ProtectedRoute>} />
              <Route path="/directory" element={<ProtectedRoute requiredPermission="directory.view"><HealthcareDirectory /></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute requiredPermission="sales.view"><SalesTracking /></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute requiredPermission="expenses.view"><ExpenseManager /></ProtectedRoute>} />
              <Route path="/schedule" element={<ProtectedRoute requiredPermission="schedule.view"><DailyCallPlan /></ProtectedRoute>} />
              <Route path="/visit-schedule" element={<ProtectedRoute requiredPermission="schedule.view"><VisitSchedule /></ProtectedRoute>} />
              <Route path="/leads" element={<ProtectedRoute requiredPermission="leads.view"><LeadsManagement /></ProtectedRoute>} />
              <Route path="/mr-dashboard" element={<ProtectedRoute requiredPermission="mr-dashboard.view"><MRDashboard /></ProtectedRoute>} />
              <Route path="/data-management" element={<ProtectedRoute requiredPermission="data.view"><DataManagement /></ProtectedRoute>} />
              <Route path="/performance" element={<ProtectedRoute requiredPermission="performance.view"><MRPerformanceDashboard /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute requiredPermission="settings.view"><Settings /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute requiredPermission="users.view"><UserManagement /></ProtectedRoute>} />
              <Route path="/mr-tracking" element={<ProtectedRoute requiredPermission="data.view"><MRTracking /></ProtectedRoute>} />
              <Route path="/field-tracker" element={<ProtectedRoute requiredPermission="field-capture.view"><MRFieldTracker /></ProtectedRoute>} />
              <Route path="/approvals" element={<ProtectedRoute requiredPermission="expenses.approve"><ApprovalWorkflow /></ProtectedRoute>} />
              <Route path="/entity-credits" element={<ProtectedRoute requiredPermission="data.view"><EntityCredits /></ProtectedRoute>} />
              <Route path="/ai-performance" element={<ProtectedRoute requiredPermission="data.view"><AIPerformanceDashboard /></ProtectedRoute>} />
              <Route path="/unauthorized" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          </div>
        </main>
      </div>

      <Suspense fallback={null}>
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </Suspense>

      <Suspense fallback={null}>
        <VoiceAssistant 
          onCommand={handleVoiceCommand}
          onNavigate={navigate}
        />
      </Suspense>
    </div>
  );
}

interface Props {
  children: React.ReactNode;
  onError: (error: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error Boundary caught:', error.message);
    console.error('Component stack:', info.componentStack);
    const errorMsg = `${error.message}\n\n${info.componentStack}`;
    this.props.onError(errorMsg);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#d32f2f',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#ffebee',
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0' }}>⚠️ Page Error</h2>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{this.state.errorMessage}</p>
          <button
            onClick={() => { this.setState({ hasError: false, errorMessage: '' }); window.location.reload(); }}
            style={{ marginTop: '15px', padding: '8px 16px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

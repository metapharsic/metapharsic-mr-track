import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { authApi } from '../services/api';
import { Pill, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const isGoogleConfigured = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed');
    }
    setIsLoading(false);
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError('Google login failed — no credential received');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Verify the Google token with our backend
      const verified = await authApi.verifyGoogleToken(response.credential);

      if (!verified.email_verified) {
        setError('Google account email is not verified');
        setIsLoading(false);
        return;
      }

      // Step 2: Log in (or auto-register) via our auth context
      const result = await loginWithGoogle({
        email: verified.email,
        name: verified.name,
        avatar_url: verified.picture,
      });

      if (result.success) {
        const saved = localStorage.getItem('metapharsic_current_user');
        const user = saved ? JSON.parse(saved) : null;
        if (user?.role === 'mr') {
          navigate('/mr-dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError(result.error || 'Google login failed');
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
      setError('Google login failed. Please try again.');
    }
    setIsLoading(false);
  };

  const handleGoogleFailure = () => {
    setError('Google login was cancelled or failed');
  };

  const fillDemoCredentials = (type: 'admin' | 'mr') => {
    if (type === 'admin') { setEmail('admin@metapharsic.com'); setPassword('admin123'); }
    else { setEmail('rajesh.kumar@metapharsic.com'); setPassword('password'); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Metapharsic</h1>
          <p className="text-slate-400 mt-1">Life Sciences - Target & Expense Manager</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Welcome Back</h2>
          <p className="text-slate-500 text-sm mb-6">Sign in to access your dashboard</p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Google Sign-In */}
          {isGoogleConfigured ? (
            <div className="mb-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
                type="standard"
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="100%"
                />
            </div>
          ) : null}

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <> Sign In <ArrowRight className="w-5 h-5" /> </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center mb-3">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => fillDemoCredentials('admin')} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left hover:bg-slate-100 transition-colors">
                <p className="text-xs font-medium text-slate-600">Admin</p>
                <p className="text-xs text-slate-400">admin@metapharsic.com</p>
              </button>
              <button type="button" onClick={() => fillDemoCredentials('mr')} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left hover:bg-slate-100 transition-colors">
                <p className="text-xs font-medium text-slate-600">MR (Rajesh)</p>
                <p className="text-xs text-slate-400">rajesh.kumar@metapharsic.com</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">© 2024 Metapharsic Life Sciences. All rights reserved.</p>
      </div>
    </div>
  );
}

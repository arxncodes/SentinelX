import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Spinner } from '../components/common/States';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/dashboard');
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-sentinel-bg bg-grid flex items-center justify-center p-4">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-glow-cyan pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-sentinel-accent/20 border border-sentinel-accent/40 flex items-center justify-center mb-4 shadow-glow-cyan">
            <Shield className="w-8 h-8 text-sentinel-accent" />
          </div>
          <h1 className="text-2xl font-bold text-sentinel-text">SentinelX</h1>
          <p className="text-sentinel-muted text-sm mt-1">Security Operations Center</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-sentinel-text mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-sentinel-muted block mb-1.5" htmlFor="login-username">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-muted" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="input pl-9"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-sentinel-muted block mb-1.5" htmlFor="login-password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-muted" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input pl-9 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sentinel-muted hover:text-sentinel-text transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn-primary w-full justify-center py-2.5 mt-2"
              disabled={isLoading}
            >
              {isLoading ? <Spinner size={16} /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-sentinel-muted mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-sentinel-accent hover:text-sentinel-accent/80 transition-colors">
              Register
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-3 rounded-lg border border-sentinel-border bg-sentinel-surface/50 text-xs text-sentinel-muted">
          <div className="font-medium text-sentinel-text mb-1">Demo Credentials</div>
          <div className="space-y-0.5 font-mono">
            <div>admin / admin1234 <span className="text-sentinel-accent">(Admin)</span></div>
            <div>analyst / analyst1234 <span className="text-sentinel-muted">(Analyst)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff, Lock, User, Mail } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Spinner } from '../components/common/States';

export const Register: React.FC = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [showPass, setShowPass] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-sentinel-bg bg-grid flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-glow-cyan pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-sentinel-accent/20 border border-sentinel-accent/40 flex items-center justify-center mb-4 shadow-glow-cyan">
            <Shield className="w-8 h-8 text-sentinel-accent" />
          </div>
          <h1 className="text-2xl font-bold text-sentinel-text">SentinelX</h1>
          <p className="text-sentinel-muted text-sm mt-1">Create an account</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-sentinel-text mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-sentinel-muted block mb-1.5" htmlFor="reg-fullname">Full Name (optional)</label>
              <input id="reg-fullname" value={form.full_name} onChange={update('full_name')} placeholder="Jane Smith" className="input" />
            </div>
            <div>
              <label className="text-xs text-sentinel-muted block mb-1.5" htmlFor="reg-username">Username *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-muted" />
                <input id="reg-username" value={form.username} onChange={update('username')} placeholder="johndoe" className="input pl-9" required />
              </div>
            </div>
            <div>
              <label className="text-xs text-sentinel-muted block mb-1.5" htmlFor="reg-email">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-muted" />
                <input id="reg-email" type="email" value={form.email} onChange={update('email')} placeholder="john@company.com" className="input pl-9" required />
              </div>
            </div>
            <div>
              <label className="text-xs text-sentinel-muted block mb-1.5" htmlFor="reg-password">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-muted" />
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="Minimum 8 characters"
                  className="input pl-9 pr-10"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sentinel-muted hover:text-sentinel-text">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button id="register-submit" type="submit" className="btn-primary w-full justify-center py-2.5 mt-2" disabled={isLoading}>
              {isLoading ? <Spinner size={16} /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-sentinel-muted mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-sentinel-accent hover:text-sentinel-accent/80 transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

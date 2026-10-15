import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LineChart, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';

export const LoginPage: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ usernameOrEmail, password });
      navigate('/');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setUsernameOrEmail('trader_test');
    setPassword('MyPassword123!');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25">
            <LineChart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h1>
          <p className="text-xs text-slate-400">Sign in to your Trading Journal & MT5 Sync Platform</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-surface-border bg-surface-card/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Username or Email</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g. trader_test"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={loading}>
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900/90 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Or continue with
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Google Sign In */}
          <GoogleLoginButton mode="signin" onError={(err) => setError(err)} />

          {/* Quick Demo Fill button */}
          <div className="pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleDemoFill}
              className="w-full text-xs text-slate-400 hover:text-slate-200"
            >
              Fill Demo Credentials (trader_test)
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold ml-1">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

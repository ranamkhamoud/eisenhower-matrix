import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, UserPlus, AlertCircle, Sun, Moon, Github, Check, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const passwordRules = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#$%^&*)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const { signup, loginWithGithub } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const ruleResults = useMemo(() => {
    return passwordRules.map(rule => ({
      ...rule,
      passed: rule.test(password)
    }));
  }, [password]);

  const allRulesPassed = ruleResults.every(r => r.passed);
  const passedCount = ruleResults.filter(r => r.passed).length;

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (!allRulesPassed) {
      return setError('Password does not meet all requirements');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to create an account. Please try again.');
    }
    setLoading(false);
  }

  async function handleGithubSignIn() {
    try {
      setError('');
      setLoading(true);
      await loginWithGithub();
      navigate('/');
    } catch (err) {
      setError('Failed to sign in with GitHub. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-white dark:bg-[#1a1a1a]">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 text-slate-900/90 hover:text-slate-900 dark:text-white/90 dark:hover:text-white transition-colors"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      >
        {theme === 'dark' ? <Sun size={28} /> : <Moon size={28} />}
      </button>

      <div className="w-full max-w-md bg-white dark:bg-white/[0.06] border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create Account</h1>
          <p className="text-sm text-slate-600 dark:text-white/70">Start organizing your tasks with Tally</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300 rounded-lg mb-4 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-900 dark:text-white">
              Email
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-transparent border border-slate-200 dark:border-white/10 rounded-lg focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-200 dark:focus-within:border-white/20 dark:focus-within:ring-white/10 transition-all">
              <Mail size={18} className="text-slate-400 dark:text-white/60 flex-shrink-0" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 outline-none text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-900 dark:text-white">
              Password
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-transparent border border-slate-200 dark:border-white/10 rounded-lg focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-200 dark:focus-within:border-white/20 dark:focus-within:ring-white/10 transition-all">
              <Lock size={18} className="text-slate-400 dark:text-white/60 flex-shrink-0" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowRules(true)}
                placeholder="Create a password"
                required
                className="flex-1 outline-none text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
              />
            </div>
            
            {showRules && password.length > 0 && (
              <div className="mt-2 p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-lg">
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < passedCount
                          ? passedCount <= 2
                            ? 'bg-red-500'
                            : passedCount <= 4
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                          : 'bg-slate-200 dark:bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <div className="space-y-1">
                  {ruleResults.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-2 text-xs">
                      {rule.passed ? (
                        <Check size={12} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <X size={12} className="text-slate-400 dark:text-white/40 flex-shrink-0" />
                      )}
                      <span className={rule.passed ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-white/50'}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-900 dark:text-white">
              Confirm Password
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-transparent border border-slate-200 dark:border-white/10 rounded-lg focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-200 dark:focus-within:border-white/20 dark:focus-within:ring-white/10 transition-all">
              <Lock size={18} className="text-slate-400 dark:text-white/60 flex-shrink-0" />
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="flex-1 outline-none text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 font-medium text-sm rounded-lg hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-6"
            disabled={loading}
          >
            <UserPlus size={18} />
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-slate-200 dark:border-white/10"></div>
            <span className="px-3 text-sm text-slate-400 dark:text-white/50">or</span>
            <div className="flex-1 border-t border-slate-200 dark:border-white/10"></div>
          </div>

          <button 
            type="button" 
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 dark:bg-white/[0.06] border border-slate-800 dark:border-white/10 text-white dark:text-white font-medium text-sm rounded-lg hover:bg-slate-700 dark:hover:bg-white/[0.10] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            onClick={handleGithubSignIn}
            disabled={loading}
          >
            <Github size={18} />
            Continue with GitHub
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
          <p className="text-sm text-slate-600 dark:text-white/70">
            Already have an account? <Link to="/login" className="font-medium text-slate-900 hover:text-slate-700 dark:text-white dark:hover:text-white/80">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

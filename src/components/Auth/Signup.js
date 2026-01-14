import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, UserPlus, AlertCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
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

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
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
                placeholder="Create a password"
                required
                className="flex-1 outline-none text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40"
              />
            </div>
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
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-medium text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.10] hover:border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
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

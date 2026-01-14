import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-6 pointer-events-none">
      <div className="flex items-start justify-between">
        <div />
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={toggleTheme}
            className="text-slate-900/90 hover:text-slate-900 dark:text-white/90 dark:hover:text-white transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={28} /> : <Moon size={28} />}
          </button>
          {currentUser && (
            <button
              onClick={handleLogout}
              className="text-slate-900/90 hover:text-slate-900 dark:text-white/90 dark:hover:text-white transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={28} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

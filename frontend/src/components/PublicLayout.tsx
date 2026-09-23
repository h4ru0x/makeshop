import React from 'react';
import { Store } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { useTheme } from '../config/ThemeConfig';
import { Moon, Sun } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        padding: '1.5rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--surface-color)'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <Store size={28} color="var(--primary)" />
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-color)' }}>Make<span style={{ color: 'var(--primary)' }}>Shop</span></span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <nav style={{ gap: '1.5rem', display: 'none', '@media (min-width: 768px)': { display: 'flex' } } as any}>
            <Link to="#features" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Features</Link>
            <Link to="#pricing" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Pricing</Link>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--text-color)' }}>Log in</Link>
            <Link to="/signup" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Start free trial</Link>
          </div>
        </div>
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};

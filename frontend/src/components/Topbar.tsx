import React from 'react';
import { useTheme } from '../config/ThemeConfig';
import { Moon, Sun, Bell, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Topbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Welcome back</h2>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        
        <button className="theme-toggle">
          <Bell size={20} />
        </button>
        
        <Link to="/profile" style={{ 
          width: '36px', 
          height: '36px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          cursor: 'pointer',
          textDecoration: 'none'
        }}>
          <User size={20} />
        </Link>
      </div>
    </header>
  );
};

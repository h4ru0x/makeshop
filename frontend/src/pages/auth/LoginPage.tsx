import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Store, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../config/AuthContext';
import React, { useState } from 'react';

import { login as apiLogin } from '../../api/user-service/user-service';
import { getApiErrorMessage } from '../../api/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await apiLogin({ email, password });
      login(response);
      
      if (response.role === 'OWNER') {
        navigate('/owner');
      } else if (response.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/shop');
      }
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Error al iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="animate-fade-in" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ maxWidth: '450px', width: '100%', margin: '0 auto' }}>
        <div style={{ marginBottom: '3rem' }}>
          <Link to="/" className="sidebar-logo" style={{ marginBottom: '1.5rem', textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' }}>
            <Store size={32} />
            <span style={{ fontSize: '1.75rem', marginLeft: '0.5rem' }}>Make</span><span style={{ color: 'var(--primary)', fontSize: '1.75rem' }}>Shop</span>
          </Link>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Enter your details to access your store dashboard.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="email" className="input-field" placeholder="you@example.com" style={{ paddingLeft: '3rem', height: '50px' }} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="input-field" 
                placeholder="••••••••" 
                style={{ paddingLeft: '3rem', paddingRight: '3rem', height: '50px' }} 
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '50px', fontSize: '1.125rem', marginTop: '1rem' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create a store</Link>
        </p>
        </div>
      </div>

    </div>
  );
}

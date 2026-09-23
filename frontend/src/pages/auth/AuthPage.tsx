import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Lock, Mail } from 'lucide-react';
import { login, register as registerUser } from '../../api/user-service/user-service';
import { getApiErrorMessage } from '../../api/api';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'OWNER'>('CLIENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login({ email, password });
        if (res.role === 'OWNER') {
          navigate('/owner');
        } else if (res.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/shop');
        }
      } else {
        const res = await registerUser({ email, password, name, role });
        if (res.role === 'OWNER') {
          navigate('/owner');
        } else {
          navigate('/shop');
        }
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-color)'
    }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
            <Store size={40} />
          </div>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem' }}>
            {isLogin ? 'Log in to MakeShop' : 'Create an account'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? 'Continue to your store' : 'Start your business today'}
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '2.5rem' }} 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                className="input-field" 
                style={{ paddingLeft: '2.5rem' }} 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 500, fontSize: '0.875rem' }}>Password</label>
              {isLogin && <a href="#" style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>Forgot password?</a>}
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '2.5rem' }} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>I want to...</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', cursor: 'pointer', backgroundColor: role === 'CLIENT' ? 'var(--surface-color)' : 'transparent' }}>
                  <input type="radio" name="role" checked={role === 'CLIENT'} onChange={() => setRole('CLIENT')} style={{ accentColor: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Buy Products</span>
                </label>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', cursor: 'pointer', backgroundColor: role === 'OWNER' ? 'var(--surface-color)' : 'transparent' }}>
                  <input type="radio" name="role" checked={role === 'OWNER'} onChange={() => setRole('OWNER')} style={{ accentColor: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Create a Store</span>
                </label>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.875rem' }} disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}

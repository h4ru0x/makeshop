
import { ArrowRight, ShoppingBag, Zap, Globe, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      <section className="hero" style={{ borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
        <h1>
          Build your dream business with <span>MakeShop</span>
        </h1>
        <p>
          The most customizable, high-performance e-commerce platform for modern entrepreneurs. Start selling globally today.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/signup" className="btn btn-primary">
            Start free trial <ArrowRight size={18} />
          </Link>
          <a href="https://lazheart.github.io/OpenStore/" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            Developer tools
          </a>
        </div>
      </section>

      <section className="features-grid">
        <div className="card">
          <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            <Zap size={32} />
          </div>
          <h3>Lightning Fast</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Optimized for speed. Deliver the fastest shopping experience to your customers and boost your conversion rates.
          </p>
        </div>

        <div className="card">
          <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            <Globe size={32} />
          </div>
          <h3>Global Reach</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Sell anywhere in the world. We handle the localization, currencies, and international shipping logistics.
          </p>
        </div>

        <div className="card">
          <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            <Shield size={32} />
          </div>
          <h3>Enterprise Security</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Bank-level security protocols ensure that your data and your customers' transactions are safe at all times.
          </p>
        </div>
      </section>

      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Ready to launch your store?</h2>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
          <ShoppingBag size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
          <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            Join thousands of successful merchants who trust MakeShop to power their businesses.
          </p>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            
            <Link to="/signup" style={{ color: 'black' }}>Create Your Store</Link>
          </button>
        </div>
      </section>
    </div>
  );
}

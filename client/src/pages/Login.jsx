import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Info
} from 'lucide-react';
import clikzLogo from '../assets/clikz_logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Mobile responsiveness state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('isAuthenticated', 'true');
      toast.success('Welcome back!');
      navigate('/');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={{
        ...styles.card,
        flexDirection: isMobile ? 'column' : 'row',
        maxWidth: isMobile ? 420 : 900,
        minHeight: isMobile ? 'auto' : 580,
        borderRadius: isMobile ? 16 : 20,
      }}>

        {/* ── Left panel ── */}
        {!isMobile && (
          <div style={styles.left}>
            <div style={styles.circle1} />
            <div style={styles.circle2} />
            <div style={styles.circle3} />

            <div style={styles.brandMark}>
              <div style={styles.logoContainer}>
                <img
                  src={clikzLogo}
                  alt="clikz_logo"
                  style={styles.logoImg}
                />
              </div>
              <p style={styles.brandName}>CLIKZ</p>
              <p style={styles.brandSub}>Wedding Films</p>
            </div>

            <div style={styles.quote}>
              <div style={styles.quoteLine} />
              <p style={styles.quoteText}>
                "Every love story is beautiful,<br />but yours should be unforgettable."
              </p>
              <p style={styles.quoteAttr}>— CLIKZ Studios</p>
            </div>
          </div>
        )}

        {/* ── Right panel ── */}
        <div style={{
          ...styles.right,
          padding: isMobile ? '2.5rem 1.5rem 2rem' : '3rem 3.2rem',
        }}>
          {isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 20 }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 12,
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: 10,
              }}>
                <img
                  src={clikzLogo}
                  alt="clikz_logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <p style={{ fontSize: 18, fontWeight: 900, color: '#f97316', letterSpacing: '0.06em', margin: 0, textShadow: '0 2px 10px rgba(249, 115, 22, 0.1)' }}>CLIKZ</p>
              <p style={{ fontSize: 9.5, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>Wedding Films</p>
            </div>
          )}

          <div style={styles.loginHead}>
            <p style={styles.welcomeTag}>Welcome back</p>
            <h1 style={{ ...styles.h1, fontSize: isMobile ? 22 : 26 }}>Sign in to your account</h1>
            <p style={styles.subtitle}>Access your billing &amp; invoice dashboard</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Email */}
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="email">
                <Mail size={13} style={styles.labelIcon} />
                Email address
              </label>
              <div style={{
                ...styles.inputWrap,
                borderColor: focusedField === 'email' ? '#0d9488' : '#e2e8f0',
                boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(13,148,136,0.08)' : 'none',
              }}>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  required
                  style={styles.input}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label} htmlFor="password">
                  <Lock size={13} style={styles.labelIcon} />
                  Password
                </label>
                <a href="#" style={styles.forgotLink}>Forgot password?</a>
              </div>
              <div style={{
                ...styles.inputWrap,
                borderColor: focusedField === 'password' ? '#0d9488' : '#e2e8f0',
                boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(13,148,136,0.08)' : 'none',
              }}>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  required
                  style={{ ...styles.input, paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={styles.eyeBtn}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div style={styles.rememberRow}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" style={styles.checkbox} />
                <span style={styles.checkText}>Keep me signed in</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.btn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? <><Loader2 size={16} style={styles.spin} /> Signing in…</>
                : <><span>Sign in</span><ArrowRight size={16} /></>
              }
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f0fdfa 100%)',
    padding: '1.5rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  },
  card: {
    display: 'flex',
    width: '100%',
    maxWidth: 900,
    minHeight: 580,
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(15, 23, 42, 0.12), 0 8px 20px rgba(15, 23, 42, 0.06)',
    background: '#ffffff',
  },

  /* Left panel */
  left: {
    width: '44%',
    background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0d9488 180%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '2.5rem',
    position: 'relative',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute', top: -80, right: -80,
    width: 280, height: 280, borderRadius: '50%',
    border: '45px solid rgba(13, 148, 136, 0.08)',
    pointerEvents: 'none',
  },
  circle2: {
    position: 'absolute', bottom: -100, left: -60,
    width: 220, height: 220, borderRadius: '50%',
    border: '35px solid rgba(13, 148, 136, 0.05)',
    pointerEvents: 'none',
  },
  circle3: {
    position: 'absolute', top: '40%', left: -40,
    width: 120, height: 120, borderRadius: '50%',
    background: 'rgba(13, 148, 136, 0.06)',
    pointerEvents: 'none',
  },
  brandMark: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    zIndex: 1,
    marginTop: '1rem',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    padding: 12,
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'brightness(1.1)',
  },
  brandName: {
    fontSize: 22,
    fontWeight: 800,
    color: '#f8fafc',
    letterSpacing: '0.12em',
    margin: 0,
    marginTop: 4,
  },
  brandSub: {
    fontSize: 11,
    color: 'rgba(148,163,184,0.7)',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    margin: 0,
    fontWeight: 500,
  },
  quote: {
    position: 'relative',
    zIndex: 1,
    marginBottom: '1rem',
  },
  quoteLine: {
    width: 36,
    height: 3,
    background: 'linear-gradient(90deg, #0d9488, #14b8a6)',
    borderRadius: 2,
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 1.7,
    color: 'rgba(226,232,240,0.55)',
    fontStyle: 'italic',
    margin: 0,
    fontWeight: 400,
    letterSpacing: '0.01em',
  },
  quoteAttr: {
    marginTop: 14,
    fontSize: 11,
    color: 'rgba(148,163,184,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    margin: '14px 0 0',
    fontWeight: 500,
  },

  /* Right panel */
  right: {
    flex: 1,
    padding: '3rem 3.2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    background: '#ffffff',
  },
  loginHead: {
    marginBottom: '2rem',
  },
  welcomeTag: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0d9488',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    margin: '0 0 8px',
  },
  h1: {
    fontSize: 26,
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 8px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
    fontWeight: 400,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#334155',
    margin: 0,
    letterSpacing: '0.01em',
  },
  labelIcon: {
    color: '#94a3b8',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputWrap: {
    position: 'relative',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    background: '#f8fafc',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: 14,
    background: 'transparent',
    border: 'none',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    fontWeight: 400,
    letterSpacing: '0.01em',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 6,
    transition: 'background 0.15s ease',
  },

  rememberRow: {
    display: 'flex',
    alignItems: 'center',
    marginTop: -4,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    border: '1.5px solid #cbd5e1',
    accentColor: '#0d9488',
    cursor: 'pointer',
  },
  checkText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: 500,
  },

  forgotLink: {
    fontSize: 12,
    color: '#0d9488',
    textDecoration: 'none',
    fontWeight: 600,
    transition: 'color 0.15s ease',
  },

  btn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    letterSpacing: '0.01em',
    marginTop: 4,
    boxShadow: '0 4px 16px rgba(13, 148, 136, 0.25)',
    transition: 'all 0.2s ease',
  },
  spin: {
    animation: 'spin 0.8s linear infinite',
  },

  signupPrompt: {
    marginTop: '2rem',
    textAlign: 'center',
    fontSize: 13,
  },
  signupText: {
    color: '#64748b',
  },
  signupLink: {
    background: 'none',
    border: 'none',
    color: '#0d9488',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    fontSize: 13,
    transition: 'color 0.15s ease',
  },
};
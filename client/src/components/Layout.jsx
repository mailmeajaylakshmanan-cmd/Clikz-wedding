import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Settings, LogOut,
  Film, Bell, User, Plus, ChevronRight, Sparkles, Calendar, Briefcase,
  Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import clikzLogo from '../assets/clikz_logo.png';
import api from '../api/axios.js';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/invoices', label: 'Master Invoice', icon: FileText },
  // { to: '/dispatcher', label: 'Dispatcher', icon: Film },
  { to: '/master-event', label: 'Master Event', icon: Calendar },
  { to: '/master-service', label: 'Master Service', icon: Briefcase },
  { to: '/master-customer', label: 'Master Customer', icon: User },
  { to: '/master-crew', label: 'Crew Master', icon: User },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Mobile responsiveness states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobileMode = window.innerWidth < 768;
      setIsMobile(mobileMode);
      if (!mobileMode) {
        setIsMobileSidebarOpen(false);
      }
    };

    const handleScroll = () => setScrolled(window.scrollY > 10);

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const getPageTitle = () => {
    const item = navItems.find(i =>
      i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)
    );
    return item?.label || 'Dashboard';
  };

  return (
    <div style={styles.shell}>

      {/* ── Mobile Sidebar Backdrop Overlay ── */}
      {isMobile && isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          style={styles.mobileBackdrop}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        style={{
          ...styles.sidebar,
          width: isMobile ? (isMobileSidebarOpen ? 260 : 0) : (isSidebarCollapsed ? 72 : 260),
          transform: isMobile ? (isMobileSidebarOpen ? 'translateX(0)' : 'translateX(-260px)') : 'none',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            ...styles.logo,
            padding: isSidebarCollapsed && !isMobile ? '20px 0' : '20px 24px 16px',
            justifyContent: isSidebarCollapsed && !isMobile ? 'center' : 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                ...styles.logoBadge,
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src={clikzLogo}
                alt="Clikz Logo"
                style={{
                  width: '28px',
                  height: '28px',
                  objectFit: 'contain',
                }}
              />
            </div>

            {(!isSidebarCollapsed || isMobile) && (
              <div style={{ overflow: 'hidden', marginLeft: 4 }}>
                <p style={styles.logoNameHighlight}>CLIKZ</p>
                <p style={styles.logoSubHighlight}>WEDDING FILMS</p>
              </div>
            )}
          </div>

          {isMobile && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              style={styles.closeSidebarBtn}
              aria-label="Close menu"
            >
              <X size={18} color="#8a9aa0" />
            </button>
          )}
        </div>

        {/* Collapse Toggle (Desktop Only) */}
        {!isMobile && (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{
              ...styles.collapseBtn,
              transform: isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            aria-label="Toggle sidebar"
          >
            <ChevronRight size={14} color="#8a9aa0" />
          </button>
        )}

        {/* Navigation */}
        <nav style={styles.nav}>
          {(!isSidebarCollapsed || isMobile) && (
            <p style={styles.secLabel}>Main Menu</p>
          )}
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              collapsed={isSidebarCollapsed && !isMobile}
            />
          ))}
        </nav>

        {/* Footer Sign-Out block */}
        <div style={{
          ...styles.sbFooter,
          padding: isSidebarCollapsed && !isMobile ? '12px 0' : '12px 16px 16px',
        }}>
          <button
            onClick={handleLogout}
            style={{
              ...styles.logoutBtn,
              justifyContent: isSidebarCollapsed && !isMobile ? 'center' : 'flex-start',
              padding: isSidebarCollapsed && !isMobile ? '10px 0' : '10px 14px',
            }}
          >
            <LogOut size={16} color="#8a9aa0" strokeWidth={2} />
            {(!isSidebarCollapsed || isMobile) && (
              <span style={styles.logoutLabel}>Sign Out</span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main Content Container ── */}
      <div style={{
        ...styles.main,
        marginLeft: isMobile ? 0 : (isSidebarCollapsed ? 72 : 260),
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>

        {/* Topbar Header */}
        <header style={{
          ...styles.topbar,
          boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.04)' : '0 1px 3px rgba(0,0,0,0.02)',
          padding: isMobile ? '0 16px' : '0 28px',
        }}>
          <div style={styles.pageCrumb}>
            {isMobile && (
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                style={styles.hamburgerBtn}
                aria-label="Toggle Menu"
              >
                <Menu size={20} color="#0f172a" />
              </button>
            )}
            {!isMobile && (
              <div style={styles.crumbIcon}>
                <LayoutDashboard size={16} color="#0d9488" strokeWidth={2.5} />
              </div>
            )}
            <div>
              <span style={styles.pageTitle}>{getPageTitle()}</span>
              {!isMobile && <span style={styles.pageSubtitle}>Welcome back, Admin</span>}
            </div>
          </div>

          <div style={styles.topbarRight}>
            <button style={styles.tbBtn} aria-label="Notifications">
              <Bell size={16} color="#64748b" strokeWidth={2} />
              <span style={styles.notificationDot} />
            </button>
            <button style={styles.tbBtn} aria-label="Account">
              <User size={16} color="#64748b" strokeWidth={2} />
            </button>
          </div>
        </header>

        {/* Content Outlet & Footer */}
        <div style={{
          ...styles.content,
          padding: isMobile ? '20px 16px' : '28px 32px',
        }}>
          <div style={{ flex: 1 }}>
            <Outlet />
          </div>

          {/* Footer */}
          <footer style={styles.footer}>
            <p style={styles.footerTitle}>CLIKZ WEDDING FILMS</p>

            <div style={styles.footerSocials}>
              <a
                href="https://instagram.com/clikz_.photography"
                target="_blank"
                rel="noreferrer"
                style={styles.footerIconLink}
                title="Instagram"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              <a
                href="https://youtube.com/@CLIKZ_FILMS"
                target="_blank"
                rel="noreferrer"
                style={styles.footerIconLink}
                title="YouTube"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.6 15.5V8.5L15.8 12z" />
                </svg>
              </a>

              <a
                href="https://facebook.com/ClikzFilms"
                target="_blank"
                rel="noreferrer"
                style={styles.footerIconLink}
                title="Facebook"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
                </svg>
              </a>
            </div>

            <p style={styles.footerCopy}>
              © {new Date().getFullYear()} CLIKZ Wedding Films
            </p>
          </footer>
        </div>

      </div>
    </div>
  );
}

function NavItem({ item, collapsed }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      {({ isActive }) => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : 12,
          padding: collapsed ? '12px 0' : '11px 16px',
          margin: '0 12px 4px',
          borderRadius: 10,
          background: isActive ? 'rgba(13, 148, 136, 0.12)' : 'transparent',
          border: isActive ? '1px solid rgba(13, 148, 136, 0.15)' : '1px solid transparent',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease',
        }}>
          {isActive && (
            <div style={{
              position: 'absolute',
              left: -12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 3,
              height: 20,
              background: '#0d9488',
              borderRadius: '0 4px 4px 0',
            }} />
          )}
          <Icon
            size={18}
            color={isActive ? '#0d9488' : '#8a9aa0'}
            strokeWidth={isActive ? 2.5 : 2}
            style={{
              flexShrink: 0,
              transition: 'color 0.2s ease',
            }}
          />
          {!collapsed && (
            <span style={{
              fontSize: 13.5,
              color: isActive ? '#0d9488' : '#8a9aa0',
              fontWeight: isActive ? 600 : 500,
              letterSpacing: '-0.01em',
              transition: 'color 0.2s ease',
              whiteSpace: 'nowrap',
            }}>
              {item.label}
            </span>
          )}
          {isActive && !collapsed && (
            <div style={{
              marginLeft: 'auto',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#0d9488',
              flexShrink: 0,
            }} />
          )}
        </div>
      )}
    </NavLink>
  );
}

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f4f6f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowX: 'hidden',
  },

  sidebar: {
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 50,
    borderRight: '1px solid rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    transition: 'padding 0.3s ease',
  },

  logoBadge: {
    width: 36,
    height: 36,
    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
  },

  logoNameHighlight: {
    fontSize: 14,
    fontWeight: 900,
    color: '#f97316',
    letterSpacing: '0.06em',
    margin: 0,
    lineHeight: 1.25,
    textShadow: '0 2px 10px rgba(249, 115, 22, 0.2)',
  },

  logoSubHighlight: {
    fontSize: 10.5,
    fontWeight: 800,
    color: '#f1f5f9',
    letterSpacing: '0.12em',
    margin: 0,
    marginTop: 1,
    lineHeight: 1.2,
  },

  closeSidebarBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderRadius: 8,
  },

  collapseBtn: {
    position: 'absolute',
    right: -10,
    top: 68,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#1e293b',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 60,
    transition: 'transform 0.3s ease, background 0.2s ease',
    padding: 0,
  },

  nav: {
    flex: 1,
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflowY: 'auto',
    overflowX: 'hidden',
  },

  secLabel: {
    fontSize: 10,
    color: '#475569',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '8px 24px 6px',
    margin: 0,
    fontWeight: 600,
  },

  sbFooter: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    transition: 'padding 0.3s ease',
  },

  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    transition: 'background 0.2s ease',
    color: '#8a9aa0',
  },

  logoutLabel: {
    fontSize: 13,
    color: '#8a9aa0',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },

  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflowX: 'hidden',
  },

  topbar: {
    background: 'rgba(248, 250, 252, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    transition: 'box-shadow 0.3s ease',
  },

  pageCrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  hamburgerBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderRadius: 8,
  },

  crumbIcon: {
    width: 36,
    height: 36,
    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(13, 148, 136, 0.08)',
  },

  pageTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
    display: 'block',
    letterSpacing: '-0.01em',
  },

  pageSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    display: 'block',
    marginTop: 2,
    fontWeight: 500,
  },

  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  tbBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: '1px solid rgba(226, 232, 240, 0.8)',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },

  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#0d9488',
    border: '2px solid #fff',
  },

  content: {
    flex: 1,
    maxWidth: 1400,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    width: '100%',
  },

  mobileBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    zIndex: 45,
  },

  // ── Footer (light theme, evenly aligned 3-section row) ──
  footer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: 24,
    padding: '16px 28px',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
  },

  footerTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '0.4px',
  },

  footerSocials: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  footerIconLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    color: '#64748b',
    textDecoration: 'none',
    transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
  },

  footerCopy: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0,
    whiteSpace: 'nowrap',
  },
};
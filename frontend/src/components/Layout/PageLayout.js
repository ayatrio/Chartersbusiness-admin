import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import { 
  RiArrowDownSLine, 
  RiPhoneLine, 
  RiBookOpenLine, 
  RiShieldUserLine, 
  RiCalendarLine, 
  RiLogoutBoxLine,
  RiArrowLeftLine
} from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PageLayout({ children, title, subtitle, actions, fullWidth = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const role = String(user?.role || '').toLowerCase();
  const homeRoute = (role === 'admin' || role === 'recruiter') ? '/admin' : (role === 'user' ? '/dashboard-overview' : '/home');

  const PROFILE_PATHS = [
    '/dashboard',
    '/linkedin',
    '/github',
    '/youtube',
    '/website',
    '/credentials',
    '/networking',
    '/ai-tools',
    '/ai-interview'
  ];

  const isProfileWorkspace = PROFILE_PATHS.some((path) => 
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <div className="page-layout" style={{ flexDirection: 'row' }}>
      <Sidebar />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100vh' }}>
        <header className="page-layout__header">
          <div className="page-layout__header-inner" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '8px',
                transition: 'all 0.18s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'var(--accent)';
                e.currentTarget.style.background = 'var(--accent-dim)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <RiArrowLeftLine size={18} />
              <span>Back</span>
            </button>

            <div className="page-layout__header-actions">
              {(role === 'admin' || role === 'recruiter') && (
                <button
                  onClick={() => navigate('/admin')}
                  className="page-layout__header-button page-layout__header-button--accent"
                >
                  Admin
                </button>
              )}

              {isProfileWorkspace && (
                <button
                  onClick={() => navigate(homeRoute)}
                  className="page-layout__header-button"
                >
                  {(role === 'admin' || role === 'recruiter') ? 'Admin Home' : 'Dashboard'}
                </button>
              )}

              {location.pathname === '/home' && (
                <button
                  onClick={() => navigate('/dashboard-overview')}
                  className="page-layout__header-button"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RiArrowLeftLine />
                  Back to Status
                </button>
              )}

              <div className="relative" ref={dropdownRef} style={{ position: 'relative' }}>
                <div 
                  className="page-layout__user-card"
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div className="page-layout__avatar">
                    {user?.firstName?.[0]?.toUpperCase() || 'U'}
                  </div>

                  <div className="page-layout__user-copy">
                    <div className="page-layout__user-name">
                      {user?.firstName} {user?.lastName}
                    </div>

                    <div className="page-layout__user-email">
                      {user?.email}
                    </div>
                  </div>

                  <RiArrowDownSLine 
                    className="page-layout__caret" 
                    style={{ 
                      transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </div>

                {showDropdown && (
                  <div 
                    className="glass fade-up"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: '320px',
                      background: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      boxShadow: '0 12px 30px rgba(22, 37, 61, 0.12)',
                      zIndex: 99999,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Dropdown Header */}
                    <div style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, var(--surface-tint) 0%, #fff 100%)',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: 'linear-gradient(180deg, var(--accent-light), var(--accent))',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: '800',
                        boxShadow: '0 4px 12px rgba(177, 7, 56, 0.2)',
                        border: '2px solid #fff',
                        flexShrink: 0
                      }}>
                        {getInitials(user?.firstName, user?.lastName)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '800',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px'
                        }}>
                          {user?.email}
                        </div>
                      </div>
                    </div>

                    {/* Dropdown Content */}
                    <div style={{
                      padding: '16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}>
                      {/* Account Role Badge */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--surface-tint)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Status</span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: 'var(--green)',
                          background: 'var(--green-dim)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase'
                        }}>
                          Active {user?.role || 'User'}
                        </span>
                      </div>

                      {/* Details list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <DropdownInfoItem 
                          icon={RiPhoneLine} 
                          label="Phone Number" 
                          value={user?.phone || 'Not provided'} 
                        />
                        {role !== 'admin' && role !== 'recruiter' && (
                          <DropdownInfoItem 
                            icon={RiBookOpenLine} 
                            label="Interested Course" 
                            value={user?.selectedCourse || 'None selected'} 
                          />
                        )}
                        <DropdownInfoItem 
                          icon={RiShieldUserLine} 
                          label="Member ID" 
                          value={user?.chartersUserId || user?._id || 'N/A'} 
                        />
                        <DropdownInfoItem 
                          icon={RiCalendarLine} 
                          label="Registered On" 
                          value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'} 
                        />
                      </div>
                    </div>

                    {/* Dropdown Footer Action */}
                    <div style={{
                      borderTop: '1px solid var(--border)',
                      padding: '12px 20px',
                      background: 'var(--surface-tint)',
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                          navigate('/login');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: 'none',
                          background: 'none',
                          color: 'var(--red)',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--red-dim)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <RiLogoutBoxLine size={16} />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className={fullWidth ? 'page-layout__main page-layout__main--full-width' : 'page-layout__main'}>
          <div className={fullWidth ? 'page-layout__content page-layout__content--full-width' : 'page-layout__content'}>
            {title && (
              <div className="page-layout__page-header">
                <div>
                  <h1 className="page-layout__page-title">{title}</h1>

                  {subtitle && (
                    <p className="page-layout__page-subtitle">{subtitle}</p>
                  )}
                </div>

                {actions && <div className="page-layout__page-actions">{actions}</div>}
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function DropdownInfoItem({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'start', gap: '10px', padding: '4px 0' }}>
      <Icon size={16} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

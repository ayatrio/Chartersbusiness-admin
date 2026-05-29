import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandMark from '../Common/BrandMark';
import {
  RiDashboardLine, RiLinkedinBoxLine, RiGithubLine,
  RiGlobalLine, RiAwardLine, RiGroupLine, RiYoutubeLine,
  RiRobotLine, RiMenuFoldLine,
  RiMenuUnfoldLine, RiUser3Line, RiSettings3Line,
  RiBriefcaseLine, RiBookOpenLine, RiLock2Line,
  RiChatVoiceLine, RiFileLine
} from 'react-icons/ri';

const PROFILE_NAV_ITEMS = [
  { to: '/home', icon: RiUser3Line, label: 'Enrolled Students' },
  { to: '/linkedin', icon: RiLinkedinBoxLine, label: 'LinkedIn' },
  { to: '/github', icon: RiGithubLine, label: 'GitHub' },
  { to: '/youtube', icon: RiYoutubeLine, label: 'YouTube' },
  { to: '/website', icon: RiGlobalLine, label: 'Website' },
  { to: '/credentials', icon: RiAwardLine, label: 'Credentials' },
  { to: '/networking', icon: RiGroupLine, label: 'Networking' },
  { to: '/ai-tools', icon: RiRobotLine, label: 'AI Tools' }
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin', icon: RiSettings3Line, label: 'Users & Permissions' },
  { to: '/admin/dashboard', icon: RiDashboardLine, label: 'Admin Dashboard' },
  { to: '/admin/jobs', icon: RiBriefcaseLine, label: 'Jobs' },
  { to: '/admin/internships', icon: RiBookOpenLine, label: 'Internships' }
];

const PROFILE_PATHS = [
  '/home',
  '/linkedin',
  '/github',
  '/youtube',
  '/website',
  '/credentials',
  '/networking',
  '/ai-tools',
  '/ai-interview'
];

export default function Sidebar() {
  const { user, logout, applications } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showLockedFeatures, setShowLockedFeatures] = useState(false);
  const pathname = location.pathname || '';
  const role = String(user?.role || '').toLowerCase();

  const hasAiInterviewAccess = (
    role === 'admin'
    || role === 'recruiter'
    || Object.values(user?.permissions?.aiInterview || {}).some(Boolean)
  );

  const isApproved = (applications || []).some((app) => app.status === 'approved');
  const isEnrolled = isApproved || role === 'enrolled_student' || role === 'candidate';
  const isAdminPath = pathname.startsWith('/admin');
  const isProfileWorkspace = PROFILE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  const mode = isAdminPath ? 'admin' : isProfileWorkspace ? 'profile' : 'home';

  let homeNavItems = [];
  if (isEnrolled) {
    homeNavItems = [
      { to: '/home', icon: RiUser3Line, label: 'Enrolled Students' },
      { to: '/application-status', icon: RiDashboardLine, label: 'Status' },
      { to: '/counseling', icon: RiChatVoiceLine, label: 'Counseling' }
    ];
  } else {
    homeNavItems = [
      { to: '/apply-form', icon: RiFileLine, label: 'Apply Form' },
      { to: '/counseling', icon: RiChatVoiceLine, label: 'Counseling' },
      { 
        icon: RiUser3Line, 
        label: 'Enrolled Students', 
        onClick: () => setShowLockedFeatures(!showLockedFeatures),
        isExpandable: true,
        isOpen: showLockedFeatures
      }
    ];

    if (showLockedFeatures) {
      homeNavItems.push(
        { icon: RiLinkedinBoxLine, label: 'LinkedIn', disabled: true, note: 'Admin approval required', isSubItem: true },
        { icon: RiGithubLine, label: 'GitHub', disabled: true, note: 'Admin approval required', isSubItem: true },
        { icon: RiYoutubeLine, label: 'YouTube', disabled: true, note: 'Admin approval required', isSubItem: true },
        { icon: RiGlobalLine, label: 'Website', disabled: true, note: 'Admin approval required', isSubItem: true },
        { icon: RiAwardLine, label: 'Credentials', disabled: true, note: 'Admin approval required', isSubItem: true },
        { icon: RiGroupLine, label: 'Networking', disabled: true, note: 'Admin approval required', isSubItem: true },
        { icon: RiRobotLine, label: 'AI Tools', disabled: true, note: 'Admin approval required', isSubItem: true },
        { icon: RiRobotLine, label: 'AI Interview', disabled: true, note: 'Admin approval required', isSubItem: true }
      );
    }
  }

  const profileNavItems = [
    ...PROFILE_NAV_ITEMS,
    ...(hasAiInterviewAccess
      ? [{ to: '/ai-interview', icon: RiRobotLine, label: 'AI Interview' }]
      : [{ icon: RiRobotLine, label: 'AI Interview', disabled: true, note: 'Access required' }])
  ];

  const navItems = mode === 'profile'
    ? profileNavItems
    : mode === 'admin'
      ? ADMIN_NAV_ITEMS
      : homeNavItems;

  const headerCopy = mode === 'profile'
    ? { title: 'Navigation', subtitle: 'Explore your branding profile' }
    : mode === 'admin'
      ? { title: 'Admin', subtitle: 'Manage platform modules' }
      : { title: 'Quick Access', subtitle: 'Account and core modules' };

  const sidebarClassName = collapsed ? 'sidebar sidebar--collapsed' : 'sidebar';
  const getItemClassName = ({ isActive, disabled }) => [
    'sidebar__nav-item',
    isActive && 'is-active',
    disabled && 'is-disabled'
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClassName}>
      <div className="sidebar__brand-wrapper" style={{
        padding: collapsed ? '16px 8px' : '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid var(--border)',
        height: '71px',
        boxSizing: 'border-box'
      }}>
        <div 
          onClick={() => { window.location.href = process.env.REACT_APP_MAIN_APP_URL || 'http://localhost:3000'; }}
          style={{ cursor: 'pointer' }}
        >
          <BrandMark compact={collapsed} />
        </div>
      </div>

      <div className="sidebar__header">
        {!collapsed && (
          <div className="sidebar__intro">
            <div className="sidebar__eyebrow">{headerCopy.title}</div>
            <div className="sidebar__subtitle">{headerCopy.subtitle}</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar__toggle"
        >
          {collapsed ? <RiMenuUnfoldLine /> : <RiMenuFoldLine />}
        </button>
      </div>

      <nav className="sidebar__nav">
        {navItems.map(({ to, icon: Icon, label, disabled, note, onClick, isExpandable, isOpen, isSubItem }) => {
          const itemStyle = isSubItem 
            ? { paddingLeft: collapsed ? '12px' : '36px', opacity: 0.7 } 
            : {};

          if (onClick) {
            return (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={getItemClassName({ isActive: false, disabled: false })}
                style={{ cursor: 'pointer', width: 'calc(100% - 24px)', ...itemStyle }}
              >
                <Icon className="sidebar__icon" />
                {!collapsed && (
                  <span className="sidebar__label-group" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{label}</span>
                    {isExpandable && (
                      <span style={{ fontSize: '11px', opacity: 0.7 }}>
                        {isOpen ? '▼' : '▶'}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          }

          if (disabled || !to) {
            return (
              <button
                key={label}
                type="button"
                disabled
                className={getItemClassName({ isActive: false, disabled: true })}
                title={collapsed ? `${label}${note ? ` (${note})` : ''}` : undefined}
                style={itemStyle}
              >
                <Icon className="sidebar__icon" />
                {!collapsed && (
                  <span className="sidebar__label-group">
                    <span>{label}</span>
                    {note && (
                      <small className="sidebar__nav-note">
                        <RiLock2Line className="sidebar__lock-icon" />
                        {note}
                      </small>
                    )}
                  </span>
                )}
              </button>
            );
          }

          // Since NavLink isActive matches exactly or starts with, let's treat Enrolled Student (/home) carefully
          // so it doesn't stay active on every other profile path like /linkedin, unless pathname is exactly /home.
          const isNavItemActive = to === '/home' ? pathname === '/home' : pathname === to || pathname.startsWith(`${to}/`);

          return (
            <NavLink
              key={to}
              to={to}
              className={getItemClassName({ isActive: isNavItemActive, disabled: false })}
              title={collapsed ? label : undefined}
              style={itemStyle}
            >
              <Icon className="sidebar__icon" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

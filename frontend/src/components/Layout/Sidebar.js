import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  RiDashboardLine, RiLinkedinBoxLine, RiGithubLine,
  RiGlobalLine, RiAwardLine, RiGroupLine, RiYoutubeLine,
  RiRobotLine, RiLogoutBoxLine, RiMenuFoldLine,
  RiMenuUnfoldLine, RiUser3Line, RiSettings3Line,
  RiBriefcaseLine, RiBookOpenLine, RiLock2Line,
  RiChatVoiceLine
} from 'react-icons/ri';

const PROFILE_NAV_ITEMS = [
  { to: '/dashboard', icon: RiDashboardLine, label: 'Dashboard' },
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
  '/dashboard',
  '/linkedin',
  '/github',
  '/youtube',
  '/website',
  '/credentials',
  '/networking',
  '/ai-tools'
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = location.pathname || '';
  const hasAiInterviewAccess = (
    user?.role === 'admin'
    || user?.role === 'recruiter'
    || Object.values(user?.permissions?.aiInterview || {}).some(Boolean)
  );

  const isCandidate = user?.role === 'candidate' || user?.role === 'admin';

  let homeNavItems = [];

  if (isCandidate) {
    homeNavItems = [
      { to: '/home', icon: RiUser3Line, label: 'Account' },
      { to: '/dashboard', icon: RiDashboardLine, label: 'Profile Dashboard' },
      { to: '/dashboard-overview', icon: RiDashboardLine, label: 'Status' },
      { to: '/counseling', icon: RiChatVoiceLine, label: 'Counseling' },
      { to: '/profile', icon: RiUser3Line, label: 'User Info' },
      ...(hasAiInterviewAccess
        ? [{ to: '/ai-interview', icon: RiRobotLine, label: 'AI Interview' }]
        : [{ icon: RiRobotLine, label: 'AI Interview', disabled: true, note: 'Access required' }])
    ];
  } else {
    homeNavItems = [
      { to: '/dashboard-overview', icon: RiDashboardLine, label: 'Dashboard' },
      { to: '/counseling', icon: RiChatVoiceLine, label: 'Counseling' },
      { to: '/profile', icon: RiUser3Line, label: 'Profile' }
    ];
  }

  const isHome = pathname === '/home';
  const isProfileWorkspace = PROFILE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAdmin = user?.role === 'admin' || pathname.startsWith('/admin');

  const mode = isHome ? 'home' : isProfileWorkspace ? 'profile' : isAdmin ? 'admin' : 'home';

  const navItems = mode === 'profile'
    ? PROFILE_NAV_ITEMS
    : mode === 'admin'
      ? ADMIN_NAV_ITEMS
      : homeNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        {navItems.map(({ to, icon: Icon, label, disabled, note }) => {
          if (disabled || !to) {
            return (
              <button
                key={label}
                type="button"
                disabled
                className={getItemClassName({ isActive: false, disabled: true })}
                title={collapsed ? `${label}${note ? ` (${note})` : ''}` : undefined}
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

          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => getItemClassName({ isActive, disabled: false })}
              title={collapsed ? label : undefined}
            >
              <Icon className="sidebar__icon" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <button
          onClick={handleLogout}
          className="sidebar__logout"
          title={collapsed ? 'Logout' : undefined}
        >
          <RiLogoutBoxLine className="sidebar__icon" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

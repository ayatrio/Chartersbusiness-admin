import React from 'react';
import Sidebar from './Sidebar';
import { RiArrowDownSLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import BrandMark from '../Common/BrandMark';

export default function PageLayout({ children, title, subtitle, actions, fullWidth = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const homeRoute = user?.role === 'admin' ? '/admin' : (user?.role === 'user' ? '/dashboard-overview' : '/home');

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

  const isProfileWorkspace = PROFILE_PATHS.some((path) => 
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  return (
    <div className="page-layout">
      <header className="page-layout__header">
        <div className="page-layout__header-inner">
          <div className="page-layout__brand" onClick={() => navigate(homeRoute)}>
            <BrandMark compact />
          </div>

          <div className="page-layout__header-actions">
            {user?.role === 'admin' && (
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
                {user?.role === 'admin' ? 'Admin Home' : 'Dashboard'}
              </button>
            )}

            <div className="page-layout__user-card">
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

              <RiArrowDownSLine className="page-layout__caret" />
            </div>
          </div>
        </div>
      </header>

      <div className="page-layout__body">
        <Sidebar />

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

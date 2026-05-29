import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import PageLayout from './PageLayout';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const mockRedirect = () => {
  window.location.href = process.env.REACT_APP_MAIN_APP_URL || 'http://localhost:3000';
};

jest.mock('./Sidebar', () => function SidebarMock() {
  return (
    <div data-testid="sidebar">
      <div 
        data-testid="brand-mark" 
        onClick={mockRedirect}
      >
        Brand
      </div>
    </div>
  );
});

jest.mock('../Common/BrandMark', () => function BrandMarkMock() {
  return <div data-testid="brand-mark">Brand</div>;
});

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

describe('PageLayout', () => {
  const navigate = jest.fn();
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({
      user: {
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@chartersbusiness.com',
      },
      logout: jest.fn(),
    });
  });

  afterEach(() => {
    root.unmount();
    container.remove();
    jest.clearAllMocks();
  });

  it('renders title, actions, and admin home controls in the profile workspace', () => {
    useLocation.mockReturnValue({ pathname: '/dashboard' });

    flushSync(() => {
      root.render(
        <PageLayout
          title="Workspace"
          subtitle="Create and manage content"
          actions={<button type="button">Create</button>}
        >
          <div>Body content</div>
        </PageLayout>
      );
    });

    expect(container.textContent).toContain('Workspace');
    expect(container.textContent).toContain('Create and manage content');
    expect(container.textContent).toContain('Body content');
    expect(container.textContent).toContain('Admin User');

    const buttonLabels = Array.from(container.querySelectorAll('button'), (button) => button.textContent);
    expect(buttonLabels).toEqual(expect.arrayContaining(['Create', 'Admin', 'Admin Home']));
  });

  it('redirects to the home screen when the brand mark is clicked', () => {
    useLocation.mockReturnValue({ pathname: '/admin/jobs' });

    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };

    flushSync(() => {
      root.render(
        <PageLayout title="Jobs">
          <div>Jobs body</div>
        </PageLayout>
      );
    });

    const brandMark = container.querySelector('[data-testid="brand-mark"]');
    expect(brandMark).not.toBeNull();

    brandMark.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(window.location.href).toBe('http://localhost:3000');

    window.location = originalLocation;
  });
});
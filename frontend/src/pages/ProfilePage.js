import React from 'react';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../components/Layout/PageLayout';
import Card from '../components/Common/Card';
import { RiUser3Line, RiMailLine, RiShieldUserLine, RiCalendarLine } from 'react-icons/ri';

export default function ProfilePage() {
  const { user } = useAuth();

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <PageLayout
      title="My Profile"
      subtitle="View and manage your personal details and account settings."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Profile Header Card */}
        <Card
          padding="14px"
          style={{ background: 'linear-gradient(135deg, #fff 0%, var(--surface-tint) 100%)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>

            <div style={{
              width: 80,   // reduced from 100
              height: 80,  // reduced from 100
              borderRadius: '50%',
              background: 'linear-gradient(180deg, var(--accent-light), var(--accent))',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28, // slightly smaller text
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(177, 7, 56, 0.2)',
              border: '3px solid #fff'
            }}>
              {getInitials(user?.firstName, user?.lastName)}
            </div>

            <div style={{ flex: 1, minWidth: 180 }}>
              <h1 style={{
                fontSize: 26,   // reduced from 32
                fontWeight: 800,
                marginBottom: 4, // reduced spacing
                color: 'var(--text-primary)'
              }}>
                {user?.firstName} {user?.lastName}
              </h1>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--text-secondary)',
                fontSize: 14 // slightly smaller
              }}>
                <RiMailLine size={16} />
                {user?.email}
              </div>
            </div>

            <div style={{
              padding: '6px 12px', // reduced padding
              borderRadius: 10,
              background: 'var(--green-dim)',
              color: 'var(--green)',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
              Active Account
            </div>

          </div>
        </Card>

        {/* Account Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <Card accent="var(--accent)">
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <RiUser3Line style={{ color: 'var(--accent)' }} />
              Personal Information
            </h3>

            <ProfileInfoItem label="Full Name" value={`${user?.firstName} ${user?.lastName}`} />
            <ProfileInfoItem label="Phone Number" value={user?.phone || 'Not provided'} />
            <ProfileInfoItem label="Interested Course" value={user?.selectedCourse || 'None selected'} />
          </Card>

          <Card accent="var(--navy)">
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <RiShieldUserLine style={{ color: 'var(--navy)' }} />
              Account Security
            </h3>

            <ProfileInfoItem label="Account Type" value={user?.role?.toUpperCase() || 'USER'} />
            <ProfileInfoItem label="Member ID" value={user?.chartersUserId || user?._id || 'N/A'} />
            <ProfileInfoItem label="Last Login" value={user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Just now'} />
          </Card>
        </div>

        {/* Recent Activity / Stats Placeholder or Footer Info */}
        <Card style={{ textAlign: 'center', padding: '30px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <RiCalendarLine />
            Registered on {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </div>
        </Card>

      </div>
    </PageLayout>
  );
}

function ProfileInfoItem({ label, value }) {
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', lastChild: { borderBottom: 'none' } }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

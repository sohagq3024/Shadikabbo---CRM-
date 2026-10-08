import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { CrmLayout, SidebarPage } from './components/CrmLayout';
import { TrafficPage } from './components/TrafficPage';
import { PaidTrafficPage } from './components/PaidTrafficPage';
import { PaymentPage } from './components/PaymentPage';
import { LeadPage } from './components/LeadPage';
import { TrashBinPage } from './components/TrashBinPage';
import { SettingsPage } from './components/SettingsPage';
import { EmptyPage } from './components/EmptyPage';
import { AttendanceAdminPage } from './components/AttendanceAdminPage';
import { StaffAttendancePage } from './components/StaffAttendancePage';
import { StaffScannerView } from './components/StaffScannerView';
import { AccountPage } from './components/AccountPage';
import { MatchmakingPage } from './components/MatchmakingPage';
import { DashboardPage } from './components/DashboardPage';
import { CrmFieldsProvider } from './context/CrmFieldsContext';

export default function App() {
  // Persistent 1-time login support: check localStorage first, fallback to sessionStorage
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('shadikabbo_token') || sessionStorage.getItem('shadikabbo_token');
  });
  const [user, setUser] = useState<any | null>(() => {
    const cached = localStorage.getItem('shadikabbo_user') || sessionStorage.getItem('shadikabbo_user');
    return cached ? JSON.parse(cached) : null;
  });

  const [activePage, setActivePage] = useState<SidebarPage>('Dashboard');
  const [isInitializing, setIsInitializing] = useState(true);

  // Staff view mode: by default, all accounts directly open the CRM web app
  const [staffViewMode, setStaffViewMode] = useState<'scanner' | 'crm'>('crm');
  // Admin scanner view toggle
  const [showAdminScanner, setShowAdminScanner] = useState(false);

  // Validate active session token on launch
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('shadikabbo_token') || sessionStorage.getItem('shadikabbo_token');
      if (!savedToken) {
        setIsInitializing(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setToken(savedToken);
          // Keep both localStorage & sessionStorage in sync
          localStorage.setItem('shadikabbo_token', savedToken);
          localStorage.setItem('shadikabbo_user', JSON.stringify(data.user));
          sessionStorage.setItem('shadikabbo_token', savedToken);
          sessionStorage.setItem('shadikabbo_user', JSON.stringify(data.user));
        } else {
          // Token expired or invalid
          localStorage.removeItem('shadikabbo_token');
          localStorage.removeItem('shadikabbo_user');
          sessionStorage.removeItem('shadikabbo_token');
          sessionStorage.removeItem('shadikabbo_user');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Session check failed', err);
      } finally {
        setIsInitializing(false);
      }
    };

    verifySession();
  }, []);

  const handleLoginSuccess = (authenticatedUser: any, sessionToken: string) => {
    setUser(authenticatedUser);
    setToken(sessionToken);
    localStorage.setItem('shadikabbo_token', sessionToken);
    localStorage.setItem('shadikabbo_user', JSON.stringify(authenticatedUser));
    sessionStorage.setItem('shadikabbo_token', sessionToken);
    sessionStorage.setItem('shadikabbo_user', JSON.stringify(authenticatedUser));
    
    // Direct all users (CRO, MK, Super Admin) directly to CRM web app on login
    setStaffViewMode('crm');
    setActivePage('Dashboard');
  };

  const handleUpdateCurrentUser = (updatedUser: any) => {
    setUser(updatedUser);
    if (localStorage.getItem('shadikabbo_token')) {
      localStorage.setItem('shadikabbo_user', JSON.stringify(updatedUser));
    }
    if (sessionStorage.getItem('shadikabbo_token')) {
      sessionStorage.setItem('shadikabbo_user', JSON.stringify(updatedUser));
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('shadikabbo_token');
    localStorage.removeItem('shadikabbo_user');
    sessionStorage.removeItem('shadikabbo_token');
    sessionStorage.removeItem('shadikabbo_user');
    setUser(null);
    setToken(null);
    setShowAdminScanner(false);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#181E54] border-t-[#D81124] rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated -> Show Login Page
  if (!user || !token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isStaff = user.role === 'MK' || user.role === 'CRO';

  // Requirement 2: Staff opening the app directly see the Daily Attendance QR Scanner
  // "App open korlei staff-der samne shorasori ekta QR Scanner chalu hobe. Onno kono menu ba option tader samne thakbe na."
  if (isStaff && staffViewMode === 'scanner') {
    return (
      <StaffScannerView
        user={user}
        token={token}
        onLogout={handleLogout}
        onSwitchToCrm={() => setStaffViewMode('crm')}
      />
    );
  }

  // Admin testing the scanner
  if (showAdminScanner) {
    return (
      <StaffScannerView
        user={user}
        token={token}
        onLogout={handleLogout}
        onSwitchToCrm={() => setShowAdminScanner(false)}
      />
    );
  }

  // Authenticated CRM Layout (Super Admin or Staff in CRM mode)
  return (
    <CrmFieldsProvider token={token}>
      <CrmLayout
        user={user}
        activePage={activePage}
        onSelectPage={(page) => setActivePage(page)}
        onLogout={handleLogout}
        onOpenScanner={isStaff ? () => setStaffViewMode('scanner') : () => setShowAdminScanner(true)}
      >
        {/* Attendance section (Admin full view vs Staff personal view) */}
        {activePage === 'Attendance' && (
          user.role === 'Super Admin' ? (
            <AttendanceAdminPage
              token={token}
              onOpenScanner={() => setShowAdminScanner(true)}
            />
          ) : (
            <StaffAttendancePage
              user={user}
              token={token}
              onOpenScanner={() => setStaffViewMode('scanner')}
            />
          )
        )}

        {/* Dashboard Overview */}
        {activePage === 'Dashboard' && (
          <DashboardPage
            user={user}
            token={token}
            onSelectPage={(page) => setActivePage(page)}
            onOpenScanner={isStaff ? () => setStaffViewMode('scanner') : () => setShowAdminScanner(true)}
          />
        )}

        {/* Existing Matrimonial CRM Pages */}
        {activePage === 'Traffic' && <TrafficPage token={token} user={user} />}
        {activePage === 'Paid Traffic' && <PaidTrafficPage token={token} user={user} />}
        {activePage === 'Payment' && <PaymentPage token={token} user={user} />}
        {activePage === 'Lead' && <LeadPage token={token} user={user} />}
        {activePage === 'Matchmaking' && <MatchmakingPage user={user} token={token} />}
        {activePage === 'Account' && (
          <AccountPage
            user={user}
            token={token}
            onUpdateCurrentUser={handleUpdateCurrentUser}
          />
        )}

        {/* Super Admin specific sections */}
        {activePage === 'Trush bin' && <TrashBinPage token={token} />}
        {activePage === 'Settings' && <SettingsPage token={token} />}
        {activePage === 'Tracking' && <EmptyPage title="Tracking" />}
      </CrmLayout>
    </CrmFieldsProvider>
  );
}

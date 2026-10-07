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
import { StaffScannerView } from './components/StaffScannerView';
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

  const [activePage, setActivePage] = useState<SidebarPage>('Attendance');
  const [isInitializing, setIsInitializing] = useState(true);

  // Staff view mode: by default, MK and CRO staff directly see the Daily Attendance Scanner
  const [staffViewMode, setStaffViewMode] = useState<'scanner' | 'crm'>('scanner');
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
    
    // For staff MK and CRO, direct them to scanner on login
    setStaffViewMode('scanner');
    setActivePage(authenticatedUser?.role === 'Super Admin' ? 'Attendance' : 'Traffic');
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
        onOpenScanner={isStaff ? () => setStaffViewMode('scanner') : undefined}
      >
        {/* Requirement 3, 4, 5: Attendance section for Admin */}
        {activePage === 'Attendance' && (
          <AttendanceAdminPage
            token={token}
            onOpenScanner={() => setShowAdminScanner(true)}
          />
        )}
        {activePage === 'Dashboard' && <EmptyPage title="Dashboard" />}

        {/* Existing Matrimonial CRM Pages */}
        {activePage === 'Traffic' && <TrafficPage token={token} />}
        {activePage === 'Paid Traffic' && <PaidTrafficPage token={token} />}
        {activePage === 'Payment' && <PaymentPage token={token} />}
        {activePage === 'Lead' && <LeadPage token={token} />}
        {activePage === 'Trush bin' && <TrashBinPage token={token} />}
        {activePage === 'Settings' && <SettingsPage token={token} />}
        
        {/* Unfinished sections */}
        {activePage === 'Account' && <EmptyPage title="Account" />}
        {activePage === 'Tracking' && <EmptyPage title="Tracking" />}
      </CrmLayout>
    </CrmFieldsProvider>
  );
}

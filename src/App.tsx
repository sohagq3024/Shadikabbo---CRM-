import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { CrmLayout, SidebarPage } from './components/CrmLayout';
import { TrafficPage } from './components/TrafficPage';
import { PaidTrafficPage } from './components/PaidTrafficPage';
import { PaymentPage } from './components/PaymentPage';
import { LeadPage } from './components/LeadPage';
import { EmptyPage } from './components/EmptyPage';

export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('shadikabbo_token');
  });
  const [user, setUser] = useState<any | null>(() => {
    const cached = sessionStorage.getItem('shadikabbo_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [activePage, setActivePage] = useState<SidebarPage>('Traffic');
  const [isInitializing, setIsInitializing] = useState(true);

  // Validate active session token on launch
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = sessionStorage.getItem('shadikabbo_token');
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
        } else {
          // Token expired or invalid
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
    sessionStorage.setItem('shadikabbo_token', sessionToken);
    sessionStorage.setItem('shadikabbo_user', JSON.stringify(authenticatedUser));
    setActivePage('Traffic');
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
    sessionStorage.removeItem('shadikabbo_token');
    sessionStorage.removeItem('shadikabbo_user');
    setUser(null);
    setToken(null);
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

  // Authenticated -> Show CRM Main Interface
  return (
    <CrmLayout
      user={user}
      activePage={activePage}
      onSelectPage={(page) => setActivePage(page)}
      onLogout={handleLogout}
    >
      {activePage === 'Traffic' && <TrafficPage token={token} />}
      {activePage === 'Paid Traffic' && <PaidTrafficPage token={token} />}
      {activePage === 'Payment' && <PaymentPage token={token} />}
      {activePage === 'Lead' && <LeadPage token={token} />}
      
      {/* Kept Empty per explicit instructions for unfinished sections */}
      {activePage === 'Dashboard' && <EmptyPage title="Dashboard" />}
      {activePage === 'Account' && <EmptyPage title="Account" />}
      {activePage === 'Tracking' && <EmptyPage title="Tracking" />}
      {activePage === 'Attendance' && <EmptyPage title="Attendance" />}
      {activePage === 'Settings' && <EmptyPage title="Settings" />}
      {activePage === 'Trush bin' && <EmptyPage title="Trush bin" />}
    </CrmLayout>
  );
}

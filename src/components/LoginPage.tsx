import React, { useState } from 'react';
import { ShadikabboLogo } from './ShadikabboLogo';
import { LoginSlideCarousel } from './LoginSlideCarousel';
import { Lock, Phone, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgetModal, setShowForgetModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneNumber.trim()) {
      setError('Official phone number is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber.trim(),
          password: password,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center bg-white rounded-3xl p-6 md:p-12 shadow-xl border border-slate-100">
        
        {/* LEFT SIDE: Shadikabbo uploaded logo & 3-image switching section */}
        <div className="flex flex-col items-center justify-center space-y-6 lg:border-r lg:border-slate-100 lg:pr-10">
          <div className="w-full flex justify-center py-2">
            <ShadikabboLogo size="xl" />
          </div>

          <div className="w-full">
            <LoginSlideCarousel />
          </div>
        </div>

        {/* RIGHT SIDE: Login card */}
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
          <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-8 shadow-lg transition-all hover:border-[#181E54]/30">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-[#181E54] text-center mb-8">
              Login
            </h1>

            {error && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#D81124]" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Official phone number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Official Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter official phone number"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#181E54] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#181E54] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#181E54] hover:bg-[#121642] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? 'Authenticating...' : 'Login'}
              </button>

              {/* Forget Pass */}
              <div className="text-center pt-1 pb-1">
                <button
                  type="button"
                  onClick={() => setShowForgetModal(true)}
                  className="text-xs font-semibold text-[#D81124] hover:text-[#B80E1C] transition-colors cursor-pointer"
                >
                  Forget Pass
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Forget Password Assistance Modal */}
      {showForgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#181E54] font-bold">
                <ShieldCheck className="w-5 h-5 text-[#D81124]" />
                <span>Password Assistance</span>
              </div>
              <button
                onClick={() => setShowForgetModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              For security compliance, password resets for official CRM accounts require Super Admin authorization. Please contact the system administrator or verify via official registered telephone line.
            </p>
            <button
              type="button"
              onClick={() => setShowForgetModal(false)}
              className="w-full py-2 px-4 bg-[#181E54] text-white text-sm font-semibold rounded-xl hover:bg-[#121642] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

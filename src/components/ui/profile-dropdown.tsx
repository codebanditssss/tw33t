'use client';

import { useState } from 'react';
import { User, Settings, LogOut, ChevronDown, History } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { SettingsModal } from './settings-modal';
import { TweetHistory } from '../tweet-history';

function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
    setIsOpen(false);
  };

  const handleHistoryClick = () => {
    setIsHistoryOpen(true);
    setIsOpen(false);
  };

  if (!user) return null;

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const userEmail = user.email;

  return (
    <>
      <div className="relative">
        {/* Profile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative px-4 py-2.5 text-sm font-medium rounded-2xl transition-all duration-300 ease-out flex items-center gap-3 cursor-pointer"
          style={{ 
            color: '#FFFFFF',
            background: 'rgba(35, 35, 37, 0.75)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Avatar */}
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
            style={{ 
              background: 'rgba(45, 45, 48, 0.95)',
              color: '#FFFFFF',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.1)'
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          
          {/* Name */}
          <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
            {userName}
          </span>
          
          {/* Chevron */}
          <ChevronDown 
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: 'rgba(255,255,255,0.7)' }}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className="absolute top-full right-0 mt-2 w-64 rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(45,45,48,0.98) 0%, rgba(35,35,38,0.98) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)'
            }}
          >
            {/* User Info */}
            <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-base font-medium"
                  style={{ 
                    background: 'linear-gradient(135deg, #3E3F41 0%, #2A2A2D 100%)',
                    color: '#FFFFFF',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                    {userName}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {userEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-white/5 cursor-pointer"
                style={{ color: 'rgba(255,255,255,0.8)' }}
                onClick={handleHistoryClick}
              >
                <History className="h-4 w-4" />
                Tweet History
              </button>
              
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-white/5 cursor-pointer"
                style={{ color: 'rgba(255,255,255,0.8)' }}
                onClick={handleSettingsClick}
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-white/5 cursor-pointer"
                style={{ color: 'rgba(255,255,255,0.8)' }}
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Tweet History Modal */}
      <TweetHistory 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />
    </>
  );
}

export { ProfileDropdown }; 
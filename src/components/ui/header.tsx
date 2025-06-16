'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/ui/auth-modal";
import { ProfileDropdown } from "@/components/ui/profile-dropdown";
import { CreditsDisplay } from "@/components/ui/credits-display";
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';

function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'login' | 'signup'>('login');
  const { user, loading } = useAuth();

  const openModal = (tab: 'login' | 'signup') => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <header className="w-full" style={{ borderColor: '#3B3B3D' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-24 h-8 rounded bg-gray-700 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-20 h-8 rounded bg-gray-700 animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="w-full" style={{ borderColor: '#3B3B3D' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="relative w-[40px] h-[40px] rounded-full overflow-hidden">
              <Image
                src="/icons/tw33t-logo.png"
                alt="tw33t logo"
                fill
                sizes="(max-width: 768px) 40px, 40px"
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-[1.7rem] font-black tracking-tight text-white case" style={{ letterSpacing: '-0.03em' }}>
              tw<span className="relative inline-block -skew-x-6 transform">33</span>t
            </h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <CreditsDisplay />
                <ProfileDropdown />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => openModal('login')}
                  className="group relative px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0"
                  style={{ 
                    color: '#FFFFFF',
                    background: 'linear-gradient(135deg, rgba(42,42,45,0.4) 0%, rgba(35,35,37,0.4) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)'
                  }}
                >
                  <span className="relative z-10">Login</span>
                  <div 
                    className="absolute inset-0 rounded-xl transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                      filter: 'blur(2px)'
                    }}
                  />
                </Button>
                
                <Button 
                  onClick={() => openModal('signup')}
                  className="group relative px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
                  style={{ 
                    color: '#FFFFFF',
                    background: 'linear-gradient(135deg, rgba(75,75,80,0.9) 0%, rgba(55,55,60,0.9) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.2)'
                  }}
                >
                  <span className="relative z-10">Sign Up</span>
                  <div 
                    className="absolute inset-0 transition-transform duration-300 group-hover:translate-x-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                      filter: 'blur(5px)',
                      transform: 'translateX(-100%)'
                    }}
                  />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTab={modalTab}
      />
    </>
  );
}

export { Header }; 
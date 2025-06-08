'use client';

import { useState } from 'react';
import { Crown, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useUsage } from '@/contexts/usage-context';
import { AuthModal } from '@/components/ui/auth-modal';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';

export function FloatingUpgradeCard() {
  const [isVisible, setIsVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const { usageStatus } = useUsage();
  const pathname = usePathname();

  // Only show for free users who haven't dismissed the card and aren't on pricing page
  if (!isVisible || !usageStatus || usageStatus.planType !== 'free' || pathname === '/pricing') {
    return null;
  }

  const handleUpgrade = () => {
    if (!user) {
      setIsModalOpen(true);
      toast.info('Please sign up or log in to upgrade');
    } else {
      // Redirect to pricing page
      window.location.href = '/pricing';
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <div 
          className="group relative w-80 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.95) 0%, rgba(15, 15, 20, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Animated background stars */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-4 left-6 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"></div>
            <div className="absolute top-8 right-8 w-1 h-1 bg-white rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-12 left-12 w-1 h-1 bg-white rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-6 right-16 w-1 h-1 bg-white rounded-full opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full transition-colors hover:bg-white/10"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>

          {/* Content */}
          <div className="relative p-6">
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Crown className="w-6 h-6 text-yellow-400" />
                <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  SuperTw33t
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              Fewer rate limits, more capabilities
            </p>

            {/* Features list */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>500 tweets per month</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>All premium features</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>Priority support</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleUpgrade}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[0.98] active:scale-[0.96]"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F0F0 100%)',
                color: '#000000',
                boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
              }}
            >
              Go Super
            </button>
          </div>

          {/* Subtle glow effect on hover */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%)',
              borderRadius: '1rem'
            }}
          />
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTab="signup"
      />
    </>
  );
} 
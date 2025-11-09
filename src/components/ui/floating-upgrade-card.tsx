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
          className="group relative w-[160px] rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.95) 0%, rgba(15, 15, 20, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Content */}
          <div className="relative p-3">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              <div className="text-sm font-bold text-white">SuperTw33t</div>
            </div>

            {/* Features */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-1.5 text-gray-300 text-xs">
                <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                <span>500 credits/month</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300 text-xs">
                <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                <span>Premium features</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleUpgrade}
              className="w-full py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F0F0 100%)',
                color: '#000000'
              }}
            >
              Go Super
            </button>
          </div>
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
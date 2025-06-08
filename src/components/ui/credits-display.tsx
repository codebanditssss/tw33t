'use client';

import { useUsage } from '@/contexts/usage-context';
import { Zap, Crown } from 'lucide-react';
import Link from 'next/link';

export function CreditsDisplay() {
  const { usageStatus, loading } = useUsage();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 animate-pulse">
        <div className="w-4 h-4 bg-gray-700 rounded"></div>
        <div className="w-12 h-4 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!usageStatus) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50">
        <div className="w-4 h-4 bg-gray-700 rounded"></div>
        <span className="text-xs text-gray-400">Loading...</span>
      </div>
    );
  }

  const { currentUsage, limit, planType } = usageStatus;
  const remaining = limit - currentUsage;
  const percentage = (currentUsage / limit) * 100;

  // Color scheme based on usage
  const getColorScheme = () => {
    if (percentage >= 90) return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
    if (percentage >= 75) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
  };

  const colors = getColorScheme();

  return (
    <div className="flex items-center gap-3">
      {/* Credits Display */}
      <div 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${colors.bg} ${colors.border}`}
      >
        {planType === 'pro' ? (
          <Crown className={`w-4 h-4 ${colors.text}`} />
        ) : (
          <Zap className={`w-4 h-4 ${colors.text}`} />
        )}
        <span className={`text-sm font-medium ${colors.text}`}>
          {remaining} left
        </span>
      </div>

      {/* Upgrade Button for Free Users */}
      {planType === 'free' && percentage >= 80 && (
        <Link 
          href="/pricing"
          className="group relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
          style={{ 
            color: '#FFFFFF',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3), inset 0 1px 1px rgba(255,255,255,0.2)'
          }}
        >
          <span className="relative z-10">Upgrade</span>
          <div 
            className="absolute inset-0 transition-transform duration-300 group-hover:translate-x-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              filter: 'blur(5px)',
              transform: 'translateX(-100%)'
            }}
          />
        </Link>
      )}
    </div>
  );
} 
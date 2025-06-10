'use client';

import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-[200px] mx-4 rounded-xl overflow-hidden"
        style={{ backgroundColor: '#252628' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full transition-colors hover:bg-white/10"
          style={{ color: '#B5B5B5' }}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="text-lg font-bold text-white">SuperTw33t</div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span>500 tweets per month</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span>All premium features</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span>Priority support</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onClose}
            className="w-full py-2 px-4 mt-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Go Super
          </button>
        </div>
      </motion.div>
    </div>
  );
} 
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
        className="relative w-full max-w-[60px] mx-1 rounded overflow-hidden"
        style={{ backgroundColor: '#252628' }}
      >
        {/* Content */}
        <div className="p-0.5">
          {/* Header */}
          <div className="flex items-center justify-center">
            <div className="text-[6px] font-bold text-white">SuperTw33t</div>
          </div>

          {/* Description */}
          <div className="text-[6px] text-gray-300">Fewer rate limits</div>

          {/* CTA Button */}
          <button
            onClick={onClose}
            className="w-full mt-0.5 bg-white text-gray-900 rounded-sm text-[6px] font-medium hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Go Super
          </button>
        </div>
      </motion.div>
    </div>
  );
} 
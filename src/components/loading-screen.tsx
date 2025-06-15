import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface LoadingScreenProps {
  progress: number;
  prompt: string;
}

function LoadingScreen({ progress, prompt }: LoadingScreenProps) {
  const getLoadingMessage = (progress: number) => {
    if (progress < 20) return "Awakening the AI...";
    if (progress < 40) return "Exploring possibilities...";
    if (progress < 60) return "Crafting your narrative...";
    if (progress < 80) return "Adding that special touch...";
    return "Perfecting your tweets...";
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#161618] text-white">
      {/* Logo Container */}
      <motion.div 
        className="mb-16 relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated rings */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid rgba(255,255,255,0.1)',
            animation: 'spin 4s linear infinite',
          }}
        />
        <motion.div
          className="absolute inset-[-10px] rounded-full"
          style={{
            border: '2px solid rgba(255,255,255,0.05)',
            animation: 'spin 6s linear infinite reverse',
          }}
        />
        <motion.div
          className="absolute inset-[-20px] rounded-full"
          style={{
            border: '2px solid rgba(255,255,255,0.03)',
            animation: 'spin 8s linear infinite',
          }}
        />
        
        {/* Logo */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full overflow-hidden bg-black">
            <div className="w-full h-full flex items-center justify-center scale-[1.2]">
              <div className="relative w-[85%] h-[85%]">
                <Image
                  src="/icons/tw33t-logo.png"
                  alt="tw33t logo"
                  fill
                  sizes="(max-width: 768px) 85vw, (max-width: 1200px) 85vw, 85vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Status Text */}
      <motion.div 
        className="text-center mb-14"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.p 
          className="text-2xl font-medium text-white/90"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {getLoadingMessage(progress)}
        </motion.p>
      </motion.div>

      {/* Progress Bar */}
      <div className="w-full max-w-[400px] px-8">
        <div className="relative w-full h-[5px] bg-[#2F3336] overflow-hidden rounded-full">
          <motion.div 
            className="absolute left-0 top-0 h-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Progress Text */}
      <motion.div 
        className="mt-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-[#71767B] text-sm">{progress}%</span>
      </motion.div>
    </div>
  );
}

export default LoadingScreen;

// Add this to your global CSS file:
/*
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
*/ 
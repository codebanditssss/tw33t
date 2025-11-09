'use client';

import { useState } from "react";
import { TwitterTabs } from "@/components/ui/twitter-tabs";
import { ChatInputDemo } from "@/components/ui/demo";
import { motion } from "framer-motion";

interface HeroSectionProps {
  onGenerate: (topic: string, tone: string, options?: {
    type: 'tweet' | 'thread' | 'reply';
    threadLength?: number;
    threadStyle?: string;
    originalTweet?: string;
  }) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const glowVariants = {
  initial: {
    opacity: 0.9,
    textShadow: "0 0 0px rgba(255,255,255,0)"
  },
  animate: {
    opacity: 1,
    textShadow: "0 0 15px rgba(255,255,255,0.3)",
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "mirror" as const,
      ease: "easeInOut"
    }
  }
};

function HeroSection({ onGenerate }: HeroSectionProps) {
  const [selectedTab, setSelectedTab] = useState("Tweets");

  const getHeadingText = () => {
    switch (selectedTab) {
      case "Threads":
        return "Thread like a pro";
      case "Replies":
        return "Reply with impact";
      default:
        return "Tweet smarter";
    }
  };

  const getSubtitleText = () => {
    switch (selectedTab) {
      case "Threads":
        return "craft engaging threads with ai";
      case "Replies":
        return "spark meaningful conversations";
      default:
        return "ai-powered tweet ideas that resonate";
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col">
      {/* Fixed spacing from header */}
      <div className="h-32" />
      
      {/* Content container */}
      <div className="flex-1 flex items-start justify-center">
        <motion.div 
          className="flex flex-col items-center w-full max-w-3xl mx-auto px-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="w-full max-w-md mx-auto mb-12"
            variants={itemVariants}
          >
            <TwitterTabs onTabChange={setSelectedTab} defaultTab="Tweets" />
          </motion.div>
          
          <motion.div 
            className="text-center space-y-2.5 w-full mb-10"
            variants={itemVariants}
          >
            <h1 className="text-[2.75rem] leading-[1.2] font-semibold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white">
                {getHeadingText()}{" "}
              </span>
              <motion.span 
                className="bg-clip-text text-transparent bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 hover:from-gray-100 hover:via-gray-300 hover:to-gray-500 transition-all duration-300"
                variants={glowVariants}
                initial="initial"
                animate="animate"
              >
                with AI
              </motion.span>
            </h1>
            <p className="text-base text-gray-400/90 font-normal tracking-wide">
              {getSubtitleText()}
            </p>
          </motion.div>
          
          <motion.div 
            className="w-full"
            variants={itemVariants}
          >
            <ChatInputDemo onGenerate={onGenerate} selectedTab={selectedTab} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export { HeroSection }; 
'use client';

import { useState } from 'react';
import AnimatedBackground from "@/components/ui/animated-tabs";
import { motion } from 'framer-motion';

interface TwitterTabsProps {
  onTabChange?: (tab: string) => void;
  defaultTab?: string;
}

function TwitterTabs({ onTabChange, defaultTab = "Tweets" }: TwitterTabsProps) {
  const TABS = ["Tweets", "Threads", "Replies"];
  const [selectedTab, setSelectedTab] = useState(defaultTab);

  const handleTabChange = (tab: string | null) => {
    if (tab) {
      setSelectedTab(tab);
      if (onTabChange) {
        onTabChange(tab);
      }
    }
  };

  return (
    <motion.div 
      className="w-full max-w-[600px]"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <div className="flex w-full rounded-2xl bg-[#1d1d1f]/50 p-1">
        {TABS.map((tab, index) => (
          <motion.button
            key={index}
            data-id={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`
              flex-1 px-6 py-2.5 text-sm font-medium relative
              transition-all duration-200
              ${selectedTab === tab 
                ? 'text-white' 
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab}
            {selectedTab === tab && (
              <motion.div
                className="absolute -bottom-[2px] left-1/2 transform -translate-x-1/2 w-12 h-[2px]"
                style={{ background: 'linear-gradient(90deg, #60a5fa 0%, #93c5fd 100%)' }}
                layoutId="active-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export { TwitterTabs }; 
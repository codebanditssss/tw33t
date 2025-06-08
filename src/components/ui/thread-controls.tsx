'use client';

import { useState } from 'react';
import { ChevronDown, MessageSquare, Layers, BookOpen, Lightbulb, History, LineChart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThreadControlsProps {
  onLengthChange?: (length: number) => void;
  onStyleChange?: (style: string) => void;
}

const THREAD_LENGTHS = [
  { 
    label: 'Quick & Punchy', 
    value: 4, 
    icon: MessageSquare, 
    description: '3-5 tweets that make a sharp impact'
  },
  { 
    label: 'Balanced Flow', 
    value: 8, 
    icon: Layers, 
    description: '6-10 tweets for storytelling and value'
  },
  { 
    label: 'Deep Dive', 
    value: 13, 
    icon: BookOpen, 
    description: '11-15 tweets – your masterclass'
  },
  { 
    label: 'Custom Rhythm', 
    value: 0, 
    icon: ChevronDown, 
    description: 'Set your own tweet count'
  }
];

const THREAD_STYLES = [
  { 
    label: 'Narrative', 
    value: 'story', 
    description: 'A structured story that keeps readers hooked',
    icon: History,
    gradient: 'from-[#0EA5E9]/20 via-[#6366F1]/20 to-[#A855F7]/20',
    selectedGradient: 'from-[#0EA5E9]/30 via-[#6366F1]/30 to-[#A855F7]/30',
    borderGradient: 'from-[#0EA5E9]/50 via-[#6366F1]/50 to-[#A855F7]/50',
    iconColor: '#38BDF8'
  },
  { 
    label: 'Educational', 
    value: 'educational', 
    description: 'Clear, easy-to-follow explanations',
    icon: Lightbulb,
    gradient: 'from-[#2DD4BF]/20 via-[#34D399]/20 to-[#10B981]/20',
    selectedGradient: 'from-[#2DD4BF]/30 via-[#34D399]/30 to-[#10B981]/30',
    borderGradient: 'from-[#2DD4BF]/50 via-[#34D399]/50 to-[#10B981]/50',
    iconColor: '#34D399'
  },
  { 
    label: 'Tips & Lists', 
    value: 'tips', 
    description: 'Your best advice, organized and simple',
    icon: MessageSquare,
    gradient: 'from-[#F59E0B]/20 via-[#F97316]/20 to-[#EF4444]/20',
    selectedGradient: 'from-[#F59E0B]/30 via-[#F97316]/30 to-[#EF4444]/30',
    borderGradient: 'from-[#F59E0B]/50 via-[#F97316]/50 to-[#EF4444]/50',
    iconColor: '#FBBF24'
  },
  { 
    label: 'Personal', 
    value: 'personal', 
    description: 'Your own take, your journey',
    icon: History,
    gradient: 'from-[#EC4899]/20 via-[#D946EF]/20 to-[#A855F7]/20',
    selectedGradient: 'from-[#EC4899]/30 via-[#D946EF]/30 to-[#A855F7]/30',
    borderGradient: 'from-[#EC4899]/50 via-[#D946EF]/50 to-[#A855F7]/50',
    iconColor: '#F472B6'
  },
  { 
    label: 'Breakdown', 
    value: 'analysis', 
    description: 'Go deeper – dissect every part',
    icon: LineChart,
    gradient: 'from-[#3B82F6]/20 via-[#6366F1]/20 to-[#8B5CF6]/20',
    selectedGradient: 'from-[#3B82F6]/30 via-[#6366F1]/30 to-[#8B5CF6]/30',
    borderGradient: 'from-[#3B82F6]/50 via-[#6366F1]/50 to-[#8B5CF6]/50',
    iconColor: '#60A5FA'
  }
];

function ThreadControls({ onLengthChange, onStyleChange }: ThreadControlsProps) {
  const [selectedLength, setSelectedLength] = useState(THREAD_LENGTHS[1]); // Default to Medium
  const [selectedStyle, setSelectedStyle] = useState(THREAD_STYLES[0]); // Default to Story
  const [customLength, setCustomLength] = useState(8);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleLengthChange = (length: typeof THREAD_LENGTHS[0]) => {
    setSelectedLength(length);
    setShowCustomInput(length.value === 0);
    
    if (length.value > 0) {
      if (onLengthChange) {
        onLengthChange(length.value);
      }
    }
  };

  const handleCustomLengthChange = (value: number) => {
    setCustomLength(value);
    if (onLengthChange) {
      onLengthChange(value);
    }
  };

  const handleStyleChange = (style: typeof THREAD_STYLES[0]) => {
    setSelectedStyle(style);
    if (onStyleChange) {
      onStyleChange(style.value);
    }
  };

  return (
    <div className="w-full max-w-[600px] space-y-12">
      {/* Thread Length Selector */}
      <div className="space-y-3">
        <div className="mb-3">
          <label className="text-lg font-semibold text-white">
            Thread Length
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {THREAD_LENGTHS.map((length) => {
            const isSelected = selectedLength.value === length.value;
            const Icon = length.icon;
            
            return (
              <motion.button
                key={length.value}
                onClick={() => handleLengthChange(length)}
                className={`p-3 rounded-lg border text-left transition-all duration-200
                  ${isSelected 
                    ? 'border-blue-500 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                    : 'border-[#1E1E1E] hover:border-[#2E2E2E] bg-[#141414] hover:bg-[#181818]'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-2">
                  <Icon 
                    className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-gray-500'}`}
                  />
                  <div>
                    <div className={`font-semibold text-[14px] ${isSelected ? 'text-blue-400' : 'text-gray-200'}`}>
                      {length.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-snug">
                      {length.description}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
        
        {/* Custom Length Input */}
        {showCustomInput && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 pl-1"
          >
            <input
              type="number"
              min="2"
              max="20"
              value={customLength}
              onChange={(e) => handleCustomLengthChange(parseInt(e.target.value) || 2)}
              className="w-20 px-3 py-2 rounded border text-sm bg-[#141414] border-[#1E1E1E] text-white
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200"
            />
            <span className="text-sm text-gray-500">
              tweets (2-20)
            </span>
          </motion.div>
        )}
      </div>

      {/* Thread Style Selector */}
      <div className="space-y-3">
        <div className="mb-3">
          <label className="text-lg font-semibold text-white">
            Thread Style
          </label>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {THREAD_STYLES.map((style) => {
            const isSelected = selectedStyle.value === style.value;
            const Icon = style.icon;
            
            return (
              <motion.button
                key={style.value}
                onClick={() => handleStyleChange(style)}
                className={`w-full p-3 rounded-lg border text-left transition-all duration-300
                  ${isSelected 
                    ? `border-[${style.iconColor}] bg-[#141414]` 
                    : 'border-[#1E1E1E] hover:border-[#2E2E2E] bg-[#141414] hover:bg-[#181818]'
                  }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <Icon 
                      className="w-4 h-4 mt-0.5 transition-colors duration-200"
                      style={{ color: isSelected ? style.iconColor : '#6B7280' }}
                    />
                    <div>
                      <div className={`font-semibold text-[14px] transition-colors duration-200 ${isSelected ? `text-[${style.iconColor}]` : 'text-gray-200'}`}>
                        {style.label}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-snug">
                        {style.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center"
                      style={{ color: style.iconColor }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { ThreadControls }; 
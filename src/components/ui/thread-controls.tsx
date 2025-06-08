'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, Layers, BookOpen, Settings, History, Lightbulb, LineChart, Zap, Heart, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThreadControlsProps {
  onLengthChange?: (length: number) => void;
  onStyleChange?: (style: string) => void;
}

// Simplified length options with better UX
const THREAD_LENGTHS = [
  { 
    label: 'Quick', 
    value: 4, 
    icon: Zap, 
    description: '3-5 tweets',
    subtitle: 'Sharp & punchy'
  },
  { 
    label: 'Standard', 
    value: 8, 
    icon: Layers, 
    description: '6-10 tweets',
    subtitle: 'Perfect balance'
  },
  { 
    label: 'Deep', 
    value: 13, 
    icon: BookOpen, 
    description: '11-15 tweets',
    subtitle: 'Comprehensive'
  }
];

// Simplified style options with better visual design
const THREAD_STYLES = [
  { 
    label: 'Story', 
    value: 'story', 
    description: 'Narrative with beginning, middle, end',
    icon: History,
    color: '#3B82F6'
  },
  { 
    label: 'Tutorial', 
    value: 'educational', 
    description: 'Step-by-step explanations',
    icon: Lightbulb,
    color: '#10B981'
  },
  { 
    label: 'Tips', 
    value: 'tips', 
    description: 'Actionable advice & lists',
    icon: MessageSquare,
    color: '#F59E0B'
  },
  { 
    label: 'Personal', 
    value: 'personal', 
    description: 'Your experience & insights',
    icon: Heart,
    color: '#EC4899'
  },
  { 
    label: 'Analysis', 
    value: 'analysis', 
    description: 'Deep dive & breakdown',
    icon: BarChart3,
    color: '#8B5CF6'
  }
];

function ThreadControls({ onLengthChange, onStyleChange }: ThreadControlsProps) {
  const [selectedLength, setSelectedLength] = useState(THREAD_LENGTHS[1]); // Default to Standard
  const [selectedStyle, setSelectedStyle] = useState(THREAD_STYLES[0]); // Default to Story
  const [showMoreStyles, setShowMoreStyles] = useState(false);
  const [showCustomLength, setShowCustomLength] = useState(false);
  const [customLength, setCustomLength] = useState(8);

  const handleLengthChange = (length: typeof THREAD_LENGTHS[0]) => {
    setSelectedLength(length);
    if (onLengthChange) {
      onLengthChange(length.value);
    }
  };

  const handleStyleChange = (style: typeof THREAD_STYLES[0]) => {
    setSelectedStyle(style);
    if (onStyleChange) {
      onStyleChange(style.value);
    }
  };

  const handleCustomLengthChange = (value: number) => {
    setCustomLength(value);
    if (onLengthChange) {
      onLengthChange(value);
    }
  };

  return (
    <div className="w-full max-w-[600px] space-y-8">
      {/* Quick Length Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white">Thread Length</h3>
          <div className="text-sm text-gray-400">
            {selectedLength.description}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {THREAD_LENGTHS.map((length) => {
            const isSelected = selectedLength.value === length.value;
            const Icon = length.icon;
            
            return (
              <motion.button
                key={length.value}
                onClick={() => handleLengthChange(length)}
                className={`relative p-4 rounded-xl border text-center transition-all duration-200 group
                  ${isSelected 
                    ? 'border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
                    : 'border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900/80'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Icon 
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isSelected ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400'
                    }`}
                  />
                  <div>
                    <div className={`font-medium text-sm ${
                      isSelected ? 'text-blue-400' : 'text-gray-200'
                    }`}>
                      {length.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {length.subtitle}
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Style Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white">Thread Style</h3>
          <div className="text-sm text-gray-400">
            {selectedStyle.description}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {THREAD_STYLES.slice(0, 4).map((style) => {
            const isSelected = selectedStyle.value === style.value;
            const Icon = style.icon;
            
            return (
              <motion.button
                key={style.value}
                onClick={() => handleStyleChange(style)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 group
                  ${isSelected 
                    ? 'border-gray-600 bg-gray-800/50 shadow-lg' 
                    : 'border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900/80'
                  }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: isSelected ? `${style.color}20` : 'rgba(75, 85, 99, 0.3)',
                      border: `1px solid ${isSelected ? `${style.color}40` : 'rgba(75, 85, 99, 0.5)'}`
                    }}
                  >
                    <Icon 
                      className="w-4 h-4"
                      style={{ color: isSelected ? style.color : '#9CA3AF' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${
                      isSelected ? 'text-white' : 'text-gray-200'
                    }`}>
                      {style.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {style.description}
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                    style={{ backgroundColor: style.color }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
        
                 {/* Show more styles button */}
         {!showMoreStyles && (
           <motion.button
             onClick={() => setShowMoreStyles(true)}
             className="w-full p-3 rounded-xl border border-gray-800 bg-gray-900/30 hover:bg-gray-900/50 
                        text-gray-400 hover:text-gray-300 transition-all duration-200 text-sm font-medium
                        flex items-center justify-center gap-2"
             whileHover={{ scale: 1.01 }}
             whileTap={{ scale: 0.99 }}
           >
             <span>More styles</span>
             <ChevronDown className="w-4 h-4" />
           </motion.button>
         )}
         
         {/* Additional styles */}
         <AnimatePresence>
           {showMoreStyles && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 gap-3">
                {THREAD_STYLES.slice(4).map((style) => {
                  const isSelected = selectedStyle.value === style.value;
                  const Icon = style.icon;
                  
                  return (
                    <motion.button
                      key={style.value}
                      onClick={() => handleStyleChange(style)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 group
                        ${isSelected 
                          ? 'border-gray-600 bg-gray-800/50 shadow-lg' 
                          : 'border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900/80'
                        }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ 
                            backgroundColor: isSelected ? `${style.color}20` : 'rgba(75, 85, 99, 0.3)',
                            border: `1px solid ${isSelected ? `${style.color}40` : 'rgba(75, 85, 99, 0.5)'}`
                          }}
                        >
                          <Icon 
                            className="w-4 h-4"
                            style={{ color: isSelected ? style.color : '#9CA3AF' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm ${
                            isSelected ? 'text-white' : 'text-gray-200'
                          }`}>
                            {style.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {style.description}
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                          style={{ backgroundColor: style.color }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
              
                             <motion.button
                 onClick={() => setShowMoreStyles(false)}
                 className="w-full p-2 rounded-lg text-gray-400 hover:text-gray-300 transition-colors duration-200 
                            text-sm font-medium flex items-center justify-center gap-2"
                 whileHover={{ scale: 1.01 }}
                 whileTap={{ scale: 0.99 }}
               >
                 <span>Show less</span>
                 <ChevronUp className="w-4 h-4" />
               </motion.button>
             </motion.div>
           )}
         </AnimatePresence>
       </div>

       {/* Advanced Options */}
       <div className="pt-4 border-t border-gray-800">
         <motion.button
           onClick={() => setShowCustomLength(!showCustomLength)}
           className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200"
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
         >
           <Settings className="w-4 h-4" />
           <span>Custom length (2-20 tweets)</span>
           <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCustomLength ? 'rotate-180' : ''}`} />
         </motion.button>
         
         <AnimatePresence>
           {showCustomLength && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={customLength}
                  onChange={(e) => handleCustomLengthChange(parseInt(e.target.value) || 2)}
                  className="w-20 px-3 py-2 rounded-lg border text-sm bg-gray-900 border-gray-700 text-white
                    focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200"
                />
                <span className="text-sm text-gray-500">tweets</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { ThreadControls }; 
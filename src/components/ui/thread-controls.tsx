'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, GraduationCap, ListChecks, User, BarChart, AlignJustify, FileText, Minus, Plus } from 'lucide-react';

interface ThreadControlsProps {
  onLengthChange?: (length: number) => void;
  onStyleChange?: (style: string) => void;
}

type StyleColor = 'blue' | 'teal' | 'yellow' | 'green' | 'purple';

const THREAD_LENGTHS = [4, 8, 13];
const THREAD_STYLES = [
  { 
    id: 'story', 
    label: 'Narrative', 
    desc: 'Story-driven thread',
    Icon: Book,
    color: 'blue' as StyleColor
  },
  { 
    id: 'educational', 
    label: 'Educational', 
    desc: 'Step-by-step explanation',
    Icon: GraduationCap,
    color: 'teal' as StyleColor
  },
  { 
    id: 'tips', 
    label: 'Tips & Lists', 
    desc: 'Actionable insights',
    Icon: ListChecks,
    color: 'yellow' as StyleColor
  },
  { 
    id: 'personal', 
    label: 'Personal', 
    desc: 'Experience-based',
    Icon: User,
    color: 'green' as StyleColor
  },
  { 
    id: 'analysis', 
    label: 'Breakdown', 
    desc: 'Deep analysis',
    Icon: BarChart,
    color: 'purple' as StyleColor
  }
] as const;

const getColorStyles = (style: typeof THREAD_STYLES[number], isSelected: boolean) => {
  const colors: Record<StyleColor, {
    selected: string;
    icon: string;
    hover: string;
    slider: string;
  }> = {
    blue: {
      selected: 'border-blue-500/50 bg-blue-500/10',
      icon: 'text-blue-400',
      hover: 'hover:border-blue-500/30',
      slider: 'from-blue-500 to-blue-400'
    },
    teal: {
      selected: 'border-teal-500/50 bg-teal-500/10',
      icon: 'text-teal-400',
      hover: 'hover:border-teal-500/30',
      slider: 'from-teal-500 to-teal-400'
    },
    yellow: {
      selected: 'border-yellow-500/50 bg-yellow-500/10',
      icon: 'text-yellow-400',
      hover: 'hover:border-yellow-500/30',
      slider: 'from-yellow-500 to-yellow-400'
    },
    green: {
      selected: 'border-green-500/50 bg-green-500/10',
      icon: 'text-green-400',
      hover: 'hover:border-green-500/30',
      slider: 'from-green-500 to-green-400'
    },
    purple: {
      selected: 'border-purple-500/50 bg-purple-500/10',
      icon: 'text-purple-400',
      hover: 'hover:border-purple-500/30',
      slider: 'from-purple-500 to-purple-400'
    }
  };
  
  return colors[style.color];
};

function ThreadControls({ onLengthChange, onStyleChange }: ThreadControlsProps) {
  const [length, setLength] = useState(8);
  const [style, setStyle] = useState('story');
  const [isDragging, setIsDragging] = useState(false);
  const [showStyleDesc, setShowStyleDesc] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const wasSliderClicked = useRef(false);

  const selectedStyle = THREAD_STYLES.find(s => s.id === style) || THREAD_STYLES[0];
  const colors = getColorStyles(selectedStyle, true);

  const handleLengthChange = (value: number) => {
    const newValue = Math.min(Math.max(value, 2), 20);
    setLength(newValue);
    onLengthChange?.(newValue);
  };

  const handleIncrement = () => {
    handleLengthChange(length + 1);
  };

  const handleDecrement = () => {
    handleLengthChange(length - 1);
  };

  const handleStyleChange = (value: string) => {
    setStyle(value);
    onStyleChange?.(value);
    setShowStyleDesc(null);
  };

  const updateSliderValue = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const offsetX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const percentage = (offsetX / rect.width) * 100;
    const newLength = Math.round((percentage / 100) * 18) + 2; // 2 to 20 range
    handleLengthChange(newLength);
  };

  const handleSliderClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      updateSliderValue(e.clientX);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    wasSliderClicked.current = true;
    setIsDragging(true);
    updateSliderValue(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && wasSliderClicked.current) {
        updateSliderValue(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      wasSliderClicked.current = false;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="w-full max-w-[600px] space-y-8 p-4">
      {/* Length Control */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm text-gray-200 font-medium">Thread Length</div>
            <div className="text-xs text-gray-500">{length} tweets</div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={length}
              onChange={(e) => {
                const val = Math.min(Math.max(parseInt(e.target.value) || 2, 2), 20);
                handleLengthChange(val);
              }}
              className="w-16 h-8 bg-[#1A1A1A] text-center text-sm text-white rounded-md 
                focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
        </div>

        {/* Enhanced Modern Slider */}
        <div className="relative py-4">
          <div className="flex items-center gap-3">
            {/* Decrement Button */}
            <motion.button
              onClick={handleDecrement}
              disabled={length <= 2}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`p-1.5 rounded-full transition-colors duration-200 select-none
                ${length <= 2 ? 'text-gray-600 cursor-not-allowed' : `${colors.icon} hover:bg-white/5 active:bg-white/10`}`}
            >
              <Minus className="w-4 h-4" />
            </motion.button>

            <div 
              ref={sliderRef}
              className="relative flex-1 h-1.5 bg-[#2A2A2A] rounded-full cursor-pointer group"
              onClick={handleSliderClick}
            >
              {/* Background Track */}
              <div className="absolute inset-0 rounded-full bg-[#2A2A2A] group-hover:bg-[#333333] transition-colors duration-200" />
              
              {/* Progress Bar */}
              <motion.div 
                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${colors.slider}`}
                style={{ width: `${(length / 20) * 100}%` }}
                animate={{ opacity: isDragging ? 1 : 0.8 }}
              />
              
              {/* Hover Effect */}
              <div className="absolute inset-y-0 w-full rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute inset-0 bg-white/5" />
              </div>

              {/* Current Value Indicator */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                style={{ left: `${(length / 20) * 100}%` }}
                animate={{ 
                  scale: isDragging ? 1.2 : 1,
                }}
                onMouseDown={handleMouseDown}
              >
                {/* Handle Hover Area */}
                <div className="absolute -inset-2.5 rounded-full bg-transparent group-hover:bg-white/5 transition-colors duration-200" />
                
                {/* Handle */}
                <div 
                  className={`w-3 h-3 rounded-full -translate-x-1/2 transition-transform duration-200
                    ${isDragging ? 'scale-125' : 'group-hover:scale-110'}
                    ${colors.selected} border ${colors.icon.replace('text-', 'border-')}`} 
                />
              </motion.div>

              {/* Length Markers */}
              {THREAD_LENGTHS.map((preset) => (
                <motion.div
                  key={preset}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${(preset / 20) * 100}%` }}
                >
                  <div 
                    className={`w-1 h-1 rounded-full transition-colors duration-200
                      ${length === preset ? colors.icon : 'bg-gray-600 group-hover:bg-gray-500'}`}
                  />
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500">
                    {preset}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Increment Button */}
            <motion.button
              onClick={handleIncrement}
              disabled={length >= 20}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`p-1.5 rounded-full transition-colors duration-200 select-none
                ${length >= 20 ? 'text-gray-600 cursor-not-allowed' : `${colors.icon} hover:bg-white/5 active:bg-white/10`}`}
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Style Selection */}
      <div className="space-y-3">
        <div className="text-sm text-gray-200 font-medium">Thread Style</div>
        <div className="grid grid-cols-3 gap-1.5">
          {THREAD_STYLES.map((styleOption) => {
            const isSelected = style === styleOption.id;
            const colors = getColorStyles(styleOption, isSelected);
            
            return (
              <motion.div
                key={styleOption.id}
                className="relative"
              >
                <motion.button
                  onClick={() => handleStyleChange(styleOption.id)}
                  className={`
                    w-full group flex items-center justify-center gap-2 px-4 py-2.5
                    rounded-xl text-sm font-medium transition-all duration-200
                    border
                    ${isSelected 
                      ? `${colors.selected} text-white` 
                      : `bg-transparent border-[#1E1E1E] text-gray-300 ${colors.hover}`}
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <styleOption.Icon 
                    className={`w-4 h-4 transition-colors duration-200 
                      ${isSelected ? colors.icon : 'text-gray-400 group-hover:text-gray-200'}
                    `} 
                  />
                  <span>{styleOption.label}</span>
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { ThreadControls }; 
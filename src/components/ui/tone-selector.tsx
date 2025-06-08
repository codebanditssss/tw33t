'use client';

import { useState } from 'react';
import { 
  Briefcase, 
  MessageCircle, 
  Sparkles, 
  Target, 
  Heart, 
  Lightbulb 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ToneSelectorProps {
  onToneChange?: (tone: string, placeholder: string) => void;
  className?: string;
}

const TONES = [
  { 
    value: 'professional', 
    label: 'Professional', 
    Icon: Briefcase, 
    color: 'blue',
    placeholder: 'Share your boardroom-ready thought.'
  },
  { 
    value: 'casual', 
    label: 'Casual', 
    Icon: MessageCircle, 
    color: 'teal',
    placeholder: 'Just drop your thoughts here.'
  },
  { 
    value: 'funny', 
    label: 'Funny', 
    Icon: Sparkles, 
    color: 'yellow',
    placeholder: 'Make the timeline laugh.'
  },
  { 
    value: 'serious', 
    label: 'Serious', 
    Icon: Target, 
    color: 'gray',
    placeholder: 'Express your point clearly.'
  },
  { 
    value: 'friendly', 
    label: 'Friendly', 
    Icon: Heart, 
    color: 'green',
    placeholder: 'Share something warm and light.'
  },
  { 
    value: 'witty', 
    label: 'Witty', 
    Icon: Lightbulb, 
    color: 'purple',
    placeholder: 'Drop that clever one-liner.'
  },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
};

const getColorStyles = (tone: typeof TONES[number], isSelected: boolean) => {
  const colors = {
    blue: {
      selected: 'border-blue-500/50 bg-blue-500/10',
      icon: 'text-blue-400',
      hover: 'hover:border-blue-500/30'
    },
    teal: {
      selected: 'border-teal-500/50 bg-teal-500/10',
      icon: 'text-teal-400',
      hover: 'hover:border-teal-500/30'
    },
    yellow: {
      selected: 'border-yellow-500/50 bg-yellow-500/10',
      icon: 'text-yellow-400',
      hover: 'hover:border-yellow-500/30'
    },
    gray: {
      selected: 'border-gray-500/50 bg-gray-500/10',
      icon: 'text-gray-400',
      hover: 'hover:border-gray-500/30'
    },
    green: {
      selected: 'border-green-500/50 bg-green-500/10',
      icon: 'text-green-400',
      hover: 'hover:border-green-500/30'
    },
    purple: {
      selected: 'border-purple-500/50 bg-purple-500/10',
      icon: 'text-purple-400',
      hover: 'hover:border-purple-500/30'
    }
  };
  
  return colors[tone.color];
};

const pulseVariants = {
  selected: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
  unselected: {
    scale: 1
  }
};

function ToneSelector({ onToneChange, className }: ToneSelectorProps) {
  const [selectedTone, setSelectedTone] = useState<typeof TONES[number]['value']>(TONES[0].value);

  const handleToneSelect = (toneValue: typeof TONES[number]['value']) => {
    setSelectedTone(toneValue);
    const selectedToneObj = TONES.find(tone => tone.value === toneValue);
    onToneChange?.(toneValue, selectedToneObj?.placeholder || '');
  };

  return (
    <div className="space-y-4">
      <motion.div 
        className={`grid grid-cols-3 gap-3 w-full max-w-xl mx-auto ${className}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {TONES.map((tone) => {
          const isSelected = selectedTone === tone.value;
          const colors = getColorStyles(tone, isSelected);
          
          return (
            <motion.button
              key={tone.value}
              type="button"
              onClick={() => handleToneSelect(tone.value)}
              className={`
                group flex items-center justify-center gap-2 px-4 py-2.5
                rounded-full text-xs cursor-pointer bg-[#252628]/50 font-medium transition-colors duration-200
                border
                ${isSelected 
                  ? `${colors.selected} text-white` 
                  : ` border-[#252628]/70 text-gray-300 ${colors.hover}`}
              `}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.95 }}
              animate={isSelected ? "selected" : "unselected"}
              variants={pulseVariants}
            >
              <tone.Icon 
                className={`w-3.5 h-3.5 transition-colors duration-200 
                  ${isSelected ? colors.icon : 'text-gray-400 group-hover:text-gray-200'}
                `} 
              />
              <span className="tracking-wide">{tone.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}

export { ToneSelector }; 
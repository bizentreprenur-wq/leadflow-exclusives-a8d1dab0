import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bamMascot from '@/assets/bamlead-mascot.png';

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export default function SplashScreen({ onComplete, minDuration = 2000 }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    const loadingMessages = [
      'Initializing...',
      'Loading AI engines...',
      'Preparing lead discovery...',
      'Ready to find leads!'
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = Math.min(messageIndex + 1, loadingMessages.length - 1);
      setLoadingText(loadingMessages[messageIndex]);
    }, minDuration / 4);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 15 + 5;
        return Math.min(next, 100);
      });
    }, minDuration / 10);

    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(onComplete, 500);
    }, minDuration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [onComplete, minDuration]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-violet-500/5" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-violet-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Mascot with animations */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.6 
            }}
            className="relative mb-8"
          >
            {/* Glowing ring behind mascot */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-violet-500 to-primary"
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              style={{ 
                filter: 'blur(20px)',
                opacity: 0.4,
                margin: '-20px'
              }}
            />
            
            {/* Mascot image */}
            <motion.img
              src={bamMascot}
              alt="BamLead Mascot"
              className="w-32 h-32 md:w-40 md:h-40 relative z-10 drop-shadow-2xl"
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* Brand name */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-2"
          >
            <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent">
              Bam
            </span>
            <span className="text-foreground">Lead</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-muted-foreground text-sm md:text-base mb-8"
          >
            AI-Powered Lead Generation
          </motion.p>

          {/* Progress bar */}
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '200px' }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="relative h-1.5 bg-muted rounded-full overflow-hidden"
            style={{ width: 200 }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-violet-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          {/* Loading text */}
          <motion.p
            key={loadingText}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground mt-4"
          >
            {loadingText}
          </motion.p>
        </div>

        {/* Bottom branding */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 text-xs text-muted-foreground/50"
        >
          Powered by AI • Up to 2,000 leads per search
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

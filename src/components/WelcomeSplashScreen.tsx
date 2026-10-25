import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface WelcomeSplashScreenProps {
  onDismiss: () => void;
}

export const WelcomeSplashScreen: React.FC<WelcomeSplashScreenProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Automatically transition into the app after ~3.2s
    const timer = setTimeout(() => {
      handleClose();
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem('glm_welcome_screen_seen', 'true');
    } catch {
      // sessionStorage unavailable or blocked
    }
    // Allow exit animation to complete before removing from DOM
    setTimeout(onDismiss, 500);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="glm-welcome-splash"
          initial={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 1.03,
            transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
          }}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 cursor-pointer select-none overflow-hidden"
          style={{
            background: 'radial-gradient(circle at center, #ffffff 0%, #f3f5f8 45%, #e2e8f0 100%)'
          }}
          role="button"
          aria-label="Welcome screen. Click or tap anywhere to continue into app."
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleClose();
            }
          }}
        >
          {/* Subtle ambient background glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-orange-200/40 via-amber-100/30 to-blue-200/30 blur-3xl pointer-events-none" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full mx-auto">
            {/* Logo container with warm flame glow */}
            <div className="relative flex items-center justify-center w-52 h-52 sm:w-60 sm:h-60 mb-2">
              {/* Warm orange pulsing glow specifically behind the flame at the top */}
              <motion.div
                className="absolute top-4 w-28 h-28 rounded-full bg-orange-500/35 blur-xl pointer-events-none"
                animate={
                  shouldReduceMotion
                    ? { opacity: 0.5 }
                    : {
                        opacity: [0.35, 0.75, 0.35],
                        scale: [0.95, 1.15, 0.95]
                      }
                }
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />

              {/* Glass Logo Image with blend mode multiply so no box edges show on light background */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                animate={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : {
                        opacity: 1,
                        scale: 1,
                        y: [0, -6, 0]
                      }
                }
                transition={{
                  opacity: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                  scale: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                  y: {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }
                }}
                className="w-full h-full flex items-center justify-center"
              >
                <img
                  src="/assets/glm-glass-logo.jpg"
                  alt="Gospel Labor Ministry"
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain mix-blend-multiply drop-shadow-sm pointer-events-none"
                />
              </motion.div>
            </div>

            {/* Typography */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-1.5"
            >
              <h1 className="text-2xl sm:text-3xl font-black text-[#0F2744] tracking-tight">
                GLM Evangelism Hub
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
                Gospel Labor Ministry
              </p>
            </motion.div>

            {/* Thin animated progress bar */}
            <div className="w-48 h-1 bg-slate-200/80 rounded-full overflow-hidden mt-6 relative">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3.2, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              />
            </div>

            {/* Tap to continue prompt */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="text-[11px] font-medium text-slate-400 mt-4 tracking-wide"
            >
              Tap anywhere to enter
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

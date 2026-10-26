import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface WelcomeSplashScreenProps {
  onDismiss: () => void;
}

export const WelcomeSplashScreen: React.FC<WelcomeSplashScreenProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Automatically transition into the app after ~3.5s
    const timer = setTimeout(() => {
      handleClose();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Exit animation duration before unmounting
    setTimeout(onDismiss, 400);
  };

  const titleWords = ['GLM', 'Evangelism', 'Hub'];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="glm-welcome-splash"
          initial={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 1.02,
            transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
          }}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 cursor-pointer select-none overflow-hidden h-[100dvh] min-h-[100dvh]"
          style={{
            backgroundColor: '#eff1f5',
            background: 'radial-gradient(circle at 50% 38%, #f8f9fb 0%, #eff1f5 55%, #e5e8ee 100%)'
          }}
          role="button"
          aria-label="Welcome screen. Tap anywhere to enter."
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleClose();
            }
          }}
        >
          {/* Subtle ambient background glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-orange-200/40 via-amber-100/30 to-blue-200/30 blur-3xl pointer-events-none" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full mx-auto">
            {/* Logo container with flame glow, sparks, shimmer and radial mask */}
            <div className="relative flex items-center justify-center w-52 h-52 sm:w-64 sm:h-64 mb-3">
              {/* Warm orange pulsing glow behind the flame */}
              <motion.div
                className="absolute top-2 sm:top-4 w-32 h-32 rounded-full bg-gradient-to-t from-orange-500/50 via-amber-400/40 to-transparent blur-2xl pointer-events-none"
                animate={
                  shouldReduceMotion
                    ? { opacity: 0.6 }
                    : {
                        opacity: [0.35, 0.85, 0.35],
                        scale: [0.95, 1.2, 0.95]
                      }
                }
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />

              {/* Small golden sparks rising slowly from the flame and fading out */}
              {!shouldReduceMotion && (
                <>
                  <motion.div
                    className="absolute top-7 w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b] pointer-events-none"
                    animate={{
                      x: [-2, 8],
                      y: [0, -38],
                      opacity: [0, 0.95, 0],
                      scale: [0.6, 1.2, 0.3]
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: 'easeOut',
                      delay: 0.3
                    }}
                  />
                  <motion.div
                    className="absolute top-9 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] pointer-events-none"
                    animate={{
                      x: [3, -10],
                      y: [0, -44],
                      opacity: [0, 0.85, 0],
                      scale: [0.5, 1.1, 0.2]
                    }}
                    transition={{
                      duration: 2.6,
                      repeat: Infinity,
                      ease: 'easeOut',
                      delay: 1.0
                    }}
                  />
                  <motion.div
                    className="absolute top-6 w-1.5 h-1.5 rounded-full bg-orange-300 shadow-[0_0_8px_#ea580c] pointer-events-none"
                    animate={{
                      x: [-1, 6],
                      y: [0, -34],
                      opacity: [0, 0.9, 0],
                      scale: [0.7, 1.2, 0.3]
                    }}
                    transition={{
                      duration: 2.1,
                      repeat: Infinity,
                      ease: 'easeOut',
                      delay: 1.7
                    }}
                  />
                  <motion.div
                    className="absolute top-8 w-1 h-1 rounded-full bg-yellow-200 shadow-[0_0_6px_#fde047] pointer-events-none"
                    animate={{
                      x: [-3, -7],
                      y: [0, -40],
                      opacity: [0, 0.8, 0],
                      scale: [0.4, 0.9, 0.2]
                    }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'easeOut',
                      delay: 0.7
                    }}
                  />
                </>
              )}

              {/* Logo floating wrapper: scales from 0.9 to 1 with slow float */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
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
                  opacity: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
                  scale: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
                  y: {
                    duration: 3.2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }
                }}
                className="relative w-48 h-48 sm:w-56 sm:h-56 overflow-hidden rounded-full flex items-center justify-center"
                style={{
                  WebkitMaskImage: 'radial-gradient(circle at center, black 60%, rgba(0, 0, 0, 0.9) 70%, rgba(0, 0, 0, 0.3) 85%, transparent 100%)',
                  maskImage: 'radial-gradient(circle at center, black 60%, rgba(0, 0, 0, 0.9) 70%, rgba(0, 0, 0, 0.3) 85%, transparent 100%)'
                }}
              >
                {/* Scaled image inside overflow-hidden to crop ~3% off every edge, no mix-blend-mode */}
                <img
                  src="/assets/glm-glass-logo.jpg"
                  alt="Gospel Labor Ministry"
                  className="w-full h-full object-cover scale-[1.07] pointer-events-none"
                />

                {/* Soft light-shimmer sweeping once across the glass letters */}
                {!shouldReduceMotion && (
                  <motion.div
                    initial={{ x: '-160%' }}
                    animate={{ x: '190%' }}
                    transition={{
                      delay: 0.75,
                      duration: 1.3,
                      ease: 'easeInOut'
                    }}
                    className="absolute inset-y-0 w-32 -skew-x-25 bg-gradient-to-r from-transparent via-white/55 to-transparent pointer-events-none"
                  />
                )}
              </motion.div>
            </div>

            {/* Typography: "GLM Evangelism Hub" word by word */}
            <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
              {titleWords.map((word, idx) => (
                <motion.span
                  key={word}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: shouldReduceMotion ? 0.2 : 0.4 + idx * 0.22,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="text-2xl sm:text-3xl font-black text-[#0F2744] tracking-tight inline-block"
                >
                  {word}
                </motion.span>
              ))}
            </div>

            {/* Sub-text: "GOSPEL LABOR MINISTRY" with wide letter spacing */}
            <motion.p
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: shouldReduceMotion ? 0.4 : 1.15,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-[0.25em] mt-2"
            >
              Gospel Labor Ministry
            </motion.p>

            {/* Thin orange progress bar */}
            <div className="w-48 h-1 bg-slate-200/90 rounded-full overflow-hidden mt-6 relative">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{
                  delay: shouldReduceMotion ? 0.1 : 1.35,
                  duration: shouldReduceMotion ? 2 : 2.15,
                  ease: 'linear'
                }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              />
            </div>

            {/* Tap to enter prompt */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              transition={{ delay: shouldReduceMotion ? 0.3 : 1.6, duration: 0.5 }}
              className="text-[11px] font-semibold text-slate-400 mt-4 tracking-wider uppercase"
            >
              Tap anywhere to enter
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

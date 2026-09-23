import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NexoraSymbol from '../../assets/logo/NexoraSymbol';

const LOADING_STEPS = [
  { progress: 15, message: 'Initializing Nexora Nexus...' },
  { progress: 45, message: 'Synchronizing encrypted channels...' },
  { progress: 75, message: 'Preparing your workspace...' },
  { progress: 95, message: 'Connecting your communities...' },
  { progress: 100, message: 'Welcome to Nexora' },
];

export default function StartupScreen({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          const next = prev + 1;
          setProgress(LOADING_STEPS[next].progress);
          return next;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 450);
          return prev;
        }
      });
    }, 420);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      key="nexora-startup"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07080C] nexora-mesh-bg overflow-hidden select-none"
    >
      {/* Ambient background orbital rings */}
      <div className="absolute w-[500px] h-[500px] rounded-full border border-cyan-500/10 animate-[spin_20s_linear_infinite] pointer-events-none" />
      <div className="absolute w-[750px] h-[750px] rounded-full border border-violet-500/10 animate-[spin_35s_linear_infinite_reverse] pointer-events-none" />
      
      {/* Background glow orb */}
      <div className="absolute w-96 h-96 bg-gradient-to-tr from-cyan-500/15 via-indigo-600/10 to-violet-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main branding container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Symbol Reveal */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-6"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-full blur-xl animate-pulse" />
          <NexoraSymbol size={72} className="relative z-10" />
        </motion.div>

        {/* Wordmark Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center"
        >
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300">
            Nexora
          </h1>
          <p className="text-xs font-mono tracking-[0.25em] text-cyan-400/80 uppercase mt-1">
            Realtime Communication Nexus
          </p>
        </motion.div>

        {/* Nexora-specific Custom Orbit Progress Indicator */}
        <div className="w-64 sm:w-72 mt-10">
          <div className="relative h-1.5 w-full bg-slate-900/80 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 rounded-full shadow-glow-cyan"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            />
          </div>

          {/* Contextual Status Message */}
          <div className="flex justify-between items-center mt-3 text-xs font-mono text-slate-400">
            <AnimatePresence mode="wait">
              <motion.span
                key={stepIndex}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.2 }}
                className="text-slate-300 truncate"
              >
                {LOADING_STEPS[stepIndex].message}
              </motion.span>
            </AnimatePresence>
            <span className="text-cyan-400 font-semibold ml-2">{progress}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

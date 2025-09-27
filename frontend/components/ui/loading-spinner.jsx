import React from 'react';
import { motion } from 'framer-motion';

export function LoadingSpinner({ text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <motion.div
          className="w-5 h-5 border-2 border-[hsl(var(--brand))] border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 w-5 h-5 border-2 border-[hsl(var(--accent))] border-b-transparent rounded-full"
          animate={{ rotate: -180 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm">
        {text}
      </motion.span>
    </div>
  );
}
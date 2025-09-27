import React from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export function SuccessPopup({ title, message, onClose, onAction }) {
  React.useEffect(() => {
    // Fire confetti
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    // Initial burst
    const count = 200;
    const origin = { x: 0.5, y: 0.7 };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        origin,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#ee82ee']
    });
    fire(0.2, {
      spread: 60,
      colors: ['#ff69b4', '#00ffff', '#ff1493', '#7fffd4', '#ff4500']
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45
    });

    // Continuous small bursts
    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 20 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#ff69b4', '#00ffff', '#ff1493', '#7fffd4', '#ff4500']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#0000ff']
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-background rounded-xl border border-border p-6 max-w-md w-full mx-4"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--success))] mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6">{message}</p>
          <button
            onClick={onAction}
            className="btn-gradient px-6 py-2 rounded-lg text-white font-medium"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}
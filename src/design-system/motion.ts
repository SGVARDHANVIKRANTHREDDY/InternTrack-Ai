/**
 * @file motion.ts
 * InternTrack AI Motion & Animation Tokens
 * Smooth, snappy transitions with automatic fallback for `prefers-reduced-motion`.
 */

export const transitions = {
  // Snappy spring physics for dialogs, popovers, and cards (Raycast caliber)
  spring: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  },
  
  // Smooth slide physics for drawer / inspector sheets (Attio/Linear caliber)
  drawer: {
    type: 'tween',
    ease: [0.16, 1, 0.3, 1], // ease-out-expo
    duration: 0.28,
  },
  
  // Micro-interaction fades (pills, badges, dropdowns)
  fast: {
    duration: 0.15,
    ease: 'easeOut',
  },
  
  // Standard interface transitions
  normal: {
    duration: 0.2,
    ease: [0.25, 0.1, 0.25, 1],
  },
} as const;

export const motionVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: transitions.fast,
  },
  
  scaleFade: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: transitions.spring,
  },
  
  slideInRight: {
    initial: { x: '100%', opacity: 0.4 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
    transition: transitions.drawer,
  },
  
  slideInBottom: {
    initial: { y: '100%', opacity: 0.4 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
    transition: transitions.drawer,
  },
  
  commandPalette: {
    initial: { opacity: 0, scale: 0.98, y: -8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: -8 },
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
} as const;

// Animation utility functions for enhanced user experience

// Function to determine if an element is in viewport
export function isInViewport(element: HTMLElement, offset = 0): boolean {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) - offset &&
    rect.bottom >= 0 &&
    rect.left <= (window.innerWidth || document.documentElement.clientWidth) - offset &&
    rect.right >= 0
  );
}

// Animation types for different elements
export type AnimationType = 
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'bounce'
  | 'pulse'
  | 'spin'
  | 'flip'
  | 'shake';

// Animation timing functions
export type TimingFunction = 
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'spring';

// Animation configuration
export interface AnimationConfig {
  type: AnimationType;
  duration?: number; // in milliseconds
  delay?: number; // in milliseconds
  timingFunction?: TimingFunction;
  iterationCount?: number | 'infinite';
  threshold?: number; // 0 to 1, percentage of element visible to trigger animation
}

// Default animation configurations
export const defaultAnimations: Record<AnimationType, Omit<AnimationConfig, 'type'>> = {
  'fade-in': {
    duration: 800,
    delay: 0,
    timingFunction: 'ease-out',
    iterationCount: 1,
    threshold: 0.2
  },
  'slide-up': {
    duration: 800,
    delay: 0,
    timingFunction: 'ease-out',
    iterationCount: 1,
    threshold: 0.2
  },
  'slide-down': {
    duration: 800,
    delay: 0,
    timingFunction: 'ease-out',
    iterationCount: 1,
    threshold: 0.2
  },
  'slide-left': {
    duration: 800,
    delay: 0,
    timingFunction: 'ease-out',
    iterationCount: 1,
    threshold: 0.2
  },
  'slide-right': {
    duration: 800,
    delay: 0,
    timingFunction: 'ease-out',
    iterationCount: 1,
    threshold: 0.2
  },
  'zoom-in': {
    duration: 800,
    delay: 0,
    timingFunction: 'ease-out',
    iterationCount: 1,
    threshold: 0.2
  },
  'zoom-out': {
    duration: 800,
    delay: 0,
    timingFunction: 'ease-out',
    iterationCount: 1,
    threshold: 0.2
  },
  'bounce': {
    duration: 800,
    delay: 0,
    timingFunction: 'ease',
    iterationCount: 1,
    threshold: 0.2
  },
  'pulse': {
    duration: 1500,
    delay: 0,
    timingFunction: 'ease-in-out',
    iterationCount: 'infinite',
    threshold: 0.2
  },
  'spin': {
    duration: 1500,
    delay: 0,
    timingFunction: 'linear',
    iterationCount: 'infinite',
    threshold: 0.2
  },
  'flip': {
    duration: 1000,
    delay: 0,
    timingFunction: 'ease-in-out',
    iterationCount: 1,
    threshold: 0.2
  },
  'shake': {
    duration: 500,
    delay: 0,
    timingFunction: 'ease-in-out',
    iterationCount: 1,
    threshold: 0.2
  }
};

// Get CSS class for animation
export function getAnimationClass(type: AnimationType): string {
  return `animate-${type}`;
}

// Get CSS style for animation with custom configuration
export function getAnimationStyle(config: AnimationConfig): React.CSSProperties {
  const { duration, delay, timingFunction, iterationCount } = {
    ...defaultAnimations[config.type],
    ...config
  };
  
  return {
    animationDuration: `${duration}ms`,
    animationDelay: `${delay}ms`,
    animationTimingFunction: timingFunction === 'spring' 
      ? 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
      : timingFunction,
    animationIterationCount: iterationCount,
    animationFillMode: 'both'
  };
}

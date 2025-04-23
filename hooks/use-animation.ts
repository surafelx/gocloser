"use client";

import { useEffect, useRef, useState } from 'react';
import { 
  AnimationConfig, 
  AnimationType, 
  defaultAnimations, 
  getAnimationClass, 
  getAnimationStyle, 
  isInViewport 
} from '@/lib/animation-utils';

interface UseAnimationProps {
  type: AnimationType;
  duration?: number;
  delay?: number;
  timingFunction?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  iterationCount?: number | 'infinite';
  threshold?: number;
  triggerOnce?: boolean;
  disabled?: boolean;
}

export function useAnimation({
  type,
  duration,
  delay,
  timingFunction,
  iterationCount,
  threshold = 0.2,
  triggerOnce = true,
  disabled = false
}: UseAnimationProps) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Create animation configuration
  const config: AnimationConfig = {
    type,
    duration,
    delay,
    timingFunction,
    iterationCount,
    threshold
  };
  
  // Merge with default animation settings
  const animationConfig = {
    ...defaultAnimations[type],
    ...config
  };
  
  // Get animation class and style
  const animationClass = getAnimationClass(type);
  const animationStyle = getAnimationStyle(config);
  
  useEffect(() => {
    if (disabled) return;
    
    const element = ref.current;
    if (!element) return;
    
    const handleScroll = () => {
      if (triggerOnce && hasAnimated) return;
      
      const shouldBeVisible = isInViewport(element, element.offsetHeight * animationConfig.threshold);
      
      if (shouldBeVisible) {
        setIsVisible(true);
        if (triggerOnce) {
          setHasAnimated(true);
        }
      } else if (!triggerOnce) {
        setIsVisible(false);
      }
    };
    
    // Check initial visibility
    handleScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [animationConfig.threshold, disabled, hasAnimated, triggerOnce]);
  
  return {
    ref,
    isVisible,
    animationClass,
    animationStyle,
    style: isVisible ? animationStyle : { opacity: 0 },
    className: isVisible ? animationClass : ''
  };
}

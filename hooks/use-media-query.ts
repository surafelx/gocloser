"use client";

import { useEffect, useState } from 'react';

// Define breakpoints that match Tailwind's default breakpoints
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

type BreakpointKey = keyof typeof breakpoints;

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Set initial value
      setMatches(media.matches);
      
      // Define callback for media query change
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };
      
      // Add event listener
      media.addEventListener('change', listener);
      
      // Clean up
      return () => {
        media.removeEventListener('change', listener);
      };
    }
    
    // Default to false on server-side
    return () => {};
  }, [query]);
  
  return matches;
}

// Convenience hooks for common breakpoints
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${breakpoints.sm - 1}px)`);
}

export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.lg - 1}px)`);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
}

export function useIsBreakpoint(breakpoint: BreakpointKey, direction: 'up' | 'down' = 'up'): boolean {
  const query = direction === 'up'
    ? `(min-width: ${breakpoints[breakpoint]}px)`
    : `(max-width: ${breakpoints[breakpoint] - 1}px)`;
  
  return useMediaQuery(query);
}

// Hook to get current breakpoint
export function useCurrentBreakpoint(): BreakpointKey | null {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointKey | null>(null);
  
  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== 'undefined') {
      const checkBreakpoint = () => {
        const width = window.innerWidth;
        
        if (width >= breakpoints['2xl']) {
          setCurrentBreakpoint('2xl');
        } else if (width >= breakpoints.xl) {
          setCurrentBreakpoint('xl');
        } else if (width >= breakpoints.lg) {
          setCurrentBreakpoint('lg');
        } else if (width >= breakpoints.md) {
          setCurrentBreakpoint('md');
        } else if (width >= breakpoints.sm) {
          setCurrentBreakpoint('sm');
        } else {
          setCurrentBreakpoint(null); // Below smallest breakpoint
        }
      };
      
      // Set initial value
      checkBreakpoint();
      
      // Add event listener
      window.addEventListener('resize', checkBreakpoint);
      
      // Clean up
      return () => {
        window.removeEventListener('resize', checkBreakpoint);
      };
    }
    
    // Default to null on server-side
    return () => {};
  }, []);
  
  return currentBreakpoint;
}

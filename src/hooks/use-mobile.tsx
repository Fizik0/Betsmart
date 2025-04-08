import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check initial
    const checkSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Initial check
    checkSize();
    
    // Listen for window resize
    window.addEventListener('resize', checkSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkSize);
  }, [breakpoint]);

  return isMobile;
}
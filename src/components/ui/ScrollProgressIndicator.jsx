import React, { useState, useEffect } from 'react';

const ScrollProgressIndicator = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const calculateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    const throttledScrollHandler = () => {
      requestAnimationFrame(calculateScrollProgress);
    };

    window.addEventListener('scroll', throttledScrollHandler);
    calculateScrollProgress(); // Initial calculation

    return () => window.removeEventListener('scroll', throttledScrollHandler);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-101 h-1 bg-surface">
      <div 
        className="h-full bg-primary transition-all duration-100 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
};

export default ScrollProgressIndicator;
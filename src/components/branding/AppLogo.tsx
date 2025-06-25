// src/components/branding/AppLogo.tsx
import React from 'react';

interface AppLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

const AppLogo: React.FC<AppLogoProps> = ({ className, width = 36, height = 36 }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="M'LAAFI App Logo"
    >
      {/* Background: Green square with rounded corners */}
      <rect x="0" y="0" width="100" height="100" rx="20" fill="hsl(var(--primary))"/>
      
      {/* Vertical capsule/pill shape */}
      <rect x="42" y="20" width="16" height="60" rx="8" fill="white"/>
      
      {/* Horizontal capsule/pill shape, creating a cross */}
      <rect x="20" y="42" width="60" height="16" rx="8" fill="white"/>
    </svg>
  );
};

export default AppLogo;

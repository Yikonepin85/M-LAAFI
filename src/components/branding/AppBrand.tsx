
import React from 'react';
import AppLogo from '@/components/branding/AppLogo';
import { cn } from '@/lib/utils';

interface AppBrandProps {
  logoWidth?: number;
  logoHeight?: number;
  className?: string;
  nameClassName?: string;
  direction?: 'col' | 'row';
}

const AppBrand: React.FC<AppBrandProps> = ({ 
  logoWidth = 64, 
  logoHeight = 64, 
  className,
  nameClassName,
  direction = 'col'
}) => {
  return (
    <div className={cn(
      "flex items-center gap-2",
      direction === 'col' ? 'flex-col' : 'flex-row',
      className
    )}>
      <AppLogo width={logoWidth} height={logoHeight} />
      <p className={cn("font-bold font-headline text-primary", nameClassName)}>M'LAAFI</p>
    </div>
  );
};

export default AppBrand;

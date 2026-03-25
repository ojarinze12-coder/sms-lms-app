'use client';

import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  href?: string;
  variant?: 'light' | 'dark';
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
};

const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

export function Logo({ size = 'md', showText = true, className = '', href = '/', variant = 'light' }: LogoProps) {
  const isLight = variant === 'light';
  
  const LogoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`absolute inset-0 ${isLight ? 'bg-white' : 'bg-blue-500'} blur-lg opacity-30`}></div>
        <GraduationCap 
          className={`${sizeClasses[size]} ${isLight ? 'text-white' : 'text-blue-600'} relative`} 
          strokeWidth={1.5}
        />
      </div>
      {showText && (
        <span className={`${textSizes[size]} font-bold tracking-tight`}>
          <span className={isLight ? 'text-white' : 'text-blue-600'}>Edu</span>
          <span className={isLight ? 'text-white/90' : 'text-gray-800'}>Next</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex-shrink-0">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}

export function LogoIcon({ size = 'md', className = '', variant = 'dark' }: { size?: 'sm' | 'md' | 'lg'; className?: string; variant?: 'light' | 'dark' }) {
  const isLight = variant === 'light';
  return (
    <div className={`relative ${className}`}>
      <div className={`absolute inset-0 ${isLight ? 'bg-white' : 'bg-blue-500'} blur-lg opacity-30`}></div>
      <GraduationCap 
        className={`${sizeClasses[size]} ${isLight ? 'text-white' : 'text-blue-600'} relative`} 
        strokeWidth={1.5}
      />
    </div>
  );
}

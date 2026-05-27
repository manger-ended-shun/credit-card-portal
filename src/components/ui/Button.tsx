// src/components/ui/button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/helpers';
import { logActivity } from '@/utils/track-activity'; // 1. Import your tracker

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, onClick, ...props }, ref) => {
    
    // 2. Wrap the click handler
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Extract a label from the children for the log (or fallback to 'Button')
      const label = typeof children === 'string' ? children : 'Button';
      
      // Log the activity
      logActivity(`Clicked: ${label}`);
      
      // Trigger the original onClick if it was provided
      if (onClick) onClick(e);
    };

    return (
      <button
        ref={ref}
        onClick={handleClick} // 3. Use our new wrapper
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
            'border-2 border-gray-300 bg-transparent hover:bg-gray-100': variant === 'outline',
            'bg-transparent hover:bg-gray-100': variant === 'ghost',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
// src/components/ui/TrackedButton.tsx
'use client';
import { logActivity } from '@/utils/track-activity';

interface TrackedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // Used for identifying the button in analytics
}

export function TrackedButton({ label, onClick, children, ...props }: TrackedButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 1. Log the activity
    logActivity(`Button Clicked: ${label}`);
    
    // 2. Trigger the original onClick if it exists
    if (onClick) onClick(e);
  };

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
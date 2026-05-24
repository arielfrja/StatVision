import React from 'react';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  fullWidth?: boolean;
}

/**
 * StatVision Button - Powered by Material Web (M3)
 * Provides a professional, accessible, and high-performance utility action.
 */
export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  disabled,
  onClick,
  ..._props
}: ButtonProps) {
  
  // Mapping our variants to Material Web components
  const Component = 
    variant === 'primary' || variant === 'danger' ? 'md-filled-button' :
    variant === 'outline' || variant === 'secondary' ? 'md-outlined-button' : 
    'md-text-button';

  // Sizing and Custom Styling
  const sizeClasses = {
    sm: "h-8 text-[11px] [--md-sys-typescale-label-large-size:11px]",
    md: "h-10 text-sm",
    lg: "h-12 text-base"
  };

  // Specific overrides for variants not handled by global M3 tokens
  const styleOverrides: any = {};
  
  if (variant === 'danger') {
    styleOverrides['--md-sys-color-primary'] = 'var(--color-error)';
  }

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    // @ts-ignore - Material Web Components are custom elements
    <Component
      className={`${sizeClasses[size]} ${widthStyle} ${className} transition-opacity duration-200`}
      disabled={disabled || isLoading}
      onClick={onClick}
      style={styleOverrides}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
           <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
           <span>Processing</span>
        </div>
      ) : (
        <>
          {icon && (
            // @ts-ignore
            <md-icon slot="icon">{icon}</md-icon>
          )}
          {children}
        </>
      )}
    </Component>
  );
}

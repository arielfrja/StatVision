import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: string;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  
  const baseStyles = "relative flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed overflow-hidden focus-visible:outline-2 focus-visible:outline-electric focus-visible:outline-offset-4";
  
  const variants = {
    primary: "bg-electric text-[#00373a] shadow-[0_0_20px_var(--primary-glow)] hover:brightness-110 click-flash",
    secondary: "bg-white text-black hover:bg-electric hover:text-[#00373a] click-flash",
    outline: "bg-transparent border border-bd-ghost text-tx-secondary hover:border-electric hover:text-electric",
    ghost: "bg-container-low text-tx-dim hover:bg-container-highest hover:text-white",
    danger: "bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px] rounded-lg min-h-[36px]",
    md: "px-6 py-3 text-xs rounded-xl min-h-[48px]",
    lg: "px-10 py-4 text-xs rounded-xl min-h-[56px]",
    xl: "px-12 py-5 text-sm rounded-2xl min-h-[64px]"
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit z-10">
          <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
        </div>
      )}

      {/* Button Content */}
      <span className={`flex items-center gap-2 transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {icon && <span className="material-symbols-outlined text-base font-bold">{icon}</span>}
        {children}
      </span>

      {/* Glossy Overlay (Primary only) */}
      {variant === 'primary' && !isLoading && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none"></div>
      )}
    </button>
  );
}

import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // primary | secondary | outline | ghost | success | danger | warning
  size = 'md', // sm | md | lg
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) => {
  const variantStyles = {
    primary:
      'bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white border border-neutral-900 shadow-sm focus-visible:ring-2 focus-visible:ring-neutral-400',
    secondary:
      'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 border border-neutral-200 shadow-sm focus-visible:ring-2 focus-visible:ring-neutral-300',
    outline:
      'bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-neutral-900 shadow-sm focus-visible:ring-2 focus-visible:ring-neutral-300',
    ghost:
      'bg-transparent hover:bg-neutral-100 active:bg-neutral-200 text-neutral-600 hover:text-neutral-900 border border-transparent',
    success:
      'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm',
    danger:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm',
    warning:
      'bg-amber-600 hover:amber-700 active:bg-amber-800 text-white',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-md font-medium',
    md: 'px-4 py-2 text-sm gap-2 rounded-md font-medium',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2 rounded-md font-semibold',
  };

  const vClass = variantStyles[variant] || variantStyles.primary;
  const sClass = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none outline-none disabled:opacity-50 disabled:cursor-not-allowed ${vClass} ${sClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 13 : 15} />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 16} className="shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;

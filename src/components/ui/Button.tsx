'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles for all buttons
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  {
    variants: {
      variant: {
        // Primary - Deep Blue (#1E3A8A)
        primary: [
          "bg-[#1E3A8A] text-white shadow-sm",
          "hover:bg-[#1E40AF] hover:text-white hover:shadow-md",
          "active:bg-[#1E293B] active:text-white active:shadow-sm",
          "focus:ring-[#1E3A8A]",
          "dark:bg-[#1E3A8A] dark:text-white dark:hover:bg-[#1E40AF] dark:hover:text-white"
        ],
        
        // Secondary - Well-defined borders
        secondary: [
          "bg-white text-gray-900 border-2 border-gray-300 shadow-sm",
          "hover:bg-gray-50 hover:border-gray-400 hover:shadow-md",
          "active:bg-gray-100 active:shadow-sm",
          "focus:ring-gray-500",
          "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
          "dark:hover:bg-gray-700 dark:hover:border-gray-500"
        ],
        
        // Success - Vibrant Green (#22C55E)
        success: [
          "bg-[#22C55E] text-white shadow-sm",
          "hover:bg-[#16A34A] hover:text-white hover:shadow-md",
          "active:bg-[#15803D] active:text-white active:shadow-sm",
          "focus:ring-[#22C55E]",
          "dark:bg-[#22C55E] dark:text-white dark:hover:bg-[#16A34A] dark:hover:text-white"
        ],
        
        // Danger - For destructive actions
        danger: [
          "bg-red-600 text-white shadow-sm",
          "hover:bg-red-700 hover:shadow-md",
          "active:bg-red-800 active:shadow-sm",
          "focus:ring-red-500",
          "dark:bg-red-600 dark:hover:bg-red-700"
        ],
        
        // Warning - For caution actions
        warning: [
          "bg-yellow-500 text-white shadow-sm",
          "hover:bg-yellow-600 hover:shadow-md",
          "active:bg-yellow-700 active:shadow-sm",
          "focus:ring-yellow-500",
          "dark:bg-yellow-600 dark:hover:bg-yellow-700"
        ],
        
        // Ghost - Transparent with subtle hover
        ghost: [
          "bg-transparent text-gray-700 hover:bg-gray-100",
          "active:bg-gray-200",
          "focus:ring-gray-500",
          "dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700"
        ],
        
        // Outline - Deep Blue outline
        outline: [
          "bg-transparent text-[#1E3A8A] border border-[#1E3A8A]",
          "hover:bg-[#1E3A8A]/10 hover:text-[#1E3A8A]",
          "active:bg-[#1E3A8A]/20",
          "focus:ring-[#1E3A8A]",
          "dark:text-[#60A5FA] dark:border-[#60A5FA]",
          "dark:hover:bg-[#1E3A8A]/20 dark:hover:text-[#60A5FA]"
        ]
      },
      
      size: {
        xs: "h-7 px-2.5 text-xs",
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-8 text-base"
      },
      
      fullWidth: {
        true: "w-full",
        false: ""
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth, 
    loading, 
    leftIcon, 
    rightIcon, 
    disabled, 
    asChild = false,
    children, 
    ...props 
  }, ref) => {
    const buttonClasses = cn(buttonVariants({ variant, size, fullWidth, className }));
    
    if (asChild) {
      const child = children as React.ReactElement<any>;
      return React.cloneElement(child, {
        className: cn(buttonClasses, child.props?.className),
        ...props
      } as any);
    }

    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="mr-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          </div>
        )}
        
        {!loading && leftIcon && (
          <div className="mr-2 flex items-center">
            {leftIcon}
          </div>
        )}
        
        <span className="truncate">
          {children}
        </span>
        
        {!loading && rightIcon && (
          <div className="ml-2 flex items-center">
            {rightIcon}
          </div>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
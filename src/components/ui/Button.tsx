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
        // Primary - High contrast blue
        primary: [
          "bg-blue-600 text-white shadow-sm",
          "hover:bg-blue-700 hover:shadow-md",
          "active:bg-blue-800 active:shadow-sm",
          "focus:ring-blue-500",
          "dark:bg-blue-600 dark:hover:bg-blue-700"
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
        
        // Success - For positive actions
        success: [
          "bg-green-600 text-white shadow-sm",
          "hover:bg-green-700 hover:shadow-md",
          "active:bg-green-800 active:shadow-sm",
          "focus:ring-green-500",
          "dark:bg-green-600 dark:hover:bg-green-700"
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
        
        // Outline - Similar to secondary but more subtle
        outline: [
          "bg-transparent text-blue-600 border border-blue-600",
          "hover:bg-blue-50 hover:text-blue-700",
          "active:bg-blue-100",
          "focus:ring-blue-500",
          "dark:text-blue-400 dark:border-blue-400",
          "dark:hover:bg-blue-950 dark:hover:text-blue-300"
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
      return React.cloneElement(children as React.ReactElement, {
        className: buttonClasses,
        ...props
      });
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
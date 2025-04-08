import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import { cva, type VariantProps } from 'class-variance-authority';

const gradientButtonVariants = cva(
  "relative overflow-hidden transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 text-white font-medium",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600",
        blue: "bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600",
        green: "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600",
        red: "bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 hover:from-red-600 hover:via-rose-600 hover:to-orange-600",
        dark: "bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:via-gray-900 hover:to-black",
        betting: "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-sm",
        lg: "h-12 px-6 text-lg",
        icon: "h-10 w-10"
      },
      glow: {
        true: "before:absolute before:inset-0 before:bg-gradient-to-r before:blur-xl before:opacity-40 before:pointer-events-none",
        none: ""
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      glow: "none"
    },
  }
);

export interface GradientButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean;
  className?: string;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, size, glow, ...props }, ref) => {
    return (
      <button
        className={cn(gradientButtonVariants({ variant, size, glow, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
GradientButton.displayName = "GradientButton";

export { GradientButton };
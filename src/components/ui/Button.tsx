import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-gold-400 to-gold-600 text-abyss-950 font-semibold hover:from-gold-300 hover:to-gold-500 active:scale-[0.98] shadow-[0_8px_30px_-10px_rgba(227,185,33,0.55)]",
  secondary:
    "bg-abyss-800/80 text-steel-100 border border-steel-700 hover:bg-abyss-700 hover:border-gold-500/40",
  ghost: "text-steel-200 hover:bg-abyss-800/60 hover:text-gold-300",
  outline:
    "border border-gold-500/40 text-gold-300 hover:bg-gold-500/10 hover:border-gold-400",
  danger:
    "bg-red-600/90 text-white hover:bg-red-500 border border-red-500/40",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
  icon: "h-10 w-10 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss-900",
          "disabled:opacity-40 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

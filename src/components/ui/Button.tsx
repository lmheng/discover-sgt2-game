"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "xl";

/*
 * Retro OS keys: ink border, hard pixel shadow, pixel font.
 * Primary is wiTTy red with white text; its labels are bold and >= 19px so they
 * meet WCAG large-text contrast (white on #E63946 is ~4.2:1).
 */
const variants: Record<Variant, string> = {
  primary: "bg-witty-red text-white",
  secondary: "bg-mint text-ink",
  ghost: "bg-paper text-ink",
  danger: "bg-coral text-ink",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-4 py-2 text-[1.2rem] gap-2",
  lg: "min-h-14 px-6 py-2 text-[1.25rem] gap-2.5",
  xl: "min-h-16 px-6 py-3 text-[1.25rem] gap-3 sm:px-8 sm:text-[1.5rem]",
};

export function Button({
  variant = "primary",
  size = "lg",
  icon,
  iconAfter,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconAfter?: IconName;
  children: ReactNode;
}) {
  const iconSize = size === "xl" ? 26 : 22;
  return (
    <button
      type="button"
      className={`retro-press inline-flex items-center justify-center border-2 border-ink text-center font-pixel font-bold uppercase leading-tight shadow-pixel disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-pixel-sm ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon ? <Icon name={icon} size={iconSize} strokeWidth={2.6} strokeLinecap="square" /> : null}
      <span>{children}</span>
      {iconAfter ? <Icon name={iconAfter} size={iconSize} strokeWidth={2.6} strokeLinecap="square" /> : null}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center border-2 border-ink bg-paper px-1.5 font-pixel text-xs leading-5 text-ink shadow-pixel-sm">
      {children}
    </kbd>
  );
}

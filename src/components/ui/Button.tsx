"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-900/40 hover:brightness-110 active:brightness-95",
  secondary: "bg-white/10 text-ink border border-white/25 hover:bg-white/15",
  ghost: "bg-transparent text-muted hover:text-ink hover:bg-white/10",
  danger: "bg-red-500 text-white hover:brightness-110",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-5 text-base gap-2",
  lg: "min-h-14 px-7 text-lg gap-2.5",
  xl: "min-h-16 px-9 text-xl gap-3",
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
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-2xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === "xl" ? 26 : 22} /> : null}
      <span>{children}</span>
      {iconAfter ? <Icon name={iconAfter} size={size === "xl" ? 26 : 22} /> : null}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-md border border-white/30 bg-white/10 px-1.5 text-xs font-semibold text-ink">
      {children}
    </kbd>
  );
}

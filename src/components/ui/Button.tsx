import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-800 text-white hover:bg-brand-900 focus-visible:outline-brand-600",
  secondary:
    "bg-white text-brand-900 border border-brand-800 hover:bg-brand-50 focus-visible:outline-brand-600",
  danger:
    "bg-status-danger text-white hover:bg-red-800 focus-visible:outline-status-danger",
};

/** Shared classes for anything styled like a Button but rendered as a different element (e.g. a Link). */
export function buttonClasses(variant: ButtonVariant = "primary", className = ""): string {
  return `inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${variantClasses[variant]} ${className}`;
}

// Large, clearly-labelled action buttons per the design brief.
export function Button({
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses(variant, `disabled:cursor-not-allowed disabled:opacity-50 ${className}`)}
      disabled={disabled}
      {...props}
    />
  );
}

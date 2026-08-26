import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

// Consistent, accessible form field: always a visible <label>,
// error text tied to the input via aria-describedby.
export function Field({ label, name, error, id, ...inputProps }: FieldProps) {
  const inputId = id ?? `field-${name}`;
  const errorId = `${inputId}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-brand-900">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30"
        {...inputProps}
      />
      {error ? (
        <p id={errorId} className="text-sm text-status-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

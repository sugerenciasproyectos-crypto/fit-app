import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { useId } from 'react';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-action text-action-ink disabled:opacity-50',
    ghost: 'border border-rule text-ink',
    danger: 'border border-alert text-alert',
  }[variant];
  return (
    <button
      type="button"
      className={`min-h-11 rounded px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${styles} ${className}`}
      {...props}
    />
  );
}

interface FieldProps {
  label: string;
  error?: string | undefined;
  hint?: ReactNode;
  suffix?: string;
}

export function TextField({
  label,
  error,
  hint,
  suffix,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm text-ink-2">
        {label}
      </label>
      <div className="flex items-baseline gap-2">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className="num min-h-11 w-full rounded border border-rule bg-paper px-3 text-ink focus-visible:outline-2 focus-visible:outline-action aria-invalid:border-alert"
          {...props}
        />
        {suffix && <span className="num text-sm text-ink-2">{suffix}</span>}
      </div>
      {hint && !error && <p className="text-xs text-ink-2">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="text-sm text-alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  error,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm text-ink-2">
        {label}
      </label>
      <select
        id={id}
        className="min-h-11 rounded border border-rule bg-paper px-3 text-ink focus-visible:outline-2 focus-visible:outline-action"
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-sm text-alert">{error}</p>}
    </div>
  );
}

/** Renglón de ticket: etiqueta ........ valor */
export function Leader({
  label,
  value,
  strong = false,
}: {
  label: ReactNode;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className={`flex items-baseline gap-1 ${strong ? 'font-semibold' : ''}`}>
      <span className="shrink-0">{label}</span>
      <span aria-hidden className="leader min-w-4 flex-1" />
      <span className="num shrink-0 text-right">{value}</span>
    </div>
  );
}

export function Dashes() {
  return <hr className="my-3 border-0 border-t border-dashed border-rule" />;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="num text-xs tracking-[0.12em] text-ink-2 uppercase">{children}</h2>;
}

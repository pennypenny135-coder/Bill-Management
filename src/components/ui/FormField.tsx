import React from 'react';
import { cn } from '../../utils/cn';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

export function FormField({ label, required, error, children, hint }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500',
        'placeholder:text-slate-400 dark:placeholder:text-slate-500',
        error
          ? 'border-red-400 dark:border-red-600'
          : 'border-slate-300 dark:border-slate-600',
        className
      )}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function Select({ error, className, children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500',
        error
          ? 'border-red-400 dark:border-red-600'
          : 'border-slate-300 dark:border-slate-600',
        className
      )}
    >
      {children}
    </select>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function TextArea({ error, className, ...props }: TextAreaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500',
        'placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none',
        error
          ? 'border-red-400 dark:border-red-600'
          : 'border-slate-300 dark:border-slate-600',
        className
      )}
    />
  );
}

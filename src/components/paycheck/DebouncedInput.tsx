import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface DebouncedInputProps {
  value: number | string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
  debounceMs?: number;
}

export function DebouncedInput({
  value: externalValue,
  onChange,
  type = 'text',
  className,
  placeholder,
  debounceMs = 300,
}: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(String(externalValue));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value only when not focused
  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalValue(String(externalValue));
    }
  }, [externalValue]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(val);
    }, debounceMs);
  }, [onChange, debounceMs]);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onChange(localValue);
  }, [onChange, localValue]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type={type}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      placeholder={placeholder}
    />
  );
}

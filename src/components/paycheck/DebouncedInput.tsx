import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';

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
    // Flush any pending debounce immediately on blur
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
    <Input
      type={type}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={className}
      placeholder={placeholder}
    />
  );
}

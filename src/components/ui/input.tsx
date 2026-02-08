import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, onChange, ...props }, ref) => {
    // Handle number inputs to prevent leading zeros
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === 'number' && onChange) {
        let inputValue = e.target.value;
        // Remove leading zeros except for decimals like "0.5" or just "0"
        if (inputValue !== '' && inputValue !== '0' && !inputValue.startsWith('0.') && inputValue.startsWith('0') && inputValue.length > 1) {
          inputValue = inputValue.replace(/^0+/, '') || '0';
          e.target.value = inputValue;
        }
      }
      onChange?.(e);
    };

    // Format the display value to remove leading zeros for number type
    // Convert number to string and strip leading zeros (except for decimals)
    const formatDisplayValue = () => {
      if (type === 'number' && value !== undefined && value !== '') {
        const strValue = String(value);
        // Remove leading zeros but keep decimal zeros like 0.5
        if (!strValue.startsWith('0.') && strValue !== '0') {
          return strValue.replace(/^0+/, '') || '0';
        }
        return strValue;
      }
      return value;
    };
    
    const displayValue = formatDisplayValue();

    return (
      <input
        type={type}
        value={displayValue}
        onChange={handleChange}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

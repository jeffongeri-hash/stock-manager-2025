import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DeductionOption {
  value: string;
  label: string;
  icon: React.ElementType;
}

interface DeductionComboboxProps {
  options: DeductionOption[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
}

export function DeductionCombobox({ options, value, onSelect, placeholder = "Select or type..." }: DeductionComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const selectedOption = options.find(opt => opt.label === value);

  const handleSelect = (selectedValue: string) => {
    const option = options.find(opt => opt.value === selectedValue);
    if (option) {
      onSelect(option.label);
    }
    setOpen(false);
    setInputValue('');
  };

  const handleInputChange = (search: string) => {
    setInputValue(search);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      // Check if it matches an existing option
      const matchingOption = options.find(
        opt => opt.label.toLowerCase() === inputValue.toLowerCase()
      );
      
      if (matchingOption) {
        onSelect(matchingOption.label);
      } else {
        // Use custom value
        onSelect(inputValue.trim());
      }
      setOpen(false);
      setInputValue('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[180px] justify-between text-left font-normal"
        >
          <span className="truncate">
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search or type custom..." 
            value={inputValue}
            onValueChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-2 px-3 text-sm">
                Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to use "{inputValue}"
              </div>
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.label ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <option.icon className="mr-2 h-4 w-4" />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

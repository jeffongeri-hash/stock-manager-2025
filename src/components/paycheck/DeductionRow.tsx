import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeductionCombobox } from './DeductionCombobox';
import { DebouncedInput } from './DebouncedInput';
import { DollarSign, Percent, Trash2 } from 'lucide-react';

interface Deduction {
  id: string;
  label: string;
  value: number;
  type: 'percentage' | 'amount';
}

interface DeductionOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DeductionRowProps {
  deduction: Deduction;
  isPretax: boolean;
  options: DeductionOption[];
  onUpdate: (id: string, field: keyof Deduction, value: string | number) => void;
  onRemove: (id: string) => void;
}

export const DeductionRow = React.memo(function DeductionRow({ 
  deduction, 
  isPretax, 
  options,
  onUpdate,
  onRemove,
}: DeductionRowProps) {
  const handleLabelSelect = useCallback((label: string) => {
    onUpdate(deduction.id, 'label', label);
  }, [deduction.id, onUpdate]);

  const handleLabelChange = useCallback((val: string) => {
    onUpdate(deduction.id, 'label', val);
  }, [deduction.id, onUpdate]);

  const handleValueChange = useCallback((val: string) => {
    onUpdate(deduction.id, 'value', parseFloat(val) || 0);
  }, [deduction.id, onUpdate]);

  const handleTypeChange = useCallback((v: 'percentage' | 'amount') => {
    onUpdate(deduction.id, 'type', v);
  }, [deduction.id, onUpdate]);

  const handleRemove = useCallback(() => {
    onRemove(deduction.id);
  }, [deduction.id, onRemove]);

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg flex-wrap">
      <DeductionCombobox
        options={options}
        value={deduction.label}
        onSelect={handleLabelSelect}
        placeholder="Select or type..."
      />
      
      <DebouncedInput
        value={deduction.label}
        onChange={handleLabelChange}
        placeholder="Custom label"
        className="flex-1 min-w-[120px]"
        debounceMs={400}
      />
      
      <div className="flex items-center gap-1">
        <Select 
          value={deduction.type} 
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="amount">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Amount
              </div>
            </SelectItem>
            <SelectItem value="percentage">
              <div className="flex items-center gap-1">
                <Percent className="h-3 w-3" />
                Percent
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        <div className="relative">
          {deduction.type === 'amount' && (
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <DebouncedInput
            type="number"
            value={deduction.value || ''}
            onChange={handleValueChange}
            className={`w-[100px] ${deduction.type === 'amount' ? 'pl-7' : ''}`}
            placeholder="0"
            debounceMs={400}
          />
          {deduction.type === 'percentage' && (
            <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRemove}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});

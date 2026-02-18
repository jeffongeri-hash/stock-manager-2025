import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeductionCombobox } from './DeductionCombobox';
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

export function DeductionRow({ 
  deduction, 
  isPretax, 
  options,
  onUpdate,
  onRemove,
}: DeductionRowProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg flex-wrap">
      <DeductionCombobox
        options={options}
        value={deduction.label}
        onSelect={(label) => onUpdate(deduction.id, 'label', label)}
        placeholder="Select or type..."
      />
      
      <Input
        placeholder="Custom label"
        value={deduction.label}
        onChange={(e) => onUpdate(deduction.id, 'label', e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex-1 min-w-[120px]"
      />
      
      <div className="flex items-center gap-1">
        <Select 
          value={deduction.type} 
          onValueChange={(v: 'percentage' | 'amount') => onUpdate(deduction.id, 'type', v)}
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
          <Input
            type="number"
            value={deduction.value || ''}
            onChange={(e) => onUpdate(deduction.id, 'value', parseFloat(e.target.value) || 0)}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className={`w-[100px] ${deduction.type === 'amount' ? 'pl-7' : ''}`}
            placeholder="0"
          />
          {deduction.type === 'percentage' && (
            <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(deduction.id)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

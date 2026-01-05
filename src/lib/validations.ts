import { z } from 'zod';

// Common patterns
const symbolPattern = /^[A-Z0-9]{1,10}$/;
const safeTextPattern = /^[^<>]*$/; // Prevent basic XSS via script tags

// Trade Journal validation
export const tradeJournalSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol must be 10 characters or less')
    .regex(symbolPattern, 'Symbol must contain only letters and numbers')
    .transform(val => val.toUpperCase()),
  entry_date: z
    .string()
    .min(1, 'Entry date is required')
    .refine(val => !isNaN(Date.parse(val)), 'Invalid date format'),
  exit_date: z
    .string()
    .optional()
    .refine(val => !val || !isNaN(Date.parse(val)), 'Invalid date format'),
  strategy: z
    .string()
    .max(100, 'Strategy must be 100 characters or less')
    .regex(safeTextPattern, 'Invalid characters detected')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .regex(safeTextPattern, 'Invalid characters detected')
    .optional(),
  emotions: z
    .string()
    .max(500, 'Emotions must be 500 characters or less')
    .regex(safeTextPattern, 'Invalid characters detected')
    .optional(),
  lessons_learned: z
    .string()
    .max(1000, 'Lessons learned must be 1000 characters or less')
    .regex(safeTextPattern, 'Invalid characters detected')
    .optional(),
  tags: z
    .string()
    .max(200, 'Tags must be 200 characters or less')
    .regex(safeTextPattern, 'Invalid characters detected')
    .optional(),
  profit_loss: z
    .string()
    .optional()
    .refine(val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= -1000000 && parseFloat(val) <= 1000000), 
      'P&L must be a valid number between -1,000,000 and 1,000,000'),
});

export type TradeJournalFormData = z.infer<typeof tradeJournalSchema>;

// Alert validation - for price alerts
export const priceAlertSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol must be 10 characters or less')
    .regex(symbolPattern, 'Symbol must contain only letters and numbers')
    .transform(val => val.toUpperCase()),
  condition: z.enum(['above', 'below']),
  target_value: z
    .string()
    .min(1, 'Target price is required')
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Target price must be a positive number')
    .refine(val => parseFloat(val) <= 1000000, 'Target price must be less than 1,000,000'),
});

export type PriceAlertFormData = z.infer<typeof priceAlertSchema>;

// Alert validation - for percent alerts
export const percentAlertSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol must be 10 characters or less')
    .regex(symbolPattern, 'Symbol must contain only letters and numbers')
    .transform(val => val.toUpperCase()),
  condition: z.enum(['up', 'down']),
  target_value: z
    .string()
    .min(1, 'Percentage is required')
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Percentage must be a positive number')
    .refine(val => parseFloat(val) <= 100, 'Percentage must be 100 or less'),
});

export type PercentAlertFormData = z.infer<typeof percentAlertSchema>;

// Legacy Alert validation (keeping for backward compatibility)
export const alertSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol must be 10 characters or less')
    .regex(symbolPattern, 'Symbol must contain only letters and numbers')
    .transform(val => val.toUpperCase()),
  alert_type: z.enum(['price_above', 'price_below', 'percent_change', 'volume_spike']),
  condition: z.enum(['above', 'below', 'equals']),
  target_value: z
    .number()
    .min(0.0001, 'Target value must be positive')
    .max(1000000, 'Target value must be less than 1,000,000'),
});

// Trade Idea validation
export const tradeIdeaSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol must be 10 characters or less')
    .regex(symbolPattern, 'Symbol must contain only letters and numbers')
    .transform(val => val.toUpperCase()),
  idea_type: z.enum(['bullish', 'bearish', 'neutral']),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be 1000 characters or less')
    .regex(safeTextPattern, 'Invalid characters detected'),
  entry_price: z
    .number()
    .min(0.0001, 'Entry price must be positive')
    .max(1000000, 'Entry price must be less than 1,000,000')
    .optional(),
  target_price: z
    .number()
    .min(0.0001, 'Target price must be positive')
    .max(1000000, 'Target price must be less than 1,000,000')
    .optional(),
  stop_loss: z
    .number()
    .min(0.0001, 'Stop loss must be positive')
    .max(1000000, 'Stop loss must be less than 1,000,000')
    .optional(),
  timeframe: z.enum(['short', 'medium', 'long']).optional(),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional(),
});

export type TradeIdeaFormData = z.infer<typeof tradeIdeaSchema>;

// Report Settings validation  
export const reportSettingsSchema = z.object({
  email_address: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be 255 characters or less')
    .optional()
    .or(z.literal('')),
  zapier_webhook: z
    .string()
    .url('Invalid webhook URL')
    .max(500, 'Webhook URL must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  daily_report: z.boolean().optional(),
  weekly_report: z.boolean().optional(),
  monthly_report: z.boolean().optional(),
});

export type ReportSettingsFormData = z.infer<typeof reportSettingsSchema>;

// Trading Rule validation
export const tradingRuleSchema = z.object({
  name: z
    .string()
    .min(1, 'Rule name is required')
    .max(100, 'Rule name must be 100 characters or less')
    .regex(safeTextPattern, 'Invalid characters detected'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .regex(safeTextPattern, 'Invalid characters detected')
    .optional(),
});

export type TradingRuleFormData = z.infer<typeof tradingRuleSchema>;

// Sanitize text input for display
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate and format symbol
export function validateSymbol(symbol: string): { valid: boolean; formatted: string; error?: string } {
  const formatted = symbol.toUpperCase().trim();
  if (!formatted) {
    return { valid: false, formatted: '', error: 'Symbol is required' };
  }
  if (!symbolPattern.test(formatted)) {
    return { valid: false, formatted, error: 'Symbol must be 1-10 alphanumeric characters' };
  }
  return { valid: true, formatted };
}

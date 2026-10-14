import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { LegalPage } from '@/components/layout/LegalPage';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  email: z.string().trim().email('Enter a valid email').max(255, 'Email must be under 255 characters'),
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message must be under 2000 characters'),
});

type Fields = z.infer<typeof schema>;

export default function Contact() {
  const [form, setForm] = useState<Fields>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Partial<Record<keyof Fields, string>> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as keyof Fields] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSending(true);
    const { error } = await supabase.from('contact_messages').insert(parsed.data as { name: string; email: string; message: string });
    setSending(false);
    if (error) {
      toast.error('Could not send your message. Please try again.');
      return;
    }
    toast.success("Thanks! Your message was sent — we'll get back to you soon.");
    setForm({ name: '', email: '', message: '' });
  };

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <LegalPage title="Contact Us" showUpdated={false}>
      <p>Questions, feedback, privacy requests, or partnership ideas? Send us a message below.</p>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={form.name} onChange={set('name')} maxLength={100} />
          {errors.name && <p className="text-sm !text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={set('email')} maxLength={255} />
          {errors.email && <p className="text-sm !text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" rows={6} value={form.message} onChange={set('message')} maxLength={2000} />
          {errors.message && <p className="text-sm !text-destructive">{errors.message}</p>}
        </div>
        <Button type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send message'}</Button>
      </form>
    </LegalPage>
  );
}

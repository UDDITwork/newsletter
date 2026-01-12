'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { subscribe } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await subscribe(email, name || undefined);
      setSuccess(true);
      toast({
        title: 'Check your inbox!',
        description: result.message,
        variant: 'success',
      });
      setEmail('');
      setName('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <div className="mb-4 text-4xl">✉️</div>
        <h3 className="text-lg font-semibold mb-2">Check your inbox!</h3>
        <p className="text-muted-foreground">
          We&apos;ve sent you a confirmation email. Click the link to confirm your subscription.
        </p>
        <Button
          variant="link"
          className="mt-4"
          onClick={() => setSuccess(false)}
        >
          Subscribe another email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
        <Input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Subscribing...
          </>
        ) : (
          'Subscribe'
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        No spam, ever. Unsubscribe anytime.
      </p>
    </form>
  );
}

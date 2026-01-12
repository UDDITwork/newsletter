'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { confirmSubscription } from '@/lib/api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: { token: string };
}

export default function ConfirmPage({ params }: PageProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function confirm() {
      try {
        const result = await confirmSubscription(params.token);
        setStatus('success');
        setMessage(result.message);
      } catch (e) {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Confirmation failed');
      }
    }

    confirm();
  }, [params.token]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            {status === 'loading' && (
              <>
                <div className="mx-auto mb-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <CardTitle>Confirming...</CardTitle>
                <CardDescription>Please wait while we confirm your subscription.</CardDescription>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle>You&apos;re subscribed!</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="mx-auto mb-4">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <CardTitle>Confirmation failed</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="text-center">
            {status === 'success' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Thank you for confirming your subscription. You&apos;ll start receiving our newsletter soon.
                </p>
                <Button asChild>
                  <Link href="/newsletter">Browse newsletters</Link>
                </Button>
              </div>
            )}
            {status === 'error' && (
              <Button asChild>
                <Link href="/">Subscribe again</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

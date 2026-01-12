'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { unsubscribe } from '@/lib/api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: { token: string };
}

export default function UnsubscribePage({ params }: PageProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function handleUnsubscribe() {
      try {
        const result = await unsubscribe(params.token);
        setStatus('success');
        setMessage(result.message);
      } catch (e) {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Unsubscribe failed');
      }
    }

    handleUnsubscribe();
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
                <CardTitle>Processing...</CardTitle>
                <CardDescription>Please wait while we process your request.</CardDescription>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle>Unsubscribed</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="mx-auto mb-4">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <CardTitle>Something went wrong</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="text-center">
            {status === 'success' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We&apos;re sorry to see you go. You won&apos;t receive any more emails from us.
                </p>
                <p className="text-sm text-muted-foreground">
                  Changed your mind?
                </p>
                <Button asChild variant="outline">
                  <Link href="/">Subscribe again</Link>
                </Button>
              </div>
            )}
            {status === 'error' && (
              <Button asChild>
                <Link href="/">Go home</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

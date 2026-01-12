'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifyMagicLink } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const token = searchParams.get('token');
  const returnUrl = searchParams.get('returnUrl') || '/';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus('error');
        setError('Invalid link - no token provided');
        return;
      }

      try {
        await verifyMagicLink(token);
        await refresh();
        setStatus('success');
        setTimeout(() => {
          router.push(returnUrl);
        }, 2000);
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Verification failed');
      }
    }

    verify();
  }, [token, returnUrl, router, refresh]);

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
                <CardTitle>Verifying...</CardTitle>
                <CardDescription>Please wait while we sign you in.</CardDescription>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle>You&apos;re signed in!</CardTitle>
                <CardDescription>Redirecting you now...</CardDescription>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="mx-auto mb-4">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <CardTitle>Verification failed</CardTitle>
                <CardDescription>{error}</CardDescription>
              </>
            )}
          </CardHeader>
          {status === 'error' && (
            <CardContent className="text-center">
              <Button asChild>
                <Link href="/auth/login">Try again</Link>
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

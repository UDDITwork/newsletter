import { Suspense } from 'react';
import LoginForm from './login-form';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Suspense fallback={<div className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

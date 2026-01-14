import { Suspense } from 'react';
import VerifyContent from './verify-content';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function VerifyPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Suspense fallback={<div className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>}>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}

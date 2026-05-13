'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    // If someone visits /admin directly, forward them to the dashboard entry point.
    // The middleware and AdminGuard will handle forcing a login if they are unauthenticated.
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-foreground/70">Redirecting...</p>
    </div>
  );
}

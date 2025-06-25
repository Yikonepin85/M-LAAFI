
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppBrand from '@/components/branding/AppBrand';

export default function HomePage() {
  const router = useRouter();
  const { isLocked, isPinSet, isLockEnabled } = useAuth();

  useEffect(() => {
    if (isLockEnabled && isPinSet && isLocked) {
      router.replace('/lockscreen');
    } else if (isLockEnabled && !isPinSet) {
      router.replace('/lockscreen'); // Go to lockscreen for PIN setup
    }
    else {
      const redirectPath = localStorage.getItem('redirectAfterUnlock') || '/dashboard';
      if (redirectPath !== '/lockscreen') { // Avoid redirect loop if lockscreen was somehow stored
         router.replace(redirectPath);
         localStorage.removeItem('redirectAfterUnlock'); // Clean up
      } else {
        router.replace('/dashboard'); // Default fallback
      }
    }
  }, [isLocked, isPinSet, isLockEnabled, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <AppBrand className="mb-4" logoWidth={72} logoHeight={72} nameClassName="text-3xl" />
      <p className="text-muted-foreground">Chargement de votre espace santé...</p>
      {/* You can add a spinner or loading animation here */}
    </div>
  );
}

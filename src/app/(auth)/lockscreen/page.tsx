
"use client";

import React, { useEffect } from 'react';
import LockScreenForm from '@/components/auth/LockScreenForm';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LockScreenPage() {
  const { isLocked, isPinSet, isLockEnabled } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect away from lockscreen if:
    // 1. Lock feature is disabled.
    if (!isLockEnabled) {
      router.replace('/');
      return;
    }
    // 2. Lock feature is enabled, a PIN is set, AND the app is already unlocked.
    if (isLockEnabled && isPinSet && !isLocked) {
      router.replace('/');
      return;
    }
    // Otherwise, stay on the lockscreen. It's needed either for unlocking or for initial PIN setup.
  }, [isLocked, isPinSet, isLockEnabled, router]);

  // Show LockScreenForm if lock is enabled and (app is locked OR PIN needs to be set)
  if (isLockEnabled && (isLocked || !isPinSet)) {
    return <LockScreenForm />;
  }
  
  // Fallback loading state, should ideally not be shown for long,
  // as useEffect should handle redirection or the above condition should render the form.
  return <div className="flex items-center justify-center min-h-screen"><p>Chargement...</p></div>;
}

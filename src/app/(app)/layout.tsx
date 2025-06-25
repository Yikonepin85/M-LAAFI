
"use client";
import React, { useEffect, useState } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import BottomNavigationBar from '@/components/layout/BottomNavigationBar';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { requestNotificationPermission } from '@/lib/notificationUtils';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLocked, isPinSet, isLockEnabled } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Request notification permission on app load
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        requestNotificationPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Notification permission granted.');
          } else {
            console.log('Notification permission not granted or denied.');
          }
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!hasMounted) {
      return; 
    }

    if (isLockEnabled && isPinSet && isLocked) {
      if (pathname !== '/lockscreen') {
        localStorage.setItem('redirectAfterUnlock', pathname);
      }
      router.replace('/lockscreen');
    } else if (!isPinSet && isLockEnabled && pathname !== '/lockscreen') {
      router.replace('/lockscreen');
    }
  }, [isLocked, isPinSet, isLockEnabled, router, pathname, hasMounted]);

  if (!hasMounted) {
    return <div className="flex items-center justify-center min-h-screen"><p>Chargement...</p></div>;
  }

  if (isLockEnabled && isPinSet && isLocked) {
     return <div className="flex items-center justify-center min-h-screen"><p>Redirection vers l'écran de verrouillage...</p></div>;
  }
   if (!isPinSet && isLockEnabled && pathname !== '/lockscreen') {
    return <div className="flex items-center justify-center min-h-screen"><p>Configuration du PIN requise...</p></div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 pb-20 pt-4"> {/* pt-4 for spacing below header, pb-20 for bottom nav */}
        {children}
      </main>
      <BottomNavigationBar />
    </div>
  );
}

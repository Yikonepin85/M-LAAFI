
// src/lib/notificationUtils.ts
'use client';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return 'denied';
  }
  return Notification.requestPermission();
}

export function showNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return null;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/icons/icon-192x192.png', // Default icon
      badge: '/icons/icon-72x72.png',  // Small badge icon
      ...options,
    });
    return notification;
  } else if (Notification.permission === 'denied') {
    console.warn('Notification permission has been denied.');
    return null;
  } else {
    // Permission is 'default', user hasn't decided yet.
    // You might want to prompt them again or guide them to settings.
    console.info('Notification permission not yet granted.');
    return null;
  }
}

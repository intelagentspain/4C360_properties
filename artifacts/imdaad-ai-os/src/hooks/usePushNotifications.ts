import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export type PushState = 'unsupported' | 'default' | 'subscribed' | 'denied' | 'loading';

export function usePushNotifications(email?: string) {
  const [state, setState] = useState<PushState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }

    navigator.serviceWorker.register('/sw.js').then(() => {
      return Notification.permission;
    }).then(permission => {
      if (permission === 'denied') {
        setState('denied');
      } else if (permission === 'granted') {
        navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription()).then(sub => {
          setState(sub ? 'subscribed' : 'default');
        });
      } else {
        setState('default');
      }
    }).catch(() => {
      setState('unsupported');
    });
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!email) {
      setError('Email is required to subscribe to push notifications');
      return false;
    }

    setState('loading');
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;

      const { publicKey } = await api.push.getPublicKey();
      const applicationServerKey = urlBase64ToArrayBuffer(publicKey);

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      await api.push.subscribe(email, subscription.toJSON() as PushSubscriptionJSON);

      setState('subscribed');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setState('default');
      return false;
    }
  }, [email]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState('loading');
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await api.push.unsubscribe(subscription.endpoint);
        await subscription.unsubscribe();
      }

      setState('default');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setState('subscribed');
      return false;
    }
  }, []);

  return { state, error, subscribe, unsubscribe };
}

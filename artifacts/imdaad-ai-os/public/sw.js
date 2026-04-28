self.addEventListener('push', function(event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'AI-OS', body: event.data.text() };
  }

  const options = {
    body: payload.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.tag || 'imdaad-notification',
    data: payload.data || {},
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View Job' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'AI-OS', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const data = event.notification.data || {};
  const workOrderId = data.workOrderId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (workOrderId) {
            client.postMessage({ type: 'OPEN_WORK_ORDER', workOrderId });
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

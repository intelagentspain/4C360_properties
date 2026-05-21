self.addEventListener('push', function(event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'DevelopmentX', body: event.data.text() };
  }

  const options = {
    body: payload.body || '',
    icon: '/4c-logo.png',
    badge: '/4c-logo.png',
    tag: payload.tag || 'developmentx-notification',
    data: payload.data || {},
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View Job' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'DevelopmentX', options)
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

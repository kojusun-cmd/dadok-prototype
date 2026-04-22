/* global importScripts, firebase, self, clients */

importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyAY7VmMHV333Bi7zTgnJshIRAFWnBWn6BU',
  authDomain: 'dadok-app.firebaseapp.com',
  projectId: 'dadok-app',
  storageBucket: 'dadok-app.firebasestorage.app',
  messagingSenderId: '702510138781',
  appId: '1:702510138781:web:fbfcfc29a8de5d3da35b74',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload?.data || {};
  const title = payload?.notification?.title || data.title || '다독 알림';
  const body = payload?.notification?.body || data.body || '새로운 알림이 도착했습니다.';
  const notificationOptions = {
    body,
    icon: '/assets/images/logo.png',
    badge: '/assets/images/logo.png',
    data: {
      clickUrl: data.clickUrl || '/',
    },
  };
  self.registration.showNotification(title, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickUrl = event?.notification?.data?.clickUrl || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(clickUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
      return null;
    }),
  );
});

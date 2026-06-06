importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBs1w6L6-cFNbTLNH1UTgi6rAxtvwH6VWw",
  authDomain: "asistencia-vehicular-bd3a4.firebaseapp.com",
  projectId: "asistencia-vehicular-bd3a4",
  storageBucket: "asistencia-vehicular-bd3a4.firebasestorage.app",
  messagingSenderId: "1071893055653",
  appId: "1:1071893055653:web:3d0623359d189a04cde54c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM] Notificacion en background:', payload);
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  });
});
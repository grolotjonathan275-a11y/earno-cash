importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "KOLE_API_KEY_OU_LA",
  authDomain: "earno-6270d.firebaseapp.com",
  projectId: "earno-6270d",
  storageBucket: "earno-6270d.appspot.com",
  messagingSenderId: "KOLE_SENDER_ID_OU_LA",
  appId: "KOLE_APP_ID_OU_LA"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, image } = payload.notification;
  self.registration.showNotification(title, {
    body: body,
    icon: '/favicon.svg',
    image: image,
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: payload.data,
  });
});
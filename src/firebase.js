import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDQd7NKxf8tovNpUwNEMlh_EHcrYLOgySU",
  authDomain: "earno-6270d.firebaseapp.com",
  projectId: "earno-6270d",
  storageBucket: "earno-6270d.appspot.com",
  messagingSenderId: "688898337336",
  appId: "1:688898337336:web:4fd30b8a9c9f3c3d2714cd"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BAc1kKzzVQsznNGcc9EHXD5zrwV69x9mAWDd3pLQUP4LL8tuRyJv4mqc5kUV5_p1op2xLDlEhbePo739W8DotR0	27 jun 2"
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error("Notification error:", error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export { messaging };
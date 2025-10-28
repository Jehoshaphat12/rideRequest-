// hooks/useNotifications.ts
import { auth, db } from "@/lib/firebaseConfig";
import { sendPushNotification } from "@/services/sendPushNotification";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  title: string;
  body: string;
  type?: string;
  rideId?: string;
  createdAt?: any;
  read?: boolean;
  expoPushToken?: string; // add this if you're storing tokens
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const newNotifs: any[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notif = { id: change.doc.id, ...change.doc.data() } as Notification;
          newNotifs.push(notif);

          // 🚀 Trigger push notification if available
          if (notif.expoPushToken && notif.title && notif.body) {
            sendPushNotification(notif.expoPushToken, notif.title, notif.body);
          }
        }
      });

      setNotifications((prev) => [...newNotifs, ...prev]);
    });

    return () => unsub();
  }, []);

  return notifications;
}

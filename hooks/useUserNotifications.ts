import { auth, db } from "@/lib/firebaseConfig";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useUserNotifications() {
    const [notifications, setNotifications] = useState<any[]>([])

    useEffect(() => {
        const user = auth.currentUser
        if(!user) return

        const q = query(
            collection(db, "users", user.uid, "notifications"),
            orderBy("createdAt", "desc")
        )

        const unsub = onSnapshot(q, (snap) => {
            setNotifications(snap.docs.map((doc) => ({id: doc.id, ...doc.data()})))
        })

        return () => unsub()
    }, [auth.currentUser])

    return notifications
}


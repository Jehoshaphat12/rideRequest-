import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// admin.initializeApp();

export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data: any = {}
) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data: { ...data, screen: "RideDetails" },
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Push API responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
}

// export const notifyRidersOnNewRequest = functions.firestore
//   .document("rides/{rideId}")
//   .onCreate(async (snap: functions.firestore.QueryDocumentSnapshot) => {
//     const ride = snap.data();
//     if (!ride) return;

//     try {
//       const ridersSnap = await admin.firestore()
//         .collection("users")
//         .where("role", "==", "rider")
//         .where("expoPushToken", "!=", null)
//         .get();

//       const notificationPromises = [];
      
//       for (const riderDoc of ridersSnap.docs) {
//         const rider = riderDoc.data();
//         if (rider.expoPushToken) {
//           notificationPromises.push(
//             sendPushNotification(
//               rider.expoPushToken,
//               "🚖 New Ride Request",
//               "A passenger nearby needs a ride!",
//               { rideId: snap.id }
//             ).catch(error => {
//               console.error(`Failed to notify rider ${riderDoc.id}:`, error);
//               return null;
//             })
//           );
//         }
//       }

//       await Promise.all(notificationPromises);
//       console.log(`Notification process completed for ride ${snap.id}`);
      
//     } catch (error) {
//       console.error("Error in notifyRidersOnNewRequest:", error);
//     }
//   });

interface Rider {
  role: string;
  expoPushToken?: string;
}

interface Ride {
  id: string;
  [key: string]: any; // for other ride properties
}

export const notifyRidersOnNewRequest = functions.firestore
  .onDocumentCreated('rides/{rideId}', async (event: functions.Change<functions.firestore.DocumentSnapshot>) => {
    const ride = event.data?.data() as Ride | undefined;
    if (!ride) return;

    const ridersSnap = await admin.firestore().collection("users").where("role", "==", "rider").get();

    for (const doc of ridersSnap.docs) {
      const rider = doc.data() as Rider;
      if (rider.expoPushToken) {
        await sendPushNotification(
          rider.expoPushToken,
          "🚖 New Ride Request",
          "A passenger nearby needs a ride!",
          { rideId: ride.id }
        );
      }
    }
  });
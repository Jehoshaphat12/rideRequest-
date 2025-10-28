export async function sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
) {
    const message = {
        to: expoPushToken,
        sound: "default",
        title,
        body,
        data: {screen: "RideDetails"}, // you can use this  to navigate to a specific screen
    }

    await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  })
}
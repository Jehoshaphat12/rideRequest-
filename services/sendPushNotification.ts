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
        data: {screen, ...data}, // you can use this  to navigate to a specific screen
    }

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

    const result = await response.json();
    console.log("Expo push response:", result);
    return result;
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}
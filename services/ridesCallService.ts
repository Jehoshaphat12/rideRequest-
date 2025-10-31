import AsyncStorage from "@react-native-async-storage/async-storage";

export const markRideAsIgnored = async (rideId: string) => {
  const ignored = JSON.parse(await AsyncStorage.getItem("ignoredRides") || "[]");
  if (!ignored.includes(rideId)) {
    ignored.push(rideId);
    await AsyncStorage.setItem("ignoredRides", JSON.stringify(ignored));
  }
};

export const hasIgnoredRide = async (rideId: string): Promise<boolean> => {
  const ignored = JSON.parse(await AsyncStorage.getItem("ignoredRides") || "[]");
  return ignored.includes(rideId);
};
export const clearIgnoredRides = async () => {
  await AsyncStorage.removeItem("ignoredRides");
}
import * as Location from "expo-location";

export const getLocationWithH3 = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") throw new Error("Permission to access location was denied");

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;


    return {
        latitude,
        longitude,
    }
}
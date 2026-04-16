import { useEffect, useState } from "react";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { socket } from "../services/socket";


const RESOLUTION = 9;

export default function MapScreen() {
  const [location, setLocation] = useState<any>(null);
  const [drivers, setDrivers] = useState<any>({});

  useEffect(() => {
    let subscriber: Location.LocationSubscription;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 1,
        },
        (loc) => {
            const coords = loc.coords;
            

            const payload = {
                latitude: coords.latitude,
                longitude: coords.longitude,
            }
          setLocation(coords);

          // 🚀 SEND to server
          socket.emit("driver:update-location", payload);
        },
      );
    };

    startTracking();

    return () => {
      subscriber && subscriber.remove();
    };
  }, []);

  // 🔥 Listen for all drivers
  useEffect(() => {
      socket.on("drivers:update", (data) => {
        console.log("Drivers updated", data);
      setDrivers(data);
    });

    return () => {
      socket.off("drivers:update");
    };
  }, []);

  if (!location) return null;

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* 🧍 You */}
        <Marker coordinate={location} title="You" />

        {/* 🚗 Other Drivers */}
        {Object.entries(drivers).map(([id, driver]: any) => {
          console.log("Rendering driver:", id);

          return (
            <Marker
              key={id}
              coordinate={{
                latitude: driver.latitude,
                longitude: driver.longitude,
              }}
              title={id === socket.id ? "You (Driver)" : "Other Driver"}
              pinColor={id === socket.id ? "blue" : "red"}
            />
          );
        })}
      </MapView>
    </View>
  );
}

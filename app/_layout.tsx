import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { Colors } from './constants/theme';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <StatusBar style="light" backgroundColor={Colors.surface} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.surface },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="screens/DriverDashboardScreen" />
        <Stack.Screen name="screens/CustomerCreateOrderScreen" />
        <Stack.Screen name="screens/CustomerLiveTrackingScreen" />
      </Stack>
    </View>
  );
}

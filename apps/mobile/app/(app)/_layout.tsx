import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function AppLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
            }}
        >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(doctor-tabs)" />
            <Stack.Screen name="(clinic-tabs)" />
        </Stack>
    );
}

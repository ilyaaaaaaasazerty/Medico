import { Stack } from 'expo-router';
import Theme from '@/constants/Theme';

export default function TransportLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Theme.Colors.background },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="ride/[id]" />
            <Stack.Screen name="schedule" />
            <Stack.Screen name="history" />
        </Stack>
    );
}

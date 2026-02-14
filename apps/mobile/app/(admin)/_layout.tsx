import { Stack } from 'expo-router';
import Theme from '@/constants/Theme';

export default function AdminLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: Theme.Colors.background,
                },
                headerTintColor: Theme.Colors.primary,
                headerTitleStyle: {
                    fontWeight: Theme.Typography.Weight.black as any,
                    fontSize: Theme.Typography.Scale.h3,
                    color: Theme.Colors.text,
                },
                contentStyle: {
                    backgroundColor: Theme.Colors.background,
                },
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen
                name="dashboard"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="verify"
                options={{
                    title: 'Verification Protocol',
                    presentation: 'modal',
                    headerShown: true,
                }}
            />
        </Stack>
    );
}

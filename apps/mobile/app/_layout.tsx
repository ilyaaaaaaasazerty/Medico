import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import '@/i18n';

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider>
            <AuthProvider>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <Stack
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(app)" options={{ headerShown: false }} />
                    <Stack.Screen name="(admin)" options={{ headerShown: false }} />
                </Stack>
            </AuthProvider>
        </ThemeProvider>
    );
}

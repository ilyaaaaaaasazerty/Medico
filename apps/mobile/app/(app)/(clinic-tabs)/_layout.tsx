import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { useAuth } from '@/providers/AuthProvider';

export default function ClinicTabLayout() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'CLINIC_ADMIN';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Theme.Colors.surface,
                    borderTopColor: Theme.Colors.divider,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: Theme.Colors.primary,
                tabBarInactiveTintColor: Theme.Colors.textSecondary,
                tabBarLabelStyle: {
                    fontFamily: Theme.Typography.Weight.bold,
                    fontSize: 11,
                }

            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Hub',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="grid" size={size - 2} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="appointments"
                options={{
                    title: 'Queues',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="doctors"
                options={{
                    title: 'Medical',
                    href: isAdmin ? '/(app)/(clinic-tabs)/doctors' : null,
                    tabBarItemStyle: { display: isAdmin ? 'flex' : 'none' },
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="medkit" size={size - 2} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="staff"
                options={{
                    title: 'Ops',
                    href: isAdmin ? '/(app)/(clinic-tabs)/staff' : null,
                    tabBarItemStyle: { display: isAdmin ? 'flex' : 'none' },
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="rooms"
                options={{
                    title: 'Units',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="business" size={size - 2} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="options" size={size - 2} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

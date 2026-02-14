import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { Platform } from 'react-native';

export default function DoctorTabLayout() {
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
                    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                    fontWeight: '700',
                    fontSize: 10,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="schedule"
                options={{
                    title: 'Schedule',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="records"
                options={{
                    title: 'Patients',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "people" : "people-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: 'Messages',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "settings" : "settings-outline"} size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

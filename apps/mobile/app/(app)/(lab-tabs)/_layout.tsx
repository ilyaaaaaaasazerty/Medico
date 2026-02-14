import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';

export default function LabTabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Theme.Colors.card,
                    borderTopColor: Theme.Colors.divider,
                    height: Platform.OS === 'ios' ? 96 : 72,
                    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: Theme.Colors.primary,
                tabBarInactiveTintColor: Theme.Colors.textSecondary,
                tabBarLabelStyle: {
                    fontFamily: 'Inter-SemiBold',
                    fontSize: 11,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="tests"
                options={{
                    title: 'Testing',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "flask" : "flask-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: 'Inbox',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Control',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

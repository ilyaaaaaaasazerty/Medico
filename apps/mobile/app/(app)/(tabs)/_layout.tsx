import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Theme.Colors.surface,
                    borderTopColor: Theme.Colors.divider,
                    height: Theme.Layout.bottomTabHeight,
                    paddingBottom: 25,
                    paddingTop: 10,
                    borderTopWidth: 1.5,
                },
                tabBarActiveTintColor: Theme.Colors.primary,
                tabBarInactiveTintColor: Theme.Colors.textSecondary,
                tabBarLabelStyle: {
                    fontWeight: Theme.Typography.Weight.bold as any,
                    fontSize: 11,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'My Day',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="records"
                options={{
                    title: 'My Health',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "heart" : "heart-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "compass" : "compass-outline"} size={size} color={color} />
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
                name="blood-donation"
                options={{
                    title: 'Donate',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "water" : "water-outline"} size={size} color={color} />
                    ),
                }}
            />

            {/* Hidden Tabs */}
            <Tabs.Screen
                name="appointments"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

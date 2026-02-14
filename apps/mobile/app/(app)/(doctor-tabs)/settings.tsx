import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

export default function DoctorSettingsScreen() {
    const router = useRouter();
    const { logout, user } = useAuth();
    const doctorData = (user as any)?.doctor;

    const menuItems = [
        {
            id: 'profile',
            title: 'Professional Profile',
            subtitle: 'Edit your bio, photo, and specialties',
            icon: 'person',
            color: Theme.Colors.primary,
            onPress: () => router.push('/(app)/edit-doctor-profile'),
        },
        {
            id: 'availability',
            title: 'Manage Availability',
            subtitle: 'Set your working hours and slots',
            icon: 'calendar',
            color: Theme.Colors.warning,
            onPress: () => router.push('/(app)/manage-availability'),
        },
        {
            id: 'designer',
            title: 'Prescription Designer',
            subtitle: 'Customize your prescription layout',
            icon: 'color-palette',
            color: Theme.Colors.secondary,
            onPress: () => router.push('/(app)/document-template-editor'),
        },
        {
            id: 'templates',
            title: 'Quick Templates',
            subtitle: 'Manage common medication lists',
            icon: 'copy',
            color: '#5856D6',
            onPress: () => router.push('/(app)/prescription-templates'),
        },
        {
            id: 'security',
            title: 'Account Security',
            subtitle: 'Change your login password',
            icon: 'lock-closed',
            color: Theme.Colors.success,
            onPress: () => router.push('/(app)/change-password'),
        },
        {
            id: 'support',
            title: 'Help & Support',
            subtitle: 'Contact Medico support team',
            icon: 'help-circle',
            color: Theme.Colors.textSecondary,
            onPress: () => Alert.alert('Support', 'Contact us at support@medico.com'),
        },
    ];

    return (
        <AppScreen padding={false} style={styles.container}>
            <View style={styles.header}>
                <AppText variant="h3" weight="bold">Settings</AppText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <AppCard style={styles.profileCard} padding="lg">
                    <View style={styles.avatar}>
                        <AppText variant="h3" color="white" weight="bold">
                            {doctorData?.lastName?.[0] || user?.email?.[0]?.toUpperCase() || 'D'}
                        </AppText>
                    </View>
                    <View style={styles.userInfo}>
                        <AppText variant="h3" weight="bold">
                            Dr. {doctorData?.firstName || 'Unknown'} {doctorData?.lastName || 'Doctor'}
                        </AppText>
                        <AppText variant="body" color="textSecondary">{user?.email}</AppText>
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color={Theme.Colors.success} />
                            <AppText variant="caption" color="success" weight="bold">VERIFIED PROVIDER</AppText>
                        </View>
                    </View>
                </AppCard>

                <View style={styles.menuSection}>
                    {menuItems.map((item, index) => (
                        <AppCard
                            key={item.id}
                            style={styles.menuItem}
                            padding="md"
                            onPress={item.onPress}
                        >
                            <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                                <Ionicons name={item.icon as any} size={22} color={item.color} />
                            </View>
                            <View style={styles.menuText}>
                                <AppText variant="body" weight="bold">{item.title}</AppText>
                                <AppText variant="caption" color="textSecondary" numberOfLines={1}>{item.subtitle}</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Theme.Colors.textSecondary} />
                        </AppCard>
                    ))}
                </View>

                <AppButton
                    title="Log Out"
                    variant="ghost"
                    textStyle={{ color: Theme.Colors.error }}
                    icon={<Ionicons name="log-out-outline" size={20} color={Theme.Colors.error} />}
                    onPress={logout}
                    style={styles.logoutBtn}
                />

                <AppText variant="caption" color="textSecondary" align="center" style={styles.version}>
                    Radiant Wellness v2.0 • Build 2026.1
                </AppText>
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.Colors.background },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 }, // iOS safe area approx
    content: { paddingHorizontal: 24, paddingBottom: 100 },

    profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24, backgroundColor: Theme.Colors.surface },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center', ...Theme.Shadows.soft },
    userInfo: { flex: 1 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, backgroundColor: Theme.Colors.success + '10', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

    menuSection: { gap: 12, marginBottom: 32 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    menuText: { flex: 1 },

    logoutBtn: { marginBottom: 20, backgroundColor: Theme.Colors.error + '10' },
    version: { opacity: 0.5 },
});

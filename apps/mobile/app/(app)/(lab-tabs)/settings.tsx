import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import Colors from '@/constants/Colors';

const LabSettingsScreen = () => {
    const router = useRouter();
    const { logout, user } = useAuth();
    const labData = (user as any)?.lab;

    const menuItems = [
        {
            id: 'profile',
            title: 'Lab Profile',
            subtitle: 'Institutional details & facility bio',
            icon: 'business-outline',
            color: Colors.primary,
            onPress: () => router.push('/(app)/lab-profile'),
        },
        {
            id: 'hours',
            title: 'Operating Hours',
            subtitle: 'Weekly schedule & availability',
            icon: 'time-outline',
            color: Colors.primary,
            onPress: () => router.push('/(app)/lab-hours'),
        },
        {
            id: 'technicians',
            title: 'Staff Directory',
            subtitle: 'Manage laboratory technicians',
            icon: 'people-outline',
            color: Colors.primary,
            onPress: () => router.push('/(app)/lab-technicians'),
        },
        {
            id: 'equipment',
            title: 'Asset Tracking',
            subtitle: 'Equipment inventory & maintenance',
            icon: 'construct-outline',
            color: Colors.primary,
            onPress: () => router.push('/(app)/lab-equipment'),
        },
        {
            id: 'designer',
            title: 'Results Format',
            subtitle: 'Customize laboratory report templates',
            icon: 'color-palette-outline',
            color: Colors.primary,
            onPress: () => router.push('/(app)/document-template-editor'),
        },
        {
            id: 'security',
            title: 'Account Security',
            subtitle: 'Manage authentication & passwords',
            icon: 'lock-closed-outline',
            color: Colors.primary,
            onPress: () => router.push('/(app)/change-password'),
        },
        {
            id: 'support',
            title: 'Network Support',
            subtitle: 'Contact regional technical team',
            icon: 'help-circle-outline',
            color: Colors.primary,
            onPress: () => Alert.alert('Request Support', 'Our technical team is available at support@medico.com during business hours.'),
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>System Settings</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.profileSummary}>
                    <View style={styles.avatarWrap}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {labData?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'L'}
                            </Text>
                        </View>
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                        </View>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.roleLabel}>{labData?.name || 'Laboratory Center'}</Text>
                        <Text style={styles.emailText}>{user?.email}</Text>
                    </View>
                </View>

                <View style={styles.menuGrid}>
                    {menuItems.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuCard}
                            onPress={item.onPress}
                        >
                            <View style={styles.cardMain}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name={item.icon as any} size={22} color={Colors.primary} />
                                </View>
                                <View style={styles.cardText}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={Colors.border} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.footerActions}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <Ionicons name="log-out-outline" size={22} color={Colors.error} />
                        <Text style={styles.logoutText}>Terminate Session</Text>
                    </TouchableOpacity>

                    <Text style={styles.versionTag}>Medical Zen Lab Console v1.3.0</Text>
                    <Text style={styles.legalLinks}>Compliance Standards • Privacy Policy</Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },

    content: { flex: 1 },
    profileSummary: { flexDirection: 'row', alignItems: 'center', padding: 24, margin: 20, backgroundColor: Colors.card, borderRadius: 32, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    avatarWrap: { position: 'relative' },
    avatar: { width: 64, height: 64, borderRadius: 24, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: Colors.white, fontSize: 24, fontWeight: '800' },
    statusBadge: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.card },
    statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
    profileInfo: { marginLeft: 20, flex: 1 },
    roleLabel: { color: Colors.text, fontSize: 18, fontWeight: '800', textTransform: 'capitalize' },
    emailText: { color: Colors.textSecondary, fontSize: 14, marginTop: 2, fontWeight: '500' },

    menuGrid: { paddingHorizontal: 20, gap: 12 },
    menuCard: { backgroundColor: Colors.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
    cardMain: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardText: { flex: 1 },
    cardTitle: { color: Colors.text, fontSize: 16, fontWeight: '800' },
    cardSubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 4, fontWeight: '500' },

    footerActions: { padding: 20, marginTop: 12, alignItems: 'center' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5F5', padding: 18, borderRadius: 24, width: '100%', borderWidth: 1, borderColor: '#FED7D7' },
    logoutText: { color: Colors.error, fontSize: 16, fontWeight: '800', marginLeft: 10 },
    versionTag: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 32 },
    legalLinks: { color: Colors.primary, fontSize: 12, fontWeight: '700', marginTop: 8 },
});

export default LabSettingsScreen;

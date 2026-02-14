import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { clinicApi, ClinicDashboardStats } from '@/services/clinic.api';
import { useAuth } from '@/providers/AuthProvider';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

export default function ClinicDashboardScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [stats, setStats] = useState<ClinicDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const clinicId = user?.clinicId || 'clinic-123';

    const fetchStats = async () => {
        if (!clinicId) return;
        try {
            const res = await clinicApi.getDashboard(clinicId);
            if (res.success && res.data) {
                setStats(res.data);
            }

        } catch (error) {
            console.error('Failed to fetch operational telemetry:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [clinicId]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <View>
                    <AppText variant="caption" weight="black" uppercase color="primary" style={{ letterSpacing: 1.5 }}>Practice Operations</AppText>
                    <AppText variant="h2" weight="black">Command Center</AppText>
                </View>
                <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(app)/(tabs)/profile' as any)}>
                    <Ionicons name="person-circle-outline" size={36} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>


            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.Colors.primary} />}
            >
                <View style={styles.telemetryGrid}>
                    <TouchableOpacity style={styles.telemetryCard} onPress={() => router.push('/(app)/clinic/queue')}>
                        <View style={[styles.iconBox, { backgroundColor: Theme.Colors.warning + '12' }]}>
                            <Ionicons name="people" size={24} color={Theme.Colors.warning} />
                        </View>
                        <View style={styles.telemetryInfo}>
                            <AppText variant="h3" weight="black">{stats?.queueLength || 0}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9 }}>INTAKE QUEUE</AppText>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.telemetryCard}>
                        <View style={[styles.iconBox, { backgroundColor: Theme.Colors.primary + '12' }]}>
                            <Ionicons name="pulse" size={24} color={Theme.Colors.primary} />
                        </View>
                        <View style={styles.telemetryInfo}>
                            <AppText variant="h3" weight="black">{stats?.appointmentsByStatus?.['IN_PROGRESS'] || 0}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9 }}>IN PROGRESS</AppText>
                        </View>
                    </View>

                    <View style={styles.telemetryCard}>
                        <View style={[styles.iconBox, { backgroundColor: Theme.Colors.success + '12' }]}>
                            <Ionicons name="checkmark-circle" size={24} color={Theme.Colors.success} />
                        </View>
                        <View style={styles.telemetryInfo}>
                            <AppText variant="h3" weight="black">{stats?.appointmentsByStatus?.['COMPLETED'] || 0}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9 }}>SESSION DONE</AppText>
                        </View>
                    </View>

                    <View style={styles.telemetryCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#9013FE12' }]}>
                            <Ionicons name="medkit" size={24} color="#9013FE" />
                        </View>
                        <View style={styles.telemetryInfo}>
                            <AppText variant="h3" weight="black">{stats?.activeDoctorsCount || 0}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9 }}>ACTIVE STAFF</AppText>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <AppText variant="caption" weight="black" uppercase color="textSecondary" style={{ letterSpacing: 1 }}>Operational Decals</AppText>
                </View>

                <View style={styles.actionGrid}>
                    <AppCard padding="none" style={styles.actionCard} onPress={() => router.push('/(app)/clinic/queue' as any)}>

                        <View style={styles.actionPadding}>
                            <View style={[styles.actionIconBg, { backgroundColor: Theme.Colors.primary + '08' }]}>
                                <Ionicons name="list" size={26} color={Theme.Colors.primary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>Patient Flow</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">Real-time intake and queue management.</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Theme.Colors.divider} />
                        </View>
                    </AppCard>

                    <AppCard padding="none" style={styles.actionCard} onPress={() => router.push('/(app)/clinic/check-in' as any)}>

                        <View style={styles.actionPadding}>
                            <View style={[styles.actionIconBg, { backgroundColor: Theme.Colors.success + '08' }]}>
                                <Ionicons name="qr-code-outline" size={26} color={Theme.Colors.success} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>Authorize Intake</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">Validate patient presence and credentials.</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Theme.Colors.divider} />
                        </View>
                    </AppCard>

                    <AppCard padding="none" style={styles.actionCard} onPress={() => router.push('/(app)/clinic/rooms' as any)}>

                        <View style={styles.actionPadding}>
                            <View style={[styles.actionIconBg, { backgroundColor: Theme.Colors.warning + '08' }]}>
                                <Ionicons name="bed-outline" size={26} color={Theme.Colors.warning} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>Room Allocation</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">{stats?.rooms?.available || 0} rooms currently available.</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Theme.Colors.divider} />
                        </View>
                    </AppCard>

                    <AppCard padding="none" style={styles.actionCard} onPress={() => router.push('/(app)/clinic/vitals' as any)}>

                        <View style={styles.actionPadding}>
                            <View style={[styles.actionIconBg, { backgroundColor: '#FF525208' }]}>
                                <Ionicons name="thermometer-outline" size={26} color="#FF5252" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>Registry Vitals</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">Pre-consult biometrics acquisition.</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Theme.Colors.divider} />
                        </View>
                    </AppCard>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    profileBtn: { padding: 4 },

    scrollContent: { paddingHorizontal: 24, paddingTop: 12 },
    telemetryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
    telemetryCard: { width: '48%', backgroundColor: Theme.Colors.surface, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    telemetryInfo: { marginLeft: 12, flex: 1 },

    sectionHeader: { marginBottom: 16, paddingLeft: 4 },
    actionGrid: { gap: 12 },
    actionCard: { borderRadius: 24 },
    actionPadding: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    actionIconBg: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
});

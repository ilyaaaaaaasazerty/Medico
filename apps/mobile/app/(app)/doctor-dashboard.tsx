import { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    RefreshControl,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { doctorApi } from '@/services/doctor.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import Theme from '@/constants/Theme';

interface DashboardData {
    profile: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
        verificationStatus: string;
        emergencyMode: boolean;
    };
    upcomingAppointments: any[];
    stats: {
        totalAppointments: number;
        totalReviews: number;
        totalEarnings: number;
    };
}

export default function DoctorDashboardScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [needsProfile, setNeedsProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [emergencyLoading, setEmergencyLoading] = useState(false);
    const [scheduleOffset, setScheduleOffset] = useState(0);

    const loadDashboard = async () => {
        if (!user) return;
        try {
            const existsRes = await doctorApi.checkProfileExists();
            if (!existsRes.data?.exists) {
                setNeedsProfile(true);
                setLoading(false);
                return;
            }

            const dashboardRes = await doctorApi.getDashboard();
            if (dashboardRes.success && dashboardRes.data) {
                setDashboard(dashboardRes.data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, [user]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadDashboard();
    }, []);

    const toggleEmergency = async () => {
        if (!dashboard?.profile.id) return;
        try {
            setEmergencyLoading(true);
            const currentStatus = dashboard.profile.emergencyMode;
            // Optimistic update
            setDashboard(prev => prev ? {
                ...prev,
                profile: { ...prev.profile, emergencyMode: !currentStatus }
            } : null);

            const res = await doctorApi.toggleEmergency(!currentStatus) as any;
            if (res.success) {
                Alert.alert(
                    !currentStatus ? 'Emergency Mode Active' : 'Emergency Mode Deactivated',
                    !currentStatus ? 'Your patients have been notified.' : 'Normal operations resumed.'
                );
            } else {
                // Revert if failed
                setDashboard(prev => prev ? {
                    ...prev,
                    profile: { ...prev.profile, emergencyMode: currentStatus }
                } : null);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to toggle emergency mode');
        } finally {
            setEmergencyLoading(false);
        }
    };

    const adjustOffset = (minutes: number) => {
        setScheduleOffset(prev => prev + minutes);
    };

    const applyScheduleChange = async () => {
        if (scheduleOffset === 0) return;
        Alert.alert(
            'Apply Schedule Change',
            `Shift all pending appointments by ${scheduleOffset > 0 ? '+' : ''}${scheduleOffset} minutes?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm Shift',
                    onPress: async () => {
                        try {
                            const res = await doctorApi.shiftSchedule(scheduleOffset) as any;
                            if (res.success) {
                                Alert.alert('Success', 'Schedule updated and patients notified.');
                                setScheduleOffset(0);
                                loadDashboard();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to shift schedule');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (needsProfile) {
        return (
            <AppScreen padding style={styles.center}>
                <View style={[styles.iconCircle, { backgroundColor: Theme.Colors.primary + '10', marginBottom: 24 }]}>
                    <AppText variant="hero">👨‍⚕️</AppText>
                </View>
                <AppText variant="h3" align="center" style={{ marginBottom: 12 }}>Complete Your Profile</AppText>
                <AppText color="textSecondary" align="center" style={{ marginBottom: 32, paddingHorizontal: 20 }}>
                    Set up your professional credentials to start receiving patient appointments.
                </AppText>
                <AppButton
                    title="Begin Setup"
                    onPress={() => router.push('/(app)/doctor-setup')}
                    style={{ width: '70%' }}
                />
            </AppScreen>
        );
    }

    const nextAppointment = dashboard?.upcomingAppointments?.[0];

    return (
        <View style={styles.container}>
            {/* Emergency Banner */}
            {dashboard?.profile.emergencyMode && (
                <View style={styles.emergencyBanner}>
                    <View style={styles.emergencyIcon}>
                        <Ionicons name="warning" size={16} color={Theme.Colors.textInverted} />
                    </View>
                    <AppText variant="caption" color="textInverted" weight="bold" style={{ flex: 1 }}>EMERGENCY OVERRIDE ACTIVE</AppText>
                    <TouchableOpacity onPress={toggleEmergency} style={styles.emergencyOffBtn}>
                        <AppText variant="caption" color="error" weight="bold">DEACTIVATE</AppText>
                    </TouchableOpacity>
                </View>
            )}

            <AppScreen
                scrollable
                padding={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.Colors.primary} />}
            >
                <View style={styles.header}>
                    <View>
                        <AppText variant="h3" color="text">Dr. {dashboard?.profile.lastName}</AppText>
                        <AppText variant="caption" color="textSecondary" weight="bold" uppercase style={{ marginTop: 4 }}>
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </AppText>
                    </View>
                    <TouchableOpacity
                        style={[styles.emergencyToggle, dashboard?.profile.emergencyMode && styles.emergencyActive]}
                        onPress={toggleEmergency}
                        disabled={emergencyLoading}
                    >
                        {emergencyLoading ? (
                            <ActivityIndicator size="small" color={Theme.Colors.error} />
                        ) : (
                            <Ionicons
                                name="medkit"
                                size={24}
                                color={dashboard?.profile.emergencyMode ? Theme.Colors.textInverted : Theme.Colors.error}
                            />
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.searchSection}>
                    <AppInput
                        placeholder="Search patient records..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        icon={<Ionicons name="search" size={20} color={Theme.Colors.textSecondary} />}
                    />
                </View>

                {/* KPI Cards */}
                <View style={styles.statsRow}>
                    <AppCard style={styles.statCard} padding="sm">
                        <View style={styles.statIcon}>
                            <Ionicons name="clipboard-outline" size={20} color={Theme.Colors.primary} />
                        </View>
                        <AppText variant="h3" weight="bold">{dashboard?.stats.totalAppointments || 0}</AppText>
                        <AppText variant="caption" color="textSecondary" weight="bold">VISITS</AppText>
                    </AppCard>
                    <AppCard style={styles.statCard} padding="sm">
                        <View style={styles.statIcon}>
                            <Ionicons name="star-half-outline" size={20} color={Theme.Colors.warning} />
                        </View>
                        <AppText variant="h3" weight="bold">{dashboard?.stats.totalReviews || 0}</AppText>
                        <AppText variant="caption" color="textSecondary" weight="bold">RATING</AppText>
                    </AppCard>
                    <AppCard style={styles.statCard} padding="sm">
                        <View style={styles.statIcon}>
                            <Ionicons name="hourglass-outline" size={20} color={Theme.Colors.success} />
                        </View>
                        <AppText variant="h3" weight="bold">{dashboard?.upcomingAppointments.length || 0}</AppText>
                        <AppText variant="caption" color="textSecondary" weight="bold">PENDING</AppText>
                    </AppCard>
                </View>

                {/* Next Patient Hero */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <AppText variant="body" weight="bold" color="text">Immediate Attention</AppText>
                    </View>

                    {nextAppointment ? (
                        <AppCard
                            padding="lg"
                            style={styles.heroCard}
                            onPress={() => router.push({
                                pathname: '/(app)/patient-preview',
                                params: {
                                    appointmentId: nextAppointment.id,
                                    patientId: nextAppointment.patientId,
                                    patientName: `${nextAppointment.patient.firstName} ${nextAppointment.patient.lastName}`
                                }
                            })}
                        >
                            <View style={styles.heroHeader}>
                                <View style={styles.liveIndicator}>
                                    <View style={styles.liveDot} />
                                    <AppText variant="caption" color="error" weight="black">NEXT UP</AppText>
                                </View>
                                <AppText variant="h3" color="primary" weight="black">{nextAppointment.scheduledTime}</AppText>
                            </View>

                            <View style={styles.patientRow}>
                                <View style={styles.avatar}>
                                    <AppText variant="title" color="white">
                                        {nextAppointment.patient.firstName[0]}{nextAppointment.patient.lastName[0]}
                                    </AppText>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <AppText variant="h3" weight="bold">{nextAppointment.patient.firstName} {nextAppointment.patient.lastName}</AppText>
                                    <AppText variant="body" color="textSecondary">{nextAppointment.reason || 'General Consultation'}</AppText>
                                </View>
                                <View style={styles.arrowBtn}>
                                    <Ionicons name="arrow-forward" size={24} color={Theme.Colors.primary} />
                                </View>
                            </View>

                            <View style={styles.heroFooter}>
                                <View style={styles.tag}>
                                    <Ionicons name="person" size={12} color={Theme.Colors.textSecondary} />
                                    <AppText variant="caption" color="textSecondary" weight="bold">{nextAppointment.patient.gender || 'N/A'}</AppText>
                                </View>
                                <View style={styles.tag}>
                                    <Ionicons name="folder-open" size={12} color={Theme.Colors.textSecondary} />
                                    <AppText variant="caption" color="textSecondary" weight="bold">View History</AppText>
                                </View>
                            </View>
                        </AppCard>
                    ) : (
                        <AppCard padding="xl" style={styles.emptyCard}>
                            <View style={[styles.iconCircle, { backgroundColor: Theme.Colors.success + '10', width: 64, height: 64 }]}>
                                <Ionicons name="checkmark" size={32} color={Theme.Colors.success} />
                            </View>
                            <AppText variant="body" weight="bold" style={{ marginTop: 16 }}>All Caught Up</AppText>
                            <AppText variant="caption" color="textSecondary">No immediate appointments pending</AppText>
                        </AppCard>
                    )}
                </View>

                {/* Queue Management */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <AppText variant="body" weight="bold" color="text">Queue Control</AppText>
                        {scheduleOffset !== 0 && (
                            <TouchableOpacity onPress={applyScheduleChange}>
                                <AppText variant="caption" color="primary" weight="black">APPLY CHANGE</AppText>
                            </TouchableOpacity>
                        )}
                    </View>

                    <AppCard padding="md" style={styles.queueCard}>
                        <View style={styles.sliderRow}>
                            <TouchableOpacity style={styles.sliderBtn} onPress={() => adjustOffset(-5)}>
                                <Ionicons name="remove" size={24} color={Theme.Colors.text} />
                            </TouchableOpacity>

                            <View style={styles.sliderDisplay}>
                                <AppText variant="h1" color="text" weight="black">
                                    {scheduleOffset > 0 ? '+' : ''}{scheduleOffset}
                                </AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">MINUTES</AppText>
                            </View>

                            <TouchableOpacity style={styles.sliderBtn} onPress={() => adjustOffset(5)}>
                                <Ionicons name="add" size={24} color={Theme.Colors.text} />
                            </TouchableOpacity>
                        </View>
                        <AppText variant="caption" color="textSecondary" align="center" style={{ marginTop: 12 }}>
                            Adjust schedule to notify waiting patients
                        </AppText>
                    </AppCard>
                </View>

                {/* Terminal Control Units */}
                <View style={styles.section}>
                    <AppText variant="caption" weight="black" color="textSecondary" uppercase style={{ letterSpacing: 1, marginBottom: 16 }}>Operational Terminals</AppText>
                    <View style={styles.terminalGrid}>
                        <TerminalItem
                            label="RECEPTION TV"
                            icon="tv-outline"
                            onPress={() => router.push('/(app)/reception-display')}
                        />
                        <TerminalItem
                            label="AVAILABILITY"
                            icon="calendar-outline"
                            onPress={() => router.push('/(app)/manage-availability')}
                        />
                        <TerminalItem
                            label="SERVICE FEES"
                            icon="cash-outline"
                            onPress={() => router.push('/(app)/edit-doctor-profile')}
                        />
                        <TerminalItem
                            label="SYSTEM EXIT"
                            icon="log-out-outline"
                            color={Theme.Colors.error}
                            onPress={() => {
                                Alert.alert('Command Session', 'Terminate active session?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'TERMINATE', onPress: () => router.replace('/(auth)/login'), style: 'destructive' }
                                ]);
                            }}
                        />
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </AppScreen>
        </View>
    );
}

function TerminalItem({ label, icon, onPress, color = Theme.Colors.primary }: any) {
    return (
        <TouchableOpacity style={styles.terminalItem} onPress={onPress}>
            <AppCard style={styles.terminalCard} padding="none">
                <View style={styles.terminalIcon}>
                    <Ionicons name={icon} size={22} color={color} />
                </View>
                <AppText variant="caption" weight="black" align="center" style={{ fontSize: 9, lineHeight: 12 }}>{label}</AppText>
            </AppCard>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

    header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    emergencyToggle: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.error + '15', justifyContent: 'center', alignItems: 'center' },
    emergencyActive: { backgroundColor: Theme.Colors.error },

    emergencyBanner: { backgroundColor: Theme.Colors.error, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 12, paddingTop: Platform.OS === 'ios' ? 54 : 32 },
    emergencyIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    emergencyOffBtn: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },

    searchSection: { paddingHorizontal: 24, marginBottom: 24 },

    statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 24 },
    statCard: { flex: 1, alignItems: 'center', gap: 8 },
    statIcon: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },

    section: { paddingHorizontal: 24, marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

    heroCard: { borderLeftWidth: 4, borderLeftColor: Theme.Colors.primary },
    heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.Colors.error + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.Colors.error },
    patientRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    avatar: { width: 56, height: 56, borderRadius: 20, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center' },
    arrowBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    heroFooter: { flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.Colors.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

    emptyCard: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: Theme.Colors.divider, backgroundColor: Theme.Colors.background },
    iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },

    queueCard: { paddingVertical: 24 },
    sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sliderBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    sliderDisplay: { alignItems: 'center' },

    listCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    timeBox: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Theme.Colors.background, borderRadius: 8 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    emptyList: { alignItems: 'center', padding: 20 },

    terminalGrid: { flexDirection: 'row', flexWrap: 'wrap', margin: -6 },
    terminalItem: { width: '33.33%', padding: 6 },
    terminalCard: { padding: 12, alignItems: 'center', gap: 6, borderRadius: 20, borderWidth: 1, borderColor: Theme.Colors.divider },
    terminalIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
});

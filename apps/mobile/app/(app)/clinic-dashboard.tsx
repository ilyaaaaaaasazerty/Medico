import { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Platform,
    ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { clinicApi, ClinicDashboardStats } from '@/services/clinic.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

interface DashboardData {
    profile: {
        id: string;
        name: string;
        verificationStatus: string;
        emergencyMode: boolean;
    };
    stats: ClinicDashboardStats;
}

export default function ClinicDashboardScreen() {
    const { logout } = useAuth();
    const router = useRouter();
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [emergencyLoading, setEmergencyLoading] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadDashboard();
        }, [])
    );

    const loadDashboard = async () => {
        try {
            const res = await clinicApi.getDashboard() as any;
            if (res.success && res.data) {
                setDashboard(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical command data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    const toggleEmergency = async () => {
        if (!dashboard?.profile.id) return;
        try {
            setEmergencyLoading(true);
            const currentStatus = dashboard.profile.emergencyMode;

            setDashboard(prev => prev ? {
                ...prev,
                profile: { ...prev.profile, emergencyMode: !currentStatus }
            } : null);

            const res = await clinicApi.toggleEmergency(!currentStatus) as any;
            if (res.success) {
                Alert.alert(
                    !currentStatus ? 'EMERGENCY PROTOCOL ACTIVE' : 'EMERGENCY PROTOCOL DEACTIVATED',
                    !currentStatus ? 'All external engagements redirected. Internal personnel notified.' : 'Institutional operations resumed standard protocol.'
                );
            } else {
                setDashboard(prev => prev ? {
                    ...prev,
                    profile: { ...prev.profile, emergencyMode: currentStatus }
                } : null);
            }
        } catch (error) {
            Alert.alert('PROTOCOL ERROR', 'Failed to synchronize institutional state.');
        } finally {
            setEmergencyLoading(false);
        }
    };

    const handleSetback = async (minutes: number) => {
        Alert.alert(
            'TEMPORAL SHIFT',
            `Are you sure you want to shift all active clinical engagements by ${minutes} minutes?`,
            [
                { text: 'ABORT', style: 'cancel' },
                {
                    text: 'EXECUTE SHIFT',
                    onPress: async () => {
                        try {
                            const res = await clinicApi.shiftSchedule(minutes) as any;
                            if (res.success) {
                                loadDashboard();
                            }
                        } catch (error) {
                            Alert.alert('SYNC ERROR', 'Failed to propagate temporal shift.');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    return (
        <AppScreen
            padding={false}
            scrollable
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.Colors.primary} />
            }
        >
            {/* Header / Institutional Branding */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ letterSpacing: 1 }}>System Command</AppText>
                    <AppText variant="h2" weight="black" numberOfLines={1}>{dashboard?.profile.name.toUpperCase()}</AppText>
                </View>
                <TouchableOpacity
                    style={[
                        styles.emergencyBtn,
                        dashboard?.profile.emergencyMode && styles.emergencyActive
                    ]}
                    onPress={toggleEmergency}
                    disabled={emergencyLoading}
                >
                    {emergencyLoading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Ionicons
                            name={dashboard?.profile.emergencyMode ? "flash" : "flash-outline"}
                            size={22}
                            color={dashboard?.profile.emergencyMode ? "white" : Theme.Colors.error}
                        />
                    )}
                </TouchableOpacity>
            </View>

            {/* Emergency Protocol Status */}
            {dashboard?.profile.emergencyMode && (
                <View style={styles.emergencyBanner}>
                    <LinearGradient
                        colors={[Theme.Colors.error, '#D32F2F']}
                        style={styles.bannerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="warning" size={20} color="white" />
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <AppText variant="caption" color="textInverted" weight="black">PROTOCOL: EMERGENCY REDIRECT</AppText>
                            <AppText variant="caption" color="textInverted" style={{ opacity: 0.9 }}>Manual override engaged. Operations suspended.</AppText>
                        </View>
                        <TouchableOpacity style={styles.endBtn} onPress={toggleEmergency}>
                            <AppText variant="caption" weight="black" color="error">DEACTIVATE</AppText>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            )}

            <View style={styles.content}>
                {/* Operational Performance Matrix */}
                <View style={styles.kpiRow}>
                    <AppCard style={styles.kpiCard} padding="none">
                        <View style={styles.kpiContent}>
                            <View style={styles.kpiIconBox}>
                                <Ionicons name="people-outline" size={20} color={Theme.Colors.primary} />
                            </View>
                            <View>
                                <AppText variant="h2" weight="black">{dashboard?.stats.queueLength || 0}</AppText>
                                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>ACTIVE QUEUE</AppText>
                            </View>
                        </View>
                    </AppCard>

                    <AppCard style={styles.kpiCard} padding="none">
                        <View style={styles.kpiContent}>
                            <View style={[styles.kpiIconBox, { backgroundColor: Theme.Colors.success + '10' }]}>
                                <Ionicons name="medkit-outline" size={20} color={Theme.Colors.success} />
                            </View>
                            <View>
                                <AppText variant="h2" weight="black">{dashboard?.stats.activeDoctorsCount || 0}</AppText>
                                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>PERSONNEL ON DUTY</AppText>
                            </View>
                        </View>
                    </AppCard>
                </View>

                {/* Temporal Synchronization Terminal */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <AppText variant="caption" weight="black" color="textSecondary" uppercase style={{ letterSpacing: 1 }}>Temporal Control</AppText>
                        <View style={styles.liveBadge}>
                            <View style={styles.livePulse} />
                            <AppText variant="caption" color="error" weight="black" style={{ fontSize: 9 }}>LIVE FEED</AppText>
                        </View>
                    </View>
                    <AppCard padding="md">
                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginBottom: 16, lineHeight: 18 }}>
                            Global temporal adjustment for all active consultation units. Synchronized with patient notification net.
                        </AppText>
                        <View style={styles.gridRow}>
                            <TouchableOpacity style={styles.shiftTerminal} onPress={() => handleSetback(15)}>
                                <AppText variant="body" weight="black" color="primary">+15m</AppText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.shiftTerminal} onPress={() => handleSetback(30)}>
                                <AppText variant="body" weight="black" color="primary">+30m</AppText>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.shiftTerminal, styles.shiftActive]} onPress={() => handleSetback(60)}>
                                <AppText variant="body" weight="black" color="primary">+60m</AppText>
                            </TouchableOpacity>
                        </View>
                    </AppCard>
                </View>

                {/* Institutional Command Terminals */}
                <View style={styles.section}>
                    <AppText variant="caption" weight="black" color="textSecondary" uppercase style={{ letterSpacing: 1, marginBottom: 16 }}>Command Terminals</AppText>
                    <View style={styles.terminalGrid}>
                        <TerminalItem
                            label="ENGAGEMENT LEDGER"
                            icon="list-outline"
                            onPress={() => router.push('/(app)/clinic-appointments')}
                        />
                        <TerminalItem
                            label="CLINICAL STAFF"
                            icon="medical-outline"
                            onPress={() => router.push('/(app)/clinic-doctors')}
                        />
                        <TerminalItem
                            label="OPERATIONAL STAFF"
                            icon="people-outline"
                            onPress={() => router.push('/(app)/clinic-staff')}
                        />
                        <TerminalItem
                            label="SPATIAL ASSETS"
                            icon="business-outline"
                            onPress={() => router.push('/(app)/clinic-rooms')}
                        />
                        <TerminalItem
                            label="PUBLIC DISPLAY"
                            icon="tv-outline"
                            onPress={() => router.push('/(app)/reception-display')}
                        />
                        <TerminalItem
                            label="SYSTEM EXIT"
                            icon="log-out-outline"
                            color={Theme.Colors.error}
                            onPress={logout}
                        />
                    </View>
                </View>

                <View style={{ height: 60 }} />
            </View>
        </AppScreen>
    );
}

function TerminalItem({ label, icon, onPress, color = Theme.Colors.primary }: any) {
    return (
        <TouchableOpacity style={styles.terminalItem} onPress={onPress}>
            <AppCard style={styles.terminalCard} padding="none">
                <View style={[styles.terminalIcon, { backgroundColor: color + '08' }]}>
                    <Ionicons name={icon} size={22} color={color} />
                </View>
                <AppText variant="caption" weight="black" align="center" style={{ fontSize: 8 }}>{label}</AppText>
            </AppCard>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 16 },
    emergencyBtn: { width: 48, height: 48, borderRadius: 18, backgroundColor: Theme.Colors.error + '08', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.error + '20' },
    emergencyActive: { backgroundColor: Theme.Colors.error, borderColor: Theme.Colors.error },

    emergencyBanner: { marginHorizontal: 24, borderRadius: 20, overflow: 'hidden', marginBottom: 24 },
    bannerGradient: { padding: 16, flexDirection: 'row', alignItems: 'center' },
    endBtn: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },

    content: { paddingHorizontal: 24 },

    kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    kpiCard: { flex: 1, borderRadius: 24 },
    kpiContent: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    kpiIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },

    section: { marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.Colors.error + '08', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    livePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.Colors.error },

    gridRow: { flexDirection: 'row', gap: 10 },
    shiftTerminal: { flex: 1, height: 52, borderRadius: 16, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, justifyContent: 'center', alignItems: 'center' },
    shiftActive: { borderColor: Theme.Colors.primary, backgroundColor: Theme.Colors.primary + '03' },

    terminalGrid: { flexDirection: 'row', flexWrap: 'wrap', margin: -6 },
    terminalItem: { width: '33.33%', padding: 6 },
    terminalCard: { padding: 16, alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1, borderColor: Theme.Colors.divider },
    terminalIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
});

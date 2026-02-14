import { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { labApi } from '@/services/lab.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

interface DashboardData {
    profile: {
        id: string;
        name: string;
        type: string;
        logoUrl?: string;
        verificationStatus: string;
        homeCollection: boolean
    };
    stats: {
        totalTests: number;
        totalTechnicians: number;
        totalEquipment: number;
        totalRequests: number
    };
}

const { width } = Dimensions.get('window');

export default function LabDashboardScreen() {
    const { logout } = useAuth();
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [needsProfile, setNeedsProfile] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const existsRes = await labApi.checkProfileExists();
            if (!existsRes.data?.exists) {
                setNeedsProfile(true);
                setLoading(false);
                return;
            }

            const dashboardRes = await labApi.getDashboard();
            if (dashboardRes.success && dashboardRes.data) {
                setDashboard(dashboardRes.data);
            }
        } catch (error) {
            console.error('Error loading intra-laboratory command data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (needsProfile) {
        return (
            <AppScreen center>
                <View style={styles.setupContainer}>
                    <View style={styles.setupIconBg}>
                        <Ionicons name="flask-outline" size={60} color={Theme.Colors.primary} />
                    </View>
                    <AppText variant="h1" weight="black" align="center">INITIALIZE INSTITUTION</AppText>
                    <AppText variant="body" color="textSecondary" align="center" weight="bold" style={{ marginVertical: 20, lineHeight: 24, opacity: 0.8 }}>
                        Establish your laboratory credentials on the institutional network to begin diagnostic operations.
                    </AppText>
                    <AppButton
                        title="BEGIN ONBOARDING PROTOCOL"
                        onPress={() => router.push('/(app)/lab-setup')}
                        style={{ width: '100%', height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text }}
                    />
                    <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <AppText variant="caption" color="textSecondary" weight="black">SWITCH ACCOUNT</AppText>
                    </TouchableOpacity>
                </View>
            </AppScreen>
        );
    }

    const isPending = dashboard?.profile?.verificationStatus === 'PENDING';

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <View>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={{ letterSpacing: 1.5 }}>INTRA-LABORATORY COMMAND</AppText>
                    <AppText variant="h2" weight="black" style={{ marginTop: 4 }}>{dashboard?.profile?.name.toUpperCase()}</AppText>
                </View>
                <TouchableOpacity onPress={() => router.push('/(app)/(lab-tabs)/settings')} style={styles.profileBtn}>
                    <Ionicons name="grid-outline" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.Colors.primary} />
                }
            >
                {isPending && (
                    <AppCard style={styles.pendingBanner} variant="outline" padding="md">

                        <View style={styles.bannerIcon}>
                            <Ionicons name="shield-half-outline" size={20} color={Theme.Colors.warning} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <AppText variant="body" weight="black" style={{ color: Theme.Colors.warning, fontSize: 13 }}>CREDENTIAL REVIEW ACTIVE</AppText>
                            <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 2 }}>Institutional verification is in progress. Operational scope is currently restricted.</AppText>
                        </View>
                    </AppCard>
                )}

                <View style={styles.telemetrySection}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionTitle}>Resource Telemetry</AppText>
                    <View style={styles.statsRow}>
                        <StatCard value={dashboard?.stats.totalTests || 0} label="TEST MATRIX" icon="flask-outline" />
                        <StatCard value={dashboard?.stats.totalTechnicians || 0} label="PERSONNEL" icon="people-outline" />
                        <StatCard value={dashboard?.stats.totalEquipment || 0} label="HARDWARE" icon="hardware-chip-outline" />
                    </View>
                </View>

                {dashboard?.profile?.homeCollection && (
                    <View style={styles.featureBanner}>
                        <Ionicons name="home-outline" size={16} color={Theme.Colors.primary} />
                        <AppText variant="caption" color="primary" weight="black" uppercase style={{ marginLeft: 8, fontSize: 9 }}>REMOTE INTAKE OPS ENABLED</AppText>
                    </View>
                )}

                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionTitle}>Operational Matrix</AppText>
                    <View style={styles.quickActions}>
                        <ActionCard
                            title="Intake Ledger"
                            icon="clipboard-outline"
                            badge={dashboard?.stats.totalRequests}
                            onPress={() => router.push('/(app)/lab-admin-requests')}
                            highlight
                        />
                        <ActionCard
                            title="Diagnostic Catalog"
                            icon="list-outline"
                            onPress={() => router.push('/(app)/lab-tests')}
                        />
                        <ActionCard
                            title="Staff Registry"
                            icon="medkit-outline"
                            onPress={() => router.push('/(app)/lab-technicians')}
                        />
                        <ActionCard
                            title="Temporal Protocol"
                            icon="time-outline"
                            onPress={() => router.push('/(app)/lab-hours')}
                        />
                        <ActionCard
                            title="Hardware Vault"
                            icon="construct-outline"
                            onPress={() => router.push('/(app)/lab-equipment')}
                        />
                        <ActionCard
                            title="Institutional Settings"
                            icon="settings-outline"
                            onPress={() => router.push('/(app)/(lab-tabs)/settings')}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.secondaryAction} onPress={logout}>
                    <Ionicons name="log-out-outline" size={20} color={Theme.Colors.error} />
                    <AppText variant="body" weight="black" style={{ color: Theme.Colors.error, marginLeft: 12, fontSize: 13 }}>TERMINATE COMMAND SESSION</AppText>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </AppScreen>
    );
}

function StatCard({ value, label, icon }: any) {
    return (
        <AppCard style={styles.statCard} padding="none">
            <View style={styles.statContent}>
                <View style={styles.statIconBox}>
                    <Ionicons name={icon} size={16} color={Theme.Colors.primary} />
                </View>
                <AppText variant="h2" weight="black" style={{ marginTop: 12 }}>{value}</AppText>
                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8, marginTop: 2 }}>{label}</AppText>
            </View>
        </AppCard>
    );
}

function ActionCard({ title, icon, badge, onPress, highlight }: any) {
    return (
        <TouchableOpacity
            style={[styles.actionCard, highlight && styles.actionCardHighlight]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={[styles.actionIconWrapper, { backgroundColor: highlight ? 'rgba(255,255,255,0.15)' : Theme.Colors.primary + '08' }]}>
                <Ionicons name={icon} size={24} color={highlight ? 'white' : Theme.Colors.primary} />
            </View>
            <AppText variant="caption" weight="black" align="center" style={{
                color: highlight ? 'white' : Theme.Colors.text,
                marginTop: 12,
                fontSize: 10,
                lineHeight: 14,
                width: '100%'
            }}>
                {title.toUpperCase()}
            </AppText>
            {badge > 0 && (
                <View style={styles.badge}>
                    <AppText variant="caption" weight="black" style={{ color: Theme.Colors.white, fontSize: 8 }}>{badge}</AppText>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    setupContainer: { alignItems: 'center', padding: 24 },
    setupIconBg: { width: 100, height: 100, borderRadius: 36, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: Theme.Colors.divider },
    logoutBtn: { marginTop: 32 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
    profileBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24 },
    pendingBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', marginBottom: 32, borderRadius: 24, borderWidth: 1, borderColor: '#FEF3C7' },
    bannerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },

    telemetrySection: { marginBottom: 32 },
    statsRow: { flexDirection: 'row', gap: 12 },
    statCard: { flex: 1, borderRadius: 24 },
    statContent: { padding: 16, alignItems: 'center' },
    statIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },

    featureBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.Colors.primary + '05', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: Theme.Colors.primary + '10', marginBottom: 32 },

    section: { marginTop: 0 },
    sectionTitle: { marginBottom: 16, letterSpacing: 1.5, fontSize: 9 },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    actionCard: {
        width: (width - 48 - 12) / 2,
        backgroundColor: Theme.Colors.surface,
        borderRadius: 28,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    actionCardHighlight: { backgroundColor: Theme.Colors.text, borderColor: Theme.Colors.text },
    actionIconWrapper: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    badge: { position: 'absolute', top: 16, right: 16, backgroundColor: Theme.Colors.error, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },

    secondaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, padding: 20, borderRadius: 24, backgroundColor: Theme.Colors.error + '08', borderWidth: 1, borderColor: Theme.Colors.error + '20' },
});

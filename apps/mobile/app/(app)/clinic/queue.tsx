import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { clinicApi, WaitlistEntry } from '@/services/clinic.api';
import { useAuth } from '@/providers/AuthProvider';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

const STATUS_CONFIG: Record<string, { color: string; label: string; action: string; icon: any }> = {
    WAITING: { color: Theme.Colors.primary, label: 'ARRIVED', action: 'AUTHORIZE INTAKE', icon: 'enter-outline' },
    CALLED: { color: Theme.Colors.warning, label: 'READY', action: 'ALLOCATE ROOM', icon: 'log-in-outline' },
    WITH_NURSE: { color: Theme.Colors.warning, label: 'VITALS', action: 'ALLOCATE ROOM', icon: 'thermometer-outline' },
    WITH_DOCTOR: { color: Theme.Colors.success, label: 'IN PROGRESS', action: 'MONITOR', icon: 'pulse' },
    COMPLETED: { color: Theme.Colors.textSecondary, label: 'COMMITTED', action: 'LEDGER', icon: 'checkmark-done' },
};

export default function QueueManagementScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [queue, setQueue] = useState<WaitlistEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const clinicId = (user as any)?.clinicId || 'clinic-123';

    const fetchQueue = async () => {
        try {
            const res = await clinicApi.getQueue(clinicId);
            if (res.success) setQueue(res.data || []);
        } catch (error) {
            console.error('Failed to fetch operational flow:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchQueue();
    }, []);

    const handleAction = (item: WaitlistEntry) => {
        if (item.status === 'WAITING') {
            updateStatus(item.id, 'CALLED');
        } else if (item.status === 'CALLED' || item.status === 'WITH_NURSE') {
            Alert.alert('ROOM ALLOCATION', 'Redirecting to facility management terminal.');
        } else if (item.status === 'WITH_DOCTOR') {
            router.push(`/consultation?id=${item.appointmentId}`);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const res = await clinicApi.updateQueueStatus(id, status);
            if (res.success) fetchQueue();
        } catch (error) {
            Alert.alert('PROTOCOL ERROR', 'Failed to propagate status transition.');
        }
    };

    const getPulseCounts = () => {
        const counts = { waiting: 0, ready: 0, inProgress: 0 };
        queue.forEach(q => {
            if (q.status === 'WAITING') counts.waiting++;
            else if (['CALLED', 'WITH_NURSE'].includes(q.status)) counts.ready++;
            else if (q.status === 'WITH_DOCTOR') counts.inProgress++;
        });
        return counts;
    };

    const counts = getPulseCounts();

    const renderItem = ({ item }: { item: WaitlistEntry }) => {
        const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.COMPLETED;
        const patientName = `${item.appointment?.patient?.firstName} ${item.appointment?.patient?.lastName}`;
        const waitTime = Math.floor((new Date().getTime() - new Date(item.checkedInAt).getTime()) / 60000);

        return (
            <AppCard
                style={[styles.flowCard, { borderLeftColor: config.color }]}
                padding="none"
                onPress={() => item.status === 'WITH_DOCTOR' && handleAction(item)}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: config.color + '12' }]}>
                        <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                        <AppText variant="caption" weight="black" style={{ color: config.color, fontSize: 8 }}>{config.label}</AppText>
                    </View>
                    <View style={styles.telemetryRow}>
                        <Ionicons name="time-outline" size={12} color={Theme.Colors.textSecondary} />
                        <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9, marginLeft: 6 }}>{waitTime}M DURATION</AppText>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>{patientName}</AppText>
                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 2 }}>{item.appointment?.service?.name || 'GENERAL CLINICAL VISIT'}</AppText>
                </View>

                <View style={styles.cardFooter}>
                    <AppButton
                        title={config.action}
                        onPress={() => handleAction(item)}
                        variant={item.status === 'WITH_DOCTOR' ? 'tonal' : 'primary'}
                        style={[styles.actionBtn, item.status !== 'WITH_DOCTOR' ? { backgroundColor: config.color } : {}]}
                        textStyle={{ fontSize: 10, fontWeight: '900' }}
                    >
                        <Ionicons name={config.icon} size={14} color={item.status === 'WITH_DOCTOR' ? config.color : 'white'} style={{ marginLeft: 8 }} />
                    </AppButton>

                </View>
            </AppCard>
        );
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
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Operational Flow</AppText>
                <TouchableOpacity onPress={fetchQueue} style={styles.circleBtn}>
                    <Ionicons name="refresh" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.pulseStrip}>
                <View style={styles.pulseItem}>
                    <AppText variant="h3" weight="black" style={{ color: Theme.Colors.primary }}>{counts.waiting}</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>ARRIVED</AppText>
                </View>
                <View style={styles.pulseDivider} />
                <View style={styles.pulseItem}>
                    <AppText variant="h3" weight="black" style={{ color: Theme.Colors.warning }}>{counts.ready}</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>READY/VITALS</AppText>
                </View>
                <View style={styles.pulseDivider} />
                <View style={styles.pulseItem}>
                    <AppText variant="h3" weight="black" style={{ color: Theme.Colors.success }}>{counts.inProgress}</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>IN CARE</AppText>
                </View>
            </View>

            <FlatList
                data={queue}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.Colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBg}>
                            <Ionicons name="people-outline" size={48} color={Theme.Colors.divider} />
                        </View>
                        <AppText variant="h3" weight="black">FLOW VACUUM</AppText>
                        <AppText variant="body" color="textSecondary" align="center" weight="bold" style={{ marginTop: 12 }}>
                            No active patient intake vectors detected in the lifecycle matrix.
                        </AppText>
                    </View>
                }
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    pulseStrip: { flexDirection: 'row', backgroundColor: Theme.Colors.surface, marginHorizontal: 24, borderRadius: 24, paddingVertical: 20, marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
    pulseItem: { flex: 1, alignItems: 'center' },
    pulseDivider: { width: 1, backgroundColor: Theme.Colors.divider },

    listContent: { paddingHorizontal: 24, paddingBottom: 40 },
    flowCard: { marginBottom: 16, borderRadius: 20, borderLeftWidth: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    telemetryRow: { flexDirection: 'row', alignItems: 'center' },

    cardBody: { paddingHorizontal: 16, paddingVertical: 12 },
    cardFooter: { padding: 12, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    actionBtn: { height: 44, borderRadius: 12 },

    emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyIconBg: { width: 96, height: 96, borderRadius: 32, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
});

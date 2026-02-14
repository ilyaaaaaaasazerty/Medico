import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { labApi } from '@/services/lab.api';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

interface LabRequest {
    id: string;
    patient: { firstName: string; lastName: string };
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    items: { test: { name: string } }[];
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    PENDING: { color: Theme.Colors.warning, bg: Theme.Colors.warning + '12', label: 'AWAITING CONFIRMATION' },
    CONFIRMED: { color: Theme.Colors.primary, bg: Theme.Colors.primary + '12', label: 'ENGAGEMENT CONFIRMED' },
    SAMPLE_COLLECTED: { color: '#6366F1', bg: '#6366F112', label: 'SAMPLE ACQUIRED' },
    IN_PROGRESS: { color: '#8B5CF6', bg: '#8B5CF612', label: 'DIAGNOSTIC PROCESSING' },
    COMPLETED: { color: Theme.Colors.success, bg: Theme.Colors.success + '12', label: 'RESULTS COMMITTED' },
    CANCELLED: { color: Theme.Colors.error, bg: Theme.Colors.error + '12', label: 'ORDER VOIDED' },
};

type StatusFilter = 'all' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export default function LabAdminRequestsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [requests, setRequests] = useState<LabRequest[]>([]);
    const [filter, setFilter] = useState<StatusFilter>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadRequests();
        }, [])
    );

    const loadRequests = async () => {
        try {
            const res = await labApi.getLabRequests();
            if (res.success && res.data) {
                setRequests(res.data);
            }
        } catch (error) {
            console.error('Error loading diagnostic intake ledger:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAction = async (id: string, action: 'confirm' | 'collect' | 'start' | 'complete') => {
        setActionLoading(id);
        try {
            let res;
            switch (action) {
                case 'confirm': res = await labApi.confirmRequest(id); break;
                case 'collect': res = await labApi.collectSample(id); break;
                case 'start': res = await labApi.startProcessing(id); break;
                case 'complete': res = await labApi.completeRequest(id); break;
            }
            if (res?.success) {
                loadRequests();
            }
        } catch (error: any) {
            Alert.alert('PROTOCOL ERROR', error.message || 'State transition failed.');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    };

    const getActionButton = (request: LabRequest) => {
        const isLoading = actionLoading === request.id;

        const renderBtn = (label: string, action: any, color: string) => (
            <AppButton
                title={label}
                onPress={() => handleAction(request.id, action)}
                loading={isLoading}
                style={[styles.actionBtn, { backgroundColor: color }]}
            />
        );

        switch (request.status) {
            case 'PENDING': return renderBtn('CONFIRM ORDER', 'confirm', Theme.Colors.warning);
            case 'CONFIRMED': return renderBtn('ACQUIRE SAMPLE', 'collect', Theme.Colors.primary);
            case 'SAMPLE_COLLECTED': return renderBtn('INITIATE ANALYSIS', 'start', '#8B5CF6');
            case 'IN_PROGRESS': return renderBtn('FINAL RESULTS', 'complete', Theme.Colors.success);
            default: return null;
        }
    };

    const filteredRequests = filter === 'all'
        ? requests
        : requests.filter(r => r.status === filter || (filter === 'IN_PROGRESS' && ['CONFIRMED', 'SAMPLE_COLLECTED'].includes(r.status)));

    const renderRequest = ({ item }: { item: LabRequest }) => {
        const status = statusConfig[item.status] || { color: Theme.Colors.textSecondary, bg: Theme.Colors.surface, label: item.status };
        return (
            <AppCard
                style={styles.orderCard}
                padding="none"
                onPress={() => router.push(`/lab-admin-request/${item.id}`)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.patientGroup}>
                        <View style={styles.avatar}>
                            <AppText variant="h3" weight="black" color="primary">
                                {item.patient.firstName[0]}{item.patient.lastName[0]}
                            </AppText>
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <AppText variant="body" weight="black" uppercase numberOfLines={1}>{item.patient.firstName} {item.patient.lastName}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9 }}>CASE: #{item.id.slice(-8).toUpperCase()}</AppText>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                        <AppText variant="caption" weight="black" style={{ color: status.color, fontSize: 8 }}>{status.label}</AppText>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.telemetryGrid}>
                        <View style={styles.telemetryItem}>
                            <Ionicons name="calendar-outline" size={14} color={Theme.Colors.primary} />
                            <AppText variant="caption" weight="black" style={{ marginLeft: 8, fontSize: 9 }}>{formatDate(item.scheduledDate)}</AppText>
                        </View>
                        <View style={styles.telemetryItem}>
                            <Ionicons name="time-outline" size={14} color={Theme.Colors.primary} />
                            <AppText variant="caption" weight="black" style={{ marginLeft: 8, fontSize: 9 }}>{item.scheduledTime}</AppText>
                        </View>
                    </View>

                    <View style={styles.panelList}>
                        {item.items.slice(0, 2).map((it, idx) => (
                            <View key={idx} style={styles.panelChip}>
                                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }} numberOfLines={1}>{it.test.name.toUpperCase()}</AppText>
                            </View>
                        ))}
                        {item.items.length > 2 && (
                            <View style={[styles.panelChip, { backgroundColor: Theme.Colors.primary + '08', borderColor: Theme.Colors.primary + '20' }]}>
                                <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 8 }}>+{item.items.length - 2} PANELS</AppText>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={{ flex: 1 }}>{getActionButton(item)}</View>
                    <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => router.push(`/lab-admin-request/${item.id}`)}
                    >
                        <Ionicons name="eye-outline" size={20} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                </View>
            </AppCard>
        );
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Intake Ledger</AppText>
                <TouchableOpacity onPress={() => { setRefreshing(true); loadRequests(); }} style={styles.circleBtn}>
                    <Ionicons name="refresh" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.filterStrip}>
                <FlatList
                    horizontal
                    data={['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED']}
                    keyExtractor={item => item}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContent}
                    renderItem={({ item: f }) => {
                        const isActive = filter === f;
                        return (
                            <TouchableOpacity
                                style={[styles.filterChip, isActive && styles.filterChipActive]}
                                onPress={() => setFilter(f as StatusFilter)}
                            >
                                <AppText variant="caption" weight="black" uppercase style={{ color: isActive ? 'white' : Theme.Colors.textSecondary, fontSize: 9 }}>
                                    {f === 'all' ? 'ACTIVE QUEUE' : f.replace('_', ' ')}
                                </AppText>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            <FlatList
                data={filteredRequests}
                renderItem={renderRequest}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.mainList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRequests(); }} tintColor={Theme.Colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBg}>
                            <Ionicons name="list-outline" size={48} color={Theme.Colors.textSecondary} />
                        </View>
                        <AppText variant="h3" weight="black">LEDGER VACUUM</AppText>
                        <AppText variant="body" color="textSecondary" align="center" weight="bold" style={{ marginTop: 12, opacity: 0.7 }}>
                            No diagnostic orders detected within active filters.
                        </AppText>
                    </View>
                }
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    filterStrip: { borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    filterContent: { paddingHorizontal: 24, paddingVertical: 16, gap: 10 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider },
    filterChipActive: { backgroundColor: Theme.Colors.text, borderColor: Theme.Colors.text },

    mainList: { padding: 24 },
    orderCard: { marginBottom: 20, borderRadius: 28 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20 },
    patientGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 8 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },

    cardBody: { paddingHorizontal: 20, marginBottom: 20 },
    telemetryGrid: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    telemetryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Theme.Colors.divider },
    panelList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    panelChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider },

    cardFooter: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    actionBtn: { flex: 1, height: 48, borderRadius: 14 },
    reviewBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },

    emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyIconBg: { width: 96, height: 96, borderRadius: 32, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
});

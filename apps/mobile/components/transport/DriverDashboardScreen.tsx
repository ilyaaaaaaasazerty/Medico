import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';
import { transportApi, DriverDashboard, TransportRequest } from '@/services/transport.api';
import { useAuth } from '@/providers/AuthProvider';

export default function DriverDashboardScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { logout } = useAuth();
    const [dashboard, setDashboard] = useState<DriverDashboard | null>(null);
    const [pendingRequests, setPendingRequests] = useState<TransportRequest[]>([]);
    const [activeRequest, setActiveRequest] = useState<TransportRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);

    const loadData = async () => {
        try {
            const [dashRes, pendingRes, activeRes] = await Promise.all([
                transportApi.getDriverDashboard(),
                transportApi.getPendingRequests(),
                transportApi.getActiveRequest()
            ]);
            if (dashRes.success) setDashboard(dashRes.data || null);
            if (pendingRes.success) setPendingRequests(pendingRes.data || []);
            if (activeRes.success) setActiveRequest(activeRes.data || null);
        } catch (error) {
            console.error('Error loading transport dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadData(); }, []);
    useFocusEffect(useCallback(() => { loadData(); }, []));

    const toggleStatus = async () => {
        if (!dashboard) return;
        const newStatus = dashboard.profile.status === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE';
        setStatusLoading(true);
        try {
            const res = await transportApi.updateStatus(newStatus);
            if (res.success) {
                setDashboard(prev => prev ? { ...prev, profile: { ...prev.profile, status: newStatus } } : null);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setStatusLoading(false);
        }
    };

    const acceptRequest = async (requestId: string) => {
        try {
            const res = await transportApi.acceptRequest(requestId);
            if (res.success) {
                setActiveRequest(res.data || null);
                setPendingRequests(prev => prev.filter(r => r.id !== requestId));
                setDashboard(prev => prev ? { ...prev, profile: { ...prev.profile, status: 'BUSY' } } : null);
            }
        } catch (error) {
            console.error('Error accepting request:', error);
        }
    };

    const updateRideStatus = async (status: 'ARRIVED_PICKUP' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED') => {
        if (!activeRequest) return;
        try {
            const res = await transportApi.updateRequestStatus(activeRequest.id, status);
            if (res.success) {
                if (status === 'COMPLETED' || status === 'CANCELLED') {
                    setActiveRequest(null);
                    setDashboard(prev => prev ? { ...prev, profile: { ...prev.profile, status: 'AVAILABLE' } } : null);
                    loadData();
                } else {
                    setActiveRequest(res.data || null);
                }
            }
        } catch (error) {
            console.error('Error updating ride status:', error);
        }
    };

    const openNavigation = () => {
        if (!activeRequest) return;
        const lat = activeRequest.status === 'ACCEPTED' ? activeRequest.pickupLat : activeRequest.destinationLat;
        const lng = activeRequest.status === 'ACCEPTED' ? activeRequest.pickupLng : activeRequest.destinationLng;
        if (lat && lng) {
            const url = Platform.OS === 'ios'
                ? `maps:0,0?q=${lat},${lng}`
                : `geo:0,0?q=${lat},${lng}`;
            Linking.openURL(url);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    const isOnline = dashboard?.profile.status === 'AVAILABLE';
    const isBusy = dashboard?.profile.status === 'BUSY';

    return (
        <AppScreen padding={false} scrollable refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Theme.Colors.primary} />}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <AppText variant="caption" color="textSecondary" weight="bold" uppercase>{t('transport.title')}</AppText>
                    <AppText variant="h2" weight="black">{dashboard?.profile.companyName || 'Driver'}</AppText>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={22} color={Theme.Colors.error} />
                </TouchableOpacity>
            </View>

            {/* Status Toggle */}
            <View style={styles.statusSection}>
                <TouchableOpacity
                    style={[styles.statusToggle, isOnline && styles.statusOnline, isBusy && styles.statusBusy]}
                    onPress={toggleStatus}
                    disabled={statusLoading || isBusy}
                >
                    {statusLoading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <Ionicons name={isOnline ? 'radio-button-on' : isBusy ? 'car' : 'radio-button-off'} size={28} color="white" />
                            <AppText variant="h3" weight="black" style={{ color: 'white', marginTop: 8 }}>
                                {isBusy ? 'EN ROUTE' : isOnline ? t('transport.online') : t('transport.offline')}
                            </AppText>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <AppCard style={styles.statCard} padding="md">
                    <AppText variant="h2" weight="black" color="primary">{dashboard?.stats.completedToday || 0}</AppText>
                    <AppText variant="caption" color="textSecondary" weight="bold">Rides Today</AppText>
                </AppCard>
                <AppCard style={styles.statCard} padding="md">
                    <AppText variant="h2" weight="black" color="success">{dashboard?.stats.earningsToday || 0} DZD</AppText>
                    <AppText variant="caption" color="textSecondary" weight="bold">Earnings</AppText>
                </AppCard>
            </View>

            {/* Active Ride */}
            {activeRequest && (
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={{ marginBottom: 12, letterSpacing: 1 }}>ACTIVE RIDE</AppText>
                    <AppCard style={styles.activeRideCard} padding="lg">
                        <View style={styles.rideHeader}>
                            <View style={styles.patientInfo}>
                                <AppText variant="h3" weight="black">{activeRequest.patient?.firstName} {activeRequest.patient?.lastName}</AppText>
                                {activeRequest.patient?.phone && (
                                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${activeRequest.patient?.phone}`)}>
                                        <AppText variant="body" color="primary">{activeRequest.patient.phone}</AppText>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: Theme.Colors.warning + '20' }]}>
                                <AppText variant="caption" color="warning" weight="black">{activeRequest.status.replace('_', ' ')}</AppText>
                            </View>
                        </View>

                        <View style={styles.addressBlock}>
                            <View style={styles.addressRow}>
                                <Ionicons name="location" size={18} color={Theme.Colors.success} />
                                <AppText variant="body" style={{ marginLeft: 8, flex: 1 }}>{activeRequest.pickupAddress}</AppText>
                            </View>
                            {activeRequest.destinationAddress && (
                                <View style={styles.addressRow}>
                                    <Ionicons name="flag" size={18} color={Theme.Colors.error} />
                                    <AppText variant="body" style={{ marginLeft: 8, flex: 1 }}>{activeRequest.destinationAddress}</AppText>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity style={styles.navButton} onPress={openNavigation}>
                            <Ionicons name="navigate" size={20} color="white" />
                            <AppText variant="body" weight="bold" style={{ color: 'white', marginLeft: 8 }}>Open Navigation</AppText>
                        </TouchableOpacity>

                        <View style={styles.actionRow}>
                            {activeRequest.status === 'ACCEPTED' && (
                                <AppButton title="I'VE ARRIVED" onPress={() => updateRideStatus('ARRIVED_PICKUP')} style={{ flex: 1 }} />
                            )}
                            {activeRequest.status === 'ARRIVED_PICKUP' && (
                                <AppButton title="START TRIP" onPress={() => updateRideStatus('IN_TRANSIT')} style={{ flex: 1 }} />
                            )}
                            {activeRequest.status === 'IN_TRANSIT' && (
                                <AppButton title="COMPLETE RIDE" onPress={() => updateRideStatus('COMPLETED')} variant="primary" style={{ flex: 1 }} />
                            )}
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => updateRideStatus('CANCELLED')}>
                                <Ionicons name="close" size={20} color={Theme.Colors.error} />
                            </TouchableOpacity>
                        </View>
                    </AppCard>
                </View>
            )}

            {/* Pending Requests */}
            {!activeRequest && isOnline && pendingRequests.length > 0 && (
                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ marginBottom: 12, letterSpacing: 1 }}>AVAILABLE REQUESTS</AppText>
                    {pendingRequests.map(request => (
                        <AppCard key={request.id} style={styles.requestCard} padding="md">
                            <View style={styles.requestHeader}>
                                <AppText variant="body" weight="bold">{request.patient?.firstName} {request.patient?.lastName}</AppText>
                                <AppText variant="caption" color="textSecondary">{new Date(request.createdAt).toLocaleTimeString()}</AppText>
                            </View>
                            <View style={styles.addressRow}>
                                <Ionicons name="location" size={16} color={Theme.Colors.primary} />
                                <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6, flex: 1 }} numberOfLines={1}>{request.pickupAddress}</AppText>
                            </View>
                            <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRequest(request.id)}>
                                <AppText variant="body" weight="black" style={{ color: 'white' }}>ACCEPT</AppText>
                            </TouchableOpacity>
                        </AppCard>
                    ))}
                </View>
            )}

            {/* Empty State */}
            {!activeRequest && isOnline && pendingRequests.length === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="car-outline" size={64} color={Theme.Colors.divider} />
                    <AppText variant="h3" weight="bold" style={{ marginTop: 16 }}>Waiting for Requests</AppText>
                    <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: 8 }}>
                        You are online and ready. New ride requests will appear here.
                    </AppText>
                </View>
            )}

            {/* Quick Actions */}
            <View style={styles.section}>
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(transport)/schedule')}>
                        <View style={styles.actionIcon}><Ionicons name="calendar-outline" size={22} color={Theme.Colors.primary} /></View>
                        <AppText variant="caption" weight="bold">Schedule</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(transport)/history')}>
                        <View style={styles.actionIcon}><Ionicons name="time-outline" size={22} color={Theme.Colors.primary} /></View>
                        <AppText variant="caption" weight="bold">History</AppText>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ height: 40 }} />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
    logoutBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.error + '10', justifyContent: 'center', alignItems: 'center' },
    statusSection: { alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
    statusToggle: { width: 140, height: 140, borderRadius: 70, backgroundColor: Theme.Colors.textDisabled, justifyContent: 'center', alignItems: 'center', ...Theme.Shadows.floating },
    statusOnline: { backgroundColor: Theme.Colors.success },
    statusBusy: { backgroundColor: Theme.Colors.warning },
    statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 24 },
    statCard: { flex: 1, alignItems: 'center' },
    section: { paddingHorizontal: 24, marginBottom: 24 },
    activeRideCard: { borderWidth: 2, borderColor: Theme.Colors.primary },
    rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    patientInfo: { flex: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    addressBlock: { gap: 8, marginBottom: 16 },
    addressRow: { flexDirection: 'row', alignItems: 'flex-start' },
    navButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.Colors.primaryAlt, padding: 14, borderRadius: 12, marginBottom: 16 },
    actionRow: { flexDirection: 'row', gap: 10 },
    cancelBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: Theme.Colors.error + '10', justifyContent: 'center', alignItems: 'center' },
    requestCard: { marginBottom: 12 },
    requestHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    acceptBtn: { backgroundColor: Theme.Colors.primary, padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
    emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    quickActions: { flexDirection: 'row', gap: 12 },
    actionItem: { flex: 1, backgroundColor: Theme.Colors.surface, padding: 16, borderRadius: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Theme.Colors.divider },
    actionIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
});

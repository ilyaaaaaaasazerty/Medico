import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { clinicApi } from '@/services/clinic.api';
import { messageApi } from '@/services/message.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard } from '@/components/base';
import Theme from '@/constants/Theme';

interface Appointment {
    id: string;
    scheduledDate: string;
    scheduledTime: string;
    status: string;
    patient: {
        id: string;
        firstName: string;
        lastName: string;
    };
    doctor: {
        firstName: string;
        lastName: string;
    };
    service: {
        name: string;
    };
}

const FILTERS = [
    { label: 'ALL', value: 'All' },
    { label: 'ACTIVE', value: 'Today' },
    { label: 'UPCOMING', value: 'Upcoming' },
    { label: 'COMPLETED', value: 'Completed' },
    { label: 'VOIDED', value: 'Cancelled' }
];

export default function ClinicAppointmentsScreen() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        loadAppointments();
    }, [filter]);

    useFocusEffect(
        useCallback(() => {
            loadAppointments();
        }, [filter])
    );

    const loadAppointments = async () => {
        try {
            const params = filter === 'All' ? {} : { status: filter.toUpperCase() };
            const res = await clinicApi.getAppointments(params) as { success: boolean; data: Appointment[] };
            if (res.success && res.data) {
                setAppointments(res.data);
            }
        } catch (error) {
            console.error('Error loading engagement ledger:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleMessagePatient = async (patientId: string, patientName: string) => {
        try {
            const res = await messageApi.startThread(patientId);
            if (res.success) {
                router.push({
                    pathname: '/(app)/messages/[id]',
                    params: { id: res.data.id, name: patientName }
                });
            }
        } catch (error) {
            console.error('Error initiating patient communication:', error);
        }
    };

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return { color: Theme.Colors.primary, label: 'AUTHORIZED' };
            case 'PENDING': return { color: Theme.Colors.warning, label: 'PENDING SYNC' };
            case 'CANCELLED': return { color: Theme.Colors.error, label: 'VOIDED' };
            case 'COMPLETED': return { color: Theme.Colors.textSecondary, label: 'FINALIZED' };
            case 'IN_PROGRESS': return { color: Theme.Colors.success, label: 'IN PROGRESS' };
            default: return { color: Theme.Colors.textSecondary, label: status };
        }
    };

    const renderItem = ({ item }: { item: Appointment }) => {
        const theme = getStatusTheme(item.status);
        const dateObj = new Date(item.scheduledDate);

        return (
            <AppCard
                style={styles.card}
                padding="none"
                onPress={() => router.push({ pathname: '/(app)/appointment-details', params: { id: item.id } })}
            >
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.temporalGroup}>
                            <View style={styles.timeIcon}>
                                <Ionicons name="time-outline" size={16} color={Theme.Colors.primary} />
                            </View>
                            <View>
                                <AppText variant="body" weight="black">{item.scheduledTime}</AppText>
                                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9 }}>
                                    {dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()}
                                </AppText>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: theme.color + '08', borderColor: theme.color + '20' }]}>
                            <AppText variant="caption" weight="black" style={{ color: theme.color, fontSize: 8 }}>{theme.label.toUpperCase()}</AppText>
                        </View>
                    </View>

                    <View style={styles.cardBody}>
                        <View style={styles.patientIdentity}>
                            <View style={styles.avatar}>
                                <AppText variant="caption" weight="black" color="primary">{item.patient.firstName[0]}{item.patient.lastName[0]}</AppText>
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>{item.patient.firstName} {item.patient.lastName}</AppText>
                                <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 9, marginTop: 2 }}>{item.service.name.toUpperCase()}</AppText>
                            </View>
                        </View>

                        <View style={styles.personnelSection}>
                            <View style={styles.personnelRow}>
                                <Ionicons name="medical-outline" size={12} color={Theme.Colors.textSecondary} />
                                <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 6 }}>DR. {item.doctor.firstName.toUpperCase()} {item.doctor.lastName.toUpperCase()}</AppText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={styles.idGroup}>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>ENGAGEMENT REID: #{item.id.slice(-6).toUpperCase()}</AppText>
                        </View>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleMessagePatient(item.patient.id, `${item.patient.firstName} ${item.patient.lastName}`)}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={18} color={Theme.Colors.primary} />
                            <AppText variant="caption" color="primary" weight="black" style={{ marginLeft: 8, fontSize: 10 }}>MESSAGE</AppText>
                        </TouchableOpacity>
                    </View>
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
                <AppText variant="h3" weight="black">Engagement Ledger</AppText>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {FILTERS.map(f => (
                        <TouchableOpacity
                            key={f.value}
                            style={[styles.filterTab, filter === f.value && styles.filterTabActive]}
                            onPress={() => setFilter(f.value)}
                        >
                            <AppText variant="caption" weight="black" style={{
                                color: filter === f.value ? 'white' : Theme.Colors.textSecondary,
                                fontSize: 9
                            }}>
                                {f.label}
                            </AppText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAppointments(); }} tintColor={Theme.Colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="list-outline" size={42} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">NO ENGAGEMENTS FOUND</AppText>
                            <AppText variant="caption" weight="bold" color="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>
                                Adjust filters or clinical state to view operational data.
                            </AppText>
                        </View>
                    }
                />
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    filterSection: { marginBottom: 8 },
    filterScroll: { paddingHorizontal: 24, paddingVertical: 12, gap: 10 },
    filterTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider },
    filterTabActive: { backgroundColor: Theme.Colors.text, borderColor: Theme.Colors.text },

    list: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
    card: { marginBottom: 16, borderRadius: 32 },
    cardContent: { padding: 22 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    temporalGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    timeIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },

    cardBody: { marginBottom: 24 },
    patientIdentity: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    personnelSection: { backgroundColor: Theme.Colors.surface, padding: 12, borderRadius: 16 },
    personnelRow: { flexDirection: 'row', alignItems: 'center' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    idGroup: { opacity: 0.6 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },

    emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyIconBox: { width: 84, height: 84, borderRadius: 28, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
});

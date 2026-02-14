import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { appointmentApi } from '@/services/appointment.api';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

type Status = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULED' | 'NO_SHOW' | 'IN_PROGRESS' | 'CALLED';

interface Appointment {
    id: string;
    scheduledDate: string;
    scheduledTime: string;
    status: Status;
    type: 'IN_PERSON' | 'VIDEO_CALL';
    doctor: {
        firstName: string;
        lastName: string;
        avatarUrl?: string;
        specialties?: { specialty: { name: string } }[];
    };
    service: {
        name: string;
    };
}

export default function AppointmentsScreen() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'UPCOMING' | 'PAST'>('UPCOMING');

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const res = await appointmentApi.getMyAppointments();
            if (res.success && res.data) {
                setAppointments(res.data as any as Appointment[]);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const upcoming = appointments.filter(a => ['PENDING', 'CONFIRMED', 'CALLED', 'IN_PROGRESS'].includes(a.status));
    const past = appointments.filter(a => ['COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'].includes(a.status));
    const currentData = filter === 'UPCOMING' ? upcoming : past;

    const getStatusColor = (status: Status) => {
        switch (status) {
            case 'PENDING': return Theme.Colors.warning;
            case 'CONFIRMED': return Theme.Colors.success;
            case 'COMPLETED': return Theme.Colors.primary;
            case 'CANCELLED': return Theme.Colors.error;
            case 'CALLED': return Theme.Colors.error;
            case 'IN_PROGRESS': return Theme.Colors.success;
            default: return Theme.Colors.textSecondary;
        }
    };

    const renderItem = ({ item }: { item: Appointment }) => (
        <AppCard
            style={styles.card}
            variant="elevated"
            padding="md"
            onPress={() => router.push({ pathname: '/(app)/appointment-details', params: { id: item.id } })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.dateTimeWrap}>
                    <AppText variant="title" style={{ fontSize: 18 }}>{item.scheduledTime}</AppText>
                    <AppText variant="caption" color="textSecondary">
                        {new Date(item.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </AppText>
                </View>
                <AppCard
                    style={{ backgroundColor: getStatusColor(item.status) + '15', borderRadius: Theme.Radii.sm }}
                    padding="xs"
                >
                    <View style={styles.statusBadge}>
                        <AppText weight="bold" style={{ fontSize: 10, color: getStatusColor(item.status), letterSpacing: 0.5, textTransform: 'uppercase' }}>
                            {item.status}
                        </AppText>
                    </View>
                </AppCard>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.doctorInfo}>
                {item.doctor.avatarUrl ? (
                    <Image source={{ uri: item.doctor.avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <AppText weight="black" color="primary" style={{ fontSize: 18 }}>
                            {item.doctor.firstName[0]}{item.doctor.lastName[0]}
                        </AppText>
                    </View>
                )}
                <View style={styles.drText}>
                    <AppText weight="bold">Dr. {item.doctor.firstName} {item.doctor.lastName}</AppText>
                    <AppText variant="caption" color="textSecondary">{item.service?.name || 'General Consultation'}</AppText>
                </View>
                <View style={styles.typeIconBox}>
                    <Ionicons
                        name={item.type === 'IN_PERSON' ? 'location-outline' : 'videocam-outline'}
                        size={18}
                        color={Theme.Colors.primary}
                    />
                </View>
            </View>

            <View style={styles.cardFooter}>
                <AppCard style={{ backgroundColor: Theme.Colors.overlayPrimary, borderRadius: Theme.Radii.sm }} padding="xs">
                    <View style={styles.pill}>
                        <Ionicons name="medical-outline" size={14} color={Theme.Colors.primary} />
                        <AppText weight="bold" color="primary" style={{ fontSize: 12 }}>
                            {item.doctor.specialties?.[0]?.specialty.name || 'Specialist'}
                        </AppText>
                    </View>
                </AppCard>
                <Ionicons name="chevron-forward" size={20} color={Theme.Colors.divider} />
            </View>
        </AppCard>
    );

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <AppText variant="title">Medical Visits</AppText>
                <TouchableOpacity style={styles.filterBtn}>
                    <Ionicons name="filter-outline" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <AppCard style={styles.tabBar} variant="outline" padding="xs">
                <TouchableOpacity
                    style={[styles.tab, filter === 'UPCOMING' && styles.activeTab]}
                    onPress={() => setFilter('UPCOMING')}
                >
                    <AppText
                        weight="bold"
                        color={filter === 'UPCOMING' ? 'primary' : 'textSecondary'}
                        style={{ fontSize: 14 }}
                    >
                        Scheduled
                    </AppText>
                    {upcoming.length > 0 && (
                        <View style={styles.badge}>
                            <AppText weight="black" color="textInverted" style={{ fontSize: 10 }}>{upcoming.length}</AppText>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, filter === 'PAST' && styles.activeTab]}
                    onPress={() => setFilter('PAST')}
                >
                    <AppText
                        weight="bold"
                        color={filter === 'PAST' ? 'primary' : 'textSecondary'}
                        style={{ fontSize: 14 }}
                    >
                        History
                    </AppText>
                </TouchableOpacity>
            </AppCard>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={currentData}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="calendar-clear-outline" size={48} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="h3" align="center">No sessions found</AppText>
                            <AppText color="textSecondary" align="center" style={{ marginTop: 8, marginBottom: 32 }}>
                                {filter === 'UPCOMING'
                                    ? "There are no health visitations scheduled for your profile."
                                    : "You haven't completed any medical consultations yet."}
                            </AppText>
                            {filter === 'UPCOMING' && (
                                <AppButton
                                    title="Initiate Consultation"
                                    icon="add"
                                    onPress={() => router.push('/(app)/(tabs)/search')}
                                    style={{ paddingHorizontal: 32 }}
                                />
                            )}
                        </View>
                    }
                />
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.lg,
        paddingVertical: Theme.Spacing.lg
    },
    filterBtn: {
        width: 44,
        height: 44,
        borderRadius: Theme.Radii.md,
        backgroundColor: Theme.Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.divider
    },

    tabBar: {
        flexDirection: 'row',
        marginHorizontal: Theme.Spacing.lg,
        borderRadius: Theme.Radii.xl,
        padding: 4,
        marginBottom: Theme.Spacing.md
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Theme.Radii.lg,
        gap: 8
    },
    activeTab: {
        backgroundColor: Theme.Colors.surface,
        ...Theme.Shadows.card
    },
    badge: {
        backgroundColor: Theme.Colors.primary,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6
    },

    list: {
        paddingHorizontal: Theme.Spacing.lg,
        paddingBottom: 100
    },
    card: {
        marginBottom: Theme.Spacing.md,
        borderWidth: 1,
        borderColor: Theme.Colors.divider
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Theme.Spacing.md
    },
    dateTimeWrap: { gap: 4 },
    statusBadge: {
        paddingHorizontal: Theme.Spacing.sm,
        paddingVertical: 4
    },

    cardDivider: {
        height: 1,
        backgroundColor: Theme.Colors.divider,
        opacity: 0.5,
        marginBottom: Theme.Spacing.md
    },

    doctorInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: Theme.Radii.md
    },
    avatarPlaceholder: {
        width: 52,
        height: 52,
        borderRadius: Theme.Radii.md,
        backgroundColor: Theme.Colors.overlayPrimary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    drText: { marginLeft: Theme.Spacing.md, flex: 1 },
    typeIconBox: {
        width: 36,
        height: 36,
        borderRadius: Theme.Radii.sm,
        backgroundColor: Theme.Colors.overlayPrimary,
        justifyContent: 'center',
        alignItems: 'center'
    },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Theme.Spacing.md
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Theme.Spacing.sm,
        paddingVertical: 4
    },

    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: Theme.Spacing.xl
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: Theme.Radii.xxl,
        backgroundColor: Theme.Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.Spacing.xl,
        borderWidth: 1,
        borderColor: Theme.Colors.divider
    },
});

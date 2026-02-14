import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { patientApi } from '@/services/patient.api';
import Theme from '@/constants/Theme';
import { format, isTomorrow, isToday } from 'date-fns';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

interface DashboardData {
    profile: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    };
    upcomingAppointments: any[];
    activeMedications: any[];
    recentVitals: any[];
}

export default function HomeScreen() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsProfile, setNeedsProfile] = useState(false);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            checkRoleAndLoad();
        }, [user])
    );

    const checkRoleAndLoad = async () => {
        if (!user) return;
        if (user?.role === 'DOCTOR') { router.replace('/(app)/(doctor-tabs)'); return; }
        if (user?.role === 'CLINIC_ADMIN') { router.replace('/(app)/(clinic-tabs)'); return; }
        loadDashboard();
    };

    const loadDashboard = async () => {
        try {
            const existsRes = await patientApi.checkProfileExists();
            if (!existsRes.data?.exists) {
                setNeedsProfile(true);
                setLoading(false);
                return;
            }
            const dashboardRes = await patientApi.getDashboard();
            if (dashboardRes.success && dashboardRes.data) {
                setDashboard(dashboardRes.data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <AppScreen>
                <View style={styles.centerFlow}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            </AppScreen>
        );
    }

    if (needsProfile) {
        return (
            <AppScreen>
                <View style={styles.centerFlow}>
                    <AppText variant="title" align="center">Welcome!</AppText>
                    <AppText color="textSecondary" align="center" style={{ marginBottom: 24 }}>
                        Please complete your profile to access all features.
                    </AppText>
                    <AppButton title="Set Up Profile" onPress={() => router.push('/(app)/setup-profile')} />
                </View>
            </AppScreen>
        );
    }

    const nextAppointment = dashboard?.upcomingAppointments?.[0];
    const medications = dashboard?.activeMedications || [];
    const emergencyAppointment = dashboard?.upcomingAppointments?.find(a => a.doctor?.emergencyMode);

    return (
        <AppScreen scrollable padding={false}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <AppText variant="caption" color="textSecondary" style={{ textTransform: 'uppercase' }}>
                        {getGreeting()}
                    </AppText>
                    <AppText variant="title">{dashboard?.profile?.firstName} 👋</AppText>
                </View>
                <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/profile')}>
                    {dashboard?.profile?.avatarUrl ? (
                        <Image source={{ uri: dashboard.profile.avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <AppText weight="bold" color="primary" style={{ fontSize: 20 }}>
                                {dashboard?.profile?.firstName?.[0]}
                            </AppText>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Emergency Banner */}
            {emergencyAppointment && (
                <AppCard style={styles.emergencyBanner} variant="elevated">
                    <Ionicons name="warning" size={24} color={Theme.Colors.textInverted} />
                    <View style={{ flex: 1 }}>
                        <AppText variant="title" color="textInverted" style={{ fontWeight: '800' }}>URGENT UPDATE</AppText>
                        <AppText variant="caption" color="textInverted">
                            Dr. {emergencyAppointment.doctor?.lastName} has an emergency. Delays expected.
                        </AppText>
                    </View>
                </AppCard>
            )}

            {/* Hero Card */}
            <View style={{ paddingHorizontal: Theme.Spacing.lg }}>
                {nextAppointment ? (
                    <AppCard
                        style={[
                            styles.heroCard,
                            nextAppointment.status === 'CALLED' && { backgroundColor: Theme.Colors.error },
                            nextAppointment.status === 'IN_PROGRESS' && { backgroundColor: Theme.Colors.success }
                        ]}
                        padding="lg"
                    >
                        <View style={styles.heroHeader}>
                            <AppText variant="caption" weight="bold" color="textInverted">
                                {nextAppointment.status === 'CALLED' ? '• YOUR TURN' :
                                    nextAppointment.status === 'IN_PROGRESS' ? '• IN PROGRESS' :
                                        nextAppointment.status === 'CHECKED_IN' ? '• WAITING' : 'UPCOMING'}
                            </AppText>
                            <AppText variant="caption" color="textInverted">
                                {isToday(new Date(nextAppointment.scheduledDate)) ? 'Today' :
                                    isTomorrow(new Date(nextAppointment.scheduledDate)) ? 'Tomorrow' :
                                        format(new Date(nextAppointment.scheduledDate), 'MMM d')}, {nextAppointment.scheduledTime}
                            </AppText>
                        </View>
                        <AppText variant="h3" color="textInverted">
                            Dr. {nextAppointment.doctor?.lastName}
                        </AppText>
                        <AppText color="textInverted" style={{ opacity: 0.9, marginBottom: 20 }}>
                            {nextAppointment.service?.name} • {nextAppointment.clinic?.name || 'MedCity Clinic'}
                        </AppText>

                        <View style={styles.heroActions}>
                            {(nextAppointment.status === 'CALLED' || nextAppointment.status === 'CHECKED_IN') ? (
                                <AppButton
                                    title="View Details"
                                    variant="outline"
                                    onPress={() => router.push({ pathname: '/(app)/appointment-details', params: { id: nextAppointment.id } })}
                                    style={{ backgroundColor: Theme.Colors.surface, flex: 1 }}
                                />
                            ) : (
                                <>
                                    <AppButton
                                        title="Navigate"
                                        variant="outline"
                                        style={{ backgroundColor: Theme.Colors.surface, flex: 1 }}
                                    />
                                    <AppButton
                                        title="Details"
                                        variant="outline"
                                        onPress={() => router.push({ pathname: '/(app)/appointment-details', params: { id: nextAppointment.id } })}
                                        style={{ flex: 1 }}
                                    />
                                </>
                            )}
                        </View>
                    </AppCard>
                ) : (
                    <AppCard style={[styles.heroCard, { backgroundColor: Theme.Colors.text }]} padding="lg">
                        <Ionicons name="shield-checkmark" size={32} color={Theme.Colors.success} style={{ marginBottom: 8 }} />
                        <AppText variant="h3" color="textInverted">All caught up!</AppText>
                        <AppText color="textInverted" style={{ opacity: 0.8 }}>No upcoming appointments scheduled.</AppText>
                    </AppCard>
                )}
            </View>

            {/* Emergency Row */}
            <View style={styles.emergencyRow}>
                <TouchableOpacity
                    style={[styles.emergencyBtn, { backgroundColor: Theme.Colors.error }]}
                    onPress={() => router.push('/(app)/emergency-transport?type=AMBULANCE')}
                >
                    <View style={styles.emergencyIconBg}>
                        <Ionicons name="medical" size={24} color={Theme.Colors.error} />
                    </View>
                    <AppText weight="bold" color="textInverted">Ambulance</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.emergencyBtn, { backgroundColor: Theme.Colors.secondary }]}
                    onPress={() => router.push('/(app)/emergency-transport?type=TAXI')}
                >
                    <View style={styles.emergencyIconBg}>
                        <Ionicons name="car" size={24} color={Theme.Colors.secondary} />
                    </View>
                    <AppText weight="bold" color="text">Health Taxi</AppText>
                </TouchableOpacity>
            </View>

            {/* Vitals Section */}
            <View style={styles.sectionHeader}>
                <AppText variant="h3">Health Pulse</AppText>
                <TouchableOpacity><AppText variant="caption" color="primary">See All</AppText></TouchableOpacity>
            </View>
            <View style={styles.pulseScrollWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Theme.Spacing.lg, gap: Theme.Spacing.md }}>
                    {/* Ring 1: Heart Rate */}
                    <AppCard style={styles.pulseCard} padding="sm">
                        <View style={[styles.ring, { borderColor: Theme.Colors.error }]}>
                            <Ionicons name="heart" size={20} color={Theme.Colors.error} />
                        </View>
                        <AppText weight="bold">
                            {dashboard?.recentVitals?.find((v: any) => v.type === 'HEART_RATE')?.value || '--'}
                            <AppText variant="caption" color="textSecondary"> bpm</AppText>
                        </AppText>
                        <AppText variant="caption" color="textSecondary">Heart Rate</AppText>
                    </AppCard>

                    {/* Ring 2: Weight */}
                    <AppCard style={styles.pulseCard} padding="sm">
                        <View style={[styles.ring, { borderColor: Theme.Colors.primary }]}>
                            <Ionicons name="body" size={20} color={Theme.Colors.primary} />
                        </View>
                        <AppText weight="bold">
                            {dashboard?.recentVitals?.find((v: any) => v.type === 'WEIGHT')?.value || '--'}
                            <AppText variant="caption" color="textSecondary"> kg</AppText>
                        </AppText>
                        <AppText variant="caption" color="textSecondary">Weight</AppText>
                    </AppCard>

                    {/* Ring 3: Glucose */}
                    <AppCard style={styles.pulseCard} padding="sm">
                        <View style={[styles.ring, { borderColor: '#BF5AF2' }]}>
                            <Ionicons name="flask" size={20} color="#BF5AF2" />
                        </View>
                        <AppText weight="bold">
                            {dashboard?.recentVitals?.find((v: any) => v.type === 'BLOOD_GLUCOSE')?.value || '--'}
                        </AppText>
                        <AppText variant="caption" color="textSecondary">Glucose</AppText>
                    </AppCard>
                </ScrollView>
            </View>

            {/* Timeline Section */}
            <View style={styles.sectionHeader}>
                <AppText variant="h3">My Day</AppText>
            </View>

            <View style={{ paddingBottom: 40 }}>
                {medications.length > 0 ? (
                    medications.flatMap((med: any) =>
                        (med.reminders || []).map((reminder: any) => ({
                            ...med,
                            reminderStatus: reminder.enabled,
                            time: reminder.time,
                            id: `${med.id}-${reminder.id}`
                        }))
                    )
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((item, index, array) => (
                            <View key={item.id} style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                    <AppText weight="bold" style={{ fontSize: 13 }}>{item.time}</AppText>
                                    {index !== array.length - 1 && <View style={styles.timelineLine} />}
                                    <View style={[styles.timelineDot, { backgroundColor: item.reminderStatus ? Theme.Colors.success : Theme.Colors.secondary }]} />
                                </View>
                                <AppCard style={styles.timelineContent} padding="md">
                                    <AppText weight="bold">{item.name}</AppText>
                                    <AppText variant="caption" color="textSecondary">{item.dosage} • {item.frequency}</AppText>
                                </AppCard>
                                <TouchableOpacity style={[styles.checkBtn, !item.reminderStatus && { borderColor: Theme.Colors.divider }]}>
                                    {item.reminderStatus && <Ionicons name="checkmark" size={20} color={Theme.Colors.success} />}
                                </TouchableOpacity>
                            </View>
                        ))
                ) : (
                    <View style={styles.emptyTimeline}>
                        <Ionicons name="calendar-outline" size={32} color={Theme.Colors.divider} />
                        <AppText color="textSecondary" align="center">No medication reminders for today.</AppText>
                    </View>
                )}
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    centerFlow: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.lg,
        paddingTop: Theme.Spacing.lg,
        paddingBottom: Theme.Spacing.md,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Theme.Colors.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    emergencyBanner: {
        backgroundColor: Theme.Colors.error,
        marginHorizontal: Theme.Spacing.lg,
        marginBottom: Theme.Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.Spacing.md,
    },
    heroCard: {
        backgroundColor: Theme.Colors.primary,
        borderRadius: Theme.Radii.xxl,
        marginBottom: Theme.Spacing.lg,
        ...Theme.Shadows.floating,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Theme.Spacing.md,
    },
    heroActions: {
        flexDirection: 'row',
        gap: Theme.Spacing.md,
    },
    emergencyRow: {
        flexDirection: 'row',
        paddingHorizontal: Theme.Spacing.lg,
        gap: Theme.Spacing.md,
        marginBottom: Theme.Spacing.xl,
    },
    emergencyBtn: {
        flex: 1,
        height: 100,
        borderRadius: Theme.Radii.xl,
        padding: Theme.Spacing.md,
        justifyContent: 'space-between',
    },
    emergencyIconBg: {
        width: 40,
        height: 40,
        borderRadius: Theme.Radii.full,
        backgroundColor: Theme.Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.lg,
        marginBottom: Theme.Spacing.md,
    },
    pulseScrollWrapper: {
        marginBottom: Theme.Spacing.xl,
    },
    pulseCard: {
        width: 120,
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Radii.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
        ...Theme.Shadows.card,
    },
    ring: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.Spacing.sm,
    },
    timelineItem: {
        flexDirection: 'row',
        paddingHorizontal: Theme.Spacing.lg,
        marginBottom: Theme.Spacing.lg,
    },
    timelineLeft: {
        alignItems: 'center',
        width: 50,
        marginRight: Theme.Spacing.sm,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        zIndex: 1,
        marginTop: 4,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: Theme.Colors.divider,
        position: 'absolute',
        top: 24,
        bottom: -24,
        left: 24,
    },
    timelineContent: {
        flex: 1,
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Radii.lg,
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
        ...Theme.Shadows.card,
    },
    checkBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: Theme.Colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginLeft: Theme.Spacing.md,
    },
    emptyTimeline: {
        alignItems: 'center',
        padding: Theme.Spacing.xxl,
        gap: Theme.Spacing.md,
    },
});

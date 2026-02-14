import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Dimensions, Platform, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { searchApi, DoctorProfile } from '@/services/availability.api';
import { clinicApi } from '@/services/clinic.api';
import { useAuth } from '@/providers/AuthProvider';
import Theme from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

const { width } = Dimensions.get('window');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Slot {
    time: string;
    available: boolean;
}

export default function DoctorProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [profile, setProfile] = useState<DoctorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [activeTab, setActiveTab] = useState<'BOOK' | 'ABOUT' | 'APPOINTMENTS'>('BOOK');
    const { user } = useAuth();
    const isAdmin = user?.role === 'CLINIC_ADMIN' || user?.role === 'STAFF';

    const [adminAppointments, setAdminAppointments] = useState<any[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            setActiveTab('APPOINTMENTS');
            loadAdminAppointments();
        }
    }, [isAdmin, id]);

    useEffect(() => {
        loadProfile();
    }, [id]);

    useEffect(() => {
        if (profile && activeTab === 'BOOK') {
            loadSlots(selectedDate);
        }
    }, [selectedDate, profile, activeTab]);

    const loadProfile = async () => {
        try {
            const res = await searchApi.getDoctorProfile(id!);
            if (res.success && res.data) {
                setProfile(res.data);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSlots = async (date: Date) => {
        setLoadingSlots(true);
        try {
            const dateStr = date.toISOString().split('T')[0];
            const res = await searchApi.getDoctorSlots(id!, dateStr);
            if (res.success && res.data) {
                setSlots(res.data);
            }
        } catch (error) {
            console.error('Error loading slots:', error);
        } finally {
            setLoadingSlots(false);
        }
    };

    const loadAdminAppointments = async () => {
        setLoadingAppointments(true);
        try {
            const res: any = await clinicApi.getAppointments({ doctorId: id });
            if (res.success && res.data) {
                setAdminAppointments(res.data);
            }
        } catch (error) {
            console.error('Error loading admin appointments:', error);
        } finally {
            setLoadingAppointments(false);
        }
    };

    const getNextDays = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const formatDate = (date: Date) => ({
        day: DAYS[date.getDay()],
        date: date.getDate(),
        month: date.toLocaleString('default', { month: 'short' }),
    });

    const handleBookAppointment = () => {
        if (!selectedSlot) return;

        router.push({
            pathname: '/(app)/book-appointment',
            params: {
                doctorId: id,
                date: selectedDate.toISOString().split('T')[0],
                time: selectedSlot,
            },
        });
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <AppScreen padding style={styles.center}>
                <Ionicons name="alert-circle-outline" size={64} color={Theme.Colors.textDisabled} />
                <AppText variant="h3" color="text" style={{ marginTop: 24 }}>Profile Not Found</AppText>
                <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: 12 }}>
                    This professional record is temporarily unavailable.
                </AppText>
                <AppButton
                    title="Return to Directory"
                    variant="outline"
                    onPress={() => router.back()}
                    style={{ marginTop: 32, width: '60%' }}
                />
            </AppScreen>
        );
    }

    return (
        <View style={styles.container}>
            <AppScreen padding={false} scrollable>
                {/* Visual Header Section */}
                <View style={styles.heroSection}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=2664&auto=format&fit=crop' }}
                        style={styles.heroBg}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.5)', 'transparent', Theme.Colors.background]}
                        locations={[0, 0.4, 1]}
                        style={styles.heroOverlay}
                    />

                    <View style={styles.topActions}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.topBtn}>
                            <Ionicons name="chevron-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={styles.topRightActions}>
                            <TouchableOpacity style={styles.topBtn}>
                                <Ionicons name="heart-outline" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.topBtn}>
                                <Ionicons name="share-social-outline" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.profileHeader}>
                        <View style={styles.avatarWrap}>
                            {profile.avatarUrl ? (
                                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <AppText variant="h3" color="primary">{profile.firstName[0]}{profile.lastName[0]}</AppText>
                                </View>
                            )}
                            <View style={styles.onlineBadge} />
                        </View>
                        <View style={styles.headerInfo}>
                            <AppText variant="title" color="text">Dr. {profile.firstName} {profile.lastName}</AppText>
                            <AppText variant="caption" weight="semiBold" color="textSecondary" style={{ marginTop: 4 }}>
                                {profile.specialties.map((s: any) => s.name).join(' • ')}
                            </AppText>
                            {profile.verified && (
                                <View style={styles.verifiedTag}>
                                    <Ionicons name="checkmark-circle" size={14} color={Theme.Colors.primary} />
                                    <AppText variant="caption" color="primary" weight="bold">Verified Medical Professional</AppText>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Performance Metrics */}
                <View style={styles.metricsBar}>
                    {isAdmin ? (
                        <>
                            <View style={styles.metricItem}>
                                <View style={[styles.metricIcon, { backgroundColor: Theme.Colors.primary + '10' }]}>
                                    <Ionicons name="calendar-outline" size={20} color={Theme.Colors.primary} />
                                </View>
                                <View>
                                    <AppText variant="body" weight="bold" color="text">{adminAppointments.length}</AppText>
                                    <AppText variant="caption" color="textSecondary">Assigned Appt</AppText>
                                </View>
                            </View>
                            <View style={styles.metricDivider} />
                            <View style={styles.metricItem}>
                                <View style={[styles.metricIcon, { backgroundColor: Theme.Colors.success + '10' }]}>
                                    <Ionicons name="today-outline" size={20} color={Theme.Colors.success} />
                                </View>
                                <View>
                                    <AppText variant="body" weight="bold" color="text">
                                        {adminAppointments.filter(a => new Date(a.scheduledDate).toDateString() === new Date().toDateString()).length}
                                    </AppText>
                                    <AppText variant="caption" color="textSecondary">Schedule Today</AppText>
                                </View>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.metricItem}>
                                <View style={[styles.metricIcon, { backgroundColor: Theme.Colors.warning + '10' }]}>
                                    <Ionicons name="star" size={18} color={Theme.Colors.warning} />
                                </View>
                                <View>
                                    <AppText variant="body" weight="bold" color="text">{profile.averageRating?.toFixed(1) || 'NEW'}</AppText>
                                    <AppText variant="caption" color="textSecondary">{profile.totalReviews || 0} Ratings</AppText>
                                </View>
                            </View>
                            <View style={styles.metricDivider} />
                            <View style={styles.metricItem}>
                                <View style={[styles.metricIcon, { backgroundColor: Theme.Colors.primary + '10' }]}>
                                    <Ionicons name="ribbon-outline" size={20} color={Theme.Colors.primary} />
                                </View>
                                <View>
                                    <AppText variant="body" weight="bold" color="text">{profile.yearsExperience || 1}+ Years</AppText>
                                    <AppText variant="caption" color="textSecondary">Experience</AppText>
                                </View>
                            </View>
                        </>
                    )}
                </View>

                {/* Tabbed Content */}
                <View style={styles.tabContainer}>
                    <View style={styles.tabBar}>
                        {isAdmin ? (
                            <TouchableOpacity
                                style={[styles.tabItem, activeTab === 'APPOINTMENTS' && styles.activeTab]}
                                onPress={() => setActiveTab('APPOINTMENTS')}
                            >
                                <AppText variant="body" weight="semiBold" color={activeTab === 'APPOINTMENTS' ? 'primary' : 'textSecondary'}>
                                    Patient List
                                </AppText>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.tabItem, activeTab === 'BOOK' && styles.activeTab]}
                                onPress={() => setActiveTab('BOOK')}
                            >
                                <AppText variant="body" weight="semiBold" color={activeTab === 'BOOK' ? 'primary' : 'textSecondary'}>
                                    Book Visit
                                </AppText>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.tabItem, activeTab === 'ABOUT' && styles.activeTab]}
                            onPress={() => setActiveTab('ABOUT')}
                        >
                            <AppText variant="body" weight="semiBold" color={activeTab === 'ABOUT' ? 'primary' : 'textSecondary'}>
                                Professional Info
                            </AppText>
                        </TouchableOpacity>
                    </View>

                    {/* Dynamic Sections */}
                    <View style={styles.sectionContent}>
                        {isAdmin && activeTab === 'APPOINTMENTS' && (
                            <View>
                                <AppText variant="h3" color="text" style={{ marginBottom: 20 }}>Clinic Engagements</AppText>
                                {loadingAppointments ? (
                                    <ActivityIndicator color={Theme.Colors.primary} style={{ marginVertical: 40 }} />
                                ) : adminAppointments.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="calendar-clear-outline" size={48} color={Theme.Colors.divider} />
                                        <AppText variant="h3" color="text" style={{ marginTop: 16 }}>No scheduled visits</AppText>
                                        <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: 8 }}>
                                            There are no patients currently assigned to this doctor in your clinic.
                                        </AppText>
                                    </View>
                                ) : (
                                    adminAppointments.map((appt) => (
                                        <AppCard key={appt.id} style={{ marginBottom: 16 }}>
                                            <View style={styles.apptHeader}>
                                                <View style={styles.apptTimeWrap}>
                                                    <AppText variant="body" weight="bold" color="text">{appt.scheduledTime}</AppText>
                                                    <AppText variant="caption" color="textSecondary">
                                                        {new Date(appt.scheduledDate).toLocaleDateString()}
                                                    </AppText>
                                                </View>
                                                <View style={[styles.statusTag, { backgroundColor: appt.status === 'COMPLETED' ? Theme.Colors.success + '15' : Theme.Colors.primary + '15' }]}>
                                                    <AppText variant="caption" weight="bold" color={appt.status === 'COMPLETED' ? 'success' : 'primary'}>
                                                        {appt.status}
                                                    </AppText>
                                                </View>
                                            </View>
                                            <View style={styles.apptPatient}>
                                                <AppText variant="body" weight="semiBold" color="text">{appt.patient.firstName} {appt.patient.lastName}</AppText>
                                                <AppText variant="caption" color="primary" weight="bold">
                                                    {appt.service?.name || 'General Consultation'}
                                                </AppText>
                                            </View>
                                        </AppCard>
                                    ))
                                )}
                            </View>
                        )}

                        {!isAdmin && activeTab === 'BOOK' && (
                            <View>
                                <AppText variant="body" weight="bold" color="text" style={{ marginBottom: 20 }}>Select Appointment Date</AppText>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
                                    {getNextDays().map((date, i) => {
                                        const { day, date: d, month } = formatDate(date);
                                        const isSelected = date.toDateString() === selectedDate.toDateString();
                                        return (
                                            <TouchableOpacity
                                                key={i}
                                                style={[styles.dateCard, isSelected && styles.dateCardActive]}
                                                onPress={() => setSelectedDate(date)}
                                            >
                                                <AppText variant="caption" weight="semiBold" color={isSelected ? 'white' : 'textSecondary'} uppercase>
                                                    {day}
                                                </AppText>
                                                <AppText variant="h2" weight="bold" color={isSelected ? 'white' : 'text'} style={{ marginVertical: 4 }}>
                                                    {d}
                                                </AppText>
                                                <AppText variant="caption" weight="semiBold" color={isSelected ? 'white' : 'textSecondary'}>
                                                    {month}
                                                </AppText>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>

                                <AppText variant="body" weight="bold" color="text" style={{ marginTop: 32, marginBottom: 20 }}>Available Intervals</AppText>
                                {loadingSlots ? (
                                    <ActivityIndicator color={Theme.Colors.primary} style={{ marginVertical: 40 }} />
                                ) : slots.length === 0 ? (
                                    <View style={styles.emptySlots}>
                                        <Ionicons name="time-outline" size={32} color={Theme.Colors.divider} />
                                        <AppText variant="body" color="textSecondary" weight="semiBold">Fully booked for this date</AppText>
                                    </View>
                                ) : (
                                    <View style={styles.slotsGrid}>
                                        {slots.map((slot, i) => (
                                            <TouchableOpacity
                                                key={i}
                                                style={[
                                                    styles.slotItem,
                                                    !slot.available && styles.slotDisabled,
                                                    selectedSlot === slot.time && styles.slotSelected,
                                                ]}
                                                onPress={() => slot.available && setSelectedSlot(slot.time)}
                                                disabled={!slot.available}
                                            >
                                                <AppText
                                                    variant="body"
                                                    weight="bold"
                                                    color={selectedSlot === slot.time ? 'white' : (!slot.available ? 'textDisabled' : 'text')}
                                                >
                                                    {slot.time}
                                                </AppText>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'ABOUT' && (
                            <View>
                                {profile.bio && (
                                    <View style={styles.bioCard}>
                                        <AppText variant="body" weight="bold" color="text" style={{ marginBottom: 20 }}>Professional Biography</AppText>
                                        <AppText variant="body" color="textSecondary" style={{ lineHeight: 26 }}>{profile.bio}</AppText>
                                    </View>
                                )}

                                <AppCard style={styles.detailsCard}>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailIcon}>
                                            <Ionicons name="cash-outline" size={18} color={Theme.Colors.primary} />
                                        </View>
                                        <View style={styles.detailText}>
                                            <AppText variant="caption" color="textSecondary" weight="semiBold">Standard Consultation Fee</AppText>
                                            <AppText variant="body" weight="bold" color="text" style={{ marginTop: 2 }}>
                                                {profile.consultationFee} DZD
                                            </AppText>
                                        </View>
                                    </View>

                                    <View style={styles.detailDivider} />

                                    <View style={styles.detailRow}>
                                        <View style={styles.detailIcon}>
                                            <Ionicons name="videocam-outline" size={18} color={Theme.Colors.primary} />
                                        </View>
                                        <View style={styles.detailText}>
                                            <AppText variant="caption" color="textSecondary" weight="semiBold">Tele-Health Availability</AppText>
                                            <AppText variant="body" weight="bold" color={profile.teleconsultEnabled ? 'success' : 'error'} style={{ marginTop: 2 }}>
                                                {profile.teleconsultEnabled ? 'Supported' : 'Unavailable'}
                                            </AppText>
                                        </View>
                                    </View>
                                </AppCard>
                            </View>
                        )}
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </AppScreen>

            {/* Bottom Interaction Layer */}
            <View style={styles.bottomBar}>
                {isAdmin ? (
                    <AppButton
                        title="Back to Provider Directory"
                        onPress={() => router.push('/(app)/clinic-doctors')}
                        size="lg"
                    />
                ) : (
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.secondaryAction}>
                            <Ionicons name="chatbubble-ellipses-outline" size={24} color={Theme.Colors.primary} />
                        </TouchableOpacity>
                        <AppButton
                            title={activeTab === 'BOOK' ? 'Verify Submission' : 'Initiate Booking'}
                            onPress={() => {
                                if (activeTab !== 'BOOK') {
                                    setActiveTab('BOOK');
                                } else {
                                    handleBookAppointment();
                                }
                            }}
                            disabled={activeTab === 'BOOK' && !selectedSlot}
                            style={{ flex: 1 }}
                            size="lg"
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background, padding: 40 },

    // Hero Header
    heroSection: { height: 340, position: 'relative' },
    heroBg: { width: '100%', height: '100%', resizeMode: 'cover' },
    heroOverlay: { ...StyleSheet.absoluteFillObject },
    topActions: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
    topRightActions: { flexDirection: 'row', gap: 12 },
    topBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },

    profileHeader: { position: 'absolute', bottom: 0, left: 24, right: 24, flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 24 },
    avatarWrap: { position: 'relative' },
    avatar: { width: 88, height: 88, borderRadius: 32, borderWidth: 4, borderColor: Theme.Colors.background },
    avatarPlaceholder: { width: 88, height: 88, borderRadius: 32, backgroundColor: Theme.Colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: Theme.Colors.background },
    onlineBadge: { position: 'absolute', bottom: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: Theme.Colors.success, borderWidth: 3, borderColor: Theme.Colors.background },

    headerInfo: { marginLeft: 20, flex: 1, paddingBottom: 4 },
    verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },

    // Metrics
    metricsBar: { flexDirection: 'row', backgroundColor: Theme.Colors.card, marginHorizontal: 20, marginTop: -20, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.divider, shadowColor: Theme.Colors.text, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8, alignItems: 'center' },
    metricItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    metricIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    metricDivider: { width: 1, height: 32, backgroundColor: Theme.Colors.divider, marginHorizontal: 4 },

    // Tabs
    tabContainer: { marginTop: 32 },
    tabBar: { flexDirection: 'row', marginHorizontal: 24, backgroundColor: Theme.Colors.card, borderRadius: 20, padding: 6, borderWidth: 1, borderColor: Theme.Colors.divider },
    tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
    activeTab: { backgroundColor: Theme.Colors.background, shadowColor: Theme.Colors.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },

    // Content Section
    sectionContent: { padding: 24 },

    // Booking Tabs
    dateList: { marginHorizontal: -24, paddingHorizontal: 24 },
    dateCard: { width: 72, height: 96, borderRadius: 20, backgroundColor: Theme.Colors.card, borderWidth: 1, borderColor: Theme.Colors.divider, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    dateCardActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },

    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    slotItem: { width: (width - 72) / 3, backgroundColor: Theme.Colors.card, borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    slotDisabled: { backgroundColor: Theme.Colors.divider + '30', borderColor: 'transparent', opacity: 0.6 },
    slotSelected: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },
    emptySlots: { alignItems: 'center', paddingVertical: 32, gap: 12 },

    // Admin Tabs
    apptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    apptTimeWrap: { gap: 4 },
    statusTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    apptPatient: { gap: 4 },
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 16 },

    // About Tab
    bioCard: { marginBottom: 32 },
    detailsCard: { backgroundColor: Theme.Colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    detailIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    detailText: { flex: 1 },
    detailDivider: { height: 1, backgroundColor: Theme.Colors.divider, marginVertical: 16 },

    // Bottom Bar
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Theme.Colors.background, padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    actionRow: { flexDirection: 'row', gap: 12 },
    secondaryAction: { width: 56, height: 56, borderRadius: 18, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
});

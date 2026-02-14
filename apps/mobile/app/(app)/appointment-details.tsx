import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Theme from '@/constants/Theme';
import { appointmentApi } from '@/services/appointment.api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function AppointmentDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        loadDetails();
    }, [id]);

    const loadDetails = async () => {
        try {
            const res = await appointmentApi.getAppointmentDetails(id!);
            if (res.success && res.data) {
                setAppointment(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical engagement details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push({ pathname: '/(app)/cancel-appointment', params: { id: appointment.id } });
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (!appointment) return null;

    const isUpcoming = ['PENDING', 'CONFIRMED'].includes(appointment.status);
    const statusColor = appointment.status === 'CONFIRMED' ? Theme.Colors.success :
        appointment.status === 'PENDING' ? Theme.Colors.warning :
            Theme.Colors.textSecondary;

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Engagement Report</AppText>
                <TouchableOpacity style={[styles.circleBtn, { backgroundColor: Theme.Colors.primary + '10', borderColor: Theme.Colors.primary + '20' }]}>
                    <Ionicons name="share-social-outline" size={22} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Visual Status Hero */}
                <AppCard style={styles.heroCard} padding="none">
                    <LinearGradient
                        colors={[Theme.Colors.primary + '10', Theme.Colors.surface]}
                        style={styles.heroGradient}
                    >
                        <View style={styles.statusHeader}>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                                <AppText variant="caption" weight="black" uppercase style={{ color: statusColor, fontSize: 10 }}>{appointment.status}</AppText>
                            </View>
                            <AppText variant="caption" color="textSecondary" weight="black">REF: #{appointment.id.slice(-6).toUpperCase()}</AppText>
                        </View>

                        <View style={styles.timeSection}>
                            <AppText style={styles.mainTime}>{appointment.scheduledTime}</AppText>
                            <AppText variant="body" weight="black" color="textSecondary">
                                {new Date(appointment.scheduledDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </AppText>
                        </View>

                        <View style={styles.tagGrid}>
                            <View style={styles.typeTag}>
                                <Ionicons name={appointment.type === 'IN_PERSON' ? 'business' : 'videocam'} size={14} color={Theme.Colors.primary} />
                                <AppText variant="caption" weight="black" color="primary">{appointment.type === 'IN_PERSON' ? 'CLINIC VISIT' : 'TELEHEALTH'}</AppText>
                            </View>
                            <View style={styles.typeTag}>
                                <Ionicons name="wallet" size={14} color={Theme.Colors.primary} />
                                <AppText variant="caption" weight="black" color="primary">{appointment.paymentMethod}</AppText>
                            </View>
                        </View>
                    </LinearGradient>
                </AppCard>

                {/* Professional Info */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Authorized Practitioner</AppText>
                    <AppCard
                        padding="md"
                        onPress={() => router.push({ pathname: '/(app)/doctor-profile', params: { id: appointment.doctorId } })}
                    >
                        <View style={styles.drRow}>
                            {appointment.doctor?.avatarUrl ? (
                                <Image source={{ uri: appointment.doctor.avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <AppText variant="h3" weight="black" color="primary">{appointment.doctor?.firstName?.[0]}{appointment.doctor?.lastName?.[0]}</AppText>
                                </View>
                            )}
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <AppText variant="body" weight="black">Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">{appointment.doctor?.specialties?.[0]?.name || 'Medical Specialist'}</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Theme.Colors.divider} />
                        </View>
                    </AppCard>
                </View>

                {/* Clinical Context */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Clinical Parameters</AppText>
                    <AppCard padding="none">
                        <View style={styles.detailRow}>
                            <View style={[styles.iconBox, { backgroundColor: Theme.Colors.primary + '08' }]}>
                                <Ionicons name="medical" size={20} color={Theme.Colors.primary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 9 }}>Requested Service</AppText>
                                <AppText variant="body" weight="black">{appointment.service?.name || 'Standard Consultation'}</AppText>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.detailRow}>
                            <View style={[styles.iconBox, { backgroundColor: Theme.Colors.warning + '08' }]}>
                                <Ionicons name="alert-circle" size={20} color={Theme.Colors.warning} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 9 }}>Presenting Condition</AppText>
                                <AppText variant="body" weight="black">{appointment.reason || 'Symptomatic Assessment'}</AppText>
                            </View>
                        </View>
                        {appointment.notes && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.detailRow}>
                                    <View style={[styles.iconBox, { backgroundColor: Theme.Colors.success + '08' }]}>
                                        <Ionicons name="document-text" size={20} color={Theme.Colors.success} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 16 }}>
                                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 9 }}>Practitioner Notes</AppText>
                                        <AppText variant="body" weight="black">{appointment.notes}</AppText>
                                    </View>
                                </View>
                            </>
                        )}
                    </AppCard>
                </View>

                {/* Preparation Guidelines */}
                <View style={styles.prepBox}>
                    <Ionicons name="notifications-circle" size={24} color={Theme.Colors.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <AppText variant="body" weight="black">Preparation Protocol</AppText>
                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 4 }}>
                            Arrive 15 minutes before your scheduled interval. Ensure all historical diagnostic transcripts are uploaded to your vault.
                        </AppText>
                    </View>
                </View>

                <View style={{ height: 140 }} />
            </ScrollView>

            {/* Sticky Actions */}
            <View style={styles.footer}>
                {isUpcoming ? (
                    <View style={styles.actionGrid}>
                        <AppButton
                            title="Rescind Visit"
                            variant="tonal"
                            onPress={handleCancel}
                            style={{ flex: 1, height: 60, borderRadius: 20, backgroundColor: Theme.Colors.error + '10' }}
                            textStyle={{ color: Theme.Colors.error }}
                        />
                        <View style={{ width: 12 }} />
                        <AppButton
                            title="Shift Interval"
                            onPress={() => router.push({ pathname: '/(app)/reschedule-appointment', params: { id: appointment.id } })}
                            style={{ flex: 1, height: 60, borderRadius: 20 }}
                        />
                    </View>
                ) : (
                    <AppButton
                        title="Schedule New Engagement"
                        onPress={() => router.push({ pathname: '/(app)/search-doctors' })}
                        style={{ height: 64, borderRadius: 22 }}
                    />
                )}
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24 },
    heroCard: { marginBottom: 32, borderRadius: 32, overflow: 'hidden' },
    heroGradient: { padding: 28 },
    statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },

    timeSection: { marginBottom: 28 },
    mainTime: { fontSize: 42, fontWeight: '900', color: Theme.Colors.text, letterSpacing: -1 },

    tagGrid: { flexDirection: 'row', gap: 10 },
    typeTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Theme.Colors.primary + '10' },

    section: { marginBottom: 32 },
    sectionTitle: { marginBottom: 16, letterSpacing: 1 },

    drRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 56, height: 56, borderRadius: 18 },
    avatarPlaceholder: { width: 56, height: 56, borderRadius: 18, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    detailRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    divider: { height: 1, backgroundColor: Theme.Colors.divider, marginHorizontal: 16 },

    prepBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Theme.Colors.primary + '05', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.primary + '15' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Theme.Colors.background, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    actionGrid: { flexDirection: 'row' },
});

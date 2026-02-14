import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { appointmentApi } from '@/services/appointment.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { LinearGradient } from 'expo-linear-gradient';

export default function CheckInScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [appointment, setAppointment] = useState<any>(null);
    const [checkedIn, setCheckedIn] = useState(false);

    useEffect(() => {
        loadAppointment();
    }, [id]);

    const loadAppointment = async () => {
        try {
            const res = await appointmentApi.getAppointmentDetails(id as string);
            if (res.success && res.data) {
                const data = res.data as any;
                setAppointment(data);
                setCheckedIn(data.status === 'CHECKED_IN' || !!data.checkInTime);
            }

        } catch (error) {
            console.error('Error loading clinical record for check-in:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        setCheckingIn(true);
        try {
            const res = await appointmentApi.checkIn(id as string);
            if (res.success) {
                setCheckedIn(true);
                Alert.alert('Protocol Success', 'Diagnostic presence synchronized. Please await practitioner notification.', [
                    { text: 'Acknowledge', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', res.error || 'Check-in protocol failed');
            }
        } catch (error) {
            Alert.alert('System Error', 'Unable to synchronize presence with clinical net');
        } finally {
            setCheckingIn(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (!appointment) return null;

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Digital Check-in</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {checkedIn ? (
                    <View style={styles.successView}>
                        <View style={styles.successIconBox}>
                            <Ionicons name="checkmark-circle" size={80} color={Theme.Colors.success} />
                        </View>
                        <AppText variant="h2" weight="black" align="center">Presence Verified</AppText>
                        <AppText variant="body" color="textSecondary" align="center" style={styles.successText}>
                            Your diagnostic presence has already been successfully synchronized for this engagement.
                        </AppText>
                        <AppButton
                            title="Back to Dashboard"
                            variant="tonal"
                            onPress={() => router.back()}
                            style={styles.backHomeBtn}
                        />
                    </View>
                ) : (
                    <>
                        <View style={styles.intakeCard}>
                            <View style={styles.qrWrapper}>
                                <View style={styles.qrPlaceholder}>
                                    <Ionicons name="scan-outline" size={64} color={Theme.Colors.divider} />
                                    <View style={styles.scanLine} />
                                </View>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ marginTop: 20 }}>Clinical Presence ID</AppText>
                                <AppText variant="body" weight="black">#{appointment.id.slice(-8).toUpperCase()}</AppText>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Engagement Summary</AppText>
                            <AppCard padding="md">
                                <View style={styles.summaryItem}>
                                    <AppText variant="caption" color="textSecondary" weight="black">PRACTITIONER</AppText>
                                    <AppText variant="body" weight="black">Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}</AppText>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.summaryRow}>
                                    <View style={{ flex: 1 }}>
                                        <AppText variant="caption" color="textSecondary" weight="black">TIME</AppText>
                                        <AppText variant="body" weight="black">{appointment.scheduledTime}</AppText>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AppText variant="caption" color="textSecondary" weight="black">SERVICE</AppText>
                                        <AppText variant="body" weight="black">{appointment.service?.name}</AppText>
                                    </View>
                                </View>
                            </AppCard>
                        </View>

                        <View style={styles.noteBox}>
                            <Ionicons name="information-circle" size={20} color={Theme.Colors.primary} />
                            <AppText variant="caption" color="textSecondary" weight="bold" style={{ flex: 1, marginLeft: 12 }}>
                                Tap the button below ONLY when physically present at the clinical facility or prepared for the virtual encounter.
                            </AppText>
                        </View>
                    </>
                )}
            </ScrollView>

            {!checkedIn && (
                <View style={styles.footer}>
                    <AppButton
                        title="Synchronize Presence"
                        loading={checkingIn}
                        onPress={handleCheckIn}
                        style={{ height: 64, borderRadius: 22 }}
                    />
                </View>
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24 },
    successView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    successIconBox: { marginBottom: 24 },
    successText: { marginTop: 12, lineHeight: 22, paddingHorizontal: 20 },
    backHomeBtn: { marginTop: 40, width: '100%', height: 60, borderRadius: 20 },

    intakeCard: { alignItems: 'center', marginBottom: 40 },
    qrWrapper: { width: '100%', backgroundColor: Theme.Colors.card, borderRadius: 32, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider, ...Theme.Shadows.small },
    qrPlaceholder: { width: 160, height: 160, borderRadius: 20, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Theme.Colors.divider, borderStyle: 'dashed', position: 'relative', overflow: 'hidden' },
    scanLine: { position: 'absolute', top: '50%', left: 0, right: 0, height: 2, backgroundColor: Theme.Colors.primary, opacity: 0.3 },

    section: { marginBottom: 32 },
    sectionTitle: { marginBottom: 16, letterSpacing: 1 },
    summaryItem: { marginBottom: 12 },
    summaryRow: { flexDirection: 'row', gap: 16 },
    divider: { height: 1, backgroundColor: Theme.Colors.divider, marginVertical: 12 },

    noteBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '08', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.primary + '15', marginBottom: 40 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: Theme.Colors.background },
});

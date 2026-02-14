import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { appointmentApi } from '@/services/appointment.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';

export default function CancelAppointmentScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [appointment, setAppointment] = useState<any>(null);
    const [reason, setReason] = useState('');
    const [refundInfo, setRefundInfo] = useState<{ amount: number; policy: string } | null>(null);

    useEffect(() => {
        loadAppointment();
    }, [id]);

    const loadAppointment = async () => {
        try {
            const res = await appointmentApi.getAppointmentDetails(id as string);
            if (res.success && res.data) {
                setAppointment(res.data);
                calculateRefund(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical record for termination:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateRefund = (appt: any) => {
        const appointmentTime = new Date(`${appt.scheduledDate}T${appt.scheduledTime}`);
        const hoursUntil = (appointmentTime.getTime() - Date.now()) / (1000 * 60 * 60);

        if (hoursUntil > 24) {
            setRefundInfo({ amount: 100, policy: 'Full Refund (>24h notice)' });
        } else if (hoursUntil > 12) {
            setRefundInfo({ amount: 50, policy: 'Partial Refund (12-24h notice)' });
        } else {
            setRefundInfo({ amount: 0, policy: 'No Refund (<12h notice)' });
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            const res = await appointmentApi.cancelAppointment(id as string, reason);
            if (res.success) {
                Alert.alert(
                    'Engagement Terminated',
                    refundInfo?.amount ? `${refundInfo.amount}% of funds have been reverted to your clinical account.` : 'The appointment has been removed from the professional schedule.',
                    [{ text: 'Acknowledge', onPress: () => router.replace('/(app)/(tabs)/appointments') }]
                );
            } else {
                Alert.alert('Protocol Error', res.error || 'Failed to terminate engagement');
            }
        } catch (error) {
            Alert.alert('System Error', 'Unable to synchronize termination with clinical net');
        } finally {
            setCancelling(false);
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
                    <Ionicons name="close" size={24} color={Theme.Colors.text} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Rescind Engagement</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.warningBox}>
                    <View style={styles.warningIcon}>
                        <Ionicons name="alert-circle" size={24} color={Theme.Colors.warning} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <AppText variant="body" weight="black" color="warning">Contractual Impact</AppText>
                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 2 }}>
                            Rescinding this engagement may trigger fund forfeiture protocols based on the notice interval.
                        </AppText>
                    </View>
                </View>

                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Engagement Details</AppText>
                    <AppCard padding="md">
                        <View style={styles.summaryItem}>
                            <AppText variant="caption" color="textSecondary" weight="black">PRACTITIONER</AppText>
                            <AppText variant="body" weight="black">Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}</AppText>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <View style={{ flex: 1 }}>
                                <AppText variant="caption" color="textSecondary" weight="black">DATE</AppText>
                                <AppText variant="body" weight="black">{new Date(appointment.scheduledDate).toLocaleDateString()}</AppText>
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppText variant="caption" color="textSecondary" weight="black">INTERVAL</AppText>
                                <AppText variant="body" weight="black">{appointment.scheduledTime}</AppText>
                            </View>
                        </View>
                    </AppCard>
                </View>

                {refundInfo && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Economic Protocol</AppText>
                        <AppCard style={[styles.refundCard, { borderColor: refundInfo.amount > 0 ? Theme.Colors.success + '20' : Theme.Colors.error + '20' }]}>
                            <View style={styles.refundHeader}>
                                <AppText variant="h2" weight="black" style={{ color: refundInfo.amount > 0 ? Theme.Colors.success : Theme.Colors.error }}>
                                    {refundInfo.amount}% <AppText variant="body" weight="black" color="textSecondary">REVERSAL</AppText>
                                </AppText>
                            </View>
                            <AppText variant="caption" color="textSecondary" weight="bold" align="center">{refundInfo.policy}</AppText>
                        </AppCard>
                    </View>
                )}

                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Revocation Rationale</AppText>
                    <AppInput
                        placeholder="State reason for protocol termination..."
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        style={{ height: 120, textAlignVertical: 'top' }}
                    />
                </View>

                <View style={styles.nudgeBox}>
                    <Ionicons name="calendar" size={20} color={Theme.Colors.primary} />
                    <AppText variant="caption" color="primary" weight="black" style={{ flex: 1, marginLeft: 12 }}>
                        CONSIDER SHIFTING RATHER THAN RESCINDING TO RETAIN CLINICAL PRIORITY.
                    </AppText>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    title="Abort Revocation"
                    variant="tonal"
                    onPress={() => router.back()}
                    style={{ marginBottom: 16, height: 60, borderRadius: 20 }}
                />
                <AppButton
                    title="Confirm Termination"
                    loading={cancelling}
                    onPress={handleCancel}
                    style={{ height: 64, borderRadius: 22, backgroundColor: Theme.Colors.error }}
                    textStyle={{ color: 'white' }}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24 },
    warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.warning + '10', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.warning + '20', marginBottom: 32 },
    warningIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: Theme.Colors.warning + '15', justifyContent: 'center', alignItems: 'center' },

    section: { marginBottom: 32 },
    sectionTitle: { marginBottom: 16, letterSpacing: 1 },

    summaryItem: { marginBottom: 12 },
    summaryRow: { flexDirection: 'row', gap: 16 },
    divider: { height: 1, backgroundColor: Theme.Colors.divider, marginVertical: 12 },

    refundCard: { backgroundColor: Theme.Colors.surface, padding: 24, alignItems: 'center' },
    refundHeader: { marginBottom: 8 },

    nudgeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '08', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Theme.Colors.primary + '15' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Theme.Colors.background, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
});

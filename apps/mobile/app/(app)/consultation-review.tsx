import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { appointmentApi, Appointment } from '@/services/appointment.api';
import { ClinicalOrderType } from '@/services/clinical-order.api';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function ConsultationReviewScreen() {
    const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
    const [loading, setLoading] = useState(true);
    const [finalizing, setFinalizing] = useState(false);
    const [appointment, setAppointment] = useState<Appointment | null>(null);

    const loadDetails = useCallback(async () => {
        if (!appointmentId) return;
        try {
            setLoading(true);
            const res = await appointmentApi.getAppointmentDetails(appointmentId);
            if (res.success && res.data) {
                setAppointment(res.data);
            }
        } catch (error) {
            console.error('Error loading session parameters:', error);
            Alert.alert('System Error', 'Failed to retrieve session audit parameters.');
        } finally {
            setLoading(false);
        }
    }, [appointmentId]);

    useFocusEffect(
        useCallback(() => {
            loadDetails();
        }, [loadDetails])
    );

    const handleFinish = async () => {
        if (!appointmentId) return;

        setFinalizing(true);
        try {
            const res = await appointmentApi.finalizeVisit(appointmentId);
            if (res.success) {
                Alert.alert('Protocol Finalized', 'Session closure authorized. Data shared with subject.', [
                    { text: 'Return to Terminal', onPress: () => router.replace('/(app)/(doctor-tabs)') }
                ]);
            } else {
                Alert.alert('Authorization Error', res.error || 'Failed to authorize session closure.');
            }
        } catch (error) {
            console.error('Error finalizing session:', error);
            Alert.alert('Operational Error', 'Verification of closure protocol failed.');
        } finally {
            setFinalizing(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (!appointment) {
        return (
            <AppScreen padding={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                        <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                    <AppText variant="h3" weight="black">Session Audit</AppText>
                    <View style={{ width: 44 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={Theme.Colors.divider} />
                    <AppText variant="h3" weight="black" style={{ marginTop: 16 }}>Protocol Parameters Unretrievable</AppText>
                </View>
            </AppScreen>
        );
    }

    const record = appointment.medicalRecord;
    const prescription = appointment.prescription;
    const orders = appointment.clinicalOrders || [];

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="close" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <AppText variant="h3" weight="black">Session Audit Protocol</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Final Verification Layer</AppText>
                </View>
                <TouchableOpacity
                    style={[styles.authorizeTrigger, finalizing && { opacity: 0.5 }]}
                    onPress={handleFinish}
                    disabled={finalizing}
                >
                    {finalizing ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="checkmark-done" size={24} color="white" />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Subject Context */}
                <AppCard style={styles.contextCard} padding="md">
                    <View style={styles.contextHeader}>
                        <View style={styles.subjectBox}>
                            <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Authorized Subject</AppText>
                            <AppText variant="body" weight="black" style={{ marginTop: 2 }}>
                                {appointment.patient?.firstName} {appointment.patient?.lastName}
                            </AppText>
                        </View>
                        <View style={styles.sessionBox}>
                            <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Session Timestamp</AppText>
                            <AppText variant="body" weight="black" style={{ marginTop: 2 }}>
                                {new Date(appointment.scheduledDate).toLocaleDateString()}
                            </AppText>
                        </View>
                    </View>
                    <View style={styles.auditWatermark}>
                        <AppText variant="caption" weight="black" style={{ opacity: 0.05, fontSize: 32 }}>VERIFICATION PENDING</AppText>
                    </View>
                </AppCard>

                {/* Audit Segments */}
                <View style={styles.segment}>
                    <View style={styles.segmentHeader}>
                        <View style={[styles.segmentInitial, { backgroundColor: '#FF9F0A' }]}>
                            <AppText variant="caption" color="textInverted" weight="black">S</AppText>
                        </View>
                        <AppText variant="body" weight="black" uppercase style={{ letterSpacing: 1 }}>Subjective Inference</AppText>
                    </View>
                    <AppCard style={styles.segmentCard} padding="md">
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Primary Indication</AppText>
                        <AppText variant="body" weight="bold" style={{ marginTop: 4 }}>{record?.chiefComplaint || 'No clinical indication recorded'}</AppText>

                        <View style={styles.separator} />

                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Symptomatic Narrative</AppText>
                        <AppText variant="body" style={{ marginTop: 4, lineHeight: 20 }}>{record?.symptoms || 'Inference narrative not documented'}</AppText>
                    </AppCard>
                </View>

                <View style={styles.segment}>
                    <View style={styles.segmentHeader}>
                        <View style={[styles.segmentInitial, { backgroundColor: '#FF375F' }]}>
                            <AppText variant="caption" color="textInverted" weight="black">O</AppText>
                        </View>
                        <AppText variant="body" weight="black" uppercase style={{ letterSpacing: 1 }}>Objective Data Array</AppText>
                    </View>
                    <AppCard style={styles.segmentCard} padding="md">
                        <View style={styles.vitalsMatrix}>
                            {[
                                { label: 'BP', value: record?.bloodPressure || '--/--', unit: '' },
                                { label: 'HR', value: record?.heartRate || '--', unit: 'bpm' },
                                { label: 'TEMP', value: record?.temperature || '--', unit: '°C' },
                                { label: 'MASS', value: record?.weight || '--', unit: 'kg' }
                            ].map((v, i) => (
                                <View key={i} style={styles.vitalModule}>
                                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 7 }}>{v.label}</AppText>
                                    <AppText variant="body" weight="black" style={{ marginTop: 4 }}>{v.value}</AppText>
                                    {v.unit && <AppText variant="caption" color="textSecondary" style={{ fontSize: 8 }}>{v.unit}</AppText>}
                                </View>
                            ))}
                        </View>
                    </AppCard>
                </View>

                <View style={styles.segment}>
                    <View style={styles.segmentHeader}>
                        <View style={[styles.segmentInitial, { backgroundColor: '#0A84FF' }]}>
                            <AppText variant="caption" color="textInverted" weight="black">A</AppText>
                        </View>
                        <AppText variant="body" weight="black" uppercase style={{ letterSpacing: 1 }}>Clinical Assessment</AppText>
                    </View>
                    <AppCard style={styles.segmentCard} padding="md">
                        <AppText variant="h3" weight="black" color="primary">{record?.diagnosis || 'AUTHORIZATION PENDING'}</AppText>
                    </AppCard>
                </View>

                <View style={styles.segment}>
                    <View style={styles.segmentHeader}>
                        <View style={[styles.segmentInitial, { backgroundColor: '#30D158' }]}>
                            <AppText variant="caption" color="textInverted" weight="black">P</AppText>
                        </View>
                        <AppText variant="body" weight="black" uppercase style={{ letterSpacing: 1 }}>Therapeutic Protocol</AppText>
                    </View>
                    <AppCard style={styles.segmentCard} padding="md">
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Care Directives</AppText>
                        <AppText variant="body" style={{ marginTop: 4, lineHeight: 22 }}>{record?.notes || 'No specific directives synchronized'}</AppText>

                        {orders.length > 0 && (
                            <View style={styles.requisitions}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginTop: 16 }}>Clinical Requisitions</AppText>
                                {orders.map((order: any, idx: number) => (
                                    <View key={idx} style={styles.orderBadge}>
                                        <Ionicons name={order.type === ClinicalOrderType.LAB ? "flask" : "images"} size={14} color={Theme.Colors.success} />
                                        <AppText variant="caption" weight="black" style={{ marginLeft: 8, color: Theme.Colors.success }}>{order.description}</AppText>
                                    </View>
                                ))}
                            </View>
                        )}

                        {prescription && prescription.items?.length > 0 && (
                            <View style={styles.pharmacology}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginTop: 16 }}>Pharmacological Requisitions</AppText>
                                {prescription.items.map((item: any, idx: number) => (
                                    <View key={idx} style={styles.pharmaEntry}>
                                        <AppText variant="body" weight="black">{item.medication}</AppText>
                                        <AppText variant="caption" color="textSecondary">{item.dosage} • {item.frequency}</AppText>
                                    </View>
                                ))}
                            </View>
                        )}

                        {record?.followUpNotes && (
                            <View style={styles.surveillance}>
                                <View style={styles.separator} />
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Scheduled Surveillance</AppText>
                                <AppText variant="body" style={{ marginTop: 4 }}>{record.followUpNotes}</AppText>
                            </View>
                        )}
                    </AppCard>
                </View>

                <View style={styles.auditNotice}>
                    <Ionicons name="shield-checkmark" size={16} color={Theme.Colors.divider} />
                    <AppText variant="caption" color="textSecondary" style={{ flex: 1, marginLeft: 12 }}>
                        Authorization of this session closure commits all data points to the subjects longitudinal ledger and triggers secure decryption for the recipient.
                    </AppText>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    title="Authorize Session Closure"
                    onPress={handleFinish}
                    loading={finalizing}
                    style={{ height: 60, borderRadius: 20 }}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider, backgroundColor: Theme.Colors.surface },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    authorizeTrigger: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.success, justifyContent: 'center', alignItems: 'center', ...Theme.Shadows.primary },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 120, paddingTop: 20 },

    contextCard: { backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, marginBottom: 32, overflow: 'hidden' },
    contextHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    subjectBox: { flex: 1 },
    sessionBox: { alignItems: 'flex-end' },
    auditWatermark: { position: 'absolute', bottom: -10, right: -20, transform: [{ rotate: '-15deg' }] },

    segment: { marginBottom: 32 },
    segmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    segmentInitial: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    segmentCard: { borderWidth: 1, borderColor: Theme.Colors.divider },

    separator: { height: 1, backgroundColor: Theme.Colors.divider, marginVertical: 16 },

    vitalsMatrix: { flexDirection: 'row', justifyContent: 'space-between' },
    vitalModule: { alignItems: 'center', flex: 1 },

    requisitions: { marginBottom: 8 },
    orderBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.success + '08', padding: 12, borderRadius: 12, marginTop: 8 },

    pharmacology: { marginBottom: 8 },
    pharmaEntry: { backgroundColor: Theme.Colors.background, padding: 12, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: Theme.Colors.divider },

    surveillance: { marginTop: 0 },
    auditNotice: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4, marginBottom: 20 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: Theme.Colors.divider },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
});

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, Modal, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { appointmentApi, Appointment } from '@/services/appointment.api';
import { doctorApi } from '@/services/doctor.api';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { clinicalOrderApi, ClinicalOrder, ClinicalOrderType } from '@/services/clinical-order.api';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

export default function ConsultationScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [elapsed, setElapsed] = useState(0);
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    // Clinical Order State
    const [clinicalOrders, setClinicalOrders] = useState<ClinicalOrder[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [orderType, setOrderType] = useState<ClinicalOrderType | null>(null);
    const [orderDescription, setOrderDescription] = useState('');

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (id) loadData(id as string);

        timerRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [id]);

    const loadData = async (apptId: string) => {
        try {
            const res = await appointmentApi.getAppointmentDetails(apptId);
            if (res.success && res.data) {
                setAppointment(res.data);
                if (res.data.status === 'CONFIRMED') {
                    appointmentApi.updateStatus(apptId, 'IN_PROGRESS');
                }
                loadOrders(apptId);
            }
        } catch (error) {
            Alert.alert('SYSTEM ERROR', 'Institutional downlink unavailable. Unable to establish session.');
        } finally {
            setLoading(false);
        }
    };

    const loadOrders = async (apptId: string) => {
        try {
            const res = await clinicalOrderApi.getAppointmentOrders(apptId);
            if (res.success && res.data) {
                setClinicalOrders(res.data);
            }
        } catch (error) {
            console.log('Failed to load operational orders', error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleEndSession = async () => {
        setProcessing(true);
        try {
            const recordRes = await doctorApi.createRecord(appointment?.id!, {
                patientId: appointment?.patientId!,
                visitDate: new Date().toISOString(),
                diagnosis: 'Clinical Consultation Session',
                notes: notes,
            });

            if (!recordRes.success) {
                Alert.alert('COMMIT ERROR', 'Failed to synchronize clinical observations.');
                return;
            }

            const res = await appointmentApi.updateStatus(appointment?.id!, 'COMPLETED');
            if (res.success) {
                Alert.alert('SESSION FINALIZED', 'Observations committed to clinical vault.', [
                    { text: 'TERMINATE CONSOLE', onPress: () => router.replace('/(app)/(tabs)/appointments') }
                ]);
            }
        } catch (error) {
            Alert.alert('PROTOCOL ERROR', 'Session termination failed.');
        } finally {
            setProcessing(false);
        }
    };

    const openOrderModal = (type: ClinicalOrderType) => {
        setOrderType(type);
        setOrderDescription('');
        setModalVisible(true);
    };

    const handleSubmitOrder = async () => {
        if (!orderDescription.trim() || !orderType || !appointment) return;

        try {
            const res = await clinicalOrderApi.createOrder({
                appointmentId: appointment.id,
                type: orderType,
                description: orderDescription
            });

            if (res.success && res.data) {
                setClinicalOrders(prev => [res.data!, ...prev]);
                setModalVisible(false);
                Alert.alert('ORDER DISPATCHED', `${orderType} request synchronized with diagnostic network.`);
            }
        } catch (error) {
            Alert.alert('ORDER ERROR', 'Diagnostic requisition protocol failed.');
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
                <View>
                    <AppText variant="caption" weight="black" color="primary" style={{ letterSpacing: 1 }}>Live Session</AppText>
                    <AppText variant="h3" weight="black">Clinical Console</AppText>
                </View>
                <View style={styles.timerBadge}>
                    <Ionicons name="time" size={16} color={Theme.Colors.primary} />
                    <AppText variant="body" weight="black" color="primary" style={styles.timerText}>{formatTime(elapsed)}</AppText>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <AppCard padding="md" style={styles.patientIdentity}>
                    <View style={styles.identityRow}>
                        {appointment.patient?.avatarUrl ? (
                            <Image source={{ uri: appointment.patient.avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <AppText variant="h3" weight="black" color="primary">
                                    {appointment.patient?.firstName?.[0]}{appointment.patient?.lastName?.[0]}
                                </AppText>
                            </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <AppText variant="h3" weight="black">{appointment.patient?.firstName.toUpperCase()} {appointment.patient?.lastName.toUpperCase()}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black">IDENTIFIER: #{appointment.patientId.slice(-8).toUpperCase()}</AppText>
                        </View>
                    </View>
                </AppCard>

                <View style={styles.section}>
                    <AppText variant="caption" weight="black" color="textSecondary" style={styles.sectionLabel}>Diagnostic Requisitions</AppText>
                    <View style={styles.orderGrid}>
                        <TouchableOpacity style={styles.orderTile} onPress={() => openOrderModal(ClinicalOrderType.LAB)}>
                            <View style={[styles.tileIcon, { backgroundColor: Theme.Colors.warning + '12' }]}>
                                <Ionicons name="flask-outline" size={24} color={Theme.Colors.warning} />
                            </View>
                            <AppText variant="caption" weight="black" style={{ marginTop: 8 }}>LAB PANEL</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.orderTile} onPress={() => openOrderModal(ClinicalOrderType.IMAGING)}>
                            <View style={[styles.tileIcon, { backgroundColor: Theme.Colors.success + '12' }]}>
                                <Ionicons name="scan-outline" size={24} color={Theme.Colors.success} />
                            </View>
                            <AppText variant="caption" weight="black" style={{ marginTop: 8 }}>RADIOLOGY</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.orderTile} onPress={() => openOrderModal(ClinicalOrderType.PROCEDURE)}>
                            <View style={[styles.tileIcon, { backgroundColor: Theme.Colors.primary + '12' }]}>
                                <Ionicons name="medkit-outline" size={24} color={Theme.Colors.primary} />
                            </View>
                            <AppText variant="caption" weight="black" style={{ marginTop: 8 }}>PROCEDURE</AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                {clinicalOrders.length > 0 && (
                    <View style={styles.section}>
                        <AppText variant="caption" weight="black" color="textSecondary" style={styles.sectionLabel}>Active Orders Ledger</AppText>
                        <AppCard padding="none" style={styles.ledgerCard}>
                            {clinicalOrders.map((order, idx) => (
                                <View key={order.id} style={[styles.ledgerRow, idx < clinicalOrders.length - 1 && styles.rowDivider]}>
                                    <View style={styles.ledgerIcon}>
                                        <Ionicons
                                            name={order.type === 'LAB' ? 'flask' : order.type === 'IMAGING' ? 'scan' : 'medkit'}
                                            size={16}
                                            color={Theme.Colors.primary}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <AppText variant="caption" weight="black" color="primary" style={{ fontSize: 8 }}>{order.type}</AppText>
                                        <AppText variant="body" weight="black" style={{ fontSize: 13 }}>{order.description.toUpperCase()}</AppText>
                                    </View>
                                    <View style={styles.statusPill}>
                                        <AppText variant="caption" weight="black" color="primary" style={{ fontSize: 7 }}>{order.status}</AppText>
                                    </View>
                                </View>
                            ))}
                        </AppCard>
                    </View>
                )}

                <View style={[styles.section, { flex: 1 }]}>
                    <AppText variant="caption" weight="black" color="textSecondary" style={styles.sectionLabel}>Clinical Observations</AppText>
                    <AppCard padding="none" style={styles.observationsCard}>
                        <TextInput
                            style={styles.notesInput}
                            multiline
                            placeholder="TYPE DIAGNOSIS, PRESCRIPTIONS, OR PROTOCOLS..."
                            placeholderTextColor={Theme.Colors.divider}
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </AppCard>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    title="FINALIZE SESSION & COMMIT"
                    onPress={handleEndSession}
                    loading={processing}
                    style={styles.endBtn}
                />
            </View>

            <Modal visible={modalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <AppText variant="h3" weight="black">REQUISITION</AppText>
                                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9 }}>NEW {orderType} ORDER</AppText>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Theme.Colors.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ padding: 24 }}>
                            <TextInput
                                style={styles.modalInput}
                                placeholder={`DESCRIBE THE ${orderType} REQUEST PARAMETERS...`}
                                placeholderTextColor={Theme.Colors.divider}
                                value={orderDescription}
                                onChangeText={setOrderDescription}
                                multiline
                                autoFocus
                            />
                            <AppButton
                                title="DISPATCH ORDER"
                                onPress={handleSubmitOrder}
                                style={{ height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '12', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Theme.Colors.primary + '20' },
    timerText: { marginLeft: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 16 },

    scrollContent: { paddingHorizontal: 24, paddingTop: 8 },
    patientIdentity: { borderRadius: 32, marginBottom: 32 },
    identityRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 64, height: 64, borderRadius: 24 },
    avatarPlaceholder: { width: 64, height: 64, borderRadius: 24, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    section: { marginBottom: 32 },
    sectionLabel: { fontSize: 8, letterSpacing: 1.5, marginBottom: 16, marginLeft: 4 },
    orderGrid: { flexDirection: 'row', gap: 12 },
    orderTile: { flex: 1, backgroundColor: Theme.Colors.surface, borderRadius: 24, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    tileIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    ledgerCard: { borderRadius: 28 },
    ledgerRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    ledgerIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },
    statusPill: { backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

    observationsCard: { borderRadius: 32, minHeight: 200 },
    notesInput: { flex: 1, padding: 24, fontSize: 16, fontWeight: 'bold', color: Theme.Colors.text, textAlignVertical: 'top' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: Theme.Colors.background, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    endBtn: { height: 64, borderRadius: 24, backgroundColor: Theme.Colors.error },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: Theme.Colors.background, borderRadius: 40, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center' },
    modalInput: { backgroundColor: Theme.Colors.surface, borderRadius: 24, padding: 24, fontSize: 16, fontWeight: 'bold', color: Theme.Colors.text, minHeight: 180, textAlignVertical: 'top', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
});

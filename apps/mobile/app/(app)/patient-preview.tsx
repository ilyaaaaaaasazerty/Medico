import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Modal, Image, Platform, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doctorApi } from '@/services/doctor.api';
import { appointmentApi } from '@/services/appointment.api';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

interface HealthProfile {
    medications: any[];
    vaccinations: any[];
    allergies: any[];
    conditions: any[];
    vitalSigns: any[];
}

interface AppointmentDetails {
    id: string;
    patient: {
        id: string;
        firstName: string;
        lastName: string;
        gender?: string;
        dateOfBirth?: string;
        avatarUrl?: string;
    };
    reason?: string;
    scheduledTime: string;
    attachments?: any[];
}

type CallStatus = 'IDLE' | 'CALLING' | 'CALLED' | 'SKIPPED';

export default function PatientPreviewScreen() {
    const { appointmentId, patientId, patientName } = useLocalSearchParams<{
        appointmentId: string;
        patientId: string;
        patientName?: string;
    }>();

    const [loading, setLoading] = useState(true);
    const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
    const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);

    // Call Status & Timer
    const [callStatus, setCallStatus] = useState<CallStatus>('IDLE');
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef<any>(null);

    // Document Preview
    const [previewDoc, setPreviewDoc] = useState<any>(null);

    useEffect(() => {
        loadData();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [appointmentId, patientId]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (patientId) {
                const healthRes = await doctorApi.getPatientHealthProfile(patientId);
                if (healthRes.success && healthRes.data) setHealthProfile(healthRes.data);
            }
            if (appointmentId) {
                const apptRes = await appointmentApi.getAppointmentDetails(appointmentId);
                if (apptRes.success && apptRes.data) setAppointment(apptRes.data as any);
            }
        } catch (error) {
            console.error('Error loading patient data:', error);
        } finally {
            setLoading(false);
        }
    };

    const startTimer = (seconds: number) => {
        setTimeLeft(seconds);
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft((prev: number) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleCallPatient = async () => {
        try {
            setCallStatus('CALLING');
            await appointmentApi.callPatient(appointmentId);
            setCallStatus('CALLED');
            startTimer(20);
        } catch (error) {
            setCallStatus('IDLE');
            Alert.alert('Protocol Failure', 'Communication with clinical display system failed.');
        }
    };

    const handleStartVisit = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        router.push({
            pathname: '/(app)/record-visit',
            params: {
                appointmentId,
                patientId,
                patientName: patientName || `${appointment?.patient?.firstName} ${appointment?.patient?.lastName}`
            }
        });
    };

    const handleAddTime = () => {
        setCallStatus('CALLED');
        startTimer(10);
    };

    const handleSkipPatient = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setCallStatus('SKIPPED');
        Alert.alert('Protocol: Skip', 'Subject has been removed from active queue for later processing.', [
            { text: 'Confirm', onPress: () => router.back() }
        ]);
    };

    const handleDocumentPress = (doc: any) => {
        if (doc.fileUrl) {
            const isImage = doc.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            const isPdf = doc.fileUrl.match(/\.pdf$/i);

            setPreviewDoc({
                ...doc,
                isImage: !!isImage,
                isPdf: !!isPdf
            });
        } else {
            setPreviewDoc(doc);
        }
    };

    const calculateAge = (dob?: string) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return `${age} yrs`;
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
                <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 12 }}>RETRIEVING CLINICAL DATA...</AppText>
            </View>
        );
    }

    const patient = appointment?.patient;
    const latestVitals = healthProfile?.vitalSigns?.[0];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="bold">Diagnostic Preview</AppText>
                <TouchableOpacity style={styles.moreBtn}>
                    <Ionicons name="ellipsis-horizontal" size={24} color={Theme.Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <AppScreen padding scrollable contentContainerStyle={styles.scrollContent}>
                {/* Patient Identity */}
                <View style={styles.patientProfileCard}>
                    <View style={styles.avatarOutline}>
                        <View style={styles.avatarInner}>
                            {patient?.avatarUrl ? (
                                <Image source={{ uri: patient.avatarUrl }} style={styles.fullAvatar} />
                            ) : (
                                <View style={styles.textAvatar}>
                                    <AppText variant="hero" color="textInverted" weight="bold">
                                        {patient?.firstName?.[0]}{patient?.lastName?.[0]}
                                    </AppText>
                                </View>
                            )}
                        </View>
                        <View style={styles.onlineStatus} />
                    </View>

                    <AppText variant="title" weight="bold" color="text">{patient?.firstName} {patient?.lastName}</AppText>

                    <View style={styles.pBadges}>
                        <View style={styles.pBadge}>
                            <Ionicons name="person" size={12} color={Theme.Colors.primary} />
                            <AppText variant="caption" weight="bold">{patient?.gender || 'N/A'}</AppText>
                        </View>
                        <View style={styles.pBadge}>
                            <Ionicons name="calendar-clear" size={12} color={Theme.Colors.primary} />
                            <AppText variant="caption" weight="bold">{calculateAge(patient?.dateOfBirth)}</AppText>
                        </View>
                        <View style={styles.pBadge}>
                            <Ionicons name="finger-print" size={12} color={Theme.Colors.primary} />
                            <AppText variant="caption" weight="bold">REG-{patientId?.slice(-6).toUpperCase()}</AppText>
                        </View>
                    </View>
                </View>

                {/* Queue Control Interface */}
                <View style={styles.protocolInterface}>
                    {callStatus === 'IDLE' && (
                        <AppButton
                            title="Initialize Patient Call"
                            onPress={handleCallPatient}
                            size="lg"
                            icon={<Ionicons name="notifications" size={22} color="white" />}
                        />
                    )}

                    {(callStatus === 'CALLED' || callStatus === 'CALLING') && (
                        <AppCard style={styles.timerInterface}>
                            <View style={styles.timerDisc}>
                                <AppText variant="h1" color="text" weight="bold">{timeLeft}s</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold" uppercase>{timeLeft > 0 ? 'Wait Period' : 'Subject Late'}</AppText>
                            </View>

                            {timeLeft === 0 ? (
                                <View style={styles.timerControls}>
                                    <TouchableOpacity style={[styles.timerSecBtn, { backgroundColor: Theme.Colors.warning }]} onPress={handleAddTime}>
                                        <Ionicons name="refresh" size={20} color="white" />
                                        <AppText variant="caption" color="white" weight="bold">+10s</AppText>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.timerSecBtn, { backgroundColor: Theme.Colors.error }]} onPress={handleSkipPatient}>
                                        <Ionicons name="ban" size={20} color="white" />
                                        <AppText variant="caption" color="white" weight="bold">Skip</AppText>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.timerSecBtn, { flex: 2, backgroundColor: Theme.Colors.success }]} onPress={handleStartVisit}>
                                        <AppText variant="caption" color="white" weight="bold">Force Start</AppText>
                                        <Ionicons name="play" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <AppButton
                                    title="Patient Present - Start Dossier"
                                    onPress={handleStartVisit}
                                    variant="success"
                                    size="lg"
                                    icon={<Ionicons name="checkmark-circle" size={24} color="white" />}
                                />
                            )}
                        </AppCard>
                    )}
                </View>

                {/* Clinical Intelligence */}
                <View style={styles.metadataGrid}>
                    {/* Vitals */}
                    <AppCard style={styles.clinicalSection}>
                        <View style={styles.clinicalHeader}>
                            <View style={[styles.cIconBg, { backgroundColor: Theme.Colors.error + '10' }]}>
                                <Ionicons name="pulse" size={18} color={Theme.Colors.error} />
                            </View>
                            <AppText variant="caption" color="text" weight="bold" uppercase>Vitals</AppText>
                        </View>
                        {latestVitals ? (
                            <View style={styles.vitalsWrap}>
                                <View style={styles.vRow}>
                                    <View style={styles.vCell}>
                                        <AppText variant="caption" color="textSecondary" uppercase weight="bold">BP</AppText>
                                        <AppText variant="body" weight="bold">{latestVitals.bloodPressure || '--/--'}</AppText>
                                    </View>
                                    <View style={styles.vCell}>
                                        <AppText variant="caption" color="textSecondary" uppercase weight="bold">HR</AppText>
                                        <AppText variant="body" weight="bold">{latestVitals.heartRate || '--'} <AppText variant="caption">bpm</AppText></AppText>
                                    </View>
                                </View>
                                <View style={styles.vRow}>
                                    <View style={styles.vCell}>
                                        <AppText variant="caption" color="textSecondary" uppercase weight="bold">Temp</AppText>
                                        <AppText variant="body" weight="bold">{latestVitals.temperature || '--'} <AppText variant="caption">°C</AppText></AppText>
                                    </View>
                                    <View style={styles.vCell}>
                                        <AppText variant="caption" color="textSecondary" uppercase weight="bold">WT</AppText>
                                        <AppText variant="body" weight="bold">{latestVitals.weight || '--'} <AppText variant="caption">kg</AppText></AppText>
                                    </View>
                                </View>
                            </View>
                        ) : <AppText variant="caption" color="textSecondary" italic>No records.</AppText>}
                    </AppCard>

                    {/* Allergies */}
                    <AppCard style={styles.clinicalSection}>
                        <View style={styles.clinicalHeader}>
                            <View style={[styles.cIconBg, { backgroundColor: Theme.Colors.warning + '10' }]}>
                                <Ionicons name="warning" size={18} color={Theme.Colors.warning} />
                            </View>
                            <AppText variant="caption" color="text" weight="bold" uppercase>Risks</AppText>
                        </View>
                        {healthProfile?.allergies?.length ? (
                            <View style={styles.tagWrap}>
                                {healthProfile.allergies.map((a: any, i: number) => (
                                    <View key={i} style={styles.criticalTag}>
                                        <AppText variant="caption" color="error" weight="bold" uppercase>{a.allergen || a.name}</AppText>
                                    </View>
                                ))}
                            </View>
                        ) : <AppText variant="caption" color="textSecondary" italic>No known risks.</AppText>}
                    </AppCard>
                </View>

                {/* Comprehensive Data */}
                <AppCard style={styles.fullSection}>
                    <View style={styles.clinicalHeader}>
                        <View style={[styles.cIconBg, { backgroundColor: Theme.Colors.primary + '10' }]}>
                            <Ionicons name="medical" size={18} color={Theme.Colors.primary} />
                        </View>
                        <AppText variant="caption" color="text" weight="bold" uppercase>Chronic Conditions</AppText>
                    </View>
                    {healthProfile?.conditions?.length ? (
                        <View style={styles.conditionStack}>
                            {healthProfile.conditions.map((c: any, i: number) => (
                                <View key={i} style={styles.condItem}>
                                    <View style={styles.condDot} />
                                    <AppText variant="body" weight="semiBold">{c.name}</AppText>
                                </View>
                            ))}
                        </View>
                    ) : <AppText variant="caption" color="textSecondary" italic>No chronic mappings.</AppText>}
                </AppCard>

                <AppCard style={styles.fullSection}>
                    <View style={styles.clinicalHeader}>
                        <View style={[styles.cIconBg, { backgroundColor: Theme.Colors.success + '10' }]}>
                            <Ionicons name="medkit" size={18} color={Theme.Colors.success} />
                        </View>
                        <AppText variant="caption" color="text" weight="bold" uppercase>Active Pharmacology</AppText>
                    </View>
                    {healthProfile?.medications?.length ? (
                        <View style={styles.medStack}>
                            {healthProfile.medications.slice(0, 5).map((med: any, idx: number) => (
                                <View key={idx} style={styles.medItem}>
                                    <View style={styles.medIconWrap}>
                                        <Ionicons name="flask" size={14} color={Theme.Colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AppText variant="body" weight="bold">{med.name}</AppText>
                                        <AppText variant="caption" color="textSecondary">{med.dosage} • {med.frequency}</AppText>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : <AppText variant="caption" color="textSecondary" italic>No pharmacologic history.</AppText>}
                </AppCard>

                <AppCard style={styles.fullSection}>
                    <View style={styles.clinicalHeader}>
                        <View style={[styles.cIconBg, { backgroundColor: Theme.Colors.primary + '10' }]}>
                            <Ionicons name="attach" size={20} color={Theme.Colors.primary} />
                        </View>
                        <AppText variant="caption" color="text" weight="bold" uppercase>Clinical Vault</AppText>
                    </View>
                    {appointment?.attachments?.length ? (
                        <View style={styles.docStack}>
                            {appointment.attachments.map((doc: any, i: number) => (
                                <TouchableOpacity key={i} style={styles.docItem} onPress={() => handleDocumentPress(doc)}>
                                    <Ionicons name="document-text" size={24} color={Theme.Colors.primary} />
                                    <AppText variant="body" weight="semiBold" style={{ flex: 1 }} numberOfLines={1}>{doc.name}</AppText>
                                    <View style={styles.eyeBtn}>
                                        <Ionicons name="eye" size={16} color={Theme.Colors.textSecondary} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : <AppText variant="caption" color="textSecondary" italic>No associated documentation.</AppText>}
                </AppCard>

                <View style={{ height: 40 }} />
            </AppScreen>

            {/* Document Preview Interface */}
            <Modal visible={!!previewDoc} transparent animationType="slide">
                <View style={styles.pOverlay}>
                    <View style={styles.pHeader}>
                        <AppText variant="body" weight="bold" color="textInverted" style={{ flex: 1 }} numberOfLines={1}>{previewDoc?.name}</AppText>
                        <TouchableOpacity style={styles.pClose} onPress={() => setPreviewDoc(null)}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.pBody}>
                        {previewDoc?.isImage ? (
                            <Image
                                source={{ uri: previewDoc.fileUrl }}
                                style={styles.pImg}
                                resizeMode="contain"
                            />
                        ) : previewDoc?.fileUrl ? (
                            <WebView
                                source={{ uri: previewDoc.fileUrl }}
                                style={styles.pWeb}
                                startInLoadingState
                                scalesPageToFit
                            />
                        ) : (
                            <View style={styles.pErr}>
                                <Ionicons name="alert-circle" size={48} color={Theme.Colors.textSecondary} />
                                <AppText variant="body" color="textSecondary" weight="bold">Format not supported.</AppText>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.card, ...Theme.Shadows.soft, justifyContent: 'center', alignItems: 'center' },
    moreBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

    scrollContent: { padding: 24, paddingTop: 10 },
    patientProfileCard: { alignItems: 'center', marginBottom: 32 },
    avatarOutline: { width: 110, height: 110, borderRadius: 38, borderWidth: 3, borderColor: Theme.Colors.primary + '20', padding: 5, marginBottom: 16, position: 'relative' },
    avatarInner: { flex: 1, borderRadius: 32, overflow: 'hidden', backgroundColor: Theme.Colors.divider },
    fullAvatar: { width: '100%', height: '100%' },
    textAvatar: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.primary },
    onlineStatus: { position: 'absolute', bottom: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: Theme.Colors.success, borderWidth: 3, borderColor: Theme.Colors.background },
    pBadges: { flexDirection: 'row', gap: 8, marginTop: 12 },
    pBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Theme.Colors.card, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: Theme.Colors.divider },

    protocolInterface: { marginBottom: 32 },
    timerInterface: { width: '100%', alignItems: 'center', padding: 24 },
    timerDisc: { width: 140, height: 140, borderRadius: 70, borderWidth: 5, borderColor: Theme.Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderStyle: 'dashed' },
    timerControls: { flexDirection: 'row', gap: 10 },
    timerSecBtn: { flex: 1, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },

    metadataGrid: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    clinicalSection: { flex: 1, padding: 16 },
    clinicalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    cIconBg: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

    vitalsWrap: { gap: 12 },
    vRow: { flexDirection: 'row', justifyContent: 'space-between' },
    vCell: { flex: 1 },

    tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    criticalTag: { backgroundColor: Theme.Colors.error + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Theme.Colors.error + '20' },

    fullSection: { marginBottom: 16, padding: 20 },
    conditionStack: { gap: 10 },
    condItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    condDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.Colors.primary },

    medStack: { gap: 12 },
    medItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    medIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: Theme.Colors.divider, justifyContent: 'center', alignItems: 'center' },

    docStack: { gap: 10 },
    docItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Theme.Colors.divider + '20', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: Theme.Colors.divider },
    eyeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Theme.Colors.divider, justifyContent: 'center', alignItems: 'center' },

    pOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
    pHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    pClose: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    pBody: { flex: 1, backgroundColor: 'white', margin: 12, borderRadius: 24, overflow: 'hidden' },
    pImg: { width: '100%', height: '100%' },
    pWeb: { flex: 1 },
    pErr: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
});

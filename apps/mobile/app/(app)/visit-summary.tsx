import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { doctorApi } from '@/services/doctor.api';
import { appointmentApi } from '@/services/appointment.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

interface VisitSummary {
    id: string;
    visitDate: string;
    patientName: string;
    chiefComplaint?: string;
    diagnosis?: string;
    symptoms?: string;
    notes?: string;
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    prescription?: {
        items: Array<{
            medication: string;
            dosage: string;
            frequency: string;
            duration: string;
        }>;
        instructions?: string;
    };
    followUpDate?: string;
    followUpNotes?: string;
}

export default function VisitSummaryScreen() {
    const { appointmentId, recordId } = useLocalSearchParams<{ appointmentId?: string; recordId?: string }>();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<VisitSummary | null>(null);

    useEffect(() => {
        loadSummary();
    }, [appointmentId, recordId]);

    const loadSummary = async () => {
        if (!appointmentId && !recordId) return;
        try {
            setLoading(true);
            const res = await appointmentApi.getAppointmentDetails(appointmentId || recordId!);
            if (res.success && res.data) {
                const appt = res.data;
                const record = appt.medicalRecord;

                setSummary({
                    id: record?.id || appt.id,
                    visitDate: record?.visitDate || appt.scheduledDate,
                    patientName: appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : 'Patient',
                    chiefComplaint: record?.chiefComplaint || appt.reason,
                    diagnosis: record?.diagnosis,
                    symptoms: record?.symptoms,
                    notes: record?.notes,
                    bloodPressure: record?.bloodPressure,
                    heartRate: record?.heartRate,
                    temperature: record?.temperature,
                    weight: record?.weight,
                    prescription: appt.prescription,
                    followUpDate: record?.followUpDate,
                    followUpNotes: record?.followUpNotes,
                });
            }
        } catch (error) {
            Alert.alert('Clinical Error', 'Failed to retrieve session transcript parameters');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleGeneratePDF = async () => {
        if (!recordId && !appointmentId) return;
        try {
            const id = appointmentId || recordId;
            const url = await doctorApi.getRecordPDF(id!);
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert('Export Error', 'Failed to authorize transcript PDF generation');
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (!summary) {
        return (
            <AppScreen padding={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                        <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                    <AppText variant="h3" weight="black">Session Transcript</AppText>
                    <View style={{ width: 44 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconBox}>
                        <Ionicons name="document-text-outline" size={64} color={Theme.Colors.divider} />
                    </View>
                    <AppText variant="h3" weight="black">Transcript Not Found</AppText>
                </View>
            </AppScreen>
        );
    }

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Clinical Transcript</AppText>
                <TouchableOpacity style={styles.circleBtn} onPress={handleGeneratePDF}>
                    <Ionicons name="download-outline" size={22} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <AppCard style={styles.transcriptCard} padding="xl">
                    <View style={styles.watermarkContainer}>
                        <Ionicons name="medical" size={300} color={Theme.Colors.primary + '03'} />
                    </View>

                    <View style={styles.transcriptHeader}>
                        <View style={styles.authorizedBadge}>
                            <Ionicons name="shield-checkmark" size={12} color={Theme.Colors.primary} />
                            <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 9, marginLeft: 4 }}>Authorized Protocol</AppText>
                        </View>
                        <AppText variant="h2" weight="black" style={{ color: '#1A1A1A', marginTop: 12 }}>{summary.patientName}</AppText>
                        <View style={styles.metaRow}>
                            <Ionicons name="calendar-outline" size={14} color={Theme.Colors.textSecondary} />
                            <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ marginLeft: 6 }}>{formatDate(summary.visitDate)}</AppText>
                        </View>
                    </View>

                    {/* Telemetry Grid */}
                    {(summary.bloodPressure || summary.heartRate || summary.temperature || summary.weight) && (
                        <View style={styles.telemetryGrid}>
                            {summary.bloodPressure && (
                                <View style={styles.telemetryItem}>
                                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>BP (sys/dia)</AppText>
                                    <AppText variant="body" weight="black">{summary.bloodPressure}</AppText>
                                </View>
                            )}
                            {summary.heartRate && (
                                <View style={styles.telemetryItem}>
                                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Heart Rate</AppText>
                                    <AppText variant="body" weight="black">{summary.heartRate} BPM</AppText>
                                </View>
                            )}
                            {summary.temperature && (
                                <View style={styles.telemetryItem}>
                                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Body Temp</AppText>
                                    <AppText variant="body" weight="black">{summary.temperature}°C</AppText>
                                </View>
                            )}
                            {summary.weight && (
                                <View style={styles.telemetryItem}>
                                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Body Mass</AppText>
                                    <AppText variant="body" weight="black">{summary.weight} kg</AppText>
                                </View>
                            )}
                        </View>
                    )}

                    <div style={styles.contentSections}>
                        {summary.chiefComplaint && (
                            <View style={styles.section}>
                                <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionLabel}>Primary Indication</AppText>
                                <AppText variant="body" style={styles.sectionValue}>{summary.chiefComplaint}</AppText>
                            </View>
                        )}

                        {summary.diagnosis && (
                            <View style={styles.assessmentSection}>
                                <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionLabel}>Clinical Assessment</AppText>
                                <AppText variant="h3" weight="black" color="primary">{summary.diagnosis}</AppText>
                            </View>
                        )}

                        {summary.notes && (
                            <View style={styles.section}>
                                <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionLabel}>Therapeutic Narrative</AppText>
                                <AppText variant="body" style={styles.narrativeText}>{summary.notes}</AppText>
                            </View>
                        )}
                    </div>

                    {summary.prescription && summary.prescription.items.length > 0 && (
                        <View style={styles.requisitionSection}>
                            <View style={styles.requisitionHeader}>
                                <Ionicons name="bandage" size={18} color={Theme.Colors.primary} />
                                <AppText variant="body" weight="black" style={{ marginLeft: 8 }}>Pharmacological Requisitions</AppText>
                            </View>
                            {summary.prescription.items.map((item, index) => (
                                <View key={index} style={styles.regimenRow}>
                                    <View style={styles.regimenDot} />
                                    <View style={{ flex: 1 }}>
                                        <AppText variant="body" weight="black">{item.medication}</AppText>
                                        <AppText variant="caption" color="textSecondary" weight="bold">{item.dosage} • {item.frequency} • {item.duration}</AppText>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {summary.followUpDate && (
                        <View style={styles.surveillanceCard}>
                            <Ionicons name="time" size={20} color={Theme.Colors.success} />
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <AppText variant="caption" color="success" weight="black" uppercase style={{ fontSize: 10 }}>Scheduled Surveillance</AppText>
                                <AppText variant="body" weight="black">{formatDate(summary.followUpDate)}</AppText>
                                {summary.followUpNotes && (
                                    <AppText variant="caption" color="textSecondary" italic style={{ marginTop: 4 }}>{summary.followUpNotes}</AppText>
                                )}
                            </View>
                        </View>
                    )}

                    <View style={styles.authenticityFooter}>
                        <View style={styles.qrPlaceholder}>
                            <Ionicons name="qr-code-outline" size={40} color={Theme.Colors.divider} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Validation Token</AppText>
                            <AppText variant="caption" color="textSecondary" style={{ fontSize: 8 }}>{summary.id.toUpperCase()}</AppText>
                        </View>
                        <View style={styles.seal}>
                            <Ionicons name="ribbon" size={24} color={Theme.Colors.primary + '30'} />
                        </View>
                    </View>
                </AppCard>

                <View style={styles.actionHub}>
                    <AppButton
                        title="Authorized PDF Export"
                        onPress={handleGeneratePDF}
                        style={{ height: 60, borderRadius: 20 }}
                    >
                        <Ionicons name="document-text" size={20} color="white" style={{ marginRight: 12 }} />
                    </AppButton>

                    <View style={styles.secondaryActions}>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={() => Alert.alert('Secure Route', 'Routing options active.')}>
                            <Ionicons name="share-social-outline" size={18} color={Theme.Colors.text} />
                            <AppText variant="caption" weight="black" style={{ marginLeft: 8 }}>Encrypted Route</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={() => Alert.alert('Transmission', 'Patient terminal transmission active.')}>
                            <Ionicons name="paper-plane-outline" size={18} color={Theme.Colors.text} />
                            <AppText variant="caption" weight="black" style={{ marginLeft: 8 }}>Transmit to Subject</AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Theme.Colors.divider },

    transcriptCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: Theme.Colors.divider, overflow: 'hidden' },
    watermarkContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },

    transcriptHeader: { marginBottom: 32 },
    authorizedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: Theme.Colors.primary + '10', alignSelf: 'flex-start' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },

    telemetryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 20, backgroundColor: Theme.Colors.background, borderRadius: 20, marginBottom: 32, borderWidth: 1, borderColor: Theme.Colors.divider },
    telemetryItem: { flex: 1, minWidth: '40%', gap: 4 },

    contentSections: { gap: 28, marginBottom: 32 },
    section: { gap: 8 },
    sectionLabel: { letterSpacing: 1.5, fontSize: 10 },
    sectionValue: { fontSize: 16, color: '#333', lineHeight: 24 },
    assessmentSection: { padding: 20, backgroundColor: Theme.Colors.primary + '05', borderRadius: 20, borderLeftWidth: 4, borderLeftColor: Theme.Colors.primary, gap: 8 },
    narrativeText: { fontSize: 15, color: '#444', lineHeight: 24, fontStyle: 'italic' },

    requisitionSection: { paddingTop: 24, borderTopWidth: 1, borderTopColor: Theme.Colors.divider, marginBottom: 32 },
    requisitionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    regimenRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
    regimenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.Colors.primary, marginTop: 8 },

    surveillanceCard: { flexDirection: 'row', backgroundColor: Theme.Colors.success + '08', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: Theme.Colors.success + '20', marginBottom: 40 },

    authenticityFooter: { flexDirection: 'row', alignItems: 'center', paddingVertical: 24, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: Theme.Colors.divider },
    qrPlaceholder: { width: 50, height: 50, backgroundColor: Theme.Colors.background, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    seal: { opacity: 0.5 },

    actionHub: { marginTop: 32, gap: 16 },
    secondaryActions: { flexDirection: 'row', gap: 12 },
    secondaryBtn: { flex: 1, height: 50, borderRadius: 16, backgroundColor: Theme.Colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
});

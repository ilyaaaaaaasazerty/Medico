import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { patientApi } from '@/services/patient.api';
import { doctorApi } from '@/services/doctor.api';
import { useAuth } from '@/providers/AuthProvider';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

interface MedicalRecord {
    id: string;
    visitDate: string;
    chiefComplaint?: string;
    diagnosis?: string;
    notes?: string;
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    followUpDate?: string;
    followUpNotes?: string;
    attachments: any[];
    prescription?: {
        id: string;
        diagnosis?: string;
        instructions?: string;
        items: Array<{
            medication: string;
            dosage: string;
            frequency: string;
            duration: string;
        }>;
        doctor?: {
            firstName?: string;
            lastName?: string;
            user?: {
                firstName: string;
                lastName: string;
            };
        };
    };
}

export default function RecordDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [record, setRecord] = useState<MedicalRecord | null>(null);

    useEffect(() => {
        loadRecord();
    }, [id]);

    const loadRecord = async () => {
        if (!id) return;
        try {
            const res = user?.role === 'DOCTOR'
                ? await doctorApi.getRecordById(id)
                : await patientApi.getRecordById(id);
            if (res.success && res.data) {
                setRecord(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical record:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!id) return;
        try {
            const url = user?.role === 'DOCTOR'
                ? await doctorApi.getRecordPDF(id)
                : await patientApi.getRecordPDF(id);
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert('System Error', 'Failed to generate official clinical transcript');
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

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (!record) return null;

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Consultation Report</AppText>
                <TouchableOpacity onPress={handleDownloadPDF} style={[styles.circleBtn, { backgroundColor: Theme.Colors.primary + '10', borderColor: Theme.Colors.primary + '20' }]}>
                    <Ionicons name="download-outline" size={22} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.dateHeader}>
                    <View style={[styles.iconBox, { backgroundColor: Theme.Colors.primary + '15' }]}>
                        <Ionicons name="calendar" size={24} color={Theme.Colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase>DATE OF CONSULTATION</AppText>
                        <AppText variant="body" weight="black">{formatDate(record.visitDate)}</AppText>
                    </View>
                </View>

                {record.chiefComplaint && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Chief Complaint</AppText>
                        <AppCard padding="md">
                            <AppText variant="body" weight="bold" style={{ color: Theme.Colors.text, lineHeight: 22 }}>{record.chiefComplaint}</AppText>
                        </AppCard>
                    </View>
                )}

                {record.diagnosis && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Clinical Diagnosis</AppText>
                        <AppCard padding="md" style={{ borderLeftWidth: 4, borderLeftColor: Theme.Colors.primary }}>
                            <AppText variant="h3" weight="black">{record.diagnosis}</AppText>
                        </AppCard>
                    </View>
                )}

                {(record.bloodPressure || record.heartRate || record.temperature || record.weight) && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Biometric Vitals</AppText>
                        <View style={styles.vitalsGrid}>
                            {record.bloodPressure && <VitalStat label="BP" value={record.bloodPressure} unit="mmHg" icon="heart" color={Theme.Colors.error} />}
                            {record.heartRate && <VitalStat label="Pulse" value={String(record.heartRate)} unit="bpm" icon="pulse" color="#8B5CF6" />}
                            {record.temperature && <VitalStat label="Temp" value={String(record.temperature)} unit="°C" icon="thermometer" color={Theme.Colors.warning} />}
                            {record.weight && <VitalStat label="Weight" value={String(record.weight)} unit="kg" icon="scale" color={Theme.Colors.success} />}
                        </View>
                    </View>
                )}

                {record.notes && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Clinical Observations</AppText>
                        <AppCard padding="md">
                            <AppText variant="body" color="textSecondary" style={{ lineHeight: 22 }}>{record.notes}</AppText>
                        </AppCard>
                    </View>
                )}

                {record.prescription && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Prescribed Regimen</AppText>
                        <AppCard padding="none">
                            {record.prescription.items.map((item, idx) => (
                                <View key={idx} style={[styles.medRow, idx !== 0 && styles.rowDivider]}>
                                    <View style={styles.medIconBox}>
                                        <Ionicons name="medical" size={18} color={Theme.Colors.success} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <AppText variant="body" weight="black">{item.medication}</AppText>
                                        <AppText variant="caption" color="textSecondary" weight="bold">{item.dosage} • {item.frequency} • {item.duration}</AppText>
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity
                                style={styles.viewFullBtn}
                                onPress={() => router.push({ pathname: '/(app)/prescription-detail', params: { id: record.prescription!.id } })}
                            >
                                <AppText variant="caption" weight="black" color="primary">VIEW FULL AUTHORIZED SCRIPT</AppText>
                                <Ionicons name="chevron-forward" size={14} color={Theme.Colors.primary} />
                            </TouchableOpacity>
                        </AppCard>
                    </View>
                )}

                {record.attachments?.length > 0 && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Diagnostic Artifacts ({record.attachments.length})</AppText>
                        <AppCard padding="none">
                            {record.attachments.map((attachment, idx) => (
                                <TouchableOpacity
                                    key={attachment.id}
                                    style={[styles.attachRow, idx !== 0 && styles.rowDivider]}
                                    onPress={() => router.push({ pathname: '/(app)/document-viewer', params: { id: attachment.id } })}
                                >
                                    <Ionicons name="document-attach" size={20} color={Theme.Colors.primary} />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <AppText variant="body" weight="black" numberOfLines={1}>{attachment.name}</AppText>
                                        <AppText variant="caption" color="textSecondary" weight="bold">{attachment.type}</AppText>
                                    </View>
                                    <Ionicons name="eye-outline" size={18} color={Theme.Colors.divider} />
                                </TouchableOpacity>
                            ))}
                        </AppCard>
                    </View>
                )}

                {record.followUpDate && (
                    <View style={styles.followUpSection}>
                        <View style={[styles.iconBox, { backgroundColor: Theme.Colors.success + '15' }]}>
                            <Ionicons name="notifications" size={22} color={Theme.Colors.success} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <AppText variant="caption" color="success" weight="black" uppercase>STRATEGIC FOLLOW-UP</AppText>
                            <AppText variant="body" weight="black">{formatDate(record.followUpDate)}</AppText>
                            {record.followUpNotes && <AppText variant="caption" color="textSecondary" weight="bold">{record.followUpNotes}</AppText>}
                        </View>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </AppScreen>
    );
}

function VitalStat({ label, value, unit, icon, color }: any) {
    return (
        <View style={styles.vitalStat}>
            <View style={[styles.vitalIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={16} color={color} />
            </View>
            <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ marginTop: 8, fontSize: 9 }}>{label}</AppText>
            <AppText variant="body" weight="black" style={{ marginTop: 2 }}>{value} <AppText variant="caption" color="textSecondary" style={{ fontSize: 9 }}>{unit}</AppText></AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24 },
    dateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, backgroundColor: Theme.Colors.surface, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: Theme.Colors.divider },
    iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    section: { marginBottom: 32 },
    sectionTitle: { marginBottom: 16, letterSpacing: 1 },

    vitalsGrid: { flexDirection: 'row', gap: 12 },
    vitalStat: { flex: 1, backgroundColor: Theme.Colors.card, borderRadius: 20, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider, ...Theme.Shadows.soft },
    vitalIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

    medRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    medIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: Theme.Colors.success + '10', justifyContent: 'center', alignItems: 'center' },
    rowDivider: { borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    viewFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: Theme.Colors.primary + '05', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, gap: 8 },

    attachRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },

    followUpSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.success + '05', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.success + '20' },
});

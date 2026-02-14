import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { router, useLocalSearchParams } from 'expo-router';
import { doctorApi } from '@/services/doctor.api';
import { patientApi } from '@/services/patient.api';
import { useAuth } from '@/providers/AuthProvider';
import { AppScreen, AppText, AppCard } from '@/components/base';

interface MedicalRecord {
    id: string;
    visitDate: string;
    diagnosis?: string;
    chiefComplaint?: string;
    symptoms?: string;
    notes?: string;
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    prescription?: {
        id: string;
        items: any[];
    };
}

export default function PatientHistoryScreen() {
    const { patientId, patientName } = useLocalSearchParams<{ patientId: string; patientName?: string }>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const isDoctor = user?.role === 'DOCTOR';

    useEffect(() => {
        loadRecords();
    }, [patientId, user]);

    const loadRecords = async () => {
        if (!user) return;
        try {
            if (isDoctor) {
                if (!patientId) return;
                const res = await doctorApi.getPatientRecords(patientId);
                if (res.success && res.data) setRecords(res.data);
            } else {
                const res = await patientApi.getRecords();
                if (res.success && res.data) setRecords(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
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

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Master Clinical Ledger</AppText>
                <View style={styles.securityBadge}>
                    <Ionicons name="shield-checkmark" size={18} color={Theme.Colors.success} />
                </View>
            </View>

            {patientName && (
                <View style={styles.patientContext}>
                    <View style={styles.patientAvatar}>
                        <AppText variant="caption" color="primary" weight="black">{patientName.charAt(0)}</AppText>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 9 }}>Longitudinal Subject Record</AppText>
                        <AppText variant="body" weight="black">{patientName}</AppText>
                    </View>
                </View>
            )}

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {records.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="layers-outline" size={64} color={Theme.Colors.divider} />
                        </View>
                        <AppText variant="h3" weight="black">Ledger Empty</AppText>
                        <AppText variant="body" color="textSecondary" style={{ textAlign: 'center', marginTop: 12 }}>
                            No session transcripts or historical protocols found for this subject.
                        </AppText>
                    </View>
                ) : (
                    <View style={styles.timeline}>
                        {records.map((record, index) => (
                            <View key={record.id} style={styles.timelineItem}>
                                <View style={styles.timelineGuide}>
                                    <View style={[styles.dot, index === 0 && styles.activeDot]} />
                                    {index < records.length - 1 && <View style={styles.line} />}
                                </View>

                                <AppCard style={styles.recordCard} padding="md">
                                    <View style={styles.cardHeader}>
                                        <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 10 }}>{formatDate(record.visitDate)}</AppText>
                                        <TouchableOpacity onPress={() => router.push({ pathname: '/(app)/visit-summary', params: { recordId: record.id } })}>
                                            <Ionicons name="arrow-forward-circle" size={24} color={Theme.Colors.primary} />
                                        </TouchableOpacity>
                                    </View>

                                    {record.diagnosis && (
                                        <View style={styles.diagnosisBox}>
                                            <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 8, letterSpacing: 1 }}>Clinical Assessment</AppText>
                                            <AppText variant="body" weight="black" color="primary">{record.diagnosis}</AppText>
                                        </View>
                                    )}

                                    <View style={styles.contentGrid}>
                                        {record.chiefComplaint && (
                                            <View style={styles.gridItem}>
                                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Primary Indication</AppText>
                                                <AppText variant="caption" weight="bold" numberOfLines={2}>{record.chiefComplaint}</AppText>
                                            </View>
                                        )}

                                        {/* Telemetry Row */}
                                        {(record.bloodPressure || record.heartRate || record.temperature || record.weight) && (
                                            <View style={styles.telemetryStrip}>
                                                {record.bloodPressure && (
                                                    <View style={styles.vitalTag}>
                                                        <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>BP {record.bloodPressure}</AppText>
                                                    </View>
                                                )}
                                                {record.heartRate && (
                                                    <View style={styles.vitalTag}>
                                                        <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>HR {record.heartRate}</AppText>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>

                                    {record.prescription && (
                                        <View style={styles.rxStatus}>
                                            <Ionicons name="bandage-outline" size={14} color={Theme.Colors.success} />
                                            <AppText variant="caption" color="success" weight="black" uppercase style={{ fontSize: 9, marginLeft: 6 }}>
                                                {record.prescription.items?.length || 0} Requisitions Issued
                                            </AppText>
                                        </View>
                                    )}

                                    {record.notes && (
                                        <View style={styles.narrativePreview}>
                                            <AppText variant="caption" color="textSecondary" italic numberOfLines={2} style={{ fontSize: 11 }}>
                                                "{record.notes}"
                                            </AppText>
                                        </View>
                                    )}
                                </AppCard>
                            </View>
                        ))}
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    securityBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.success + '10', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.success + '20' },

    patientContext: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20 },
    patientAvatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 80 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Theme.Colors.divider },

    timeline: { gap: 0 },
    timelineItem: { flexDirection: 'row' },
    timelineGuide: { width: 32, alignItems: 'center' },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.Colors.divider, marginTop: 24 },
    activeDot: { backgroundColor: Theme.Colors.primary, width: 12, height: 12, borderRadius: 6 },
    line: { width: 2, flex: 1, backgroundColor: Theme.Colors.divider, marginVertical: 4 },

    recordCard: { flex: 1, marginLeft: 8, marginBottom: 20, borderWidth: 1, borderColor: Theme.Colors.divider },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },

    diagnosisBox: { backgroundColor: Theme.Colors.primary + '08', padding: 12, borderRadius: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: Theme.Colors.primary },

    contentGrid: { gap: 12, marginBottom: 12 },
    gridItem: { gap: 4 },
    telemetryStrip: { flexDirection: 'row', gap: 8 },
    vitalTag: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: Theme.Colors.background, borderRadius: 6, borderWidth: 1, borderColor: Theme.Colors.divider },

    rxStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.success + '10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
    narrativePreview: { borderTopWidth: 1, borderTopColor: Theme.Colors.divider, paddingTop: 12 },
});

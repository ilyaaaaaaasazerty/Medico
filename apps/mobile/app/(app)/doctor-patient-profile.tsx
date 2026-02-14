import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doctorApi } from '@/services/doctor.api';
import { messageApi } from '@/services/message.api';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

interface MedicalRecord {
    id: string;
    visitDate: string;
    diagnosis?: string;
    chiefComplaint?: string;
    notes?: string;
}

export default function DoctorPatientProfileScreen() {
    const { patientId, patientName } = useLocalSearchParams<{ patientId: string; patientName?: string }>();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<MedicalRecord[]>([]);

    useEffect(() => {
        loadPatientRecords();
    }, [patientId]);

    const loadPatientRecords = async () => {
        if (!patientId) return;
        try {
            const res = await doctorApi.getPatientRecords(patientId);
            if (res.success && res.data) {
                setRecords(res.data);
            }
        } catch (error) {
            console.error('Error loading subject telemetry:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMessagePatient = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const res = await messageApi.startThread(patientId);
            if (res.success) {
                router.push({
                    pathname: '/(app)/messages/[id]',
                    params: {
                        id: res.data.id,
                        name: patientName || 'Subject'
                    }
                });
            }
        } catch (error) {
            console.error('Failed to initiate secure channel:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
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
                <AppText variant="h3" weight="black">Subject Snapshot</AppText>
                <TouchableOpacity style={styles.circleBtn} onPress={handleMessagePatient}>
                    <Ionicons name="chatbubbles-outline" size={22} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Identity Terminal */}
                <AppCard style={styles.identityTerminal} padding="lg">
                    <View style={styles.identityRow}>
                        <View style={styles.avatarOutline}>
                            <View style={styles.avatarInternal}>
                                <AppText variant="h1" weight="black" color="textInverted" style={{ fontSize: 32 }}>
                                    {patientName ? patientName[0] : 'S'}
                                </AppText>
                            </View>
                            <View style={styles.statusInlay} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 20 }}>
                            <AppText variant="h2" weight="black">{patientName || 'Subject Unidentified'}</AppText>
                            <View style={styles.idBadge}>
                                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9 }}>UID: {patientId?.toUpperCase().substring(0, 12)}</AppText>
                            </View>
                            <View style={styles.verifiedTag}>
                                <Ionicons name="shield-checkmark" size={10} color={Theme.Colors.success} />
                                <AppText variant="caption" color="success" weight="black" uppercase style={{ fontSize: 8, marginLeft: 4 }}>Authored Identity</AppText>
                            </View>
                        </View>
                    </View>
                </AppCard>

                {/* Registry Protocol Matrix */}
                <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionLabel}>Registry Protocol Matrix</AppText>
                <View style={styles.protocolGrid}>
                    {[
                        { label: 'Longitudinal Ledger', icon: 'list-circle', route: `/(app)/patient-history?patientId=${patientId}&patientName=${patientName || ''}` },
                        { label: 'Clinical Narrative', icon: 'document-text', route: `/(app)/patient-notes?patientId=${patientId}&patientName=${patientName || ''}` },
                        { label: 'Asset Vault', icon: 'folder-open', route: `/(app)/patient-documents?patientId=${patientId}&patientName=${patientName || ''}` },
                        { label: 'Hypersensitivity', icon: 'warning', color: Theme.Colors.error }
                    ].map((item, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.protocolTile}
                            onPress={() => item.route && router.push(item.route as any)}
                        >
                            <View style={[styles.tileIconFrame, { backgroundColor: (item.color || Theme.Colors.primary) + '10' }]}>
                                <Ionicons name={item.icon as any} size={24} color={item.color || Theme.Colors.primary} />
                            </View>
                            <AppText variant="caption" weight="black" align="center" style={{ marginTop: 10, fontSize: 10 }}>{item.label}</AppText>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Telemetry Aggregation */}
                <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionLabel}>Telemetry Aggregation</AppText>
                <View style={styles.statsRow}>
                    <View style={styles.statModule}>
                        <AppText variant="h1" weight="black" color="primary">{records.length}</AppText>
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Cumulative Sessions</AppText>
                    </View>
                    <View style={[styles.statModule, { borderLeftWidth: 1, borderLeftColor: Theme.Colors.divider }]}>
                        <AppText variant="h1" weight="black" color="primary">
                            {records.filter(r => r.visitDate && new Date(r.visitDate) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)).length}
                        </AppText>
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Annual Cycle (2026)</AppText>
                    </View>
                </View>

                {/* Session Registry */}
                <View style={styles.registryHeader}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={{ letterSpacing: 1.2, fontSize: 10 }}>Registry of Recent Sessions</AppText>
                    <TouchableOpacity onPress={() => router.push(`/(app)/patient-history?patientId=${patientId}&patientName=${patientName || ''}`)}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 10 }}>Full Archive</AppText>
                    </TouchableOpacity>
                </View>

                {records.length === 0 ? (
                    <View style={styles.emptyRegistry}>
                        <Ionicons name="layers-outline" size={40} color={Theme.Colors.divider} />
                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 16 }}>Registry void. No historical clinical sessions documented.</AppText>
                    </View>
                ) : (
                    <View style={styles.recordList}>
                        {records.slice(0, 3).map((record) => (
                            <TouchableOpacity
                                key={record.id}
                                style={styles.recordEntry}
                                onPress={() => router.push({ pathname: '/(app)/record-detail', params: { id: record.id } })}
                            >
                                <View style={styles.entryDateBox}>
                                    <AppText variant="caption" color="primary" weight="black" align="center">{formatDate(record.visitDate).split(',')[0].split(' ')[0]}</AppText>
                                    <AppText variant="body" weight="black" align="center" style={{ fontSize: 16 }}>{formatDate(record.visitDate).split(',')[0].split(' ')[1]}</AppText>
                                </View>
                                <View style={styles.entryContent}>
                                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 7 }}>Clinical Assessment</AppText>
                                    <AppText variant="body" weight="black" numberOfLines={1}>{record.diagnosis || 'Undocumented Assessment'}</AppText>
                                    {record.chiefComplaint && (
                                        <AppText variant="caption" color="textSecondary" numberOfLines={1} style={{ marginTop: 2 }}>Indication: {record.chiefComplaint}</AppText>
                                    )}
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={Theme.Colors.divider} />
                            </TouchableOpacity>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, backgroundColor: Theme.Colors.background },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

    identityTerminal: { backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, marginTop: 10, marginBottom: 32 },
    identityRow: { flexDirection: 'row', alignItems: 'center' },
    avatarOutline: { width: 80, height: 80, borderRadius: 30, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    avatarInternal: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    statusInlay: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: Theme.Colors.success, borderWidth: 4, borderColor: Theme.Colors.surface },

    idBadge: { backgroundColor: Theme.Colors.background, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4, borderWidth: 1, borderColor: Theme.Colors.divider },
    verifiedTag: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },

    sectionLabel: { marginLeft: 4, marginBottom: 16, letterSpacing: 1.2, fontSize: 10 },

    protocolGrid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    protocolTile: { flex: 1, backgroundColor: Theme.Colors.surface, padding: 16, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    tileIconFrame: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    statsRow: { flexDirection: 'row', backgroundColor: Theme.Colors.surface, borderRadius: 24, padding: 24, marginBottom: 32, borderWidth: 1, borderColor: Theme.Colors.divider },
    statModule: { flex: 1, alignItems: 'center' },

    registryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
    emptyRegistry: { backgroundColor: Theme.Colors.surface, padding: 40, borderRadius: 24, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: Theme.Colors.divider },

    recordList: { gap: 12 },
    recordEntry: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.surface, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: Theme.Colors.divider },
    entryDateBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.primary + '20' },
    entryContent: { flex: 1, marginLeft: 16 },
});

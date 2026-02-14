import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { patientApi } from '@/services/patient.api';
import { format } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function RecordsScreen() {
    const [vitals, setVitals] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [vitalsRes, docsRes, recordsRes, rxRes] = await Promise.all([
                patientApi.getVitals(),
                patientApi.getDocuments(),
                patientApi.getRecords(),
                patientApi.getPrescriptions()
            ]);
            if (vitalsRes.success) setVitals(vitalsRes.data || []);
            if (docsRes.success) setDocuments(docsRes.data || []);

            const combined = [
                ...(recordsRes.success ? (recordsRes.data || []).map((r: any) => ({ ...r, _type: 'RECORD', date: r.visitDate })) : []),
                ...(rxRes.success ? (rxRes.data || []).map((p: any) => ({ ...p, _type: 'PRESCRIPTION', date: p.createdAt })) : [])
            ];
            combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setHistory(combined);
        } catch (error) {
            console.error('Error loading records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                const uploadRes = await patientApi.uploadDocument({
                    name: asset.name,
                    type: asset.mimeType?.startsWith('image') ? 'IMAGE' : 'REPORT',
                    file: {
                        uri: asset.uri,
                        name: asset.name,
                        mimeType: asset.mimeType
                    }
                });

                if (uploadRes.success) {
                    loadData();
                }
            }
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const getStatusColor = (value: number, type: string) => {
        if (type === 'BLOOD_PRESSURE_SYSTOLIC' && value > 140) return Theme.Colors.error;
        if (type === 'HEART_RATE' && (value > 100 || value < 60)) return Theme.Colors.warning;
        return Theme.Colors.success;
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <AppText variant="title">My Health</AppText>
                <TouchableOpacity style={styles.shareBtn}>
                    <Ionicons name="share-outline" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: Theme.Spacing.lg }}>
                {/* 1. Results Hub */}
                <View style={styles.sectionHeader}>
                    <AppText variant="h3">Recent Results</AppText>
                    <TouchableOpacity><AppText color="primary" weight="bold">See All</AppText></TouchableOpacity>
                </View>

                <View style={styles.resultsGrid}>
                    {vitals.slice(0, 6).map((v: any) => (
                        <AppCard key={v.id} style={styles.resultCard} padding="md">
                            <View style={styles.resultHeader}>
                                <AppText variant="caption" color="textSecondary" numberOfLines={1}>{v.type.replace(/_/g, ' ')}</AppText>
                                <Ionicons name="information-circle-outline" size={16} color={Theme.Colors.textSecondary} />
                            </View>
                            <View style={styles.resultValueRow}>
                                <AppText weight="black" style={{ fontSize: 24 }}>{v.value}</AppText>
                                <AppText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>{v.unit}</AppText>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(v.value, v.type) + '15' }]}>
                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(v.value, v.type) }]} />
                                <AppText weight="black" style={{ fontSize: 10, color: getStatusColor(v.value, v.type) }}>
                                    {format(new Date(v.recordedAt), 'MMM d')}
                                </AppText>
                            </View>
                        </AppCard>
                    ))}
                    {vitals.length === 0 && (
                        <AppText color="textSecondary" style={{ padding: Theme.Spacing.md }}>No vital readings yet.</AppText>
                    )}
                </View>

                {/* 2. Document Vault */}
                <View style={styles.sectionHeader}>
                    <AppText variant="h3">Documents</AppText>
                    <AppButton title="Upload" size="sm" variant="ghost" onPress={handleUpload} />
                </View>

                {documents.map((doc: any) => (
                    <AppCard key={doc.id} style={styles.docRow} padding="sm" variant="outline">
                        <View style={styles.docIconBg}>
                            <Ionicons
                                name={doc.type === 'IMAGE' ? "image" : "document-text"}
                                size={22} color={Theme.Colors.primary}
                            />
                        </View>
                        <View style={styles.docContent}>
                            <AppText weight="bold">{doc.name}</AppText>
                            <AppText variant="caption" color="textSecondary">
                                {doc.type} • {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                            </AppText>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Theme.Colors.divider} />
                    </AppCard>
                ))}
                {documents.length === 0 && (
                    <AppText color="textSecondary" style={{ textAlign: 'center', padding: Theme.Spacing.lg }}>No documents uploaded yet.</AppText>
                )}

                {/* 3. Clinical History */}
                <View style={[styles.sectionHeader, { marginTop: Theme.Spacing.lg }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <AppText variant="h3">Clinical History</AppText>
                        <Ionicons name="time-outline" size={20} color={Theme.Colors.primary} />
                    </View>
                </View>

                {history.map((item: any) => {
                    const isRecord = item._type === 'RECORD';
                    return (
                        <AppCard
                            key={`${item._type}-${item.id}`}
                            style={styles.historyRow}
                            padding="md"
                            onPress={() => router.push({
                                pathname: isRecord ? '/(app)/record-detail' : '/(app)/prescription-detail',
                                params: { id: item.id }
                            })}
                        >
                            <View style={[styles.historyIcon, { backgroundColor: isRecord ? Theme.Colors.primary + '15' : Theme.Colors.success + '15' }]}>
                                <Ionicons
                                    name={isRecord ? "medical" : "receipt"}
                                    size={20}
                                    color={isRecord ? Theme.Colors.primary : Theme.Colors.success}
                                />
                            </View>
                            <View style={styles.historyContent}>
                                <AppText weight="bold">
                                    {isRecord ? (item.diagnosis || 'Visit Record') : 'Prescription'}
                                </AppText>
                                <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                                    {isRecord ? (item.chiefComplaint || 'Consultation') : `Dr. ${item.doctor?.lastName || 'Doctor'}`}
                                </AppText>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <AppText variant="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                                    {format(new Date(item.date), 'MMM d, yyyy')}
                                </AppText>
                                <AppCard
                                    padding="none"
                                    style={[styles.historyBadge, { backgroundColor: (isRecord ? Theme.Colors.primary : Theme.Colors.success) + '15' }]}
                                >
                                    <AppText weight="black" style={{ fontSize: 9, paddingHorizontal: 6, paddingVertical: 2, color: isRecord ? Theme.Colors.primary : Theme.Colors.success }}>
                                        {isRecord ? 'Visit' : 'Rx'}
                                    </AppText>
                                </AppCard>
                            </View>
                        </AppCard>
                    );
                })}
                {history.length === 0 && (
                    <AppText color="textSecondary" style={{ textAlign: 'center', padding: Theme.Spacing.lg }}>No clinical history found.</AppText>
                )}

                <View style={{ height: 100 }} />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.lg,
        paddingTop: Theme.Spacing.lg,
        paddingBottom: Theme.Spacing.md,
    },
    shareBtn: {
        width: 44,
        height: 44,
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Radii.lg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Theme.Spacing.xl,
        marginBottom: Theme.Spacing.md,
    },
    resultsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Theme.Spacing.md,
    },
    resultCard: {
        width: '47.5%',
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    resultValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Theme.Radii.sm,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    docRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.Spacing.sm,
        borderColor: Theme.Colors.divider,
    },
    docIconBg: {
        width: 48,
        height: 48,
        borderRadius: Theme.Radii.md,
        backgroundColor: Theme.Colors.overlayPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Theme.Spacing.md,
    },
    docContent: {
        flex: 1,
    },
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.Spacing.sm,
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    historyIcon: {
        width: 44,
        height: 44,
        borderRadius: Theme.Radii.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Theme.Spacing.md,
    },
    historyContent: {
        flex: 1,
    },
    historyBadge: {
        borderRadius: Theme.Radii.xs,
        borderWidth: 0,
    },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import Theme from '@/constants/Theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doctorApi } from '@/services/doctor.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard } from '@/components/base';

interface Document {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
}

export default function PatientDocumentsScreen() {
    const router = useRouter();
    const { patientId, patientName } = useLocalSearchParams<{ patientId: string; patientName: string }>();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDocuments();
    }, [patientId]);

    const loadDocuments = async () => {
        if (!patientId) return;
        try {
            const res = await doctorApi.getPatientDocuments(patientId);
            if (res.success && res.data) {
                setDocuments(res.data);
            }
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getDocProtocolIcon = (type: string) => {
        switch (type) {
            case 'LAB_RESULT': return { icon: 'flask', color: '#8B5CF6' };
            case 'PRESCRIPTION': return { icon: 'medical', color: Theme.Colors.primary };
            case 'IMAGING': return { icon: 'scan', color: '#EC4899' };
            case 'REPORT': return { icon: 'document-text', color: '#3B82F6' };
            case 'INSURANCE': return { icon: 'shield-outline', color: '#10B981' };
            case 'ID_DOCUMENT': return { icon: 'person-circle-outline', color: '#6B7280' };
            default: return { icon: 'document', color: Theme.Colors.textSecondary };
        }
    };

    const renderItem = ({ item }: { item: Document }) => {
        const protocol = getDocProtocolIcon(item.type);
        const dateObj = new Date(item.uploadedAt);

        return (
            <AppCard
                padding="md"
                style={styles.assetCard}
                onPress={() => router.push(`/(app)/document-viewer?id=${item.id}`)}
            >
                <View style={[styles.protocolIcon, { backgroundColor: protocol.color + '10' }]}>
                    <Ionicons name={protocol.icon as any} size={24} color={protocol.color} />
                </View>
                <View style={styles.assetMeta}>
                    <AppText variant="body" weight="black" numberOfLines={1}>{item.name}</AppText>
                    <View style={styles.telemetryRow}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 7 }}>{item.type.replace(/_/g, ' ')}</AppText>
                        <View style={styles.metaDot} />
                        <AppText variant="caption" color="textSecondary" weight="bold">{dateObj.toLocaleDateString()}</AppText>
                        <View style={styles.metaDot} />
                        <AppText variant="caption" color="textSecondary" weight="bold">{formatSize(item.size)}</AppText>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Theme.Colors.divider} />
            </AppCard>
        );
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <AppText variant="h3" weight="black">Asset Vault</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Diagnostic Data Repository</AppText>
                </View>
                <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="cloud-upload-outline" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.heroBox}>
                <View style={styles.subjectRow}>
                    <AppText variant="h1" weight="black">Vault Assets</AppText>
                    {patientName && (
                        <View style={styles.subjectTag}>
                            <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 8 }}>{patientName}</AppText>
                        </View>
                    )}
                </View>
                <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 8 }}>
                    Aggregated diagnostic records and institutional documentation committed to the subject's clinical registry.
                </AppText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={documents}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.voidVault}>
                            <View style={styles.voidIconBox}>
                                <Ionicons name="folder-open-outline" size={40} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="h3" weight="black">Vault Empty</AppText>
                            <AppText variant="caption" color="textSecondary" align="center" style={{ marginTop: 12 }}>
                                No diagnostic assets or clinical documentation have been manifest in this subject's registry.
                            </AppText>
                        </View>
                    }
                />
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, backgroundColor: Theme.Colors.surface, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    actionBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },

    heroBox: { padding: 32, paddingBottom: 16 },
    subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    subjectTag: { backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Theme.Colors.primary + '20' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    list: { padding: 24, paddingTop: 16 },
    assetCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: Theme.Colors.divider },
    protocolIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    assetMeta: { flex: 1, marginLeft: 16 },
    telemetryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    metaDot: { width: 2, height: 2, borderRadius: 1, backgroundColor: Theme.Colors.divider, marginHorizontal: 8 },

    voidVault: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    voidIconBox: { width: 80, height: 80, borderRadius: 30, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
});

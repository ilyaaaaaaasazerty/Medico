import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import * as DocumentPicker from 'expo-document-picker';
import { patientApi } from '@/services/patient.api';
import { appointmentApi } from '@/services/appointment.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

interface Document {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
}

export default function AttachDocumentsScreen() {
    const router = useRouter();
    const { appointmentId } = useLocalSearchParams();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const res = await patientApi.getDocuments();
            if (res.success && res.data) {
                setDocuments(res.data);
            }
        } catch (error) {
            console.error('Error loading documents for engagement:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setUploading(true);

                try {
                    const formData = new FormData();
                    formData.append('file', {
                        uri: file.uri,
                        type: file.mimeType || 'application/octet-stream',
                        name: file.name,
                    } as any);

                    const res = await appointmentApi.uploadAttachment(appointmentId as string, formData);

                    if (res.success && res.data) {
                        setDocuments([...documents, res.data]);
                        Alert.alert('Asset Verified', 'Document successfully synchronized with clinical engagement.');
                    } else {
                        Alert.alert('Protocol Error', res.error || 'Failed to authorize upload');
                    }
                } catch (error) {
                    Alert.alert('System Error', 'Unable to commit asset to clinical vault');
                } finally {
                    setUploading(false);
                }
            }
        } catch (error) {
            console.error('Asset Intake Error:', error);
            setUploading(false);
        }
    };

    const handleRemove = (id: string) => {
        setDocuments(documents.filter(d => d.id !== id));
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Asset Intake</AppText>
                <TouchableOpacity onPress={() => router.back()}>
                    <AppText variant="body" weight="black" color="primary">FINISH</AppText>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={Theme.Colors.primary} />
                    </View>
                ) : (
                    <>
                        <AppText variant="body" color="textSecondary" weight="bold" style={styles.description}>
                            Select relevant diagnostic assets, historical reports, or prescriptions to synchronize with this engagement.
                        </AppText>

                        <AppCard
                            padding="none"
                            style={styles.uploadCard}
                            onPress={handlePickDocument}
                        >
                            <View style={styles.uploadInner}>
                                {uploading ? (
                                    <ActivityIndicator color={Theme.Colors.primary} size="large" />
                                ) : (
                                    <>
                                        <View style={styles.uploadIconBox}>
                                            <Ionicons name="cloud-upload" size={32} color={Theme.Colors.primary} />
                                        </View>
                                        <AppText variant="body" weight="black" style={{ marginTop: 12 }}>Ingest Diagnostic File</AppText>
                                        <AppText variant="caption" color="textSecondary" weight="bold">PDF or High-Resolution Image</AppText>
                                    </>
                                )}
                            </View>
                        </AppCard>

                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>
                            SYNCHRONIZED ASSETS ({documents.length})
                        </AppText>

                        <FlatList
                            data={documents}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <AppCard padding="sm" style={styles.docCard}>
                                    <View style={styles.docRow}>
                                        <View style={styles.docIconBox}>
                                            <Ionicons name="document-text" size={20} color={Theme.Colors.primary} />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 16 }}>
                                            <AppText variant="body" weight="black" numberOfLines={1}>{item.name}</AppText>
                                            <AppText variant="caption" color="textSecondary" weight="bold">
                                                {item.type.split('/')[1]?.toUpperCase() || 'FILE'} • {formatSize(item.size)}
                                            </AppText>
                                        </View>
                                        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id)}>
                                            <Ionicons name="trash-outline" size={20} color={Theme.Colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                </AppCard>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyView}>
                                    <Ionicons name="server-outline" size={48} color={Theme.Colors.divider} />
                                    <AppText variant="caption" color="textSecondary" weight="black" style={{ marginTop: 16 }}>NO ASSETS ATTACHED</AppText>
                                </View>
                            }
                            contentContainerStyle={{ paddingBottom: 40 }}
                        />
                    </>
                )}
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    content: { flex: 1, paddingHorizontal: 24 },
    description: { marginBottom: 24, lineHeight: 20 },

    uploadCard: { borderStyle: 'dashed', borderWidth: 2, borderColor: Theme.Colors.divider, backgroundColor: Theme.Colors.surface, marginBottom: 32 },
    uploadInner: { padding: 40, alignItems: 'center' },
    uploadIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    sectionTitle: { marginBottom: 16, letterSpacing: 1 },
    docCard: { marginBottom: 12 },
    docRow: { flexDirection: 'row', alignItems: 'center' },
    docIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    removeBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: Theme.Colors.error + '08', justifyContent: 'center', alignItems: 'center' },

    emptyView: { padding: 60, alignItems: 'center' },
});

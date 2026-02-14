import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, TextInput, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { labApi } from '@/services/lab.api';
import { messageApi } from '@/services/message.api';
import * as DocumentPicker from 'expo-document-picker';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

interface LabRequestDetail {
    id: string;
    labCenter: { name: string; address: string; phone: string };
    patient: { firstName: string; lastName: string };
    patientId: string;
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    prescriptionUrl?: string;
    items: { id: string; test: { name: string; category: string; price: number } }[];
    results: { id: string; fileName: string; fileUrl: string; notes?: string; uploadedAt: string }[];
    createdAt: string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
    PENDING: { color: Theme.Colors.warning, label: 'AWAITING CONFIRMATION' },
    CONFIRMED: { color: Theme.Colors.primary, label: 'ORDER CONFIRMED' },
    SAMPLE_COLLECTED: { color: Theme.Colors.primary, label: 'SAMPLE ACQUIRED' },
    IN_PROGRESS: { color: '#8B5CF6', label: 'DIAGNOSTIC PROCESSING' },
    COMPLETED: { color: Theme.Colors.success, label: 'RESULTS COMMITTED' },
    CANCELLED: { color: Theme.Colors.error, label: 'ORDER VOIDED' },
};

export default function LabAdminRequestDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState<LabRequestDetail | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [resultFile, setResultFile] = useState<any>(null);
    const [resultName, setResultName] = useState('');
    const [resultNotes, setResultNotes] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadRequest();
    }, [id]);

    const loadRequest = async () => {
        try {
            const res = await labApi.getLabRequest(id!);
            if (res.success && res.data) {
                setRequest(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical order terminal:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'confirm' | 'collect' | 'start' | 'complete') => {
        setActionLoading(true);
        try {
            let res;
            switch (action) {
                case 'confirm': res = await labApi.confirmRequest(id!); break;
                case 'collect': res = await labApi.collectSample(id!); break;
                case 'start': res = await labApi.startProcessing(id!); break;
                case 'complete': res = await labApi.completeRequest(id!); break;
            }
            if (res?.success) loadRequest();
            else Alert.alert('PROTOCOL ERROR', res?.error || 'State transition failed.');
        } catch (error: any) {
            Alert.alert('SYNC ERROR', error.message || 'Action execution protocol failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewResult = (fileUrl: string, fileName: string = 'Document') => {
        router.push({
            pathname: '/(app)/document-viewer',
            params: { url: fileUrl, title: fileName, type: 'LAB_RESULT' }
        });
    };

    const pickResultDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setResultFile(asset);
                setResultName(asset.name.split('.')[0] || 'CLINICAL RESULT');
            }
        } catch (error) {
            Alert.alert('ASSET ERROR', 'Failed to acquire digital asset.');
        }
    };

    const handleUploadResult = async () => {
        if (!resultFile || !resultName) {
            Alert.alert('VALIDATION ERROR', 'Mandatory parameters missing for diagnostic asset commit.');
            return;
        }

        setUploading(true);
        try {
            const res = await labApi.uploadResult(id!, {
                uri: resultFile.uri,
                name: resultFile.name,
                type: resultFile.mimeType || 'application/pdf',
            }, resultName, resultNotes);

            if (res.success) {
                setUploadModalVisible(false);
                setResultFile(null);
                setResultName('');
                setResultNotes('');
                Alert.alert('ASSET COMMITTED', 'Diagnostic results securely synchronized to patient clinical vault.');
                loadRequest();
            } else Alert.alert('PROTOCOL ERROR', res.error || 'Asset commit failed.');
        } catch (error: any) {
            Alert.alert('SYNC ERROR', error.message || 'Network synchronization failure.');
        } finally {
            setUploading(false);
        }
    };

    const handleMessagePatient = async () => {
        if (!request?.patientId) return;
        setActionLoading(true);
        try {
            const res = await messageApi.startThread(request.patientId);
            if (res.success) {
                router.push({
                    pathname: '/(app)/messages/[id]',
                    params: { id: res.data.id, name: `${request.patient?.firstName} ${request.patient?.lastName}` }
                });
            }
        } catch (error) {
            Alert.alert('COMMUNICATION ERROR', 'Failed to establish encrypted clinical channel.');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (!request) return null;

    const renderActionButtons = () => {
        const isLoading = actionLoading;
        switch (request.status) {
            case 'PENDING':
                return (
                    <AppButton
                        title="AUTHORIZE DIAGNOSTIC CASE"
                        onPress={() => handleAction('confirm')}
                        loading={isLoading}
                        style={styles.primaryAction}
                    />
                );
            case 'CONFIRMED':
                return (
                    <AppButton
                        title="CONSOLIDATE SAMPLE ACQUISITION"
                        onPress={() => handleAction('collect')}
                        loading={isLoading}
                        style={styles.primaryAction}
                    />
                );
            case 'SAMPLE_COLLECTED':
                return (
                    <AppButton
                        title="INITIATE DIAGNOSTIC ANALYSIS"
                        onPress={() => handleAction('start')}
                        loading={isLoading}
                        style={[styles.primaryAction, { backgroundColor: '#8B5CF6' }]}
                    />
                );
            case 'IN_PROGRESS':
                return (
                    <View style={styles.btnCluster}>
                        <AppButton
                            title="UPLOAD ASSETS"
                            variant="tonal"
                            onPress={() => setUploadModalVisible(true)}
                            style={{ flex: 1, height: 60, borderRadius: 20 }}
                        />
                        <View style={{ width: 12 }} />
                        <AppButton
                            title="COMMIT CASE"
                            onPress={() => handleAction('complete')}
                            loading={isLoading}
                            style={{ flex: 1, height: 60, borderRadius: 20, backgroundColor: Theme.Colors.success }}
                        />
                    </View>
                );
            case 'COMPLETED':
                return (
                    <AppButton
                        title="APPEND SUPPLEMENTARY ASSETS"
                        variant="tonal"
                        onPress={() => setUploadModalVisible(true)}
                        style={styles.primaryAction}
                    />
                );
            default: return null;
        }
    };

    const diagnosticStatus = statusConfig[request.status] || { color: Theme.Colors.textSecondary, label: 'UNKNOWN' };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Order Terminal</AppText>
                <TouchableOpacity onPress={loadRequest} style={styles.circleBtn}>
                    <Ionicons name="sync" size={20} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.statusSection}>
                    <View style={[styles.statusStrip, { backgroundColor: diagnosticStatus.color + '12' }]}>
                        <View style={[styles.statusIndicator, { backgroundColor: diagnosticStatus.color }]} />
                        <AppText variant="caption" weight="black" style={{ color: diagnosticStatus.color, fontSize: 9 }}>PROTOCOL STATUS: {diagnosticStatus.label}</AppText>
                    </View>
                    <AppText variant="caption" color="textSecondary" weight="black">CASE-TX: #{id?.slice(-10).toUpperCase()}</AppText>
                </View>

                <AppCard padding="none" style={styles.patientLedger}>
                    <View style={styles.ledgerHeader}>
                        <View style={styles.identityAvatar}>
                            <AppText variant="body" weight="black" color="primary">
                                {request.patient.firstName[0]}{request.patient.lastName[0]}
                            </AppText>
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <AppText variant="h3" weight="black">{request.patient.firstName} {request.patient.lastName}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9 }}>IDENTIFIER: #{request.patientId.slice(-8).toUpperCase()}</AppText>
                        </View>
                        <TouchableOpacity style={styles.commBtn} onPress={handleMessagePatient}>
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color={Theme.Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.horizontalDivider} />

                    <View style={styles.metaLedger}>
                        <View style={styles.metaCell}>
                            <Ionicons name="calendar-outline" size={16} color={Theme.Colors.primary} />
                            <View style={{ marginLeft: 12 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 7 }}>SCHEDULED DATE</AppText>
                                <AppText variant="body" weight="black" style={{ fontSize: 13 }}>{formatDate(request.scheduledDate)}</AppText>
                            </View>
                        </View>
                        <View style={styles.metaCell}>
                            <Ionicons name="time-outline" size={16} color={Theme.Colors.primary} />
                            <View style={{ marginLeft: 12 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 7 }}>TEMPORAL SLOT</AppText>
                                <AppText variant="body" weight="black" style={{ fontSize: 13 }}>{request.scheduledTime}</AppText>
                            </View>
                        </View>
                    </View>
                </AppCard>

                {request.prescriptionUrl && (
                    <AppCard padding="none" style={styles.intakeAsset} onPress={() => handleViewResult(request.prescriptionUrl!, 'Institutional Prescription')}>
                        <View style={styles.assetPadding}>
                            <View style={styles.assetIconBox}>
                                <Ionicons name="document-text-outline" size={20} color={Theme.Colors.primary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>Digital Requisition</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">Verified prescription asset acquired at intake.</AppText>
                            </View>
                            <View style={styles.viewIndicator}>
                                <AppText variant="caption" weight="black" color="primary" style={{ fontSize: 8 }}>INSPECT</AppText>
                            </View>
                        </View>
                    </AppCard>
                )}

                <View style={styles.terminalSection}>
                    <AppText variant="caption" color="textSecondary" weight="black" style={styles.terminalLabel}>DIAGNOSTIC MATRIX PANELS</AppText>
                    <AppCard padding="none" style={styles.matrixContainer}>
                        {request.items.map((item, idx) => (
                            <View key={item.id} style={[styles.matrixRow, idx < request.items.length - 1 && styles.matrixDivider]}>
                                <View style={{ flex: 1 }}>
                                    <AppText variant="body" weight="black" uppercase style={{ fontSize: 12 }}>{item.test.name}</AppText>
                                    <View style={styles.catBadge}>
                                        <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 7 }}>{item.test.category.toUpperCase()}</AppText>
                                    </View>
                                </View>
                                <View style={styles.valTag}>
                                    <AppText variant="caption" weight="black" color="primary" style={{ fontSize: 10 }}>{item.test.price} DA</AppText>
                                </View>
                            </View>
                        ))}
                    </AppCard>
                </View>

                {request.results?.length > 0 && (
                    <View style={styles.terminalSection}>
                        <AppText variant="caption" color="textSecondary" weight="black" style={styles.terminalLabel}>AUTHORIZED OUTPUT ASSETS</AppText>
                        <AppCard padding="none" style={styles.matrixContainer}>
                            {request.results.map((result, idx) => (
                                <TouchableOpacity key={result.id} style={[styles.outputRow, idx < request.results.length - 1 && styles.matrixDivider]} onPress={() => handleViewResult(result.fileUrl, result.fileName)}>
                                    <View style={styles.outputIconBg}>
                                        <Ionicons name="medal-outline" size={16} color={Theme.Colors.success} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 16 }}>
                                        <AppText variant="body" weight="black" uppercase style={{ fontSize: 12 }}>{result.fileName}</AppText>
                                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ fontSize: 9 }}>COMMITTED {new Date(result.uploadedAt).toLocaleDateString()}</AppText>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={Theme.Colors.divider} />
                                </TouchableOpacity>
                            ))}
                        </AppCard>
                    </View>
                )}

                <View style={{ height: 160 }} />
            </ScrollView>

            <View style={styles.terminalFooter}>
                {renderActionButtons()}
            </View>

            <Modal visible={uploadModalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <AppText variant="h3" weight="black">ASSET COMMITMENT</AppText>
                                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9 }}>DIAGNOSTIC OUTPUT REQUISITION</AppText>
                            </View>
                            <TouchableOpacity onPress={() => setUploadModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Theme.Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                            <TouchableOpacity
                                style={[styles.intakeZone, resultFile && styles.intakeZoneActive]}
                                onPress={pickResultDocument}
                            >
                                <View style={[styles.intakeIconBg, resultFile && { backgroundColor: Theme.Colors.success + '10' }]}>
                                    <Ionicons name={resultFile ? "shield-checkmark-outline" : "document-attach-outline"} size={32} color={resultFile ? Theme.Colors.success : Theme.Colors.primary} />
                                </View>
                                <AppText variant="body" weight="black" uppercase style={{ marginTop: 12, color: resultFile ? Theme.Colors.success : Theme.Colors.text }}>
                                    {resultFile ? 'ASSET DETECTED' : 'INJECT CLINICAL ASSET'}
                                </AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 4 }}>{resultFile ? resultFile.name : 'PDF / IMAGE MATRIX INPUT'}</AppText>
                            </TouchableOpacity>

                            <View style={{ marginTop: 32 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" style={styles.inputLabel}>OUTPUT NOMENCLATURE</AppText>
                                <TextInput
                                    style={styles.institutionalInput}
                                    value={resultName}
                                    onChangeText={setResultName}
                                    placeholder="E.G. COMPLETE BLOOD COUNT RESULTS..."
                                    placeholderTextColor={Theme.Colors.divider}
                                />
                            </View>

                            <View style={{ marginTop: 24 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" style={styles.inputLabel}>ANALYSIS OBSERVATIONS</AppText>
                                <TextInput
                                    style={[styles.institutionalInput, { height: 120, textAlignVertical: 'top', paddingTop: 20 }]}
                                    value={resultNotes}
                                    onChangeText={setResultNotes}
                                    placeholder="APPEND SPECIALIZED CLINICAL FINDINGS..."
                                    placeholderTextColor={Theme.Colors.divider}
                                    multiline
                                />
                            </View>

                            <AppButton
                                title="COMMIT ASSET TO VAULT"
                                loading={uploading}
                                disabled={!resultFile || !resultName}
                                onPress={handleUploadResult}
                                style={{ marginTop: 40, height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text }}
                            />
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24, paddingTop: 16 },
    statusSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    statusStrip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 10 },
    statusIndicator: { width: 8, height: 8, borderRadius: 4 },

    patientLedger: { borderRadius: 32, marginBottom: 24 },
    ledgerHeader: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    identityAvatar: { width: 60, height: 60, borderRadius: 24, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    commBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    horizontalDivider: { height: 1, backgroundColor: Theme.Colors.divider },
    metaLedger: { flexDirection: 'row', padding: 20 },
    metaCell: { flex: 1, flexDirection: 'row', alignItems: 'center' },

    intakeAsset: { marginBottom: 32, backgroundColor: Theme.Colors.primary + '05', borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.primary + '15' },
    assetPadding: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    assetIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
    viewIndicator: { backgroundColor: Theme.Colors.primary + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },

    terminalSection: { marginBottom: 32 },
    terminalLabel: { fontSize: 8, letterSpacing: 1, marginBottom: 16, marginLeft: 4 },
    matrixContainer: { borderRadius: 32 },
    matrixRow: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    matrixDivider: { borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    catBadge: { alignSelf: 'flex-start', backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    valTag: { backgroundColor: Theme.Colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Theme.Colors.divider },

    outputRow: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    outputIconBg: { width: 44, height: 44, borderRadius: 16, backgroundColor: Theme.Colors.success + '08', justifyContent: 'center', alignItems: 'center' },

    terminalFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: Theme.Colors.background, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    btnCluster: { flexDirection: 'row' },
    primaryAction: { height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Theme.Colors.background, borderTopLeftRadius: 40, borderTopRightRadius: 40, height: '92%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 32, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    closeBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center' },
    intakeZone: { alignItems: 'center', padding: 48, borderRadius: 36, borderStyle: 'dashed', borderWidth: 2, borderColor: Theme.Colors.divider, backgroundColor: Theme.Colors.surface },
    intakeZoneActive: { borderColor: Theme.Colors.success, backgroundColor: Theme.Colors.success + '03' },
    intakeIconBg: { width: 80, height: 80, borderRadius: 28, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    inputLabel: { fontSize: 8, letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
    institutionalInput: { backgroundColor: Theme.Colors.surface, borderRadius: 20, padding: 24, fontSize: 16, fontWeight: 'bold', color: Theme.Colors.text, borderWidth: 1, borderColor: Theme.Colors.divider },
});

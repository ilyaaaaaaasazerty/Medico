import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { labApi } from '@/services/lab.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

interface LabRequestDetail {
    id: string;
    labCenter: { name: string; address: string; phone: string };
    patient: { firstName: string; lastName: string };
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    prescriptionUrl?: string;
    items: { id: string; test: { name: string; category: string; price: number } }[];
    results: { id: string; fileName: string; fileUrl: string }[];
    createdAt: string;
}

const statusColors: Record<string, string> = {
    PENDING: Theme.Colors.warning,
    CONFIRMED: Theme.Colors.primary,
    SAMPLE_COLLECTED: Theme.Colors.primary,
    IN_PROGRESS: Theme.Colors.primary,
    COMPLETED: Theme.Colors.success,
    CANCELLED: Theme.Colors.error,
};

export default function LabRequestDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState<LabRequestDetail | null>(null);
    const [cancelling, setCancelling] = useState(false);

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
            console.error('Error loading clinical report archive:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        }).toUpperCase();
    };

    const handleCancel = async () => {
        Alert.alert(
            'PROTOCOL TERMINATION',
            'Authorized clinical engagements cancellation will trigger a liquidity audit. Proceed with revocation?',
            [
                { text: 'ABORT', style: 'cancel' },
                {
                    text: 'REVOKE ENGAGEMENT',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelling(true);
                        try {
                            const res = await labApi.cancelLabRequest(id!);
                            if (res.success) {
                                Alert.alert('REVOKED', `Engagement terminated. Funds restored: ${res.data?.refundAmount || 0} DZD.`);
                                loadRequest();
                            }
                        } catch (error: any) {
                            Alert.alert('ERROR', error.message || 'Revocation protocol failed.');
                        } finally {
                            setCancelling(false);
                        }
                    },
                },
            ]
        );
    };

    const handleViewResult = (fileUrl: string, title: string = 'Document') => {
        router.push({
            pathname: '/(app)/document-viewer',
            params: { url: fileUrl, title }
        });
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (!request) return null;

    const currentStatus = statusColors[request.status] || Theme.Colors.textSecondary;
    const canCancel = ['PENDING', 'CONFIRMED'].includes(request.status);

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Report Archive</AppText>
                <TouchableOpacity style={styles.circleBtn}>
                    <Ionicons name="print-outline" size={20} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Status Header */}
                <View style={styles.statusSection}>
                    <View style={[styles.statusBadge, { backgroundColor: currentStatus + '15' }]}>
                        <AppText variant="caption" weight="black" style={{ color: currentStatus }}>STATUS: {request.status.replace('_', ' ')}</AppText>
                    </View>
                    <AppText variant="caption" color="textSecondary" weight="black" style={{ marginTop: 8 }}>ENGAGEMENT ID: {request.id.slice(0, 12).toUpperCase()}</AppText>
                </View>

                {/* Institution Card */}
                <AppCard padding="lg" style={styles.card}>
                    <AppText variant="caption" color="textSecondary" weight="black" style={styles.cardLabel}>INSTITUTIONAL ORIGIN</AppText>
                    <View style={styles.infoRow}>
                        <View style={styles.miniIcon}>
                            <Ionicons name="business" size={18} color={Theme.Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText variant="body" weight="black">{request.labCenter.name.toUpperCase()}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 2 }}>{request.labCenter.address}</AppText>
                        </View>
                    </View>
                </AppCard>

                {/* Temporal Card */}
                <AppCard padding="lg" style={styles.card}>
                    <AppText variant="caption" color="textSecondary" weight="black" style={styles.cardLabel}>TEMPORAL DATA</AppText>
                    <View style={styles.infoRow}>
                        <View style={styles.miniIcon}>
                            <Ionicons name="calendar-clear" size={18} color={Theme.Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText variant="body" weight="black">{formatDate(request.scheduledDate)}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 2 }}>SLOT PRECISION: {request.scheduledTime}</AppText>
                        </View>
                    </View>
                </AppCard>

                {/* Diagnostic Results Section */}
                {request.results?.length > 0 && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="textSecondary" weight="black" style={styles.sectionLabel}>CERTIFIED DIAGNOSTIC ASSETS</AppText>
                        {request.results.map(result => (
                            <AppCard key={result.id} padding="md" style={styles.assetCard} onPress={() => handleViewResult(result.fileUrl, result.fileName)}>
                                <View style={styles.assetContent}>
                                    <View style={styles.assetIcon}>
                                        <Ionicons name="ribbon" size={20} color={Theme.Colors.success} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 16 }}>
                                        <AppText variant="body" weight="black" uppercase>{result.fileName}</AppText>
                                        <AppText variant="caption" color="textSecondary" weight="bold">SECURE PDF VERIFIED</AppText>
                                    </View>
                                    <Ionicons name="download-outline" size={20} color={Theme.Colors.primary} />
                                </View>
                            </AppCard>
                        ))}
                    </View>
                )}

                {/* Parameter Matrix */}
                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" style={styles.sectionLabel}>PARAMETER MATRIX</AppText>
                    <AppCard padding="none" style={styles.matrixCard}>
                        {request.items.map((item, idx) => (
                            <View key={item.id} style={[styles.matrixRow, idx < request.items.length - 1 && styles.matrixDivider]}>
                                <View style={{ flex: 1 }}>
                                    <AppText variant="body" weight="black" uppercase>{item.test.name}</AppText>
                                    <AppText variant="caption" color="textSecondary" weight="bold">{item.test.category}</AppText>
                                </View>
                                <AppText variant="body" weight="black" color="primary">{item.test.price} DZD</AppText>
                            </View>
                        ))}
                    </AppCard>
                </View>

                {/* Prescription Asset */}
                {request.prescriptionUrl && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="textSecondary" weight="black" style={styles.sectionLabel}>PREREQUISITE PROTOCOL</AppText>
                        <AppCard padding="md" style={styles.assetCard} onPress={() => handleViewResult(request.prescriptionUrl!, 'Clinical Prescription')}>
                            <View style={styles.assetContent}>
                                <View style={[styles.assetIcon, { backgroundColor: Theme.Colors.primary + '10' }]}>
                                    <Ionicons name="document-attach" size={20} color={Theme.Colors.primary} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <AppText variant="body" weight="black">ORIGINAL PRESCRIPTION</AppText>
                                    <AppText variant="caption" color="textSecondary" weight="bold">AUTHORIZED ASSET</AppText>
                                </View>
                                <Ionicons name="eye-outline" size={20} color={Theme.Colors.primary} />
                            </View>
                        </AppCard>
                    </View>
                )}

                {/* Revocation Terminal */}
                {canCancel && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={cancelling}>
                        {cancelling ? (
                            <ActivityIndicator size="small" color={Theme.Colors.error} />
                        ) : (
                            <>
                                <Ionicons name="alert-circle-outline" size={18} color={Theme.Colors.error} />
                                <AppText variant="caption" weight="black" style={{ color: Theme.Colors.error, marginLeft: 8 }}>REVOKE ENGAGEMENT PROTOCOL</AppText>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                <View style={{ height: 60 }} />
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24, paddingTop: 8 },
    statusSection: { alignItems: 'center', marginBottom: 32 },
    statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },

    card: { borderRadius: 28, marginBottom: 16 },
    cardLabel: { fontSize: 8, letterSpacing: 1, marginBottom: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    miniIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider, marginRight: 16 },

    section: { marginBottom: 32 },
    sectionLabel: { fontSize: 9, marginBottom: 16, letterSpacing: 1 },

    assetCard: { borderRadius: 20, marginBottom: 12 },
    assetContent: { flexDirection: 'row', alignItems: 'center' },
    assetIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.success + '10', justifyContent: 'center', alignItems: 'center' },

    matrixCard: { borderRadius: 24 },
    matrixRow: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    matrixDivider: { borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },

    cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: Theme.Colors.error + '08', borderRadius: 20, borderWidth: 1, borderColor: Theme.Colors.error + '20' },
});

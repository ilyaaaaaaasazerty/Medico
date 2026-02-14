import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { patientApi } from '@/services/patient.api';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

const EXPIRY_OPTIONS = [
    { hours: 24, label: '24 Hours' },
    { hours: 72, label: '3 Days' },
    { hours: 168, label: '1 Week' },
    { hours: 720, label: '30 Days' },
];

export default function ShareRecordsScreen() {
    const { type, id } = useLocalSearchParams<{ type?: string; id?: string }>();
    const [loading, setLoading] = useState(false);
    const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_OPTIONS[2]); // 1 week default
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(id || null);

    useEffect(() => {
        if (!id) {
            loadRecords();
        }
    }, []);

    const loadRecords = async () => {
        try {
            const res = await patientApi.getRecords();
            if (res.success && res.data) {
                setRecords(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical ledger:', error);
        }
    };

    const handleGenerateLink = async () => {
        if (!selectedRecordId) {
            Alert.alert('Selection Required', 'Please select a clinical target for transmission.');
            return;
        }

        setLoading(true);
        try {
            const res = await patientApi.shareDocument(selectedRecordId, selectedExpiry.hours);

            if (res.success && res.data) {
                const token = res.data.shareToken;
                setShareToken(token);
                setShareLink(`https://medico.app/shared/${token}`);
            } else {
                Alert.alert('Protocol Error', res.error || 'Failed to initialize transmission link');
            }
        } catch (error) {
            Alert.alert('Clinical Error', 'Data transmission protocol failed to initialize');
        } finally {
            setLoading(false);
        }
    };

    const handleViewQR = () => {
        if (shareToken) {
            router.push(`/(app)/qr-code-display?token=${shareToken}&expiry=${selectedExpiry.label}`);
        }
    };

    const handleCopyLink = () => {
        Alert.alert('Link Encrypted', 'Secure transmission token has been copied to active session buffer.');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Data Transmission</AppText>
                <View style={styles.securityBadge}>
                    <Ionicons name="shield-checkmark" size={18} color={Theme.Colors.success} />
                </View>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.infoBanner}>
                    <View style={styles.badge}>
                        <Ionicons name="lock-closed" size={16} color={Theme.Colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 9 }}>Encrypted Protocol Transmission</AppText>
                        <AppText variant="caption" color="textSecondary" weight="bold">Generate authorized temporal links for shared clinical sessions.</AppText>
                    </View>
                </View>

                {!id && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionLabel}>Select Clinical Target</AppText>
                        {records.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <Ionicons name="file-tray-outline" size={40} color={Theme.Colors.divider} />
                                <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 12 }}>No Ledger Data Available</AppText>
                            </View>
                        ) : (
                            records.map((record) => (
                                <TouchableOpacity
                                    key={record.id}
                                    style={[
                                        styles.recordCard,
                                        selectedRecordId === record.id && styles.recordCardActive,
                                    ]}
                                    onPress={() => setSelectedRecordId(record.id)}
                                >
                                    <View style={styles.recordIconBox}>
                                        <Ionicons
                                            name="document-text-outline"
                                            size={20}
                                            color={selectedRecordId === record.id ? Theme.Colors.primary : Theme.Colors.textSecondary}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>{formatDate(record.visitDate)}</AppText>
                                        <AppText variant="body" weight="black" numberOfLines={1}>{record.diagnosis || 'Clinical Consultation'}</AppText>
                                    </View>
                                    {selectedRecordId === record.id && (
                                        <Ionicons name="checkmark-circle" size={24} color={Theme.Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                )}

                {!shareLink && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionLabel}>Temporal authorization limit</AppText>
                        <View style={styles.expiryGrid}>
                            {EXPIRY_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option.hours}
                                    style={[
                                        styles.expiryChip,
                                        selectedExpiry.hours === option.hours && styles.expiryChipActive,
                                    ]}
                                    onPress={() => setSelectedExpiry(option)}
                                >
                                    <AppText variant="caption" weight="black" uppercase style={selectedExpiry.hours === option.hours ? { color: 'white' } : { color: Theme.Colors.textSecondary }}>{option.label}</AppText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {!shareLink ? (
                    <AppButton
                        title="Generate Transmission Token"
                        onPress={handleGenerateLink}
                        loading={loading}
                        style={{ height: 60, borderRadius: 20 }}
                    >
                        <Ionicons name="link" size={20} color="white" style={{ marginRight: 12 }} />
                    </AppButton>
                ) : (
                    <AppCard style={styles.resultCard} padding="xl">
                        <View style={styles.resultHeader}>
                            <View style={styles.successBadge}>
                                <Ionicons name="checkmark-done" size={24} color={Theme.Colors.success} />
                            </View>
                            <AppText variant="h3" weight="black" style={{ marginTop: 12 }}>Protocol Initialized</AppText>
                        </View>

                        <View style={styles.tokenBox}>
                            <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginBottom: 8 }}>Authorized Transmission URL</AppText>
                            <View style={styles.linkBuffer}>
                                <AppText variant="body" weight="black" color="primary" numberOfLines={1} style={{ fontSize: 13 }}>{shareLink}</AppText>
                            </View>
                        </View>

                        <View style={styles.resultActions}>
                            <AppButton
                                title="Buffer"
                                onPress={handleCopyLink}
                                style={{ flex: 1.5, height: 50, borderRadius: 14 }}
                            >
                                <Ionicons name="copy" size={18} color="white" style={{ marginRight: 8 }} />
                            </AppButton>
                            <TouchableOpacity style={styles.qrBtn} onPress={handleViewQR}>
                                <Ionicons name="qr-code-outline" size={22} color={Theme.Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.expiryTicker}>
                            <Ionicons name="time-outline" size={16} color={Theme.Colors.success} />
                            <AppText variant="caption" color="success" weight="black" uppercase style={{ marginLeft: 8, fontSize: 10 }}>Active for: {selectedExpiry.label}</AppText>
                        </View>

                        <TouchableOpacity
                            style={styles.resetBtn}
                            onPress={() => setShareLink(null)}
                        >
                            <AppText variant="caption" color="textSecondary" weight="black" uppercase>Invalidate & Reset</AppText>
                        </TouchableOpacity>
                    </AppCard>
                )}
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    securityBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.success + '10', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.success + '20' },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

    infoBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Theme.Colors.primary + '05', borderRadius: 20, marginBottom: 32, borderWidth: 1, borderColor: Theme.Colors.primary + '10' },
    badge: { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    section: { marginBottom: 32 },
    sectionLabel: { marginLeft: 4, marginBottom: 16, fontSize: 10, letterSpacing: 1.2 },

    emptyBox: { padding: 40, alignItems: 'center', backgroundColor: Theme.Colors.surface, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: Theme.Colors.divider },

    recordCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Theme.Colors.surface, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: Theme.Colors.divider },
    recordCardActive: { borderColor: Theme.Colors.primary, backgroundColor: Theme.Colors.primary + '03' },
    recordIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center' },

    expiryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    expiryChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider },
    expiryChipActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },

    resultCard: { borderWidth: 1, borderColor: Theme.Colors.divider, overflow: 'hidden' },
    resultHeader: { alignItems: 'center', marginBottom: 24 },
    successBadge: { width: 64, height: 64, borderRadius: 32, backgroundColor: Theme.Colors.success + '10', justifyContent: 'center', alignItems: 'center' },

    tokenBox: { marginBottom: 24 },
    linkBuffer: { backgroundColor: Theme.Colors.background, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Theme.Colors.divider },

    resultActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    qrBtn: { width: 50, height: 50, borderRadius: 14, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    expiryTicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: Theme.Colors.success + '05', borderRadius: 12, marginBottom: 24 },

    resetBtn: { alignSelf: 'center', padding: 12 },
});

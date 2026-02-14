import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Alert, Image, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doctorApi } from '@/services/doctor.api';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { LinearGradient } from 'expo-linear-gradient';

interface Prescription {
    id: string;
    diagnosis?: string;
    instructions?: string;
    temporarySignature?: string;
    createdAt: string;
    items: Array<{
        medication: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
        quantity?: number;
    }>;
    doctor?: {
        user?: {
            firstName: string;
            lastName: string;
        };
    };
}

export default function PrescriptionPreviewScreen() {
    const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();
    const [loading, setLoading] = useState(true);
    const [prescription, setPrescription] = useState<Prescription | null>(null);

    useEffect(() => {
        if (data) {
            try {
                const parsed = JSON.parse(data);
                setPrescription({
                    ...parsed,
                    createdAt: new Date().toISOString(),
                    id: 'PREVIEW',
                });
                setLoading(false);
            } catch (e) {
                console.error('Error parsing preview data', e);
                setLoading(false);
            }
        } else if (id) {
            loadPrescription();
        } else {
            setLoading(false);
        }
    }, [id, data]);

    const loadPrescription = async () => {
        if (!id) return;
        try {
            const res = await doctorApi.getPrescription(id);
            if (res.success && res.data) {
                setPrescription(res.data);
            }
        } catch (error) {
            console.error('Error loading prescription:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleGeneratePDF = async () => {
        if (!id || id === 'PREVIEW') {
            Alert.alert('Preview Restricted', 'Requisition must be finalized before generating formal transcript.');
            return;
        }
        try {
            const url = await doctorApi.getPrescriptionPDF(id);
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert('System Error', 'Failed to generate official clinical transcript');
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (!prescription) {
        return (
            <AppScreen padding={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                        <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                    <AppText variant="h3" weight="black">Transcript Preview</AppText>
                    <View style={{ width: 44 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconBox}>
                        <Ionicons name="document-text-outline" size={64} color={Theme.Colors.divider} />
                    </View>
                    <AppText variant="body" color="textSecondary" weight="bold">Protocol Specification Not Found</AppText>
                </View>
            </AppScreen>
        );
    }

    const doctorName = prescription.doctor?.user
        ? `Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`
        : 'Medical Professional';

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Transcript Preview</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.paper}>
                    <LinearGradient
                        colors={['#FFFFFF', '#F9FAFB']}
                        style={styles.paperGradient}
                    >
                        {/* Watermark/Logo */}
                        <View style={styles.watermark}>
                            <Ionicons name="medical" size={140} color={Theme.Colors.primary + '03'} />
                        </View>

                        {/* Rx Header */}
                        <View style={styles.paperHeader}>
                            <View style={styles.rxBadge}>
                                <AppText variant="h2" color="textInverted" weight="black">{doctorName?.[0] || 'D'}</AppText>
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <AppText variant="h3" weight="black">Dr. {doctorName}</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">LICENSED PRESCRIBER</AppText>
                                <View style={styles.dateRow}>
                                    <Ionicons name="calendar-outline" size={12} color={Theme.Colors.textSecondary} />
                                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ marginLeft: 6, fontSize: 10 }}>{formatDate(prescription.createdAt)}</AppText>
                                </View>
                            </View>
                        </View>

                        {/* Practitioner Info */}
                        <View style={styles.paperSection}>
                            <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.paperLabel}>Authorized Practitioner</AppText>
                            <AppText variant="body" weight="black" style={{ fontSize: 16 }}>{doctorName}</AppText>
                        </View>

                        {/* Clinical Indication */}
                        {prescription.diagnosis && (
                            <View style={styles.paperSection}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.paperLabel}>Primary Indication</AppText>
                                <View style={styles.indicationBox}>
                                    <AppText variant="body" weight="bold" style={{ fontSize: 14 }}>{prescription.diagnosis}</AppText>
                                </View>
                            </View>
                        )}

                        {/* Medication Regimen */}
                        <View style={styles.paperSection}>
                            <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.paperLabel}>Therapeutic Regimen</AppText>
                            {prescription.items.map((item, index) => (
                                <View key={index} style={styles.medItem}>
                                    <View style={styles.medItemHeader}>
                                        <View style={styles.medIndex}>
                                            <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 10 }}>{index + 1}</AppText>
                                        </View>
                                        <AppText variant="body" weight="black" style={{ flex: 1, marginHorizontal: 12 }}>{item.medication}</AppText>
                                        <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 10 }}>{item.dosage}</AppText>
                                    </View>
                                    <View style={styles.medDetails}>
                                        <View style={styles.detailItem}>
                                            <Ionicons name="repeat-outline" size={12} color={Theme.Colors.textSecondary} />
                                            <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 4 }}>{item.frequency}</AppText>
                                        </View>
                                        <View style={styles.detailItem}>
                                            <Ionicons name="time-outline" size={12} color={Theme.Colors.textSecondary} />
                                            <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 4 }}>{item.duration}</AppText>
                                        </View>
                                        {item.quantity && (
                                            <View style={styles.detailItem}>
                                                <Ionicons name="layers-outline" size={12} color={Theme.Colors.textSecondary} />
                                                <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 4 }}>Qty: {item.quantity}</AppText>
                                            </View>
                                        )}
                                    </View>
                                    {item.instructions && (
                                        <View style={styles.medInstructionBox}>
                                            <AppText variant="caption" color="textSecondary" italic style={{ fontSize: 11 }}>
                                                <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 11 }}>PROTOCOL NOTE: </AppText>
                                                {item.instructions}
                                            </AppText>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* General Narrative */}
                        {prescription.instructions && (
                            <View style={styles.paperSection}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.paperLabel}>Instructional Narrative</AppText>
                                <AppText variant="body" color="textSecondary" italic style={{ fontSize: 14, lineHeight: 22 }}>{prescription.instructions}</AppText>
                            </View>
                        )}

                        {/* Authorization Checkpoint */}
                        <View style={styles.authCheckpoint}>
                            <View style={styles.signatureContainer}>
                                {prescription.temporarySignature ? (
                                    <Image
                                        source={{ uri: prescription.temporarySignature }}
                                        style={styles.signatureImage}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View style={styles.signaturePlaceholder} />
                                )}
                                <View style={styles.signatureLine} />
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Practitioner Authorization</AppText>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Secure Portals Action Hub */}
                <View style={styles.actionHub}>
                    <AppButton
                        title="Generate Authorization PDF"
                        onPress={handleGeneratePDF}
                        loading={false}
                        style={{ height: 64, borderRadius: 24 }}
                    >
                        <Ionicons name="document-text" size={20} color="white" style={{ marginRight: 12 }} />
                    </AppButton>

                    <View style={styles.secondaryPortals}>
                        <TouchableOpacity style={styles.portalBtn} onPress={handleGeneratePDF}>
                            <Ionicons name="print-outline" size={20} color={Theme.Colors.primary} />
                            <AppText variant="caption" color="primary" weight="black" uppercase style={{ marginLeft: 10, fontSize: 11 }}>Finalize & Print</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.portalBtn} onPress={() => Alert.alert('Secure Routing', 'Opening encrypted transmission portal...')}>
                            <Ionicons name="share-social-outline" size={20} color={Theme.Colors.primary} />
                            <AppText variant="caption" color="primary" weight="black" uppercase style={{ marginLeft: 10, fontSize: 11 }}>Encrypted Route</AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 40 }} />
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

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Theme.Colors.divider },

    paper: { backgroundColor: '#FFF', borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: Theme.Colors.divider, ...Theme.Shadows.large },
    paperGradient: { padding: 32, minHeight: 650 },
    watermark: { position: 'absolute', top: 120, right: -30, opacity: 0.8 },

    paperHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    rxBadge: { width: 56, height: 56, backgroundColor: Theme.Colors.primary, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },

    paperSection: { marginBottom: 32 },
    paperLabel: { marginBottom: 8, letterSpacing: 2, fontSize: 9 },
    indicationBox: { backgroundColor: Theme.Colors.primary + '05', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: Theme.Colors.primary },

    medItem: { backgroundColor: '#F9FAFB', padding: 20, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: Theme.Colors.divider },
    medItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    medIndex: { width: 24, height: 24, borderRadius: 8, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    medDetails: { flexDirection: 'row', gap: 16, marginLeft: 36 },
    detailItem: { flexDirection: 'row', alignItems: 'center' },
    medInstructionBox: { marginLeft: 36, marginTop: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },

    authCheckpoint: { marginTop: 40, alignItems: 'flex-end' },
    signatureContainer: { width: 200, alignItems: 'center' },
    signatureImage: { width: 160, height: 64, marginBottom: 8 },
    signaturePlaceholder: { height: 64 },
    signatureLine: { width: '100%', height: 1, backgroundColor: Theme.Colors.text, marginBottom: 8 },

    actionHub: { marginTop: 32, gap: 16 },
    secondaryPortals: { flexDirection: 'row', gap: 12 },
    portalBtn: { flex: 1, height: 56, backgroundColor: Theme.Colors.primary + '08', borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.Colors.primary + '15' },
});

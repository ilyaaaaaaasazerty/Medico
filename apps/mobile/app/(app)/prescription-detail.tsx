import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { patientApi } from '@/services/patient.api';
import { doctorApi } from '@/services/doctor.api';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { LinearGradient } from 'expo-linear-gradient';

interface PrescriptionItem {
    id: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity?: number;
}

interface Prescription {
    id: string;
    diagnosis?: string;
    instructions?: string;
    pdfUrl?: string;
    validUntil?: string;
    createdAt: string;
    items: PrescriptionItem[];
    doctor?: {
        id?: string;
        user?: {
            firstName: string;
            lastName: string;
        };
        specialty?: {
            name: string;
        };
    };
}

export default function PrescriptionDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [prescription, setPrescription] = useState<Prescription | null>(null);

    useEffect(() => {
        loadPrescription();
    }, [id]);

    const loadPrescription = async () => {
        if (!id) return;
        try {
            const res = user?.role === 'DOCTOR'
                ? await doctorApi.getPrescriptionById(id)
                : await patientApi.getPrescriptionById(id);
            if (res.success && res.data) {
                setPrescription(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical script:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!id) return;
        try {
            const url = user?.role === 'DOCTOR'
                ? await doctorApi.getPrescriptionPDF(id)
                : await patientApi.getPrescriptionPDF(id);
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert('System Error', 'Failed to generate official prescription transcript');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
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

    if (!prescription) return null;

    const doctorName = prescription.doctor?.user
        ? `Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`
        : 'Medical Professional';

    const isValid = !prescription.validUntil || new Date(prescription.validUntil) > new Date();

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Protocol Specification</AppText>
                <TouchableOpacity onPress={handleDownloadPDF} style={[styles.circleBtn, { backgroundColor: Theme.Colors.primary + '10', borderColor: Theme.Colors.primary + '20' }]}>
                    <Ionicons name="download-outline" size={22} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={[Theme.Colors.primary + '15', Theme.Colors.surface]}
                    style={styles.doctorHeader}
                >
                    <View style={styles.rxBadge}>
                        <AppText variant="h1" color="white" weight="black" style={{ fontSize: 28 }}>Rx</AppText>
                    </View>
                    <View style={{ flex: 1, marginLeft: 20 }}>
                        <AppText variant="h3" weight="black">{doctorName}</AppText>
                        {prescription.doctor?.specialty && (
                            <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 10 }}>{prescription.doctor.specialty.name}</AppText>
                        )}
                        <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={12} color={Theme.Colors.textSecondary} />
                            <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 6 }}>ISSUED: {formatDate(prescription.createdAt)}</AppText>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.validityContainer}>
                    <View style={[styles.validityBanner, !isValid && styles.invalidBanner]}>
                        <Ionicons name={isValid ? "shield-checkmark" : "warning"} size={18} color={isValid ? Theme.Colors.success : Theme.Colors.error} />
                        <View style={{ marginLeft: 12 }}>
                            <AppText variant="caption" color={isValid ? "success" : "error"} weight="black" uppercase style={{ fontSize: 10 }}>
                                {isValid ? "Authorized Protocol" : "Protocol Expired"}
                            </AppText>
                            {prescription.validUntil && (
                                <AppText variant="caption" color="textSecondary" weight="bold">{isValid ? 'Valid until' : 'Expired on'} {formatDate(prescription.validUntil)}</AppText>
                            )}
                        </View>
                    </View>
                </View>

                {prescription.diagnosis && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Clinical Indication</AppText>
                        <AppCard padding="md" style={styles.diagnosisCard}>
                            <AppText variant="body" weight="bold">{prescription.diagnosis}</AppText>
                        </AppCard>
                    </View>
                )}

                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Medication Protocol ({prescription.items.length})</AppText>
                    {prescription.items.map((item, index) => (
                        <AppCard key={item.id || index} style={styles.medCard} padding="md">
                            <View style={styles.medHeader}>
                                <View style={styles.medIndex}>
                                    <AppText variant="caption" color="primary" weight="black">{index + 1}</AppText>
                                </View>
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <AppText variant="body" weight="black">{item.medication}</AppText>
                                    <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 10 }}>{item.dosage}</AppText>
                                </View>
                            </View>

                            <View style={styles.medDivider} />

                            <View style={styles.medInfoGrid}>
                                <View style={styles.infoCol}>
                                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ fontSize: 9 }}>FREQUENCY</AppText>
                                    <AppText variant="body" weight="black" style={{ fontSize: 13 }}>{item.frequency}</AppText>
                                </View>
                                <View style={styles.infoCol}>
                                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ fontSize: 9 }}>DURATION</AppText>
                                    <AppText variant="body" weight="black" style={{ fontSize: 13 }}>{item.duration}</AppText>
                                </View>
                                {item.quantity && (
                                    <View style={styles.infoCol}>
                                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ fontSize: 9 }}>TOTAL QTY</AppText>
                                        <AppText variant="body" weight="black" style={{ fontSize: 13 }}>{item.quantity} Units</AppText>
                                    </View>
                                )}
                            </View>

                            {item.instructions && (
                                <View style={styles.instructionBox}>
                                    <Ionicons name="information-circle" size={14} color={Theme.Colors.primary} />
                                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 8, flex: 1, fontSize: 11 }}>{item.instructions}</AppText>
                                </View>
                            )}
                        </AppCard>
                    ))}
                </View>

                {prescription.instructions && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Instructional Narrative</AppText>
                        <AppCard padding="md" style={styles.narrativeCard}>
                            <AppText variant="body" color="textSecondary" style={{ lineHeight: 22, fontSize: 14 }}>{prescription.instructions}</AppText>
                        </AppCard>
                    </View>
                )}

                <View style={styles.footerActions}>
                    <AppButton
                        title="Secure Share"
                        variant="tonal"
                        onPress={() => router.push({ pathname: '/(app)/share-records', params: { type: 'prescription', id: prescription.id } })}
                        style={{ height: 60, borderRadius: 20, flex: 1 }}
                    >
                        <Ionicons name="share-social-outline" size={20} color={Theme.Colors.primary} style={{ marginRight: 8 }} />
                    </AppButton>
                    <View style={{ width: 12 }} />
                    <AppButton
                        title="View Transcript"
                        onPress={handleDownloadPDF}
                        style={{ height: 60, borderRadius: 20, flex: 1 }}
                    >
                        <Ionicons name="document-text" size={20} color="white" style={{ marginRight: 8 }} />
                    </AppButton>
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

    scrollContent: { paddingHorizontal: 24 },
    doctorHeader: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 32, marginBottom: 20, borderWidth: 1, borderColor: Theme.Colors.divider },
    rxBadge: { width: 64, height: 64, backgroundColor: Theme.Colors.primary, borderRadius: 20, justifyContent: 'center', alignItems: 'center', ...Theme.Shadows.medium },
    dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },

    validityContainer: { marginBottom: 32 },
    validityBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.success + '05', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.success + '15' },
    invalidBanner: { backgroundColor: Theme.Colors.error + '05', borderColor: Theme.Colors.error + '15' },

    section: { marginBottom: 32 },
    sectionTitle: { marginBottom: 12, letterSpacing: 1 },
    diagnosisCard: { borderLeftWidth: 4, borderLeftColor: Theme.Colors.primary },

    medCard: { marginBottom: 16, borderWidth: 1, borderColor: Theme.Colors.divider },
    medHeader: { flexDirection: 'row', alignItems: 'center' },
    medIndex: { width: 32, height: 32, borderRadius: 10, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    medDivider: { height: 1, backgroundColor: Theme.Colors.divider, marginVertical: 16 },
    medInfoGrid: { flexDirection: 'row', gap: 16 },
    infoCol: { flex: 1 },
    instructionBox: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 12, backgroundColor: Theme.Colors.background, borderRadius: 12 },

    narrativeCard: { backgroundColor: Theme.Colors.background, borderStyle: 'dashed', borderWidth: 1, borderColor: Theme.Colors.divider },
    footerActions: { flexDirection: 'row', marginTop: 8 },
});

import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { Ionicons } from '@expo/vector-icons';

interface VerificationStep {
    id: string;
    title: string;
    status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
    description: string;
    rejectionReason?: string;
}

export default function DoctorVerificationStatusScreen() {
    const [loading, setLoading] = useState(true);
    const [steps, setSteps] = useState<VerificationStep[]>([]);
    const [overallStatus, setOverallStatus] = useState<'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'>('PENDING');

    useEffect(() => {
        loadVerificationStatus();
    }, []);

    const loadVerificationStatus = async () => {
        try {
            // Mocking verification stream for high-density UI
            const mockSteps: VerificationStep[] = [
                {
                    id: '1',
                    title: 'Primary Identification',
                    status: 'APPROVED',
                    description: 'Legal nomenclature and identity synchronization',
                },
                {
                    id: '2',
                    title: 'Clinical Licensure',
                    status: 'IN_REVIEW',
                    description: 'Medical license authorization and validity audit',
                },
                {
                    id: '3',
                    title: 'Academic Pedigree',
                    status: 'PENDING',
                    description: 'Verification of conferred degrees and certifications',
                },
                {
                    id: '4',
                    title: 'Specialty Accreditation',
                    status: 'PENDING',
                    description: 'Board certification and specialized clinical domains',
                },
                {
                    id: '5',
                    title: 'Vault Asset Verification',
                    status: 'PENDING',
                    description: 'Integrity check for uploaded clinical documents',
                },
            ];

            setSteps(mockSteps);
            setOverallStatus('IN_REVIEW');
        } catch (error) {
            console.error('Error loading verification protocol:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'APPROVED': return { color: Theme.Colors.success, icon: 'shield-checkmark', label: 'Authorized' };
            case 'IN_REVIEW': return { color: Theme.Colors.warning, icon: 'time', label: 'Under Institutional Audit' };
            case 'REJECTED': return { color: Theme.Colors.error, icon: 'alert-circle', label: 'Registry Deficiency' };
            default: return { color: Theme.Colors.divider, icon: 'ellipse-outline', label: 'Await Protocol Initiation' };
        }
    };

    const getOverallTelemetry = () => {
        switch (overallStatus) {
            case 'APPROVED':
                return {
                    icon: 'ribbon',
                    title: 'Authorization Finalized',
                    message: 'Practitioner identity has been fully verified. Clinical sessions are now authorized.',
                    color: Theme.Colors.success,
                };
            case 'IN_REVIEW':
                return {
                    icon: 'file-tray-full',
                    title: 'Audit Protocol Active',
                    message: 'Institutional oversight is currently auditing provided assets. Estimated latency: 48-72 hours.',
                    color: Theme.Colors.warning,
                };
            case 'REJECTED':
                return {
                    icon: 'warning',
                    title: 'Action Protocol Required',
                    message: 'Verification deficiencies detected in one or more checkpoints. Immediate resolution required.',
                    color: Theme.Colors.error,
                };
            default:
                return {
                    icon: 'layers',
                    title: 'Awaiting Initiation',
                    message: 'Submit all required clinical assets to trigger the institutional verification protocol.',
                    color: Theme.Colors.textSecondary,
                };
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    const telemetry = getOverallTelemetry();

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Verification Monitor</AppText>
                <View style={[styles.statusPulse, { borderColor: telemetry.color + '40' }]}>
                    <View style={[styles.pulseDot, { backgroundColor: telemetry.color }]} />
                </View>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.telemetryBanner, { backgroundColor: telemetry.color + '05', borderColor: telemetry.color + '15' }]}>
                    <View style={[styles.iconFrame, { backgroundColor: telemetry.color + '10' }]}>
                        <Ionicons name={telemetry.icon as any} size={28} color={telemetry.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <AppText variant="h3" weight="black" style={{ color: telemetry.color }}>{telemetry.title}</AppText>
                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 4, lineHeight: 18 }}>{telemetry.message}</AppText>
                    </View>
                </View>

                <View style={styles.checkpointSection}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionLabel}>Operational Checkpoints</AppText>

                    {steps.map((step, index) => {
                        const status = getStatusTheme(step.status);
                        return (
                            <View key={step.id} style={styles.checkpointItem}>
                                <View style={styles.checkpointHeader}>
                                    <View style={[styles.circleIcon, { backgroundColor: status.color + '10' }]}>
                                        <Ionicons name={status.icon as any} size={18} color={status.color} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 16 }}>
                                        <AppText variant="body" weight="black">{step.title}</AppText>
                                        <AppText variant="caption" color="textSecondary" numberOfLines={1}>{step.description}</AppText>
                                    </View>
                                    <View style={[styles.statusTag, { backgroundColor: status.color + '08' }]}>
                                        <AppText variant="caption" style={{ color: status.color, fontSize: 8 }} weight="black" uppercase>{status.label}</AppText>
                                    </View>
                                </View>

                                {step.rejectionReason && (
                                    <View style={styles.deficiencyBox}>
                                        <AppText variant="caption" color="error" weight="black" uppercase style={{ fontSize: 9 }}>Deficiency Detected</AppText>
                                        <AppText variant="caption" color="error" italic style={{ marginTop: 4 }}>{step.rejectionReason}</AppText>
                                    </View>
                                )}

                                {index < steps.length - 1 && <View style={styles.connector} />}
                            </View>
                        );
                    })}
                </View>

                <AppCard style={styles.protocolCard} padding="md">
                    <View style={styles.cardHeader}>
                        <Ionicons name="information-circle" size={18} color={Theme.Colors.primary} />
                        <AppText variant="body" weight="black" style={{ marginLeft: 8 }}>Next Protocol Steps</AppText>
                    </View>
                    <View style={styles.infoList}>
                        {[
                            'Institutional audit involves document metadata verification.',
                            'Real-time updates delivered via practitioners encrypted terminal.',
                            'Standard latency remains 2-3 business days post-submission.',
                            'Restricted access to clinical sessions remains active.'
                        ].map((text, i) => (
                            <View key={i} style={styles.infoRow}>
                                <View style={styles.rowDot} />
                                <AppText variant="caption" color="textSecondary" weight="bold" style={{ flex: 1 }}>{text}</AppText>
                            </View>
                        ))}
                    </View>
                </AppCard>

                <View style={styles.actionHub}>
                    <AppButton
                        title="Update Clinical Assets"
                        onPress={() => router.push('/(app)/edit-doctor-profile')}
                        style={{ height: 60, borderRadius: 20 }}
                    >
                        <Ionicons name="cloud-upload" size={20} color="white" style={{ marginRight: 12 }} />
                    </AppButton>

                    <TouchableOpacity
                        style={styles.oversightBtn}
                        onPress={() => {/* support logic */ }}
                    >
                        <Ionicons name="shield-half" size={18} color={Theme.Colors.textSecondary} />
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ marginLeft: 10 }}>Engage Institutional Oversight</AppText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    statusPulse: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    pulseDot: { width: 8, height: 8, borderRadius: 4 },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

    telemetryBanner: { flexDirection: 'row', padding: 24, borderRadius: 24, borderWidth: 1, marginBottom: 40, marginTop: 10 },
    iconFrame: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    checkpointSection: { marginBottom: 40 },
    sectionLabel: { marginLeft: 4, marginBottom: 24, letterSpacing: 1.2, fontSize: 10 },

    checkpointItem: { marginBottom: 0 },
    checkpointHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    circleIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    connector: { width: 2, height: 24, backgroundColor: Theme.Colors.divider, marginLeft: 19, marginVertical: 4 },

    deficiencyBox: { marginLeft: 56, backgroundColor: Theme.Colors.error + '08', padding: 12, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: Theme.Colors.error, marginTop: 8 },

    protocolCard: { backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, marginBottom: 40 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    infoList: { gap: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    rowDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Theme.Colors.primary, marginTop: 8 },

    actionHub: { gap: 16 },
    oversightBtn: { height: 50, borderRadius: 16, borderWidth: 1, borderColor: Theme.Colors.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.Colors.surface },
});

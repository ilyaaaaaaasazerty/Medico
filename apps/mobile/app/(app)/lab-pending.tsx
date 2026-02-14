import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

export default function LabPendingScreen() {
    const router = useRouter();
    const { logout } = useAuth();

    const verificationSteps = [
        { id: 1, text: 'Regulatory License Verification', desc: 'Validating institutional certification and legal compliance matrix.' },
        { id: 2, text: 'Clinical Accreditation Review', desc: 'Ensuring facility adherence to international diagnostic standards.' },
        { id: 3, text: 'Hardware Telemetry Validation', desc: 'Confirming operational status of analysis instrumentation.' },
    ];

    return (
        <AppScreen padding={false}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <View style={styles.pulseContainer}>
                        <View style={styles.pulseRing} />
                        <View style={styles.iconBadge}>
                            <Ionicons name="flask" size={48} color={Theme.Colors.primary} />
                        </View>
                    </View>
                    <AppText variant="h2" weight="black" align="center">Verification Protocol</AppText>
                    <AppText variant="body" color="textSecondary" align="center" weight="bold" style={styles.subtitle}>
                        Our institutional compliance matrix is currently evaluating your laboratory credentials to ensure patient diagnostic safety.
                    </AppText>
                </View>

                <View style={styles.timelineBlock}>
                    {verificationSteps.map((step, idx) => (
                        <View key={step.id} style={styles.timelineItem}>
                            <View style={styles.orbitColumn}>
                                <View style={[styles.node, idx === 0 && styles.nodeActive]} />
                                {idx < verificationSteps.length - 1 && <View style={styles.path} />}
                            </View>
                            <View style={styles.stepInfo}>
                                <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>{step.text}</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 6, lineHeight: 18 }}>{step.desc}</AppText>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.guidanceStrip}>
                    <View style={styles.guidanceIcon}>
                        <Ionicons name="shield-checkmark" size={20} color={Theme.Colors.primary} />
                    </View>
                    <AppText variant="caption" weight="bold" color="textSecondary" style={{ flex: 1, lineHeight: 18 }}>
                        EVALUATION CYCLE: <AppText variant="caption" weight="black" color="primary">3 — 5 BUSINESS DAYS</AppText>. NOTIFICATION WILL BE DISPATCHED UPON PROTOCOL CLEARANCE.
                    </AppText>
                </View>

                <View style={styles.actionCluster}>
                    <AppButton
                        title="SYNCHRONIZE PROTOCOL STATUS"
                        onPress={() => router.replace('/(app)/(lab-tabs)')}
                        style={styles.syncBtn}
                    >
                        <Ionicons name="refresh" size={20} color="white" style={{ marginLeft: 12 }} />
                    </AppButton>

                    <TouchableOpacity style={styles.terminateBtn} onPress={logout}>
                        <Ionicons name="log-out-outline" size={20} color={Theme.Colors.error} />
                        <AppText variant="caption" weight="black" uppercase style={{ color: Theme.Colors.error, marginLeft: 12, letterSpacing: 1 }}>Terminate Command Session</AppText>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    content: { padding: 32, paddingTop: 20 },
    heroSection: { alignItems: 'center', marginBottom: 56 },
    pulseContainer: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
    iconBadge: { width: 100, height: 100, borderRadius: 40, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', zIndex: 1, borderWidth: 1, borderColor: Theme.Colors.divider },
    pulseRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: Theme.Colors.primary + '03', borderWidth: 1, borderColor: Theme.Colors.primary + '08' },

    subtitle: { marginTop: 16, paddingHorizontal: 12, lineHeight: 22 },

    timelineBlock: { width: '100%', marginBottom: 48 },
    timelineItem: { flexDirection: 'row', gap: 20 },
    orbitColumn: { width: 32, alignItems: 'center' },
    node: { width: 12, height: 12, borderRadius: 6, backgroundColor: Theme.Colors.divider, marginTop: 8 },
    nodeActive: { backgroundColor: Theme.Colors.primary, transform: [{ scale: 1.2 }], borderWidth: 2, borderColor: 'white' },
    path: { width: 1, flex: 1, backgroundColor: Theme.Colors.divider, marginVertical: 6 },
    stepInfo: { flex: 1, paddingBottom: 40 },

    guidanceStrip: { flexDirection: 'row', gap: 16, backgroundColor: Theme.Colors.primary + '08', padding: 24, borderRadius: 28, marginBottom: 56, borderWidth: 1, borderColor: Theme.Colors.primary + '10' },
    guidanceIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },

    actionCluster: { width: '100%', gap: 24 },
    syncBtn: { height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text },
    terminateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 20, backgroundColor: Theme.Colors.error + '05' },
});

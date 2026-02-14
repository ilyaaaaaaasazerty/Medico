import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function ClinicPendingScreen() {
    const router = useRouter();
    const { logout } = useAuth();

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <View>
                    <AppText variant="h2" weight="black">Institutional Audit</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Clinic Entity monitor</AppText>
                </View>
                <TouchableOpacity onPress={logout} style={styles.exitBtn}>
                    <Ionicons name="log-out-outline" size={20} color={Theme.Colors.error} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.pulseContainer}>
                    <View style={styles.pulseOuter} />
                    <View style={styles.pulseInner}>
                        <Ionicons name="business" size={44} color={Theme.Colors.primary} />
                    </View>
                </View>

                <AppText variant="h1" weight="black" align="center" style={styles.mainTitle}>Verification Protocol</AppText>
                <AppText variant="body" color="textSecondary" align="center" weight="bold" style={styles.subtext}>
                    Your institutional registration is being vetted for clinical compliance and operational authorization.
                </AppText>

                <AppCard padding="md" style={styles.checklistCard}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.checklistLabel}>Audit Matrix</AppText>

                    {[
                        { label: 'Licensed Facility Authentication', status: 'ACTIVE' },
                        { label: 'Operational Credential Audit', status: 'PENDING' },
                        { label: 'Institutional Hierarchy Review', status: 'AWAITING' }
                    ].map((step, i) => (
                        <View key={i} style={[styles.stepItem, i < 2 && styles.stepDivider]}>
                            <View style={styles.stepDot} />
                            <AppText variant="body" weight="black" style={{ flex: 1, fontSize: 13 }}>{step.label}</AppText>
                            <View style={[styles.statusBadge, { backgroundColor: step.status === 'ACTIVE' ? Theme.Colors.success + '15' : Theme.Colors.primary + '10' }]}>
                                <AppText variant="caption" color={step.status === 'ACTIVE' ? 'success' : 'primary'} weight="black" style={{ fontSize: 8 }}>{step.status}</AppText>
                            </View>
                        </View>
                    ))}
                </AppCard>

                <View style={styles.noticeBox}>
                    <Ionicons name="information-circle-outline" size={20} color={Theme.Colors.primary} />
                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 12, flex: 1 }}>
                        Institutional vetting sequences typically manifest within 24-72 temporal hours.
                    </AppText>
                </View>
            </View>

            <View style={styles.footer}>
                <AppButton
                    title="Check Institutional Status"
                    onPress={() => router.replace('/(app)/clinic-dashboard')}
                    style={{ height: 60, borderRadius: 20 }}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, backgroundColor: Theme.Colors.surface, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    exitBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.error + '10', justifyContent: 'center', alignItems: 'center' },

    content: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
    pulseContainer: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
    pulseOuter: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.Colors.primary + '15' },
    pulseInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.primary + '25' },

    mainTitle: { marginBottom: 12 },
    subtext: { marginBottom: 40, lineHeight: 22 },

    checklistCard: { width: '100%', borderWidth: 1, borderColor: Theme.Colors.divider },
    checklistLabel: { fontSize: 8, letterSpacing: 1.5, marginBottom: 20 },
    stepItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    stepDivider: { borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.Colors.primary, marginRight: 12 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

    noticeBox: { flexDirection: 'row', alignItems: 'center', marginTop: 32, padding: 16, borderRadius: 16, backgroundColor: Theme.Colors.primary + '08' },

    footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: Theme.Colors.surface, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
});

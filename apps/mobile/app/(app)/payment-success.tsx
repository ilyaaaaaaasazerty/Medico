import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function PaymentSuccessScreen() {
    const router = useRouter();
    const { amount, txId } = useLocalSearchParams<{ amount: string; txId: string }>();

    return (
        <AppScreen padding={false}>
            <LinearGradient
                colors={[Theme.Colors.primary + '10', 'transparent', Theme.Colors.primary + '03']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                <View style={styles.successIconBox}>
                    <View style={styles.outerCircle}>
                        <LinearGradient
                            colors={[Theme.Colors.primary, Theme.Colors.primary + 'CC']}
                            style={styles.innerCircle}
                        >
                            <Ionicons name="card" size={48} color="white" />
                        </LinearGradient>
                    </View>
                </View>

                <AppText variant="h2" weight="black" align="center">Transaction Finalized</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" align="center" style={styles.subtitle}>
                    Your digital wallet replenishment has been successfully processed, audited, and committed to the clinical ledger.
                </AppText>

                <AppCard padding="md" style={styles.valueCard}>
                    <AppText variant="caption" weight="black" color="textSecondary" align="center" style={{ letterSpacing: 2 }}>TOTAL REPLENISHMENT</AppText>
                    <AppText variant="h1" weight="black" style={{ color: Theme.Colors.success, textAlign: 'center', marginTop: 8 }}>+{amount || '0.00'} DZD</AppText>
                    <View style={styles.divider} />
                    <View style={styles.refRow}>
                        <AppText variant="caption" color="textSecondary" weight="black">PROTOCOL TX ID</AppText>
                        <AppText variant="caption" weight="black">#{txId?.slice(-12).toUpperCase() || 'SYNCHRONIZING'}</AppText>
                    </View>
                </AppCard>

                <View style={styles.securitySeal}>
                    <Ionicons name="shield-checkmark" size={20} color={Theme.Colors.primary} />
                    <AppText variant="caption" color="textSecondary" weight="black">REGULATED TRANSACTION • SECURE VAULT</AppText>
                </View>
            </View>

            <View style={styles.footer}>
                <AppButton
                    title="View Updated Balance"
                    onPress={() => router.replace('/(app)/(tabs)/profile')}
                    style={{ height: 64, borderRadius: 22 }}
                />
                <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() => router.push('/(app)/transactions')}
                >
                    <AppText variant="body" color="textSecondary" weight="black" style={{ fontSize: 13 }}>DOWNLOAD AUDIT RECEIPT</AppText>
                </TouchableOpacity>
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

    successIconBox: { marginBottom: 32 },
    outerCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: Theme.Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
    innerCircle: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center' },

    subtitle: { marginTop: 12, lineHeight: 24, paddingHorizontal: 20 },

    valueCard: { width: '100%', marginTop: 40, borderRadius: 32 },
    divider: { height: 1, backgroundColor: Theme.Colors.divider, marginVertical: 24 },
    refRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    securitySeal: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 40 },

    footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, gap: 16 },
    secondaryAction: { height: 48, justifyContent: 'center', alignItems: 'center' },
});

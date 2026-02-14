import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { LinearGradient } from 'expo-linear-gradient';

export default function LabBookingSuccessScreen() {
    const { labName, scheduledDate, scheduledTime } = useLocalSearchParams<{
        labName: string;
        scheduledDate: string;
        scheduledTime: string;
    }>();

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.centerContent}>
                <View style={styles.successIconContainer}>
                    <LinearGradient
                        colors={[Theme.Colors.success + '20', Theme.Colors.success + '05']}
                        style={styles.iconCircle}
                    >
                        <Ionicons name="shield-checkmark" size={60} color={Theme.Colors.success} />
                    </LinearGradient>
                    <View style={styles.successPulse} />
                </View>

                <AppText variant="h1" weight="black" style={{ textAlign: 'center' }}>FINALIZED</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={styles.subtitle}>
                    Diagnostic protocol authorized. Temporal slot escrowed within the institutional clinical network.
                </AppText>

                <AppCard padding="lg" style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <View style={styles.miniIcon}>
                            <Ionicons name="business" size={16} color={Theme.Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText variant="caption" color="textSecondary" weight="black">INSTITUTION</AppText>
                            <AppText variant="body" weight="black">{labName?.toUpperCase()}</AppText>
                        </View>
                    </View>

                    <View style={styles.gridRow}>
                        <View style={[styles.detailRow, { flex: 1 }]}>
                            <View style={styles.miniIcon}>
                                <Ionicons name="calendar" size={16} color={Theme.Colors.primary} />
                            </View>
                            <View>
                                <AppText variant="caption" color="textSecondary" weight="black">DATE</AppText>
                                <AppText variant="body" weight="black">{formatDate(scheduledDate!).toUpperCase()}</AppText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.miniIcon}>
                            <Ionicons name="time" size={16} color={Theme.Colors.primary} />
                        </View>
                        <View>
                            <AppText variant="caption" color="textSecondary" weight="black">SLOT PRECISION</AppText>
                            <AppText variant="body" weight="black">{scheduledTime} (GMT+1)</AppText>
                        </View>
                    </View>

                </AppCard>

                <View style={styles.alertBox}>
                    <Ionicons name="information-circle-outline" size={20} color={Theme.Colors.primary} />
                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ flex: 1, marginLeft: 12 }}>
                        Institutional requirement: Arrive 15m prior to temporal slot. Authorized digital ID mandatory for sample collection.
                    </AppText>
                </View>
            </View>

            <View style={styles.footer}>
                <AppButton
                    title="ACCESS CLINICAL LEDGER"
                    onPress={() => router.replace('/(app)/lab-requests')}
                    style={styles.secondaryBtn}
                    textStyle={{ color: Theme.Colors.text }}
                />
                <AppButton
                    title="RETURN TO COMMAND"
                    onPress={() => router.replace('/(app)/(tabs)')}
                    style={styles.primaryBtn}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    centerContent: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center' },
    successIconContainer: { marginBottom: 40, alignItems: 'center', justifyContent: 'center' },
    iconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.success + '30' },
    successPulse: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: Theme.Colors.success, opacity: 0.1 },

    subtitle: { textAlign: 'center', marginTop: 12, marginBottom: 40, paddingHorizontal: 20, lineHeight: 22 },
    detailsCard: { width: '100%', borderRadius: 32, marginBottom: 32 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    gridRow: { flexDirection: 'row', gap: 16 },
    miniIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider, marginRight: 16 },

    alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '08', padding: 20, borderRadius: 24 },

    footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, gap: 12 },
    primaryBtn: { height: 60, borderRadius: 20, backgroundColor: Theme.Colors.text },
    secondaryBtn: { height: 60, borderRadius: 20, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider },
});

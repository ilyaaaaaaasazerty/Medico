import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function BookingSuccessScreen() {
    const router = useRouter();
    const { doctorName } = useLocalSearchParams<{ doctorName: string }>();

    return (
        <AppScreen padding={false}>
            <LinearGradient
                colors={[Theme.Colors.primary + '08', Theme.Colors.background]}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.successHeader}>
                    <View style={styles.successIconBox}>
                        <LinearGradient
                            colors={[Theme.Colors.primary, Theme.Colors.primary + 'CC']}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="checkmark" size={64} color="white" />
                        </LinearGradient>
                        <View style={styles.glowEffect} />
                    </View>

                    <AppText variant="h1" weight="black" align="center">Engagement Synchronized</AppText>
                    <AppText variant="body" color="textSecondary" align="center" style={styles.subtitle}>
                        Your clinical consultation with <AppText variant="body" weight="black" color="primary">Dr. {doctorName || 'Expert Practitioner'}</AppText> has been successfully verified and committed to the medical ledger.
                    </AppText>
                </View>

                <AppCard padding="md" style={styles.verificationCard}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.miniIcon, { backgroundColor: Theme.Colors.primary + '10' }]}>
                            <Ionicons name="shield-checkmark" size={20} color={Theme.Colors.primary} />
                        </View>
                        <AppText variant="body" weight="black" style={{ marginLeft: 12 }}>Protocol Verification</AppText>
                    </View>
                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 8, lineHeight: 18 }}>
                        The practitioner has received your diagnostic request and will review your clinical history prior to the scheduled interval.
                    </AppText>
                </AppCard>

                <View style={styles.guideSection}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Preparation Protocol</AppText>

                    <View style={styles.stepGrid}>
                        <PrepStep
                            num="1"
                            title="Review Guidelines"
                            desc="Access clinical preparation notes in appointment details."
                        />
                        <View style={styles.stepDivider} />
                        <PrepStep
                            num="2"
                            title="Asset Alignment"
                            desc="Ensure relevant diagnostic files are present in your vault."
                        />
                        <View style={styles.stepDivider} />
                        <PrepStep
                            num="3"
                            title="Calendar Sync"
                            desc="Synchronize this interval with your external scheduler."
                        />
                    </View>
                </View>

                <View style={{ height: 140 }} />
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    title="Access Clinical Ledger"
                    onPress={() => router.replace('/(app)/(tabs)/appointments')}
                    style={{ height: 64, borderRadius: 22 }}
                />
                <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() => router.push('/(app)/search-doctors')}
                >
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase>Schedule Parallel Engagement</AppText>
                </TouchableOpacity>
            </View>
        </AppScreen>
    );
}

function PrepStep({ num, title, desc }: any) {
    return (
        <View style={styles.stepRow}>
            <View style={styles.stepNumBox}>
                <AppText variant="caption" color="primary" weight="black">{num}</AppText>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
                <AppText variant="body" weight="black">{title}</AppText>
                <AppText variant="caption" color="textSecondary" weight="bold">{desc}</AppText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 32, alignItems: 'center' },

    successHeader: { alignItems: 'center', marginTop: Platform.OS === 'ios' ? 60 : 40, marginBottom: 40 },
    successIconBox: { width: 140, height: 140, marginBottom: 32, position: 'relative' },
    iconGradient: { width: 140, height: 140, borderRadius: 50, justifyContent: 'center', alignItems: 'center', zIndex: 1, ...Theme.Shadows.medium },
    glowEffect: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, borderRadius: 60, backgroundColor: Theme.Colors.primary, opacity: 0.2, transform: [{ scale: 1.2 }] },

    subtitle: { marginTop: 16, lineHeight: 24, paddingHorizontal: 12 },

    verificationCard: { width: '100%', marginBottom: 40 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    miniIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    guideSection: { width: '100%' },
    sectionTitle: { marginBottom: 20, letterSpacing: 1, textAlign: 'center' },
    stepGrid: { gap: 0 },
    stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    stepNumBox: { width: 28, height: 28, borderRadius: 10, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    stepDivider: { height: 1, backgroundColor: Theme.Colors.divider, marginLeft: 44, marginVertical: 4, opacity: 0.5 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: Theme.Colors.background },
    secondaryAction: { height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
});

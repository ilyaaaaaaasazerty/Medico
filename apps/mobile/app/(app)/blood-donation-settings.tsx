import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { useRouter } from 'expo-router';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function BloodDonationSettingsScreen() {
    const router = useRouter();
    const [isDonor, setIsDonor] = useState(false);
    const [lastDonation, setLastDonation] = useState('Aug 12, 2025');

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Donor Protocol</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Enrollment Section */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Network Enrollment</AppText>
                    <AppCard padding="md">
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1, marginRight: 16 }}>
                                <AppText variant="body" weight="black">Volunteer to Donate</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 4 }}>
                                    Visible to medical staff and authorized donors during critical blood shortages.
                                </AppText>
                            </View>
                            <Switch
                                value={isDonor}
                                onValueChange={setIsDonor}
                                trackColor={{ false: Theme.Colors.divider, true: Theme.Colors.primary }}
                                thumbColor="white"
                                ios_backgroundColor={Theme.Colors.divider}
                            />
                        </View>
                    </AppCard>
                </View>

                {/* Clinical History */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Clinical History</AppText>
                    <AppCard padding="md" onPress={() => { }}>
                        <View style={styles.historyRow}>
                            <View style={styles.iconBox}>
                                <Ionicons name="calendar-clear" size={24} color={Theme.Colors.primary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <AppText variant="caption" color="textSecondary" weight="black">LAST DONATION SESSION</AppText>
                                <AppText variant="body" weight="black">{lastDonation}</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={Theme.Colors.divider} />
                        </View>
                    </AppCard>
                </View>

                {/* Eligibility Protocol */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Regional Eligibility Protocol</AppText>
                    <AppCard padding="md" style={styles.protocolCard}>
                        <View style={styles.protocolItem}>
                            <View style={styles.dot} />
                            <AppText variant="caption" color="textSecondary" weight="black">AGE RANGE: 18 - 65 YEARS</AppText>
                        </View>
                        <View style={styles.protocolItem}>
                            <View style={styles.dot} />
                            <AppText variant="caption" color="textSecondary" weight="black">MINIMUM MASS: 50 KG</AppText>
                        </View>
                        <View style={styles.protocolItem}>
                            <View style={styles.dot} />
                            <AppText variant="caption" color="textSecondary" weight="black">VITAL STATUS: GOOD OVERALL HEALTH</AppText>
                        </View>
                        <View style={styles.protocolItem}>
                            <View style={styles.dot} />
                            <AppText variant="caption" color="textSecondary" weight="black">INTERVAL: 90 DAYS BETWEEN SESSIONS</AppText>
                        </View>
                    </AppCard>
                </View>

                <View style={styles.noteBox}>
                    <Ionicons name="information-circle" size={20} color={Theme.Colors.primary} />
                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ flex: 1, marginLeft: 12 }}>
                        Enrollment in the network helps local clinical facilities mobilize donors during emergencies.
                    </AppText>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    title="Update Protocol"
                    onPress={() => {
                        Alert.alert('Protocol Updated', 'Your clinical donor status and session history have been synchronized.');
                        router.back();
                    }}
                    style={{ height: 64, borderRadius: 22 }}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24 },
    section: { marginBottom: 32 },
    sectionTitle: { marginBottom: 16, letterSpacing: 1 },

    settingRow: { flexDirection: 'row', alignItems: 'center' },

    historyRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    protocolCard: { backgroundColor: Theme.Colors.surface, borderStyle: 'dashed' },
    protocolItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.Colors.primary, marginRight: 12 },

    noteBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '08', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.primary + '15' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Theme.Colors.background, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
});

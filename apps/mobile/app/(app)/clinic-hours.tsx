import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { clinicApi } from '@/services/clinic.api';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

export default function ClinicHoursScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadHours();
    }, []);

    const loadHours = async () => {
        try {
            await clinicApi.getWorkingHours();
        } catch (error) {
            console.error('Error loading temporal protocol:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm247 = async () => {
        setSaving(true);
        try {
            const hours247 = Array.from({ length: 7 }, (_, i) => ({
                dayOfWeek: i,
                openTime: '00:00',
                closeTime: '23:59',
                isClosed: false
            }));

            const res = await clinicApi.setWorkingHours(hours247);
            if (res.success) {
                Alert.alert('PROTOCOL SYNCHRONIZED', 'The institution has been successfully verified for continuous 24/7 operations.');
            }
        } catch (error) {
            Alert.alert('SYNC FAILED', 'Institutional temporal state could not be propagated to clinical net.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Temporal Protocol</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <View style={styles.outerCircle}>
                        <View style={styles.midCircle}>
                            <View style={styles.innerCircle}>
                                <Ionicons name="time-outline" size={48} color={Theme.Colors.primary} />
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.intro}>
                    <AppText variant="h1" weight="black" align="center">Continuous Care Cycle</AppText>
                    <AppText variant="body" color="textSecondary" weight="bold" align="center" style={styles.introSub}>
                        Institutional availability is bound to the <AppText variant="body" weight="black" color="primary">Universal Care standard</AppText>, ensuring 24/7 engagement capability across all spatial units.
                    </AppText>
                </View>

                <AppCard style={styles.protocolCard} padding="lg">
                    <ProtocolRow
                        icon="infinite-outline"
                        label="UNINTERRUPTED CYCLE"
                        subtext="Operational window: 00:00 - 23:59 DAILY"
                    />
                    <View style={styles.protocolDivider} />
                    <ProtocolRow
                        icon="calendar-outline"
                        label="INSTITUTIONAL RELIABILITY"
                        subtext="Includes public holidays and weekend cycles"
                    />
                    <View style={styles.protocolDivider} />
                    <ProtocolRow
                        icon="shield-checkmark-outline"
                        label="EMERGENCY SYNCHRONIZATION"
                        subtext="Propagated to regional dispatch nets"
                    />
                </AppCard>

                <AppButton
                    title="SYNCHRONIZE 24/7 PROTOCOL"
                    onPress={handleConfirm247}
                    loading={saving}
                    style={styles.syncBtn}
                >
                    <Ionicons name="sync-outline" size={20} color="white" />
                </AppButton>

                <View style={styles.overrideBox}>
                    <View style={styles.overrideIcon}>
                        <Ionicons name="lock-closed-outline" size={18} color={Theme.Colors.textSecondary} />
                    </View>
                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ flex: 1, lineHeight: 18 }}>
                        MANUAL OVERRIDES ARE INSTITUTIONALLY RESTRICTED. STATUS MODIFICATION REQUIRES SUPERVISORY AUTHORIZATION THROUGH REGIONAL GOVERNANCE.
                    </AppText>
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>
        </AppScreen>
    );
}

function ProtocolRow({ icon, label, subtext }: any) {
    return (
        <View style={styles.protocolRow}>
            <View style={styles.iconBox}>
                <Ionicons name={icon} size={20} color={Theme.Colors.primary} />
            </View>
            <View style={styles.protocolText}>
                <AppText variant="caption" weight="black" uppercase style={{ fontSize: 10 }}>{label}</AppText>
                <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 2 }}>{subtext}</AppText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    content: { paddingHorizontal: 24, alignItems: 'center' },
    hero: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 32 },
    outerCircle: { width: 180, height: 180, borderRadius: 90, backgroundColor: Theme.Colors.primary + '03', justifyContent: 'center', alignItems: 'center' },
    midCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: Theme.Colors.primary + '05', justifyContent: 'center', alignItems: 'center' },
    innerCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.primary + '10' },

    intro: { alignItems: 'center', marginBottom: 32 },
    introSub: { marginTop: 12, lineHeight: 22, paddingHorizontal: 12 },

    protocolCard: { width: '100%', marginBottom: 32, borderRadius: 32 },
    protocolRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.primary + '05', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    protocolText: { flex: 1 },
    protocolDivider: { height: 1, backgroundColor: Theme.Colors.divider, marginVertical: 20, marginHorizontal: 12 },

    syncBtn: { width: '100%', height: 64, borderRadius: 24, gap: 12, backgroundColor: Theme.Colors.text },
    overrideBox: { flexDirection: 'row', gap: 16, padding: 22, backgroundColor: Theme.Colors.surface, borderRadius: 24, marginTop: 24, borderWidth: 1, borderColor: Theme.Colors.divider, alignItems: 'center' },
    overrideIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
});

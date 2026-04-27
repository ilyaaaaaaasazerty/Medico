import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { bloodApi, BloodRequest } from '@/services/blood.api';

export default function BloodDonationScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [isDonor, setIsDonor] = useState(false);
    const [requests, setRequests] = useState<BloodRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [togglingDonor, setTogglingDonor] = useState(false);

    const fetchRequests = useCallback(async () => {
        try {
            const res = await bloodApi.getRecommendedRequests();
            if (res.success && res.data) setRequests(res.data);
        } catch (err) {
            console.error('[BloodDonation] Failed to fetch requests:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRequests();
    }, [fetchRequests]);

    const handleToggleDonor = async () => {
        setTogglingDonor(true);
        try {
            const res = await bloodApi.updateDonorStatus(!isDonor);
            if (res.success) setIsDonor(!isDonor);
        } catch (err) {
            Alert.alert('Error', 'Could not update donor status. Please try again.');
        } finally {
            setTogglingDonor(false);
        }
    };

    const handleRespond = async (requestId: string) => {
        try {
            const res = await bloodApi.respondToRequest(requestId);
            if (res.success) {
                Alert.alert('Thank you!', 'The patient has been notified of your response.');
                fetchRequests();
            }
        } catch {
            Alert.alert('Error', 'Could not submit response. Please try again.');
        }
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <AppText variant="title">Blood Donation</AppText>
                <TouchableOpacity onPress={() => router.push('/(app)/blood-donation-settings')} style={styles.settingsBtn}>
                    <Ionicons name="settings-outline" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: Theme.Spacing.lg, paddingBottom: 32 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Volunteer Status Card */}
                <AppCard style={styles.statusCard} variant="elevated" padding="lg">
                    <View style={styles.statusTextContainer}>
                        <AppText weight="bold" style={{ fontSize: 18 }}>Volunteer Donor</AppText>
                        <AppText variant="caption" color="textSecondary">
                            {isDonor ? 'Available to save lives' : 'Not currently a donor'}
                        </AppText>
                    </View>
                    <TouchableOpacity
                        style={[styles.toggleButton, isDonor ? styles.toggleOn : styles.toggleOff]}
                        onPress={handleToggleDonor}
                        disabled={togglingDonor}
                    >
                        {togglingDonor ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <AppText weight="black" color="textInverted" style={{ fontSize: 12 }}>
                                {isDonor ? 'ON' : 'OFF'}
                            </AppText>
                        )}
                    </TouchableOpacity>
                </AppCard>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <AppCard style={styles.actionCard} onPress={() => router.push('/(app)/request-blood')} padding="md">
                        <View style={[styles.actionIcon, { backgroundColor: Theme.Colors.error + '10' }]}>
                            <Ionicons name="water" size={32} color={Theme.Colors.error} />
                        </View>
                        <AppText weight="bold" align="center">Request Blood</AppText>
                    </AppCard>
                    <AppCard style={styles.actionCard} onPress={() => router.push('/(app)/explore-map')} padding="md">
                        <View style={[styles.actionIcon, { backgroundColor: Theme.Colors.success + '10' }]}>
                            <Ionicons name="map" size={32} color={Theme.Colors.success} />
                        </View>
                        <AppText weight="bold" align="center">Find Centers</AppText>
                    </AppCard>
                </View>

                {/* Compatible Requests */}
                <View style={styles.section}>
                    <AppText variant="h3" style={{ marginBottom: Theme.Spacing.md }}>Compatible Requests</AppText>

                    {loading ? (
                        <ActivityIndicator size="large" color={Theme.Colors.primary} style={{ marginTop: 32 }} />
                    ) : requests.length === 0 ? (
                        <AppCard variant="elevated" padding="lg" style={{ alignItems: 'center' }}>
                            <Ionicons name="heart-outline" size={40} color={Theme.Colors.textSecondary} />
                            <AppText variant="caption" color="textSecondary" align="center" style={{ marginTop: 8 }}>
                                No compatible requests nearby right now.
                            </AppText>
                        </AppCard>
                    ) : requests.map(item => (
                        <AppCard key={item.id} style={styles.requestCard} variant="elevated" padding="md">
                            <View style={[styles.bloodBadge, { backgroundColor: item.urgency === 'EMERGENCY' ? Theme.Colors.error : Theme.Colors.warning }]}>
                                <AppText weight="black" color="textInverted" style={{ fontSize: 20 }}>{item.bloodType}</AppText>
                            </View>
                            <View style={styles.requestInfo}>
                                <View style={styles.requestHeader}>
                                    <AppText weight="bold">{item.patientName}</AppText>
                                    <AppText weight="black" style={{ fontSize: 10, color: item.urgency === 'EMERGENCY' ? Theme.Colors.error : Theme.Colors.warning, textTransform: 'uppercase' }}>
                                        {item.urgency}
                                    </AppText>
                                </View>
                                {item.location && (
                                    <View style={styles.locationContainer}>
                                        <Ionicons name="location" size={12} color={Theme.Colors.textSecondary} />
                                        <AppText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                                            {item.location}
                                        </AppText>
                                    </View>
                                )}
                            </View>
                            <AppButton
                                title="HELP"
                                size="sm"
                                onPress={() => handleRespond(item.id)}
                                style={{ width: 60 }}
                            />
                        </AppCard>
                    ))}
                </View>
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.lg,
        paddingVertical: Theme.Spacing.lg
    },
    settingsBtn: {
        width: 44, height: 44,
        borderRadius: Theme.Radii.md,
        backgroundColor: Theme.Colors.surface,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: Theme.Colors.divider,
    },
    statusCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.Spacing.lg,
        borderWidth: 1, borderColor: Theme.Colors.divider,
    },
    statusTextContainer: { flex: 1 },
    toggleButton: {
        paddingHorizontal: 15, paddingVertical: 8,
        borderRadius: Theme.Radii.full,
        width: 70, alignItems: 'center', justifyContent: 'center',
        height: 36,
    },
    toggleOn: { backgroundColor: Theme.Colors.success },
    toggleOff: { backgroundColor: Theme.Colors.divider },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Theme.Spacing.md,
        marginBottom: Theme.Spacing.xl
    },
    actionCard: {
        flex: 1, height: 120,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: Theme.Colors.divider,
    },
    actionIcon: {
        width: 56, height: 56,
        borderRadius: Theme.Radii.lg,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: Theme.Spacing.sm,
    },
    section: { marginTop: Theme.Spacing.sm },
    requestCard: {
        flexDirection: 'row', alignItems: 'center',
        marginBottom: Theme.Spacing.md,
        borderWidth: 1, borderColor: Theme.Colors.divider,
    },
    bloodBadge: {
        width: 54, height: 54, borderRadius: 27,
        justifyContent: 'center', alignItems: 'center'
    },
    requestInfo: { flex: 1, marginLeft: Theme.Spacing.md },
    requestHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    locationContainer: {
        flexDirection: 'row', alignItems: 'center', marginTop: 4
    },
});

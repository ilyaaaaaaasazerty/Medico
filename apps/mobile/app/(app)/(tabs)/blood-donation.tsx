import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function BloodDonationScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [isDonor, setIsDonor] = useState(false);

    // Mock data for initial UI
    const mockRequests = [
        { id: '1', bloodType: 'O-', urgency: 'EMERGENCY', location: 'Mustapha Pacha Hospital', patientName: 'Sami', createdAt: new Date() },
        { id: '2', bloodType: 'A+', urgency: 'HIGH', location: 'Clinic Al-Azhar', patientName: 'Lina', createdAt: new Date() },
    ];

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <AppText variant="title">Blood Donation</AppText>
                <TouchableOpacity onPress={() => router.push('/(app)/blood-donation-settings')} style={styles.settingsBtn}>
                    <Ionicons name="settings-outline" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: Theme.Spacing.lg }}>
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
                        onPress={() => setIsDonor(!isDonor)}
                    >
                        <AppText weight="black" color="textInverted" style={{ fontSize: 12 }}>
                            {isDonor ? 'ON' : 'OFF'}
                        </AppText>
                    </TouchableOpacity>
                </AppCard>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <AppCard
                        style={styles.actionCard}
                        onPress={() => router.push('/(app)/request-blood')}
                        padding="md"
                    >
                        <View style={[styles.actionIcon, { backgroundColor: Theme.Colors.error + '10' }]}>
                            <Ionicons name="water" size={32} color={Theme.Colors.error} />
                        </View>
                        <AppText weight="bold" align="center">Request Blood</AppText>
                    </AppCard>
                    <AppCard
                        style={styles.actionCard}
                        onPress={() => router.push('/(app)/explore-map')}
                        padding="md"
                    >
                        <View style={[styles.actionIcon, { backgroundColor: Theme.Colors.success + '10' }]}>
                            <Ionicons name="map" size={32} color={Theme.Colors.success} />
                        </View>
                        <AppText weight="bold" align="center">Find Centers</AppText>
                    </AppCard>
                </View>

                {/* Compatible Requests */}
                <View style={styles.section}>
                    <AppText variant="h3" style={{ marginBottom: Theme.Spacing.md }}>Compatible Requests</AppText>
                    {mockRequests.map(item => (
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
                                <View style={styles.locationContainer}>
                                    <Ionicons name="location" size={12} color={Theme.Colors.textSecondary} />
                                    <AppText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                                        {item.location}
                                    </AppText>
                                </View>
                            </View>
                            <AppButton
                                title="HELP"
                                size="sm"
                                onPress={() => Alert.alert('Thank you!', 'The patient has been notified.')}
                                style={{ width: 60 }}
                            />
                        </AppCard>
                    ))}
                </View>
            </View>
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
        width: 44,
        height: 44,
        borderRadius: Theme.Radii.md,
        backgroundColor: Theme.Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    statusCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.Spacing.lg,
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    statusTextContainer: { flex: 1 },
    toggleButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: Theme.Radii.full,
        width: 70,
        alignItems: 'center'
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
        flex: 1,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: Theme.Radii.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.Spacing.sm,
    },
    section: { marginTop: Theme.Spacing.sm },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.Spacing.md,
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    bloodBadge: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center'
    },
    requestInfo: { flex: 1, marginLeft: Theme.Spacing.md },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4
    },
});

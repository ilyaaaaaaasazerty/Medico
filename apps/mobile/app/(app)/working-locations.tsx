import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Theme from '@/constants/Theme';
import { doctorApi } from '@/services/doctor.api';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { Ionicons } from '@expo/vector-icons';

interface ClinicAffiliation {
    id: string;
    clinic: {
        id: string;
        name: string;
        address: string;
        city: string;
    };
    status: string;
    joinedAt: string;
    isPrimary: boolean;
}

export default function WorkingLocationsScreen() {
    const router = useRouter();
    const [affiliations, setAffiliations] = useState<ClinicAffiliation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAffiliations();
    }, []);

    const loadAffiliations = async () => {
        try {
            const res = await doctorApi.getClinicAffiliations();
            if (res.success && res.data) {
                setAffiliations(res.data);
            }
        } catch (error) {
            console.error('Error loading institutional affiliations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetPrimary = async (id: string, name: string) => {
        try {
            await doctorApi.setPrimaryClinic(id);
            setAffiliations(affiliations.map(a => ({ ...a, isPrimary: a.id === id })));
            Alert.alert('Protocol Updated', `Primary institutional anchor synchronized to ${name}.`);
        } catch (error) {
            Alert.alert('Operational Error', 'Failed to synchronize primary anchor.');
        }
    };

    const handleLeaveClinic = (id: string, clinicName: string) => {
        Alert.alert(
            'Decommission Affiliation',
            `Are you sure you want to terminate your institutional anchor at ${clinicName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm Termination',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await doctorApi.leaveClinic(id);
                            setAffiliations(affiliations.filter(a => a.id !== id));
                        } catch (error) {
                            Alert.alert('Operational Error', 'Institutional decommissioning failed.');
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const renderItem = ({ item }: { item: ClinicAffiliation }) => (
        <AppCard style={styles.anchorCard} padding="md">
            <View style={styles.cardHeader}>
                <View style={styles.iconFrame}>
                    <Ionicons name="business" size={24} color={Theme.Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <View style={styles.nameRow}>
                        <AppText variant="body" weight="black" style={{ flex: 1 }}>{item.clinic.name}</AppText>
                        {item.isPrimary && (
                            <View style={styles.primaryBadge}>
                                <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 8 }}>Primary Anchor</AppText>
                            </View>
                        )}
                    </View>
                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 4 }}>{item.clinic.address}, {item.clinic.city}</AppText>
                    <View style={styles.joinedRow}>
                        <Ionicons name="calendar-outline" size={10} color={Theme.Colors.textSecondary} />
                        <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6, fontSize: 10 }}>Anchored since {formatDate(item.joinedAt)}</AppText>
                    </View>
                </View>
            </View>

            <View style={styles.actionRow}>
                {!item.isPrimary ? (
                    <TouchableOpacity style={styles.anchorBtn} onPress={() => handleSetPrimary(item.id, item.clinic.name)}>
                        <Ionicons name="location-outline" size={14} color={Theme.Colors.primary} />
                        <AppText variant="caption" color="primary" weight="black" uppercase style={{ marginLeft: 8 }}>Anchor as Primary</AppText>
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.anchorBtn, { opacity: 0.5, borderColor: Theme.Colors.success }]}>
                        <Ionicons name="checkmark-circle" size={14} color={Theme.Colors.success} />
                        <AppText variant="caption" color="success" weight="black" uppercase style={{ marginLeft: 8 }}>Active Anchor</AppText>
                    </View>
                )}
                <TouchableOpacity style={styles.terminateBtn} onPress={() => handleLeaveClinic(item.id, item.clinic.name)}>
                    <Ionicons name="trash-outline" size={14} color={Theme.Colors.error} />
                    <AppText variant="caption" weight="black" uppercase style={{ marginLeft: 8, color: Theme.Colors.error }}>Decommission</AppText>
                </TouchableOpacity>
            </View>
        </AppCard>
    );

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
                <AppText variant="h3" weight="black">Institutional Footprint</AppText>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.heroSection}>
                <AppText variant="h1" weight="black">Facility Matrix</AppText>
                <AppText variant="body" color="textSecondary" style={{ marginTop: 8 }}>
                    Monitor and manage active clinical affiliations. Anchored facilities define your operational footprint.
                </AppText>
            </View>

            <FlatList
                data={affiliations}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="business-outline" size={48} color={Theme.Colors.divider} />
                        </View>
                        <AppText variant="h3" weight="black">Footprint Detached</AppText>
                        <AppText variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: 12 }}>
                            Await facility invitations or register and anchor at a new institutional site to begin clinical sessions.
                        </AppText>
                    </View>
                }
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    heroSection: { paddingHorizontal: 24, marginBottom: 32 },

    list: { paddingHorizontal: 24, paddingBottom: 40 },
    anchorCard: { marginBottom: 16, borderWidth: 1, borderColor: Theme.Colors.divider },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconFrame: { width: 48, height: 48, borderRadius: 14, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    primaryBadge: { backgroundColor: Theme.Colors.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    joinedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },

    actionRow: { flexDirection: 'row', gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    anchorBtn: { flex: 2, height: 44, borderRadius: 12, borderWidth: 1, borderColor: Theme.Colors.primary + '30', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.Colors.surface },
    terminateBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: Theme.Colors.error + '20', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.Colors.error + '05' },

    emptyContainer: { alignItems: 'center', marginTop: 80, padding: 40 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
});

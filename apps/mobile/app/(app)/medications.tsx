import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Theme from '@/constants/Theme';
import { patientApi } from '@/services/patient.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { LinearGradient } from 'expo-linear-gradient';

interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    status: 'ACTIVE' | 'COMPLETED';
    prescribedBy: string;
    startDate: string;
}

export default function MedicationsScreen() {
    const router = useRouter();
    const { patientId } = useLocalSearchParams<{ patientId?: string }>();
    const [meds, setMeds] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadMeds();
        }, [patientId])
    );

    const loadMeds = async () => {
        try {
            const res = await patientApi.getMedications(patientId);
            if (res.success && res.data) {
                setMeds(res.data);
            }
        } catch (error) {
            console.error('Error loading pharmacological ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Medication }) => {
        const isActive = item.status === 'ACTIVE';

        return (
            <AppCard
                padding="none"
                style={styles.card}
                onPress={() => router.push({ pathname: '/(app)/prescription-detail', params: { id: item.id } })}
            >
                <View style={styles.cardContent}>
                    <View style={styles.topRow}>
                        <View style={[styles.statusBadge, { backgroundColor: isActive ? Theme.Colors.success + '12' : Theme.Colors.divider }]}>
                            <AppText variant="caption" weight="black" style={{ color: isActive ? Theme.Colors.success : Theme.Colors.textSecondary, fontSize: 8 }}>{isActive ? 'IN PROTOCOL' : 'TERMINATED'}</AppText>
                        </View>
                        <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9 }}>
                            SINCE {new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
                        </AppText>
                    </View>

                    <View style={styles.mainInfo}>
                        <View style={styles.iconBox}>
                            <Ionicons name="medical" size={22} color={Theme.Colors.primary} />
                        </View>
                        <View style={styles.textContainer}>
                            <AppText variant="body" weight="black" uppercase style={{ fontSize: 15 }}>{item.name}</AppText>
                            <View style={styles.posologyRow}>
                                <Ionicons name="timer-outline" size={12} color={Theme.Colors.primary} />
                                <AppText variant="caption" color="primary" weight="black" style={{ marginLeft: 6, fontSize: 10 }}>{item.dosage.toUpperCase()} • {item.frequency.toUpperCase()}</AppText>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Theme.Colors.divider} />
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.docInfo}>
                            <View style={styles.avatarMini}>
                                <AppText variant="caption" weight="black" color="textSecondary" style={{ fontSize: 8 }}>DR</AppText>
                            </View>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ marginLeft: 8 }}>{item.prescribedBy.toUpperCase()}</AppText>
                        </View>
                        <TouchableOpacity
                            style={styles.alertBtn}
                            onPress={() => router.push({ pathname: '/(app)/medication-reminders', params: { medId: item.id } })}
                        >
                            <Ionicons name="notifications-outline" size={16} color={Theme.Colors.primary} />
                            <AppText variant="caption" color="primary" weight="black" style={{ marginLeft: 6, fontSize: 9 }}>SET ALERT</AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            </AppCard>
        );
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Pharma Ledger</AppText>
                <TouchableOpacity
                    style={styles.circleBtn}
                    onPress={() => router.push('/(app)/medication-reminders')}
                >
                    <Ionicons name="alarm-outline" size={22} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
                <AppText variant="h2" weight="black">Therapeutic Stack</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={styles.heroSub}>
                    Official audit of active pharmacological regimens and authorized treatment protocols.
                </AppText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={meds}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="medkit-outline" size={42} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">NO ACTIVE REGIMENS DETECTED</AppText>
                            <AppText variant="caption" color="textSecondary" weight="bold" style={{ textAlign: 'center', marginTop: 8 }}>
                                Clinical protocols logged by medical staff will appear here.
                            </AppText>
                        </View>
                    }
                />
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    heroSection: { paddingHorizontal: 24, marginBottom: 16 },
    heroSub: { marginTop: 8, lineHeight: 20 },

    list: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
    card: { marginBottom: 16, borderRadius: 32 },
    cardContent: { padding: 20 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },

    mainInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    iconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },
    textContainer: { flex: 1, marginLeft: 16 },
    posologyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },

    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    docInfo: { flexDirection: 'row', alignItems: 'center' },
    avatarMini: { width: 24, height: 24, borderRadius: 8, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    alertBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: Theme.Colors.primary + '08' },

    emptyContainer: { paddingVertical: 80, alignItems: 'center', paddingHorizontal: 40 },
    emptyIconBox: { width: 84, height: 84, borderRadius: 28, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Theme.Colors.divider },
});

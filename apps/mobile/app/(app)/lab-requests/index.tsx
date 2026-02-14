import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Theme from '@/constants/Theme';
import { labApi } from '@/services/lab.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

interface LabRequest {
    id: string;
    labCenter: { name: string };
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    items: { test: { name: string } }[];
    results: { id: string }[];
}

const statusThemes: Record<string, { color: string, label: string }> = {
    PENDING: { color: Theme.Colors.warning, label: 'PENDING' },
    CONFIRMED: { color: Theme.Colors.primary, label: 'CONFIRMED' },
    SAMPLE_COLLECTED: { color: Theme.Colors.primary, label: 'COLLECTED' },
    IN_PROGRESS: { color: Theme.Colors.primary, label: 'ANALYZING' },
    COMPLETED: { color: Theme.Colors.success, label: 'COMPLETED' },
    CANCELLED: { color: Theme.Colors.error, label: 'CANCELLED' },
};

export default function LabRequestsScreen() {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<LabRequest[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadRequests();
        }, [])
    );

    const loadRequests = async () => {
        try {
            const res = await labApi.getMyLabRequests();
            if (res.success && res.data) {
                setRequests(res.data);
            }
        } catch (error) {
            console.error('Error loading diagnostic ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).toUpperCase();
    };

    const renderRequest = ({ item }: { item: LabRequest }) => {
        const theme = statusThemes[item.status] || { color: Theme.Colors.textSecondary, label: item.status };

        return (
            <AppCard
                padding="none"
                style={styles.requestCard}
                onPress={() => router.push(`/lab-requests/${item.id}`)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.providerInfo}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="flask" size={24} color={Theme.Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText variant="body" weight="black">{item.labCenter.name.toUpperCase()}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9, marginTop: 2 }}>
                                {item.items.length} PARAMETERS DETECTED
                            </AppText>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: theme.color + '12' }]}>
                        <AppText variant="caption" weight="black" style={{ color: theme.color, fontSize: 8 }}>{theme.label}</AppText>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.scheduleInfo}>
                        <Ionicons name="calendar-outline" size={14} color={Theme.Colors.textSecondary} />
                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 6 }}>
                            {formatDate(item.scheduledDate)} AT {item.scheduledTime}
                        </AppText>
                    </View>

                    {item.results?.length > 0 ? (
                        <View style={styles.resultBadge}>
                            <Ionicons name="ribbon" size={12} color={Theme.Colors.success} />
                            <AppText variant="caption" weight="black" style={{ color: Theme.Colors.success, fontSize: 8, marginLeft: 4 }}>REPORT SECURED</AppText>
                        </View>
                    ) : (
                        <Ionicons name="chevron-forward" size={16} color={Theme.Colors.divider} />
                    )}
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
                <AppText variant="h3" weight="black">Diagnostic Vault</AppText>
                <TouchableOpacity style={styles.circleBtn}>
                    <Ionicons name="filter-outline" size={20} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
                <AppText variant="h2" weight="black">Engagement Ledger</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 8 }}>
                    Official audit trail of authorized laboratory engagements and diagnostic result histories.
                </AppText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderRequest}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="document-text-outline" size={48} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">NO DIAGNOSTIC ASSETS FOUND</AppText>
                            <AppButton
                                title="Authorize New Diagnostic"
                                onPress={() => router.push('/(app)/labs')}
                                style={{ marginTop: 24, paddingHorizontal: 32 }}
                            />
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

    heroSection: { paddingHorizontal: 24, marginBottom: 24 },
    listContent: { padding: 24, paddingTop: 0, paddingBottom: 40 },
    requestCard: { marginBottom: 16, borderRadius: 28 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20 },
    providerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: Theme.Colors.divider, backgroundColor: Theme.Colors.surface + '40' },
    scheduleInfo: { flexDirection: 'row', alignItems: 'center' },
    resultBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.success + '08', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyIconContainer: { width: 100, height: 100, borderRadius: 32, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Theme.Colors.divider },
});

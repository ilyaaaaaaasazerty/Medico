import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard } from '@/components/base';
import Theme from '@/constants/Theme';
import { transportApi, TransportRequest } from '@/services/transport.api';

export default function TransportHistoryScreen() {
    const router = useRouter();
    const [rides, setRides] = useState<TransportRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async (pageNum = 1) => {
        try {
            const res = await transportApi.getRideHistory(pageNum);
            if (res.success && res.data) {
                const newRides = res.data.data || [];
                if (pageNum === 1) {
                    setRides(newRides);
                } else {
                    setRides(prev => [...prev, ...newRides]);
                }
                setHasMore(res.data.pagination.page < res.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!hasMore || loading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadHistory(nextPage);
    };

    const renderRide = ({ item }: { item: TransportRequest }) => (
        <AppCard style={styles.rideCard} padding="md">
            <View style={styles.rideHeader}>
                <AppText variant="body" weight="bold">{item.patient?.firstName} {item.patient?.lastName}</AppText>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'COMPLETED' ? Theme.Colors.success + '20' : Theme.Colors.error + '20' }]}>
                    <AppText variant="caption" weight="bold" style={{ color: item.status === 'COMPLETED' ? Theme.Colors.success : Theme.Colors.error }}>
                        {item.status}
                    </AppText>
                </View>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={14} color={Theme.Colors.textSecondary} />
                <AppText variant="caption" color="textSecondary" numberOfLines={1} style={{ marginLeft: 6, flex: 1 }}>{item.pickupAddress}</AppText>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={14} color={Theme.Colors.textSecondary} />
                <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
                    {new Date(item.completedAt || item.createdAt).toLocaleDateString()}
                </AppText>
                {item.costs && (
                    <>
                        <View style={styles.dot} />
                        <AppText variant="caption" color="primary" weight="bold">{item.costs} DZD</AppText>
                    </>
                )}
            </View>
        </AppCard>
    );

    if (loading && rides.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Theme.Colors.text} />
                </TouchableOpacity>
                <AppText variant="h2" weight="black">Ride History</AppText>
            </View>

            <FlatList
                data={rides}
                keyExtractor={(item) => item.id}
                renderItem={renderRide}
                contentContainerStyle={{ padding: 24 }}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="time-outline" size={48} color={Theme.Colors.divider} />
                        <AppText variant="body" color="textSecondary" style={{ marginTop: 12 }}>No rides yet</AppText>
                    </View>
                }
                ListFooterComponent={hasMore ? <ActivityIndicator size="small" color={Theme.Colors.primary} style={{ marginTop: 20 }} /> : null}
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 24, paddingBottom: 0 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    rideCard: { marginBottom: 12 },
    rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Theme.Colors.divider, marginHorizontal: 8 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
});

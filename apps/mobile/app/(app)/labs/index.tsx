import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Theme from '@/constants/Theme';
import { searchApi } from '@/services/search.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppInput, AppButton } from '@/components/base';

interface LabCenter {
    id: string;
    name: string;
    type: string;
    address: string;
    city: string;
    homeCollection: boolean;
    logoUrl?: string;
}

export default function LabsListScreen() {
    const [loading, setLoading] = useState(true);
    const [labs, setLabs] = useState<LabCenter[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredLabs, setFilteredLabs] = useState<LabCenter[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadLabs();
        }, [])
    );

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = labs.filter(lab =>
                lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lab.city.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredLabs(filtered);
        } else {
            setFilteredLabs(labs);
        }
    }, [searchQuery, labs]);

    const loadLabs = async () => {
        try {
            const res = await searchApi.searchLabs('');
            if (res.success && res.data) {
                setLabs(res.data);
                setFilteredLabs(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical diagnostic network:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderLabItem = ({ item }: { item: LabCenter }) => (
        <AppCard
            padding="none"
            style={styles.labCard}
            onPress={() => router.push(`/labs/${item.id}`)}
        >
            <View style={styles.cardContent}>
                <View style={styles.labIconContainer}>
                    <Ionicons name="flask" size={28} color={Theme.Colors.primary} />
                </View>
                <View style={styles.labInfo}>
                    <View style={styles.labHeaderRow}>
                        <AppText variant="body" weight="black" uppercase style={{ flex: 1 }}>{item.name}</AppText>
                        <View style={styles.typeBadge}>
                            <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 8 }}>{item.type.replace('_', ' ')}</AppText>
                        </View>
                    </View>

                    <View style={styles.labLocation}>
                        <Ionicons name="location" size={12} color={Theme.Colors.textSecondary} />
                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 4 }}>
                            {item.city} • {item.address.split(',')[0]}
                        </AppText>
                    </View>

                    {item.homeCollection && (
                        <View style={styles.homeCollectionBadge}>
                            <Ionicons name="home" size={10} color={Theme.Colors.success} />
                            <AppText variant="caption" weight="black" style={{ color: Theme.Colors.success, fontSize: 8, marginLeft: 4 }}>HOME SAMPLE COLLECTION ACTIVE</AppText>
                        </View>
                    )}
                </View>
                <View style={styles.chevronContainer}>
                    <Ionicons name="chevron-forward" size={18} color={Theme.Colors.primary} />
                </View>
            </View>
        </AppCard>
    );

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Diagnostic Net</AppText>
                <TouchableOpacity style={styles.circleBtn}>
                    <Ionicons name="options-outline" size={22} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
                <AppText variant="h2" weight="black">Institutional Discovery</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 8 }}>
                    Official registry of authorized clinical diagnostic centers and laboratory institutions within the clinical network.
                </AppText>
            </View>

            <View style={styles.searchSection}>
                <AppInput
                    placeholder="Search institutions, cities, diagnostics..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    containerStyle={styles.searchInput}
                    icon={<Ionicons name="search" size={20} color={Theme.Colors.textSecondary} />}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredLabs}
                    renderItem={renderLabItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="flask-outline" size={48} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">NO INSTITUTIONS FOUND</AppText>
                            <AppButton
                                title="Reset Synchronization"
                                onPress={() => setSearchQuery('')}
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

    heroSection: { paddingHorizontal: 24, marginBottom: 16 },
    searchSection: { paddingHorizontal: 24, marginBottom: 8 },
    searchInput: { height: 56, borderRadius: 20, backgroundColor: Theme.Colors.surface },

    listContent: { padding: 24, paddingTop: 16, paddingBottom: 40 },
    labCard: { marginBottom: 16, borderRadius: 28 },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    labIconContainer: { width: 72, height: 72, borderRadius: 20, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },
    labInfo: { flex: 1, marginLeft: 16 },
    labHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    typeBadge: { backgroundColor: Theme.Colors.primary + '12', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
    labLocation: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    homeCollectionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.success + '08', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
    chevronContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider, marginLeft: 12 },

    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyIconContainer: { width: 100, height: 100, borderRadius: 32, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Theme.Colors.divider },
});

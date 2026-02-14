import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { searchApi } from '@/services/search.api';
import { useDebounce } from '../../../utils/useDebounce';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';

const CATEGORIES = ['All', 'Doctors', 'Clinics', 'Labs'];

interface SearchResultItem {
    id: string;
    type: 'Doctor' | 'Clinic' | 'Lab';
    name: string;
    sub: string;
    rating: number;
    loc: string;
    verified: boolean;
}

export default function SearchScreen() {
    const [activeCat, setActiveCat] = useState('All');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedQuery = useDebounce(query, 500);

    const performSearch = useCallback(async (q: string, cat: string) => {
        try {
            setLoading(true);
            const res = await searchApi.search(q);
            if (res.success && res.data) {
                const combined: SearchResultItem[] = [];

                if (cat === 'All' || cat === 'Doctors') {
                    res.data.doctors.forEach((d: any) => combined.push({
                        id: d.id, type: 'Doctor', name: `Dr. ${d.lastName}`,
                        sub: d.specialties?.[0]?.specialty?.name || 'General Practitioner',
                        rating: 4.8, loc: '1.2 mi', verified: d.verificationStatus === 'APPROVED'
                    }));
                }
                if (cat === 'All' || cat === 'Clinics') {
                    res.data.clinics.forEach((c: any) => combined.push({
                        id: c.id, type: 'Clinic', name: c.name, sub: 'Medical Center',
                        rating: 4.7, loc: '0.8 mi', verified: c.verificationStatus === 'APPROVED'
                    }));
                }
                if (cat === 'All' || cat === 'Labs') {
                    res.data.labs.forEach((l: any) => combined.push({
                        id: l.id, type: 'Lab', name: l.name, sub: l.type,
                        rating: 4.5, loc: '2.5 mi', verified: l.verificationStatus === 'APPROVED'
                    }));
                }
                setResults(combined);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        performSearch(debouncedQuery, activeCat);
    }, [debouncedQuery, activeCat, performSearch]);

    const handlePress = (item: any) => {
        if (item.type === 'Doctor') {
            router.push({ pathname: '/(app)/doctor-profile', params: { id: item.id } });
        } else if (item.type === 'Clinic') {
            router.push({ pathname: '/(app)/clinic-public-profile', params: { id: item.id } });
        } else if (item.type === 'Lab') {
            router.push({ pathname: '/(app)/lab-public-profile', params: { id: item.id } });
        }
    };

    const renderItem = ({ item }: { item: SearchResultItem }) => (
        <AppCard
            style={styles.card}
            variant="elevated"
            padding="md"
            onPress={() => handlePress(item)}
        >
            <View style={styles.cardImagePlaceholder}>
                <AppText weight="black" color="primary" style={{ fontSize: 24 }}>{item.name[0]}</AppText>
            </View>
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <AppText weight="bold" numberOfLines={1} style={{ flex: 1 }}>{item.name}</AppText>
                    {item.verified && <Ionicons name="checkmark-circle" size={16} color={Theme.Colors.primary} style={{ marginLeft: 4 }} />}
                </View>
                <AppText variant="caption" color="textSecondary">{item.sub}</AppText>

                <View style={styles.metaRow}>
                    <Ionicons name="star" size={14} color={Theme.Colors.warning} />
                    <AppText weight="bold" style={{ fontSize: 13 }}>{item.rating}</AppText>
                    <View style={styles.dot} />
                    <Ionicons name="location-outline" size={12} color={Theme.Colors.textSecondary} />
                    <AppText variant="caption" color="textSecondary">{item.loc}</AppText>
                </View>
            </View>
            <AppButton
                title="Book"
                size="sm"
                variant="secondary"
                onPress={() => handlePress(item)}
            />
        </AppCard>
    );

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <AppText variant="title">Explore</AppText>
                <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => router.push({ pathname: '/(app)/explore-map', params: { q: query } })}
                >
                    <Ionicons name="map-outline" size={22} color={Theme.Colors.textInverted} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <AppInput
                    placeholder="Doctors, conditions, or clinics..."
                    value={query}
                    onChangeText={setQuery}
                    icon={<Ionicons name="search" size={20} color={Theme.Colors.textSecondary} />}
                />
            </View>

            <View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.catRow}
                >
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.catChip, activeCat === cat && styles.catChipActive]}
                            onPress={() => setActiveCat(cat)}
                        >
                            <AppText
                                weight="bold"
                                style={[styles.catText, activeCat === cat && styles.catTextActive]}
                            >
                                {cat}
                            </AppText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={results}
                renderItem={renderItem}
                keyExtractor={item => `${item.type}-${item.id}`}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="search-outline" size={48} color={Theme.Colors.divider} />
                        </View>
                        <AppText weight="bold" color="textSecondary" align="center">
                            {loading ? 'Searching...' : 'No results found.'}
                        </AppText>
                        <AppText variant="caption" color="textSecondary" align="center" style={{ marginTop: 4 }}>
                            {loading ? 'Hanging tight while we find matches' : 'Try searching for something else'}
                        </AppText>
                    </View>
                )}
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.lg,
        paddingTop: Theme.Spacing.lg,
        paddingBottom: Theme.Spacing.md,
    },
    mapBtn: {
        width: 44,
        height: 44,
        borderRadius: Theme.Radii.lg,
        backgroundColor: Theme.Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.Shadows.card,
    },
    searchContainer: {
        paddingHorizontal: Theme.Spacing.lg,
        marginBottom: Theme.Spacing.md,
    },
    catRow: {
        paddingHorizontal: Theme.Spacing.lg,
        paddingBottom: Theme.Spacing.md,
        gap: Theme.Spacing.sm,
    },
    catChip: {
        paddingHorizontal: Theme.Spacing.lg,
        paddingVertical: Theme.Spacing.sm,
        borderRadius: Theme.Radii.full,
        backgroundColor: Theme.Colors.surface,
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    catChipActive: {
        backgroundColor: Theme.Colors.primary,
        borderColor: Theme.Colors.primary,
    },
    catText: {
        color: Theme.Colors.textSecondary,
        fontSize: 14,
    },
    catTextActive: {
        color: Theme.Colors.textInverted,
    },
    list: {
        paddingHorizontal: Theme.Spacing.lg,
        paddingTop: Theme.Spacing.sm,
        paddingBottom: 100,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.Spacing.md,
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    cardImagePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: Theme.Radii.md,
        backgroundColor: Theme.Colors.overlayPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Theme.Spacing.md,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Theme.Colors.divider,
        marginHorizontal: 4,
    },
    emptyContainer: {
        marginTop: 80,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.Colors.overlaySubtle,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.Spacing.lg,
    },
});

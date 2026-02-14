import React from 'react';
import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchApi } from '@/services/search.api';
import Theme from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, AppCard } from '@/components/base';

const { width, height } = Dimensions.get('window');

const ALGIERS_REGION = {
    latitude: 36.7538,
    longitude: 3.0588,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

export default function ExploreMapScreen() {
    const { q } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [results, setResults] = useState<{ clinics: any[], labs: any[] }>({ clinics: [], labs: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadMarkers();
    }, [q]);

    const loadMarkers = async () => {
        try {
            setLoading(true);
            const res = await searchApi.search(q as string || '');
            if (res.success && res.data) {
                setResults({
                    clinics: res.data.clinics || [],
                    labs: res.data.labs || []
                });
            }
        } catch (error) {
            console.error('Map loading error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderMarker = (item: any, type: 'Clinic' | 'Lab') => {
        if (!item.latitude || !item.longitude) return null;

        const color = type === 'Clinic' ? Theme.Colors.primary : Theme.Colors.secondary;

        return (
            <Marker
                key={`${type}-${item.id}`}
                coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                pinColor={color}
            >
                <Callout
                    tooltip
                    onPress={() => {
                        const path = type === 'Clinic' ? '/(app)/clinic-public-profile' : '/(app)/lab-public-profile';
                        router.push({ pathname: path, params: { id: item.id } });
                    }}
                >
                    <View style={styles.callout}>
                        <View style={styles.calloutHeader}>
                            <AppText variant="title" style={styles.calloutTitle}>{item.name}</AppText>
                            <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
                                <AppText variant="caption" weight="black" style={{ color, fontSize: 10 }}>{type}</AppText>
                            </View>
                        </View>
                        <AppText variant="caption" color="textSecondary" numberOfLines={1} style={{ marginBottom: 8 }}>
                            {item.address || 'Medical Facility'}
                        </AppText>
                        <AppText variant="caption" color="primary" weight="bold">View Medical Profile</AppText>
                    </View>
                </Callout>
            </Marker>
        );
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={ALGIERS_REGION}
                userInterfaceStyle="light"
            >
                {results.clinics.map(c => renderMarker(c, 'Clinic'))}
                {results.labs.map(l => renderMarker(l, 'Lab'))}
            </MapView>

            <View style={[styles.headerOverlay, { top: insets.top + 10 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppCard style={styles.searchCard} padding="xs">
                    <View style={styles.searchCardContent}>
                        <Ionicons name="search" size={18} color={Theme.Colors.textSecondary} />
                        <AppText weight="bold" style={{ fontSize: 14 }}>
                            {q ? `Results for "${q}"` : 'Exploring Nearby Care'}
                        </AppText>
                    </View>
                </AppCard>
            </View>

            {loading && (
                <View style={[styles.loadingToast, { bottom: insets.bottom + 40 }]}>
                    <ActivityIndicator size="small" color={Theme.Colors.textInverted} style={{ marginRight: 10 }} />
                    <AppText color="textInverted" weight="bold" style={{ fontSize: 13 }}>
                        Synchronizing clinical data...
                    </AppText>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.Colors.background },
    map: { width, height },
    headerOverlay: {
        position: 'absolute',
        left: Theme.Spacing.lg,
        right: Theme.Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.Spacing.md
    },
    backBtn: {
        width: 48,
        height: 48,
        borderRadius: Theme.Radii.md,
        backgroundColor: Theme.Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.Shadows.floating,
    },
    searchCard: {
        flex: 1,
        height: 48,
        borderRadius: Theme.Radii.md,
        backgroundColor: Theme.Colors.surface,
        ...Theme.Shadows.floating,
    },
    searchCardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.md,
        gap: Theme.Spacing.sm,
    },
    callout: {
        width: 240,
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Radii.lg,
        padding: Theme.Spacing.md,
        borderWidth: 1,
        borderColor: Theme.Colors.divider
    },
    calloutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Theme.Spacing.sm
    },
    calloutTitle: {
        flex: 1,
        marginRight: Theme.Spacing.sm,
        color: Theme.Colors.text
    },
    typeBadge: {
        paddingHorizontal: Theme.Spacing.sm,
        paddingVertical: 2,
        borderRadius: Theme.Radii.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingToast: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: Theme.Colors.text,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.xl,
        paddingVertical: Theme.Spacing.md,
        borderRadius: Theme.Radii.full,
        ...Theme.Shadows.floating,
    },
});

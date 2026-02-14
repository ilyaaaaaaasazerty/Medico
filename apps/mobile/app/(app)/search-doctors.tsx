import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { searchApi } from '@/services/availability.api';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';

interface Doctor {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    consultationFee?: number;
    averageRating?: number;
    totalReviews: number;
    specialties: Array<{ id: string; name: string }>;
}

export default function SearchDoctorsScreen() {
    const [query, setQuery] = useState('');
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Load featured doctors on mount
        loadDoctors();
    }, []);

    const loadDoctors = async (searchQuery?: string) => {
        setLoading(true);
        setHasSearched(true);
        try {
            const res = await searchApi.searchDoctors({
                name: searchQuery || undefined,
                limit: 20,
            });
            if (res.success && res.data) {
                setDoctors(res.data.doctors);
            }
        } catch (error) {
            console.error('Error searching doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (query.trim()) {
            loadDoctors(query.trim());
        }
    };

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= Math.round(rating) ? "star" : "star-outline"}
                    size={14}
                    color={i <= Math.round(rating) ? "#FFD60A" : Theme.Colors.divider}
                    style={{ marginRight: 2 }}
                />
            );
        }
        return stars;
    };

    return (
        <AppScreen scrollable padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" align="center" style={{ flex: 1 }}>Find a Doctor</AppText>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.searchSection}>
                <AppInput
                    placeholder="Search by name or specialty..."
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    icon={<Ionicons name="search" size={20} color={Theme.Colors.textSecondary} />}
                    style={{ flex: 1 }}
                />
                <AppButton
                    variant="primary"
                    onPress={handleSearch}
                    style={styles.searchBtn}
                    title="Find"
                />
            </View>

            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Theme.Colors.primary} />
                    </View>
                ) : doctors.length === 0 && hasSearched ? (
                    <View style={styles.emptyContainer}>
                        <AppText style={styles.emptyIcon}>🔍</AppText>
                        <AppText variant="h3" align="center">No doctors found</AppText>
                        <AppText color="textSecondary" align="center">Try a different search term</AppText>
                    </View>
                ) : (
                    doctors.map((doctor) => (
                        <AppCard
                            key={doctor.id}
                            padding="md"
                            onPress={() => router.push(`/(app)/doctor-profile?id=${doctor.id}`)}
                            style={styles.doctorCard}
                        >
                            <View style={styles.doctorImageContainer}>
                                {doctor.avatarUrl ? (
                                    <Image source={{ uri: doctor.avatarUrl }} style={styles.doctorImage} />
                                ) : (
                                    <View style={styles.doctorImagePlaceholder}>
                                        <AppText weight="black" color="primary" style={{ fontSize: 20 }}>
                                            {doctor.firstName[0]}{doctor.lastName[0]}
                                        </AppText>
                                    </View>
                                )}
                            </View>
                            <View style={styles.doctorInfo}>
                                <AppText weight="bold" style={{ fontSize: 16 }}>
                                    Dr. {doctor.firstName} {doctor.lastName}
                                </AppText>
                                {doctor.specialties.length > 0 && (
                                    <AppText variant="caption" color="textSecondary">
                                        {doctor.specialties.map((s) => s.name).join(', ')}
                                    </AppText>
                                )}
                                <View style={styles.ratingRow}>
                                    <View style={styles.stars}>{renderStars(doctor.averageRating || 0)}</View>
                                    <AppText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                                        ({doctor.totalReviews})
                                    </AppText>
                                </View>
                                {doctor.consultationFee && (
                                    <AppText weight="black" color="success" style={{ fontSize: 14, marginTop: 4 }}>
                                        {doctor.consultationFee} DA
                                    </AppText>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={Theme.Colors.divider} />
                        </AppCard>
                    ))
                )}
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.lg,
        paddingVertical: Theme.Spacing.md,
    },
    backCircle: {
        width: 44,
        height: 44,
        borderRadius: Theme.Radii.full,
        backgroundColor: Theme.Colors.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: Theme.Spacing.lg,
        gap: Theme.Spacing.sm,
        marginBottom: Theme.Spacing.md,
        alignItems: 'center',
    },
    searchBtn: {
        width: 80,
        height: 52,
        borderRadius: Theme.Radii.md,
    },
    content: {
        flex: 1,
        paddingHorizontal: Theme.Spacing.lg,
    },
    loadingContainer: {
        paddingTop: 100,
        alignItems: 'center',
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
        gap: Theme.Spacing.sm,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: Theme.Spacing.md,
    },
    doctorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Radii.xl,
        marginBottom: Theme.Spacing.md,
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
        ...Theme.Shadows.floating,
    },
    doctorImageContainer: {
        marginRight: Theme.Spacing.md,
    },
    doctorImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    doctorImagePlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Theme.Colors.overlayPrimary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doctorInfo: {
        flex: 1,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    stars: {
        flexDirection: 'row',
    },
});

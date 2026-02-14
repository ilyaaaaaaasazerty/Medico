import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { LinearGradient } from 'expo-linear-gradient';

export default function TestDetailScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { name, category, description, instructions, price, turnaroundHours, labId, labName } = params;

    const handleBook = () => {
        router.push({
            pathname: '/labs/select-slot',
            params: { testId: params.id, testName: name, price, labId, labName }
        });
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Parameters</AppText>
                <TouchableOpacity style={styles.circleBtn}>
                    <Ionicons name="bookmark-outline" size={20} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <AppCard padding="lg" style={styles.mainInfoCard}>
                    <View style={styles.categoryBadge}>
                        <AppText variant="caption" weight="black" style={{ color: Theme.Colors.primary, fontSize: 10 }}>{category?.toString().toUpperCase()}</AppText>
                    </View>
                    <AppText variant="h2" weight="black" style={{ marginTop: 16 }}>{name?.toString().toUpperCase()}</AppText>
                    <AppText variant="body" color="textSecondary" weight="black" style={{ marginTop: 4 }}>OFFERED BY: {labName?.toString().toUpperCase()}</AppText>

                    <View style={styles.metaGrid}>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={20} color={Theme.Colors.primary} />
                            <AppText variant="body" weight="black" style={{ marginTop: 8 }}>{turnaroundHours || 24}H</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>TURNAROUND</AppText>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={Theme.Colors.primary} />
                            <AppText variant="body" weight="black" style={{ marginTop: 8 }}>ISO</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>VALIDATION</AppText>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}>
                            <Ionicons name="document-text-outline" size={20} color={Theme.Colors.primary} />
                            <AppText variant="body" weight="black" style={{ marginTop: 8 }}>DIGITAL</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>DELIVERY</AppText>
                        </View>
                    </View>
                </AppCard>

                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" style={styles.sectionLabel}>DIAGNOSTIC SCOPE</AppText>
                    <AppText variant="body" color="textSecondary" weight="bold" style={styles.descriptionText}>
                        {description || "This laboratory test is performed using high-precision automated systems to ensure accurate results for clinical diagnosis and monitoring."}
                    </AppText>
                </View>

                <View style={styles.preparationContainer}>
                    <LinearGradient colors={[Theme.Colors.warning + '12', Theme.Colors.warning + '05']} style={styles.preparationCard}>
                        <View style={styles.prepHeader}>
                            <Ionicons name="alert-circle" size={20} color={Theme.Colors.warning} />
                            <AppText variant="body" weight="black" style={{ color: Theme.Colors.warning, marginLeft: 12 }}>PREREQUISITE PROTOCOL</AppText>
                        </View>
                        <AppText variant="body" weight="bold" style={styles.instructionsText}>
                            {instructions || "• 10-12 hours fasting required\n• Water is allowed during fasting\n• Avoid strenuous exercise before the test"}
                        </AppText>
                    </LinearGradient>
                </View>

                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" style={styles.sectionLabel}>PROTOCOL INCLUSIONS</AppText>
                    {['Authorized Sample Collection', 'High-Fidelity Laboratory Analysis', 'Encrypted Digital Reporting', 'Clinical Data Synchronization'].map((item, idx) => (
                        <View key={idx} style={styles.checkItem}>
                            <View style={styles.checkIcon}>
                                <Ionicons name="checkmark" size={12} color={Theme.Colors.success} />
                            </View>
                            <AppText variant="body" weight="black" style={{ fontSize: 13, flex: 1 }}>{item.toUpperCase()}</AppText>
                        </View>
                    ))}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.bottomBar}>
                <View style={styles.priceContainer}>
                    <AppText variant="caption" color="textSecondary" weight="black">TOTAL CLEARANCE</AppText>
                    <AppText variant="h2" weight="black" color="primary">{price} DZD</AppText>
                </View>
                <AppButton
                    title="ALLOCATE TEMPORAL SLOT"
                    onPress={handleBook}
                    style={styles.bookButton}
                    icon={<Ionicons name="calendar" size={20} color="white" />}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24, paddingTop: 8 },
    mainInfoCard: { borderRadius: 32, marginBottom: 32 },
    categoryBadge: { backgroundColor: Theme.Colors.primary + '12', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
    metaGrid: { flexDirection: 'row', marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    metaItem: { flex: 1, alignItems: 'center' },
    metaDivider: { width: 1, height: 40, backgroundColor: Theme.Colors.divider },

    section: { marginBottom: 32 },
    sectionLabel: { fontSize: 9, marginBottom: 12, letterSpacing: 1 },
    descriptionText: { lineHeight: 24 },

    preparationContainer: { marginBottom: 32 },
    preparationCard: { padding: 24, borderRadius: 28, borderWidth: 1, borderColor: Theme.Colors.warning + '20' },
    prepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    instructionsText: { lineHeight: 22 },

    checkItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    checkIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: Theme.Colors.success + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: Theme.Colors.background, borderTopWidth: 1, borderTopColor: Theme.Colors.divider, flexDirection: 'row', gap: 20, alignItems: 'center' },
    priceContainer: { flex: 1 },
    bookButton: { flex: 2, height: 60, borderRadius: 20, backgroundColor: Theme.Colors.text },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Platform, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { labApi } from '@/services/lab.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface LabProfile {
    id: string;
    name: string;
    address: string;
    city: string;
    homeCollection: boolean;
    logoUrl?: string;
    workingHours: any[];
    tests: any[];
}

export default function LabProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [lab, setLab] = useState<LabProfile | null>(null);
    const [activeTab, setActiveTab] = useState<'TESTS' | 'PACKAGES'>('TESTS');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadLabDetails();
    }, [id]);

    const loadLabDetails = async () => {
        try {
            const res = await labApi.getPublicProfile(id!);
            if (res.success && res.data) {
                setLab(res.data);
            }
        } catch (error) {
            console.error('Error loading institution command center:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (!lab) return null;

    const filteredTests = lab.tests?.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <AppScreen padding={false}>
            <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
                {/* Hero Area */}
                <View style={styles.heroContainer}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=2070&auto=format&fit=crop' }}
                        style={styles.heroImage}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                        style={styles.heroGradient}
                    />

                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                            <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity style={styles.circleBtn}>
                                <Ionicons name="share-social-outline" size={22} color={Theme.Colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.circleBtn}>
                                <Ionicons name="heart-outline" size={22} color={Theme.Colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.heroContent}>
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={12} color={Theme.Colors.success} />
                            <AppText variant="caption" weight="black" style={{ color: Theme.Colors.success, fontSize: 8, marginLeft: 4 }}>ISO CERTIFIED INSTITUTION</AppText>
                        </View>
                        <AppText variant="h1" weight="black" style={{ color: 'white' }}>{lab.name.toUpperCase()}</AppText>
                        <AppText variant="caption" weight="bold" style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                            {lab.city} • {lab.address}
                        </AppText>
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <AppText variant="body" weight="black" color="primary">4.8</AppText>
                        <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>RATING</AppText>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <AppText variant="body" weight="black" color="primary">24H</AppText>
                        <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>AVG REPORT</AppText>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <AppText variant="body" weight="black" color="primary">{lab.homeCollection ? 'YES' : 'NO'}</AppText>
                        <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>HOME COLL.</AppText>
                    </View>
                </View>

                {/* Tabs & Search Header (Sticky) */}
                <View style={styles.stickyHeader}>
                    <View style={styles.tabsContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'TESTS' && styles.activeTab]}
                            onPress={() => setActiveTab('TESTS')}
                        >
                            <AppText variant="caption" weight="black" style={{ color: activeTab === 'TESTS' ? 'white' : Theme.Colors.textSecondary }}>TEST MENU</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'PACKAGES' && styles.activeTab]}
                            onPress={() => setActiveTab('PACKAGES')}
                        >
                            <AppText variant="caption" weight="black" style={{ color: activeTab === 'PACKAGES' ? 'white' : Theme.Colors.textSecondary }}>WELLNESS PACKS</AppText>
                        </TouchableOpacity>
                    </View>
                    <AppInput
                        placeholder="Search diagnostics..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        containerStyle={styles.searchBar}
                        icon={<Ionicons name="search" size={18} color={Theme.Colors.textSecondary} />}
                    />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {activeTab === 'TESTS' ? (
                        <View style={styles.testsGrid}>
                            {filteredTests?.map(test => (
                                <AppCard
                                    key={test.id}
                                    padding="none"
                                    style={styles.testCard}
                                    onPress={() => router.push({
                                        pathname: '/labs/test-detail',
                                        params: { ...test, labId: lab.id, labName: lab.name }
                                    })}
                                >
                                    <View style={styles.testCardContent}>
                                        <View style={{ flex: 1, marginRight: 16 }}>
                                            <AppText variant="body" weight="black" uppercase>{test.name}</AppText>
                                            <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 2 }}>ISO: {test.category}</AppText>
                                            <View style={styles.tatRow}>
                                                <Ionicons name="time-outline" size={10} color={Theme.Colors.textSecondary} />
                                                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9, marginLeft: 4 }}>{test.turnaroundHours || 24}H TURNAROUND</AppText>
                                            </View>
                                        </View>
                                        <View style={styles.testAction}>
                                            <AppText variant="body" weight="black" color="primary">{test.price} DZD</AppText>
                                            <View style={styles.miniBtn}>
                                                <Ionicons name="chevron-forward" size={14} color="white" />
                                            </View>
                                        </View>
                                    </View>
                                </AppCard>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.packageSection}>
                            <AppCard padding="none" style={styles.promoCard}>
                                <LinearGradient colors={[Theme.Colors.primary, Theme.Colors.primary + 'CC']} style={styles.promoGradient}>
                                    <View style={styles.promoHeader}>
                                        <View style={styles.bestValueBadge}>
                                            <AppText variant="caption" weight="black" style={{ color: 'white', fontSize: 8 }}>VALUE PROTOCOL</AppText>
                                        </View>
                                        <AppText variant="h3" weight="black" style={{ color: 'white' }}>Institutional Wellness</AppText>
                                    </View>
                                    <View style={styles.promoPoints}>
                                        <AppText variant="caption" weight="bold" style={{ color: 'rgba(255,255,255,0.8)' }}>• Full Body Parametric Audit</AppText>
                                        <AppText variant="caption" weight="bold" style={{ color: 'rgba(255,255,255,0.8)' }}>• Priority Sample Allocation</AppText>
                                        <AppText variant="caption" weight="bold" style={{ color: 'rgba(255,255,255,0.8)' }}>• Specialist Report Validation</AppText>
                                    </View>
                                    <AppButton title="View Full Package" style={styles.promoBtn} textStyle={{ color: Theme.Colors.primary }} />
                                </LinearGradient>
                            </AppCard>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.inquireBtn}>
                    <Ionicons name="chatbubbles-outline" size={20} color={Theme.Colors.primary} />
                    <AppText variant="caption" weight="black" color="primary" style={{ marginLeft: 8 }}>INQUIRE</AppText>
                </TouchableOpacity>
                <AppButton
                    title="Choose Diagnostic to Book"
                    onPress={() => setActiveTab('TESTS')}
                    style={styles.mainBookBtn}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    heroContainer: { height: 320, position: 'relative' },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 },
    headerActions: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
    heroContent: { position: 'absolute', bottom: 30, left: 24, right: 24 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.success + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 12 },

    statsRow: { flexDirection: 'row', padding: 20, backgroundColor: Theme.Colors.surface, marginHorizontal: 24, borderRadius: 24, marginTop: -32, borderWidth: 1, borderColor: Theme.Colors.divider, alignItems: 'center' },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: 30, backgroundColor: Theme.Colors.divider },

    stickyHeader: { backgroundColor: Theme.Colors.background, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
    tabsContainer: { flexDirection: 'row', backgroundColor: Theme.Colors.surface, borderRadius: 16, padding: 6, marginBottom: 16 },
    tab: { flex: 1, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
    activeTab: { backgroundColor: Theme.Colors.primary },
    searchBar: { height: 50, borderRadius: 16, backgroundColor: Theme.Colors.surface },

    content: { paddingHorizontal: 24, paddingBottom: 140 },
    testsGrid: { gap: 12 },
    testCard: { borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
    testCardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    tatRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    testAction: { alignItems: 'flex-end', gap: 8 },
    miniBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center' },

    packageSection: { marginTop: 8 },
    promoCard: { borderRadius: 32, overflow: 'hidden' },
    promoGradient: { padding: 32 },
    promoHeader: { marginBottom: 24 },
    bestValueBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
    promoPoints: { marginBottom: 32 },
    promoBtn: { backgroundColor: 'white', borderRadius: 16, height: 56 },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: Theme.Colors.background, borderTopWidth: 1, borderTopColor: Theme.Colors.divider, flexDirection: 'row', gap: 16 },
    inquireBtn: { height: 60, width: 120, borderRadius: 20, borderWidth: 1, borderColor: Theme.Colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    mainBookBtn: { flex: 1, height: 60, borderRadius: 20, backgroundColor: Theme.Colors.text },
});

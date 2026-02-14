import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Image, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { searchApi, LabProfile } from '@/services/search.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { LinearGradient } from 'expo-linear-gradient';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function LabPublicProfileScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [lab, setLab] = useState<LabProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLab();
    }, [id]);

    const loadLab = async () => {
        try {
            const res = await searchApi.getLabProfile(id as string);
            if (res.success && res.data) {
                setLab(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical diagnostic profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = () => {
        if (lab?.phone) {
            Linking.openURL(`tel:${lab.phone}`);
        }
    };

    const handleEmail = () => {
        if (lab?.email) {
            Linking.openURL(`mailto:${lab.email}`);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (!lab) {
        return (
            <AppScreen padding style={styles.center}>
                <Ionicons name="alert-circle-outline" size={64} color={Theme.Colors.textSecondary} />
                <AppText variant="h3" weight="black" style={{ marginTop: 24 }}>ASSET NOT FOUND</AppText>
                <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: 12, opacity: 0.7 }}>
                    This clinical laboratory record is temporarily unavailable or has been decommissioned from the institutional network.
                </AppText>
                <AppButton
                    title="RETURN TO DIRECTORY"
                    variant="tonal"
                    onPress={() => router.back()}
                    style={{ marginTop: 32, width: '70%', height: 56, borderRadius: 16 }}
                />
            </AppScreen>
        );
    }

    return (
        <AppScreen padding={false}>
            <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
                <View style={styles.heroSection}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1579152276506-2d501d9bea8e?q=80&w=2670&auto=format&fit=crop' }}
                        style={styles.heroBg}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.7)', 'transparent', Theme.Colors.background]}
                        locations={[0, 0.4, 0.98]}
                        style={styles.heroOverlay}
                    />

                    <View style={styles.topNav}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.glassBtn}>
                            <Ionicons name="chevron-back" size={24} color="white" />
                        </TouchableOpacity>
                        <View style={styles.topRightIcons}>
                            <TouchableOpacity style={styles.glassBtn}>
                                <Ionicons name="heart-outline" size={22} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.glassBtn}>
                                <Ionicons name="share-social-outline" size={22} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.heroContent}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarMain}>
                                <AppText variant="hero" style={{ fontSize: 36 }}>🧪</AppText>
                            </View>
                            {lab.verificationStatus === 'VERIFIED' && (
                                <View style={styles.verifiedTag}>
                                    <Ionicons name="shield-checkmark" size={14} color="white" />
                                </View>
                            )}
                        </View>
                        <View style={styles.identityGroup}>
                            <AppText variant="h1" weight="black" style={{ color: Theme.Colors.text, textShadowColor: 'rgba(255,255,255,0.5)', textShadowRadius: 10 }}>{lab.name}</AppText>
                            <View style={styles.classificationRow}>
                                <View style={styles.typeBadge}>
                                    <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 8 }}>DIAGNOSTIC COMPLEX</AppText>
                                </View>
                                {lab.homeCollection && (
                                    <View style={styles.homeBadge}>
                                        <Ionicons name="home" size={10} color="white" />
                                        <AppText variant="caption" weight="black" style={{ color: 'white', fontSize: 8 }}>HOME INTAKE OPS</AppText>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.quickStatsRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                        <StatTile label="LOCATION" value={lab.city.toUpperCase()} icon="location-outline" />
                        <StatTile label="OPERATIONAL" value="4.9/5.0" icon="star-outline" />
                        <StatTile label="PARAMETER CAPACITY" value={String(lab.tests?.length || 0)} icon="flask-outline" />
                        <StatTile label="INTAKE TYPE" value={lab.homeCollection ? "HYBRID" : "FACILITY-ONLY"} icon="business-outline" />
                    </ScrollView>
                </View>

                <View style={styles.mainContainer}>
                    {lab.description && (
                        <View style={styles.section}>
                            <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Institutional Mission</AppText>
                            <AppCard padding="lg" style={styles.descriptionCard}>
                                <AppText variant="body" color="textSecondary" weight="bold" style={{ lineHeight: 24 }}>
                                    {lab.description}
                                </AppText>
                            </AppCard>
                        </View>
                    )}

                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Facility Logistics</AppText>
                        <AppCard padding="none" style={styles.logisticsCard}>
                            <View style={styles.logisticsHeader}>
                                <View style={styles.locIconBox}>
                                    <Ionicons name="map-outline" size={24} color={Theme.Colors.primary} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>{lab.address}</AppText>
                                    <AppText variant="caption" color="textSecondary" weight="bold">Diagnostic Complex Site</AppText>
                                </View>
                            </View>
                            <View style={styles.logisticsActions}>
                                <TouchableOpacity style={styles.logActionBtn} onPress={handleCall}>
                                    <Ionicons name="call-outline" size={20} color={Theme.Colors.primary} />
                                    <AppText variant="caption" color="primary" weight="black" style={{ marginLeft: 10, fontSize: 9 }}>DIAL FACILITY</AppText>
                                </TouchableOpacity>
                                <View style={styles.actionDivider} />
                                <TouchableOpacity style={styles.logActionBtn} onPress={handleEmail}>
                                    <Ionicons name="mail-outline" size={20} color={Theme.Colors.primary} />
                                    <AppText variant="caption" color="primary" weight="black" style={{ marginLeft: 10, fontSize: 9 }}>EMAIL PROTOCOL</AppText>
                                </TouchableOpacity>
                            </View>
                        </AppCard>
                    </View>

                    <View style={styles.section}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Operational Temporal Protocol</AppText>
                        <AppCard padding="lg" style={styles.hoursCard}>
                            {lab.workingHours?.map((h, idx) => (
                                <View key={idx} style={[styles.hourRow, idx !== 0 && styles.hourDivider]}>
                                    <AppText variant="body" weight="black" uppercase style={{ fontSize: 12 }}>{DAYS[h.dayOfWeek]}</AppText>
                                    <View style={[styles.timeBadge, { backgroundColor: h.isClosed ? Theme.Colors.error + '10' : Theme.Colors.primary + '05' }]}>
                                        <AppText variant="caption" color={h.isClosed ? 'error' : 'primary'} weight="black" style={{ fontSize: 9 }}>
                                            {h.isClosed ? 'DECOMMISSIONED' : `${h.openTime} - ${h.closeTime}`}
                                        </AppText>
                                    </View>
                                </View>
                            ))}
                        </AppCard>
                    </View>

                    {lab.tests?.length > 0 && (
                        <View style={[styles.section, { marginBottom: 140 }]}>
                            <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Diagnostic Parameter Directory ({lab.tests.length})</AppText>
                            {lab.tests.map(test => (
                                <AppCard key={test.id} style={styles.testCard} padding="none">
                                    <View style={styles.testMain}>
                                        <View style={styles.testInfo}>
                                            <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>{test.name}</AppText>
                                            <View style={styles.testTagRow}>
                                                <View style={styles.testCategoryTag}>
                                                    <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 8 }}>{test.category.toUpperCase()}</AppText>
                                                </View>
                                                <View style={styles.testIdTag}>
                                                    <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>RID: #{test.id.slice(-4).toUpperCase()}</AppText>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.testPriceBox}>
                                            <AppText variant="body" weight="black" color="primary">{test.price}</AppText>
                                            <AppText variant="caption" weight="black" color="primary" style={{ fontSize: 8, marginLeft: 2 }}>DA</AppText>
                                        </View>
                                    </View>
                                    {test.turnaroundTime && (
                                        <View style={styles.testFooter}>
                                            <View style={styles.timelineGroup}>
                                                <Ionicons name="time-outline" size={14} color={Theme.Colors.textSecondary} />
                                                <AppText variant="caption" color="textSecondary" weight="black" style={{ marginLeft: 6, fontSize: 9 }}>OUTCOME GENERATION: {test.turnaroundTime}H</AppText>
                                            </View>
                                            <Ionicons name="chevron-forward" size={14} color={Theme.Colors.divider} />
                                        </View>
                                    )}
                                </AppCard>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.stickyAction}>
                <LinearGradient
                    colors={[Theme.Colors.background + '00', Theme.Colors.background]}
                    style={styles.actionGradient}
                />
                <View style={styles.actionContent}>
                    <TouchableOpacity style={styles.mainIntakeBtn}>
                        <AppText variant="body" weight="black" style={{ color: 'white', letterSpacing: 1 }}>INITIATE CLINICAL INTAKE</AppText>
                        <View style={styles.intakeIcon}>
                            <Ionicons name="arrow-forward" size={20} color={Theme.Colors.primary} />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </AppScreen>
    );
}

function StatTile({ label, value, icon }: any) {
    return (
        <View style={styles.statTile}>
            <View style={styles.statTileIcon}>
                <Ionicons name={icon} size={18} color={Theme.Colors.primary} />
            </View>
            <View style={{ marginLeft: 12 }}>
                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>{label}</AppText>
                <AppText variant="body" weight="black" style={{ fontSize: 13, marginTop: 1 }}>{value}</AppText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    heroSection: { height: 420, position: 'relative' },
    heroBg: { width: '100%', height: '100%' },
    heroOverlay: { ...StyleSheet.absoluteFillObject },
    topNav: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
    topRightIcons: { flexDirection: 'row', gap: 12 },
    glassBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    heroContent: { position: 'absolute', bottom: 40, left: 24, right: 24, flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { position: 'relative' },
    avatarMain: { width: 100, height: 100, borderRadius: 36, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, borderWidth: 4, borderColor: Theme.Colors.background },
    verifiedTag: { position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: Theme.Colors.success, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
    identityGroup: { marginLeft: 24, flex: 1 },
    classificationRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    typeBadge: { backgroundColor: Theme.Colors.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Theme.Colors.primary + '20' },
    homeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.Colors.text, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

    quickStatsRow: { backgroundColor: Theme.Colors.background, paddingTop: 12, paddingBottom: 24 },
    statsScroll: { paddingHorizontal: 24, gap: 16 },
    statTile: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.surface, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
    statTileIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },

    mainContainer: { paddingHorizontal: 24 },
    section: { marginBottom: 40 },
    sectionTitle: { marginBottom: 16, letterSpacing: 1 },
    descriptionCard: { borderRadius: 32 },
    logisticsCard: { borderRadius: 32, overflow: 'hidden' },
    logisticsHeader: { flexDirection: 'row', alignItems: 'center', padding: 22, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    locIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },
    logisticsActions: { flexDirection: 'row', height: 60 },
    logActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.Colors.surface },
    actionDivider: { width: 1, height: '40%', backgroundColor: Theme.Colors.divider, alignSelf: 'center' },

    hoursCard: { borderRadius: 32 },
    hourRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    hourDivider: { borderTopWidth: 1, borderTopColor: Theme.Colors.divider, paddingTop: 12 },
    timeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },

    testCard: { marginBottom: 16, borderRadius: 28 },
    testMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 22 },
    testInfo: { flex: 1 },
    testTagRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    testCategoryTag: { backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    testIdTag: { opacity: 0.5 },
    testPriceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    testFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingBottom: 18 },
    timelineGroup: { flexDirection: 'row', alignItems: 'center' },

    stickyAction: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    actionGradient: { height: 100 },
    actionContent: { backgroundColor: Theme.Colors.background, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24 },
    mainIntakeBtn: { height: 68, backgroundColor: Theme.Colors.text, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    intakeIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', position: 'absolute', right: 8 },
});

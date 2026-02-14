import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Image, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import Theme from '@/constants/Theme';
import { searchApi, ClinicProfile } from '@/services/search.api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ClinicPublicProfileScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [clinic, setClinic] = useState<ClinicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'DOCTORS' | 'SERVICES' | 'INFO'>('DOCTORS');

    useEffect(() => {
        loadClinic();
    }, [id]);

    const loadClinic = async () => {
        try {
            const res = await searchApi.getClinicProfile(id as string);
            if (res.success && res.data) {
                setClinic(res.data);
            }
        } catch (error) {
            console.error('Error loading clinic:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = () => {
        if (clinic?.phone) Linking.openURL(`tel:${clinic.phone}`);
    };

    const handleEmail = () => {
        if (clinic?.email) Linking.openURL(`mailto:${clinic.email}`);
    };

    const handleWebsite = () => {
        if (clinic?.website) Linking.openURL(clinic.website);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (!clinic) {
        return (
            <AppScreen safeArea padding scrollable={false} style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={64} color={Theme.Colors.textSecondary} />
                <AppText variant="h3" style={{ marginTop: 16 }}>Clinic Not Found</AppText>
                <AppText variant="body" color="textSecondary" style={{ marginTop: 8 }}>This clinic info is currently unavailable.</AppText>
                <AppButton
                    title="Go Back"
                    variant="secondary"
                    onPress={() => router.back()}
                    style={{ marginTop: 24, width: '60%' }}
                />
            </AppScreen>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: Theme.Colors.background }}>
            <AppScreen
                padding={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Hero Header */}
                <View style={styles.headerImageContainer}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2653&auto=format&fit=crop' }}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.4)', 'transparent', Theme.Colors.background]}
                        locations={[0, 0.4, 0.95]}
                        style={styles.gradientOverlay}
                    />

                    {/* Navbar */}
                    <View style={styles.topNav}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                            <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                        </TouchableOpacity>
                        <View style={styles.topRightIcons}>
                            <TouchableOpacity style={styles.iconBtn}>
                                <Ionicons name="heart-outline" size={24} color={Theme.Colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn}>
                                <Ionicons name="share-social-outline" size={24} color={Theme.Colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Clinic Info */}
                    <View style={styles.heroContent}>
                        <View style={styles.avatarRow}>
                            <View style={styles.avatar}>
                                <AppText style={{ fontSize: 32 }}>🏥</AppText>
                            </View>
                            <View style={styles.nameSection}>
                                <AppText variant="hero">{clinic.name}</AppText>
                                <AppText variant="body" color="textSecondary" style={{ fontWeight: '600' }}>{clinic.city}</AppText>
                                {clinic.verificationStatus === 'VERIFIED' && (
                                    <View style={styles.verifiedBadge}>
                                        <Ionicons name="checkmark-circle" size={14} color={Theme.Colors.success} />
                                        <AppText variant="caption" style={styles.verifiedText}>Verified Clinic</AppText>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Stats Card */}
                <AppCard style={styles.statsCard} padding="sm">
                    <View style={styles.statItem}>
                        <Ionicons name="people" size={20} color={Theme.Colors.primary} />
                        <View>
                            <AppText variant="body" weight="black">{clinic.doctors?.length || 0}</AppText>
                            <AppText variant="caption" color="textSecondary">Doctors</AppText>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Ionicons name="time" size={20} color={clinic.is24Hours ? Theme.Colors.success : Theme.Colors.warning} />
                        <View>
                            <AppText variant="body" weight="black">{clinic.is24Hours ? '24/7' : 'Standard'}</AppText>
                            <AppText variant="caption" color="textSecondary">Hours</AppText>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Ionicons name="star" size={20} color={Theme.Colors.accent} />
                        <View>
                            <AppText variant="body" weight="black">4.9</AppText>
                            <AppText variant="caption" color="textSecondary">Rating</AppText>
                        </View>
                    </View>
                </AppCard>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    {['DOCTORS', 'SERVICES', 'INFO'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab as any)}
                        >
                            <AppText
                                variant="caption"
                                weight="bold"
                                color={activeTab === tab ? 'textInverted' : 'textSecondary'}
                            >
                                {tab.charAt(0) + tab.slice(1).toLowerCase()}
                            </AppText>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* DOCTORS TAB */}
                {activeTab === 'DOCTORS' && (
                    <View style={styles.contentSection}>
                        {clinic.doctors?.length > 0 ? clinic.doctors.map(doc => (
                            <TouchableOpacity
                                key={doc.id}
                                onPress={() => router.push({ pathname: '/(app)/doctor-profile', params: { id: doc.id } })}
                            >
                                <AppCard style={styles.doctorCard} padding="md">
                                    <View style={styles.docAvatar}>
                                        <AppText weight="black" style={{ color: Theme.Colors.primary }}>
                                            {doc.firstName[0]}{doc.lastName[0]}
                                        </AppText>
                                    </View>
                                    <View style={styles.docInfo}>
                                        <AppText variant="body" weight="bold">Dr.{doc.firstName} {doc.lastName}</AppText>
                                        <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                                            {doc.specialties?.map((s: any) => s.specialty?.name).join(', ') || 'General'}
                                        </AppText>
                                    </View>
                                    <View style={styles.bookBtnSmall}>
                                        <AppText variant="caption" weight="black" style={{ color: Theme.Colors.primary }}>BOOK</AppText>
                                    </View>
                                </AppCard>
                            </TouchableOpacity>
                        )) : (
                            <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: 40 }}>No doctors available.</AppText>
                        )}
                    </View>
                )}

                {/* SERVICES TAB */}
                {activeTab === 'SERVICES' && (
                    <View style={styles.contentSection}>
                        {clinic.services?.length > 0 ? clinic.services.map(svc => (
                            <AppCard key={svc.id} style={styles.serviceCard} padding="md">
                                <View style={styles.serviceInfo}>
                                    <View style={styles.serviceIcon}>
                                        <Ionicons name="medkit-outline" size={20} color={Theme.Colors.primary} />
                                    </View>
                                    <AppText variant="body" weight="bold">{svc.name}</AppText>
                                </View>
                                <AppText variant="h3" style={{ color: Theme.Colors.success }}>{svc.price} DZD</AppText>
                            </AppCard>
                        )) : (
                            <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: 40 }}>No services listed.</AppText>
                        )}
                    </View>
                )}

                {/* INFO TAB */}
                {activeTab === 'INFO' && (
                    <View style={styles.contentSection}>
                        {clinic.description && (
                            <View style={styles.infoBlock}>
                                <AppText variant="title">About</AppText>
                                <AppText variant="body" color="textSecondary" style={styles.description}>{clinic.description}</AppText>
                            </View>
                        )}

                        <View style={styles.infoBlock}>
                            <AppText variant="title">Contact</AppText>
                            <View style={styles.contactRow}>
                                <TouchableOpacity style={styles.contactBtn} onPress={handleCall}>
                                    <Ionicons name="call-outline" size={24} color={Theme.Colors.primary} />
                                    <AppText variant="caption" weight="bold" style={{ marginTop: 8 }}>Call</AppText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.contactBtn} onPress={handleEmail}>
                                    <Ionicons name="mail-outline" size={24} color={Theme.Colors.primary} />
                                    <AppText variant="caption" weight="bold" style={{ marginTop: 8 }}>Email</AppText>
                                </TouchableOpacity>
                                {clinic.website && (
                                    <TouchableOpacity style={styles.contactBtn} onPress={handleWebsite}>
                                        <Ionicons name="globe-outline" size={24} color={Theme.Colors.primary} />
                                        <AppText variant="caption" weight="bold" style={{ marginTop: 8 }}>Website</AppText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.infoBlock}>
                            <AppText variant="title">Working Hours</AppText>
                            <AppCard padding="md" variant="outline">
                                {clinic.is24Hours ? (
                                    <View style={styles.hourRow}>
                                        <AppText variant="body" weight="bold">Every Day</AppText>
                                        <AppText variant="body" weight="black" style={{ color: Theme.Colors.success }}>Open 24 Hours</AppText>
                                    </View>
                                ) : (
                                    clinic.workingHours?.map((h, idx) => (
                                        <View key={idx} style={[styles.hourRow, idx === clinic.workingHours.length - 1 && { borderBottomWidth: 0 }]}>
                                            <AppText variant="body" weight="bold">{DAYS[h.dayOfWeek]}</AppText>
                                            <AppText
                                                variant="body"
                                                color={h.isClosed ? 'error' : 'textSecondary'}
                                                weight="bold"
                                            >
                                                {h.isClosed ? 'Closed' : `${h.openTime} - ${h.closeTime}`}
                                            </AppText>
                                        </View>
                                    ))
                                )}
                            </AppCard>
                        </View>
                    </View>
                )}
            </AppScreen>

            <View style={styles.bottomBar}>
                <AppButton
                    title="Chat with Clinic"
                    variant="secondary"
                    style={styles.chatButton}
                />
                <AppButton
                    title="Call Now"
                    onPress={handleCall}
                    style={styles.callButton}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: { justifyContent: 'center', alignItems: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },

    // Header
    headerImageContainer: { height: 320, position: 'relative' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    gradientOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%' },
    topNav: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 10 },
    topRightIcons: { flexDirection: 'row', gap: 12 },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.Shadows.floating,
    },

    // Hero Content
    heroContent: { position: 'absolute', bottom: 32, left: 24, right: 24 },
    avatarRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 28,
        backgroundColor: Theme.Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: Theme.Colors.background,
        ...Theme.Shadows.floating,
    },
    nameSection: { marginLeft: 16, flex: 1 },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: Theme.Colors.success + '15',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12
    },
    verifiedText: { color: Theme.Colors.success, fontWeight: '800', marginLeft: 6, textTransform: 'uppercase' },

    // Stats
    statsCard: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: -32,
        marginBottom: 24,
        alignItems: 'center',
    },
    statItem: { flex: 1, alignItems: 'center', gap: 6, justifyContent: 'center' },
    divider: { width: 1.5, height: 32, backgroundColor: Theme.Colors.divider, marginHorizontal: 8 },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 24,
        backgroundColor: Theme.Colors.surfaceAlt,
        borderRadius: 20,
        padding: 6,
        borderWidth: 1.5,
        borderColor: Theme.Colors.divider
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16 },
    activeTab: { backgroundColor: Theme.Colors.primary, ...Theme.Shadows.floating },

    // Content
    contentSection: { paddingHorizontal: 20, gap: 16 },

    // Doctor Card
    doctorCard: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    docAvatar: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: Theme.Colors.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1.5,
        borderColor: Theme.Colors.divider
    },
    docInfo: { flex: 1 },
    bookBtnSmall: { backgroundColor: Theme.Colors.primary + '10', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },

    // Service Card
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    serviceInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    serviceIcon: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: Theme.Colors.overlayPrimary,
        alignItems: 'center',
        justifyContent: 'center'
    },

    // Info Blocks
    infoBlock: { marginBottom: 32 },
    description: { marginTop: 12, lineHeight: 24 },
    contactRow: { flexDirection: 'row', gap: 14 },
    contactBtn: {
        flex: 1,
        backgroundColor: Theme.Colors.surface,
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Theme.Colors.divider,
        ...Theme.Shadows.card,
    },
    hourRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1.5,
        borderBottomColor: Theme.Colors.divider,
        alignItems: 'center'
    },

    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: Theme.Colors.background,
        borderTopWidth: 1.5,
        borderTopColor: Theme.Colors.divider,
        gap: 12
    },
    chatButton: {
        flex: 1,
    },
    callButton: {
        flex: 1,
    },
});

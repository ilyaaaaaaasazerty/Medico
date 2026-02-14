import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Theme from '@/constants/Theme';
import { patientApi } from '@/services/patient.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function FamilyMemberProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [member, setMember] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const res = await patientApi.getFamilyMember(id!);

            if (res.success && res.data) {
                setMember(res.data);
            }
        } catch (error) {
            console.error('Error loading member profile:', error);
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

    if (!member) {
        return (
            <AppScreen padding style={styles.center}>
                <Ionicons name="alert-circle-outline" size={64} color={Theme.Colors.textDisabled} />
                <AppText variant="h3" color="text" style={{ marginTop: 24 }}>Member Not Found</AppText>
                <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: 12 }}>
                    This family member record is temporarily unavailable.
                </AppText>
                <AppButton
                    title="Return to Index"
                    variant="outline"
                    onPress={() => router.back()}
                    style={{ marginTop: 32, width: '60%' }}
                />
            </AppScreen>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.text} />
                </TouchableOpacity>
                <AppText variant="h3" weight="bold">Medical Portfolio</AppText>
                <TouchableOpacity style={styles.editBtn}>
                    <Ionicons name="create-outline" size={22} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <AppScreen padding scrollable contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileHero}>
                    <View style={styles.avatarWrap}>
                        {member?.avatarUrl ? (
                            <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <AppText variant="hero" color="primary">{member?.firstName?.[0]}{member?.lastName?.[0]}</AppText>
                            </View>
                        )}
                        <View style={styles.relBadge}>
                            <AppText variant="caption" weight="bold" color="textInverted" uppercase>{member?.relationship?.replace(/_/g, ' ')}</AppText>
                        </View>
                    </View>

                    <AppText variant="title" weight="bold" color="text" style={{ marginTop: 12 }}>{member?.firstName} {member?.lastName}</AppText>
                    <AppText variant="caption" weight="semiBold" color="textSecondary" style={{ marginTop: 4 }}>
                        Public Key: {member?.id?.slice(-8).toUpperCase()}
                    </AppText>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <AppText variant="h3" weight="bold" color="text">{member?.bloodType || '--'}</AppText>
                        <AppText variant="caption" color="textSecondary" uppercase weight="bold">Blood Type</AppText>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <AppText variant="h3" weight="bold" color="text">{member?.weight || '--'} <AppText variant="caption">kg</AppText></AppText>
                        <AppText variant="caption" color="textSecondary" uppercase weight="bold">Weight</AppText>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <AppText variant="h3" weight="bold" color="text">{member?.height || '--'} <AppText variant="caption">cm</AppText></AppText>
                        <AppText variant="caption" color="textSecondary" uppercase weight="bold">Height</AppText>
                    </View>
                </View>

                <View style={styles.section}>
                    <AppText variant="h3" color="text" style={{ marginBottom: 16 }}>Biometric Integrity</AppText>
                    <AppCard>
                        <View style={styles.dataItem}>
                            <View style={styles.dataIcon}>
                                <Ionicons name="calendar-clear-outline" size={18} color={Theme.Colors.primary} />
                            </View>
                            <View style={styles.dataText}>
                                <AppText variant="caption" color="textSecondary" uppercase weight="bold">Date of Birth</AppText>
                                <AppText variant="body" weight="bold" color="text" style={{ marginTop: 2 }}>
                                    {new Date(member?.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                </AppText>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.dataItem}>
                            <View style={styles.dataIcon}>
                                <Ionicons name="male-female-outline" size={18} color={Theme.Colors.primary} />
                            </View>
                            <View style={styles.dataText}>
                                <AppText variant="caption" color="textSecondary" uppercase weight="bold">Legal Gender</AppText>
                                <AppText variant="body" weight="bold" color="text" style={{ marginTop: 2 }}>{member?.gender}</AppText>
                            </View>
                        </View>
                    </AppCard>
                </View>

                <View style={styles.section}>
                    <AppText variant="h3" color="text" style={{ marginBottom: 16 }}>Clinical Dashboards</AppText>
                    <View style={styles.grid}>
                        <TouchableOpacity style={styles.gridItem} onPress={() => router.push({ pathname: '/(app)/health', params: { patientId: member.id } })}>
                            <View style={[styles.gridIcon, { backgroundColor: Theme.Colors.primary + '10' }]}>
                                <Ionicons name="fitness-outline" size={24} color={Theme.Colors.primary} />
                            </View>
                            <AppText variant="body" weight="bold" color="text">Vitals</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.gridItem} onPress={() => router.push({ pathname: '/(app)/my-records', params: { patientId: member.id } })}>
                            <View style={[styles.gridIcon, { backgroundColor: Theme.Colors.secondary + '10' }]}>
                                <Ionicons name="folder-open-outline" size={24} color={Theme.Colors.secondary} />
                            </View>
                            <AppText variant="body" weight="bold" color="text">Records</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.gridItem} onPress={() => router.push({ pathname: '/(app)/vaccinations', params: { patientId: member.id } })}>
                            <View style={[styles.gridIcon, { backgroundColor: Theme.Colors.success + '10' }]}>
                                <Ionicons name="shield-outline" size={24} color={Theme.Colors.success} />
                            </View>
                            <AppText variant="body" weight="bold" color="text">Vaccines</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.gridItem} onPress={() => router.push({ pathname: '/(app)/medications', params: { patientId: member.id } })}>
                            <View style={[styles.gridIcon, { backgroundColor: Theme.Colors.error + '10' }]}>
                                <Ionicons name="medical-outline" size={24} color={Theme.Colors.error} />
                            </View>
                            <AppText variant="body" weight="bold" color="text">Scripts</AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </AppScreen>

            <View style={styles.footer}>
                <AppButton
                    title={`Book Consultation for ${member?.firstName}`}
                    onPress={() => router.push({ pathname: '/(app)/(tabs)/search', params: { memberId: member.id } })}
                    size="lg"
                    icon={<Ionicons name="calendar-outline" size={20} color="white" />}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, backgroundColor: Theme.Colors.background },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.card, ...Theme.Shadows.soft, justifyContent: 'center', alignItems: 'center' },
    editBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    scrollContent: { padding: 24, paddingTop: 10 },
    profileHero: { alignItems: 'center', marginBottom: 32 },
    avatarWrap: { position: 'relative' },
    avatar: { width: 120, height: 120, borderRadius: 44, ...Theme.Shadows.medium },
    avatarPlaceholder: { width: 120, height: 120, borderRadius: 44, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.primary + '20' },
    relBadge: { position: 'absolute', bottom: -12, alignSelf: 'center', backgroundColor: Theme.Colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 4, borderColor: Theme.Colors.background, ...Theme.Shadows.soft },

    statsRow: { flexDirection: 'row', backgroundColor: Theme.Colors.card, borderRadius: 28, padding: 20, borderWidth: 1, borderColor: Theme.Colors.divider, marginBottom: 32, ...Theme.Shadows.soft },
    statBox: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: '60%', backgroundColor: Theme.Colors.divider, alignSelf: 'center' },

    section: { marginBottom: 32 },
    dataItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    dataIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },
    dataText: { flex: 1 },
    divider: { height: 1, backgroundColor: Theme.Colors.divider, marginVertical: 16 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: '48%', backgroundColor: Theme.Colors.card, borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider, ...Theme.Shadows.soft },
    gridIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, backgroundColor: Theme.Colors.background, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Theme from '@/constants/Theme';
import { patientApi } from '@/services/patient.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { LinearGradient } from 'expo-linear-gradient';

interface FamilyMember {
    id: string;
    firstName: string;
    lastName: string;
    relationship: string;
    avatarUrl?: string;
    dateOfBirth: string;
}

export default function FamilyMembersScreen() {
    const router = useRouter();
    const [family, setFamily] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFamily();
    }, []);

    const loadFamily = async () => {
        try {
            const res = await patientApi.getFamilyMembers();
            if (res.success && res.data) {
                setFamily(res.data);
            }
        } catch (error) {
            console.error('Error loading family circle:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Rescind Circle Member',
            'Terminating this dependent association will prevent further diagnostic management for this individual.',
            [
                { text: 'Retain', style: 'cancel' },
                {
                    text: 'Confirm Rescision',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await patientApi.deleteFamilyMember(id);
                            if (res.success) {
                                setFamily(family.filter(m => m.id !== id));
                            }
                        } catch (error) {
                            Alert.alert('Protocol Error', 'Unable to synchronize removal with clinical net.');
                        }
                    }
                }
            ]
        );
    };

    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Family Governance</AppText>
                <TouchableOpacity
                    style={[styles.circleBtn, { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary }]}
                    onPress={() => router.push('/(app)/add-family-member')}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
                <AppText variant="h2" weight="black">Household Circle</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 8 }}>
                    Centralized management for medical records and diagnostic indices of dependents under your clinical stewardship.
                </AppText>

                <TouchableOpacity
                    style={styles.timelineLink}
                    onPress={() => router.push('/(app)/family-timeline')}
                >
                    <Ionicons name="calendar-outline" size={20} color={Theme.Colors.primary} />
                    <AppText variant="caption" weight="black" color="primary" style={{ flex: 1, marginLeft: 12 }}>VIEW UNIFIED HEALTH TIMELINE</AppText>
                    <Ionicons name="chevron-forward" size={16} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={family}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <AppCard
                            padding="none"
                            style={styles.memberCard}
                            onPress={() => router.push({ pathname: '/(app)/family-member-profile', params: { id: item.id } })}
                        >
                            <View style={styles.memberRow}>
                                {item.avatarUrl ? (
                                    <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <AppText variant="h3" weight="black" color="primary">{item.firstName[0]}{item.lastName[0]}</AppText>
                                    </View>
                                )}
                                <View style={styles.memberInfo}>
                                    <AppText variant="body" weight="black">{item.firstName} {item.lastName}</AppText>
                                    <View style={styles.badgeRow}>
                                        <View style={styles.relBadge}>
                                            <AppText variant="caption" weight="black" color="primary" uppercase style={{ fontSize: 9 }}>{item.relationship.replace(/_/g, ' ')}</AppText>
                                        </View>
                                        <AppText variant="caption" color="textSecondary" weight="black">{calculateAge(item.dateOfBirth)} YRS</AppText>
                                    </View>
                                </View>
                                <View style={styles.actionGroup}>
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => router.push({ pathname: '/(app)/add-family-member', params: { id: item.id } })}
                                    >
                                        <Ionicons name="pencil" size={16} color={Theme.Colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: Theme.Colors.error + '10' }]}
                                        onPress={() => handleDelete(item.id)}
                                    >
                                        <Ionicons name="trash-outline" size={16} color={Theme.Colors.error} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </AppCard>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyView}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="people-outline" size={48} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">NO DEPENDENTS REGISTERED</AppText>
                            <AppButton
                                title="Add Circle Member"
                                onPress={() => router.push('/(app)/add-family-member')}
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

    heroSection: { paddingHorizontal: 24, marginBottom: 8 },
    timelineLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, marginTop: 24, borderWidth: 1, borderColor: Theme.Colors.primary + '15' },

    list: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
    memberCard: { marginBottom: 16, borderRadius: 24 },
    memberRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    avatar: { width: 64, height: 64, borderRadius: 20 },
    avatarPlaceholder: { width: 64, height: 64, borderRadius: 20, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    memberInfo: { flex: 1, marginLeft: 16 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    relBadge: { backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

    actionGroup: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },

    emptyView: { padding: 80, alignItems: 'center' },
    emptyIcon: { width: 80, height: 80, borderRadius: 30, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Theme.Colors.divider },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { clinicApi } from '@/services/clinic.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

interface Doctor {
    id: string;
    doctor: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
        specialties: { specialty: { name: string } }[];
    };
    status: string;
    joinedAt: string;
}

export default function ClinicDoctorsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.role !== 'CLINIC_ADMIN') {
            router.replace('/(app)/clinic-dashboard');
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            loadDoctors();
        }, [])
    );

    const loadDoctors = async () => {
        try {
            const res: any = await clinicApi.getAffiliatedDoctors();
            if (res.success && res.data) {
                setDoctors(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical registry:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveDoctor = (doctorId: string, doctorName: string) => {
        Alert.alert(
            'RESCIND AFFILIATION',
            `Are you sure you want to permanently revoke Dr. ${doctorName.toUpperCase()}'s access to institutional assets and scheduling?`,
            [
                { text: 'ABORT', style: 'cancel' },
                {
                    text: 'REVOKE AFFILIATION',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clinicApi.removeDoctor(doctorId);
                            setDoctors(doctors.filter(d => d.doctor.id !== doctorId));
                        } catch (error) {
                            Alert.alert('PROTOCOL ERROR', 'Failed to rescind medical staff affiliation.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Doctor }) => {
        const isActive = item.status === 'ACTIVE';

        return (
            <AppCard style={styles.card} padding="none">
                <View style={styles.cardContent}>
                    <View style={styles.cardTop}>
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatar, { backgroundColor: Theme.Colors.primary + '08' }]}>
                                <AppText variant="title" color="primary" weight="black">
                                    {item.doctor.firstName[0]}{item.doctor.lastName[0]}
                                </AppText>
                            </View>
                            <View style={[styles.statusDot, { backgroundColor: isActive ? Theme.Colors.success : Theme.Colors.divider }]} />
                        </View>

                        <View style={styles.mainInfo}>
                            <AppText variant="body" weight="black" uppercase style={{ fontSize: 14 }}>
                                Dr. {item.doctor.firstName} {item.doctor.lastName}
                            </AppText>
                            <View style={styles.specialtyRow}>
                                <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 8 }}>
                                    {item.doctor.specialties?.map(s => s.specialty.name.toUpperCase()).join(' • ') || 'GENERAL PRACTICE'}
                                </AppText>
                            </View>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8, marginTop: 4 }}>
                                SYNCED: {new Date(item.joinedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                            </AppText>
                        </View>

                        <TouchableOpacity
                            style={styles.detailsBtn}
                            onPress={() => router.push({ pathname: '/(app)/doctor-profile', params: { id: item.doctor.id } })}
                        >
                            <Ionicons name="shield-checkmark" size={20} color={Theme.Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.secondaryBtn}
                            onPress={() => router.push({ pathname: '/(app)/doctor-profile', params: { id: item.doctor.id } })}
                        >
                            <Ionicons name="person-outline" size={16} color={Theme.Colors.textSecondary} />
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ marginLeft: 8, fontSize: 9 }}>RESUME PROFILE</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.revokeBtn}
                            onPress={() => handleRemoveDoctor(item.doctor.id, `${item.doctor.firstName} ${item.doctor.lastName}`)}
                        >
                            <Ionicons name="trash-outline" size={16} color={Theme.Colors.error} />
                            <AppText variant="caption" color="error" weight="black" style={{ marginLeft: 8, fontSize: 9 }}>RESCIND</AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            </AppCard>
        );
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Clinical Personnel</AppText>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push('/(app)/add-clinic-doctor')}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.hero}>
                <AppText variant="h2" weight="black">Staff Governance</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={styles.heroSub}>
                    Official registry of authorized clinical practitioners and medical consultants.
                </AppText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={doctors}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="medkit-outline" size={42} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">NO CLINICAL STAFF DETECTED</AppText>
                            <AppText variant="caption" weight="bold" color="textSecondary" style={styles.emptyDesc}>
                                Register and authorize medical practitioners to initiate institutional operations.
                            </AppText>
                            <AppButton
                                title="AUTHORIZE NEW PRACTITIONER"
                                onPress={() => router.push('/(app)/add-clinic-doctor')}
                                style={{ marginTop: 32, paddingHorizontal: 24 }}
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.text, justifyContent: 'center', alignItems: 'center' },

    hero: { paddingHorizontal: 24, marginBottom: 16 },
    heroSub: { marginTop: 8, lineHeight: 22 },

    list: { padding: 24, paddingTop: 12 },
    card: { marginBottom: 16, borderRadius: 32 },
    cardContent: { padding: 22 },
    cardTop: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { marginRight: 20 },
    avatar: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    statusDot: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: 'white' },

    mainInfo: { flex: 1 },
    specialtyRow: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: Theme.Colors.primary + '08', marginTop: 6 },
    detailsBtn: { padding: 8 },

    actions: { flexDirection: 'row', gap: 12, marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 12, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider },
    revokeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 12, backgroundColor: Theme.Colors.error + '05', borderWidth: 1, borderColor: Theme.Colors.error + '10' },

    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyIconBox: { width: 84, height: 84, borderRadius: 28, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
    emptyDesc: { textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

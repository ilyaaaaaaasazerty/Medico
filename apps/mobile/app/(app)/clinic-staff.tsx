import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { clinicApi } from '@/services/clinic.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

interface StaffMember {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email?: string;
    phone?: string;
    isActive: boolean;
}

export default function ClinicStaffScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (user && user.role !== 'CLINIC_ADMIN') {
            router.replace('/(app)/clinic-dashboard');
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            loadStaff();
        }, [])
    );

    const loadStaff = async () => {
        try {
            const res: any = await clinicApi.getStaff();
            if (res.success && res.data) {
                setStaff(res.data);
            }
        } catch (error) {
            console.error('Error loading personnel registry:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            'RESCIND PERSONNEL ACCESS',
            `Permanently revoke all institutional access for ${name.toUpperCase()}?`,
            [
                { text: 'ABORT', style: 'cancel' },
                {
                    text: 'REVOKE ACCESS',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clinicApi.removeStaff(id);
                            setStaff(staff.filter(s => s.id !== id));
                        } catch (error) {
                            Alert.alert('PROTOCOL ERROR', 'Failed to rescind personnel access.');
                        }
                    }
                }
            ]
        );
    };

    const getRoleAttributes = (role: string) => {
        switch (role.toUpperCase()) {
            case 'ADMIN': return { color: Theme.Colors.warning, label: 'INSTITUTIONAL ADMIN' };
            case 'DOCTOR': return { color: Theme.Colors.primary, label: 'CLINICAL PRACTITIONER' };
            case 'NURSE': return { color: '#6366F1', label: 'CLINICAL SUPPORT' };
            case 'RECEPTIONIST': return { color: '#0EA5E9', label: 'OPERATIONAL RECEPTION' };
            default: return { color: Theme.Colors.textSecondary, label: role.toUpperCase() };
        }
    };

    const renderItem = ({ item }: { item: StaffMember }) => {
        const roleAttr = getRoleAttributes(item.role);
        return (
            <AppCard style={styles.card} padding="none">
                <View style={styles.cardContent}>
                    <View style={styles.cardTop}>
                        <View style={styles.avatarBox}>
                            <View style={[styles.avatar, { backgroundColor: Theme.Colors.primary + '08' }]}>
                                <AppText variant="title" color="primary" weight="black">
                                    {item.firstName[0]}{item.lastName[0]}
                                </AppText>
                            </View>
                            <View style={[styles.statusIndicator, { backgroundColor: item.isActive ? Theme.Colors.success : Theme.Colors.divider }]} />
                        </View>

                        <View style={styles.mainInfo}>
                            <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>{item.firstName} {item.lastName}</AppText>
                            <View style={[styles.roleBadge, { backgroundColor: roleAttr.color + '08', borderColor: roleAttr.color + '20' }]}>
                                <AppText variant="caption" weight="black" style={{ color: roleAttr.color, fontSize: 8 }}>{roleAttr.label}</AppText>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => router.push({ pathname: '/(app)/add-clinic-staff', params: { id: item.id } })}
                        >
                            <Ionicons name="settings-outline" size={18} color={Theme.Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.contactMatrix}>
                        {item.email && (
                            <View style={styles.matrixItem}>
                                <Ionicons name="mail-outline" size={12} color={Theme.Colors.textSecondary} />
                                <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 8 }}>{item.email.toUpperCase()}</AppText>
                            </View>
                        )}
                        {item.phone && (
                            <View style={styles.matrixItem}>
                                <Ionicons name="call-outline" size={12} color={Theme.Colors.textSecondary} />
                                <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 8 }}>{item.phone}</AppText>
                            </View>
                        )}
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => router.push({ pathname: '/(app)/add-clinic-staff', params: { id: item.id } })}
                        >
                            <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 9 }}>GOVERNANCE PROTOCOL</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDelete(item.id, `${item.firstName} ${item.lastName}`)}
                        >
                            <Ionicons name="trash-outline" size={16} color={Theme.Colors.divider} />
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
                <AppText variant="h3" weight="black">Operational Personnel</AppText>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push('/(app)/add-clinic-staff')}
                >
                    <Ionicons name="person-add" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.hero}>
                <AppText variant="h2" weight="black">Personnel Registry</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={styles.heroSub}>
                    Administrative governance and operational classification of non-practitioner institutional staff.
                </AppText>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={staff}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStaff(); }} tintColor={Theme.Colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="people-outline" size={42} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">NO PERSONNEL DETECTED</AppText>
                            <AppText variant="caption" weight="bold" color="textSecondary" style={styles.emptyDesc}>
                                Enroll administrative staff to manage reception, triage, and institutional assets.
                            </AppText>
                            <AppButton
                                title="ENROLL NEW PERSONNEL"
                                onPress={() => router.push('/(app)/add-clinic-staff')}
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
    avatarBox: { marginRight: 20 },
    avatar: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    statusIndicator: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: 'white' },

    mainInfo: { flex: 1 },
    roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginTop: 6 },
    editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    contactMatrix: { marginTop: 20, gap: 10 },
    matrixItem: { flexDirection: 'row', alignItems: 'center' },

    actions: { flexDirection: 'row', gap: 12, marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    actionBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.primary + '10' },
    deleteBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyIconBox: { width: 84, height: 84, borderRadius: 28, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
    emptyDesc: { textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

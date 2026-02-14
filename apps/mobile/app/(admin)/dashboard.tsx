import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, RefreshControl, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { adminApi, DashboardStats, VerificationRequest } from '@/services/admin.api';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function AdminDashboardScreen() {
    const router = useRouter();
    const { logout } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const [statsRes, verifyRes] = await Promise.all([
                adminApi.getStats(),
                adminApi.getVerifications()
            ]);
            if (statsRes.success && statsRes.data) setStats(statsRes.data);
            if (verifyRes.success && verifyRes.data) setVerifications(verifyRes.data);
        } catch (error) {
            console.error('Failed to load admin data', error);
        } finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout }
        ]);
    };

    return (
        <AppScreen
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.Colors.primary} />}
        >
            <View style={styles.header}>
                <View>
                    <AppText variant="hero">Command Center</AppText>
                    <AppText variant="body" color="textSecondary" style={styles.headerSubtitle}>Live Ecosystem Overview</AppText>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={24} color={Theme.Colors.error} />
                </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <AppCard style={styles.statCard} padding="md">
                    <AppText variant="caption" color="textSecondary">Patients</AppText>
                    <AppText variant="title" style={{ color: Theme.Colors.primary, marginTop: 12 }}>{stats?.users.patients || 0}</AppText>
                </AppCard>
                <AppCard style={styles.statCard} padding="md">
                    <AppText variant="caption" color="textSecondary">Doctors</AppText>
                    <AppText variant="title" style={{ color: Theme.Colors.success, marginTop: 12 }}>{stats?.users.doctors || 0}</AppText>
                </AppCard>
                <AppCard style={styles.statCard} padding="md">
                    <AppText variant="caption" color="textSecondary">Clinics</AppText>
                    <AppText variant="title" style={{ color: Theme.Colors.accent, marginTop: 12 }}>{stats?.users.clinics || 0}</AppText>
                </AppCard>
                <AppCard style={styles.statCard} padding="md">
                    <AppText variant="caption" color="textSecondary">Revenue</AppText>
                    <AppText variant="title" style={{ color: Theme.Colors.warning, marginTop: 12 }}>{(stats?.finance.totalPayouts || 0).toLocaleString()}</AppText>
                </AppCard>
            </View>

            {/* Pending Verifications */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <AppText variant="title">Pending Approvals</AppText>
                    <View style={styles.badge}>
                        <AppText variant="caption" style={styles.badgeText}>{verifications.length}</AppText>
                    </View>
                </View>

                {verifications.length === 0 ? (
                    <AppCard variant="outline" style={styles.emptyState}>
                        <Ionicons name="checkmark-circle-outline" size={48} color={Theme.Colors.success} />
                        <AppText variant="body" color="textSecondary" style={styles.emptyText}>All Caught Up!</AppText>
                    </AppCard>
                ) : (
                    verifications.map((req) => (
                        <TouchableOpacity
                            key={req.id}
                            onPress={() => router.push({ pathname: '/(admin)/verify', params: { id: req.id, data: JSON.stringify(req) } })}
                        >
                            <AppCard style={styles.taskCard}>
                                <View style={styles.taskIcon}>
                                    <Ionicons
                                        name={req.type === 'DOCTOR' ? 'medkit' : req.type === 'CLINIC' ? 'business' : 'flask'}
                                        size={24}
                                        color={Theme.Colors.primary}
                                    />
                                </View>
                                <View style={styles.taskInfo}>
                                    <AppText variant="h3" style={{ fontSize: 16 }}>{req.type} Verification</AppText>
                                    <AppText variant="body" color="textSecondary" style={{ fontSize: 13 }}>{new Date(req.createdAt).toLocaleDateString()}</AppText>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={Theme.Colors.textSecondary} />
                            </AppCard>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 24,
    },
    headerSubtitle: {
        marginTop: 4,
    },
    logoutBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Theme.Colors.error + '10',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.error + '20',
    },
    content: {
        paddingTop: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Theme.Spacing.md,
        marginBottom: Theme.Layout.sectionGap,
    },
    statCard: {
        width: '47.5%',
    },
    section: {
        marginBottom: Theme.Layout.sectionGap,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.Layout.elementGap,
        gap: 12,
    },
    badge: {
        backgroundColor: Theme.Colors.error,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Theme.Radii.chip,
    },
    badgeText: {
        color: Theme.Colors.textInverted,
        fontSize: 12,
    },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.Layout.elementGap,
    },
    taskIcon: {
        width: 52,
        height: 52,
        borderRadius: Theme.Radii.input,
        backgroundColor: Theme.Colors.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    taskInfo: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        borderStyle: 'dashed',
    },
    emptyText: {
        marginTop: 16,
    },
});

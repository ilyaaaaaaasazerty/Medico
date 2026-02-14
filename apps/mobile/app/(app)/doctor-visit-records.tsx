import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppInput, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';
import { doctorApi } from '@/services/doctor.api';
import { useAuth } from '@/providers/AuthProvider';

interface MedicalRecord {
    id: string;
    patientId: string;
    visitDate: string;
    diagnosis?: string;
    chiefComplaint?: string;
    patient: {
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    };
    familyMember?: {
        firstName: string;
        lastName: string;
    };
    prescription?: {
        id: string;
    };
}

type FilterType = 'all' | 'today' | 'week' | 'month';

export default function DoctorVisitRecordsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');

    useEffect(() => {
        loadRecords();
    }, [user]);

    const loadRecords = async () => {
        if (!user) return;
        try {
            const res = await doctorApi.getMedicalRecords();
            if (res.success && res.data) {
                setRecords(res.data);
            }
        } catch (error) {
            console.error('Error loading session ledger:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadRecords();
    };

    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const patientName = `${record.patient.firstName} ${record.patient.lastName}`.toLowerCase();
            const familyName = record.familyMember ? `${record.familyMember.firstName} ${record.familyMember.lastName}`.toLowerCase() : '';
            const matchesSearch = patientName.includes(searchQuery.toLowerCase()) || familyName.includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (filter === 'all') return true;

            const visitDate = new Date(record.visitDate);
            const now = new Date();

            if (filter === 'today') return visitDate.toDateString() === now.toDateString();
            if (filter === 'week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                return visitDate >= oneWeekAgo;
            }
            if (filter === 'month') {
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(now.getMonth() - 1);
                return visitDate >= oneMonthAgo;
            }

            return true;
        });
    }, [records, searchQuery, filter]);

    const renderItem = ({ item }: { item: MedicalRecord }) => {
        const initials = (item.patient.firstName[0] || '') + (item.patient.lastName[0] || '');
        const displayName = item.familyMember
            ? `${item.familyMember.firstName} ${item.familyMember.lastName}`
            : `${item.patient.firstName} ${item.patient.lastName}`;

        return (
            <AppCard
                style={styles.recordCard}
                onPress={() => router.push({ pathname: '/(app)/record-detail', params: { id: item.id } })}
                padding="md"
            >
                <View style={styles.cardHeader}>
                    <View style={styles.dateLabel}>
                        <Ionicons name="time-outline" size={12} color={Theme.Colors.primary} />
                        <AppText variant="caption" color="primary" weight="black" uppercase style={{ marginLeft: 6 }}>
                            {new Date(item.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </AppText>
                    </View>
                    {item.prescription && (
                        <View style={styles.pharmaBadge}>
                            <AppText variant="caption" color="textInverted" weight="black" style={{ fontSize: 8 }}>PHARMA</AppText>
                        </View>
                    )}
                </View>

                <View style={styles.subjectRow}>
                    <View style={styles.avatarOutline}>
                        {item.patient.avatarUrl ? (
                            <Image source={{ uri: item.patient.avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <AppText variant="body" color="textInverted" weight="black">{initials}</AppText>
                            </View>
                        )}
                    </View>

                    <View style={styles.details}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <AppText variant="body" weight="black">{displayName}</AppText>
                            {item.familyMember && (
                                <View style={styles.subTag}>
                                    <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 8 }}>SUB-SUBJECT</AppText>
                                </View>
                            )}
                        </View>

                        <View style={styles.indicatorGrid}>
                            <View style={styles.indicator}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 7 }}>Clinical Assessment</AppText>
                                <AppText variant="caption" weight="black" numberOfLines={1} style={{ marginTop: 2 }}>
                                    {item.diagnosis || 'Unspecified'}
                                </AppText>
                            </View>
                            {item.chiefComplaint && (
                                <View style={[styles.indicator, { borderLeftWidth: 1, borderLeftColor: Theme.Colors.divider, paddingLeft: 12 }]}>
                                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 7 }}>Primary Indication</AppText>
                                    <AppText variant="caption" weight="bold" numberOfLines={1} style={{ marginTop: 2 }}>{item.chiefComplaint}</AppText>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.actionCircle}>
                        <Ionicons name="chevron-forward" size={16} color={Theme.Colors.primary} />
                    </View>
                </View>
            </AppCard>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    return (
        <AppScreen padding={false} scrollable={false}>
            <View style={styles.header}>
                <View>
                    <AppText variant="h3" weight="black">Session Ledger</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ letterSpacing: 1 }}>Historical Authored Transcripts</AppText>
                </View>
                <TouchableOpacity style={styles.circleBtn}>
                    <Ionicons name="cloud-download-outline" size={20} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchSection}>
                <AppInput
                    placeholder="Filter by subject nomenclature..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    containerStyle={{ backgroundColor: Theme.Colors.surface, borderRadius: 16 }}
                    icon={<Ionicons name="search" size={20} color={Theme.Colors.textTertiary} />}
                />
            </View>

            <View style={styles.filterStrip}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContent}
                    data={['all', 'today', 'week', 'month'] as FilterType[]}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.filterChip, filter === item && styles.filterChipActive]}
                            onPress={() => setFilter(item)}
                        >
                            <AppText
                                variant="caption"
                                color={filter === item ? 'textInverted' : 'textSecondary'}
                                weight="black"
                                uppercase
                                style={{ fontSize: 10 }}
                            >
                                {item === 'all' ? 'Full Archive' : item}
                            </AppText>
                        </TouchableOpacity>
                    )}
                />
            </View>

            <FlatList
                data={filteredRecords}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="documents-outline" size={48} color={Theme.Colors.divider} />
                        </View>
                        <AppText variant="h3" weight="black">Ledger Empty</AppText>
                        <AppText variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: 12, maxWidth: 280 }}>
                            Historical session ledger is currently empty. No authorized transcripts available for retrieval.
                        </AppText>
                    </View>
                }
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Theme.Colors.background },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, ...Theme.Shadows.soft, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    searchSection: { paddingHorizontal: 24, marginBottom: 16 },

    filterStrip: { marginBottom: 20 },
    filterContent: { paddingHorizontal: 24, gap: 10 },
    filterChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider },
    filterChipActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary, ...Theme.Shadows.primary },

    list: { paddingBottom: 100, paddingHorizontal: 24 },
    recordCard: { marginBottom: 12, borderWidth: 1, borderColor: Theme.Colors.divider },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    dateLabel: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    pharmaBadge: { backgroundColor: Theme.Colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

    subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatarOutline: { width: 64, height: 64, borderRadius: 22, borderWidth: 3, borderColor: Theme.Colors.background, ...Theme.Shadows.soft, overflow: 'hidden' },
    avatar: { width: '100%', height: '100%' },
    avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center' },

    details: { flex: 1 },
    subTag: { backgroundColor: Theme.Colors.primary + '10', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    indicatorGrid: { flexDirection: 'row', marginTop: 12, gap: 12 },
    indicator: { flex: 1 },

    actionCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
});

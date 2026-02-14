import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import Theme from '@/constants/Theme';
import { useRouter } from 'expo-router';
import { patientApi } from '@/services/patient.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard } from '@/components/base';

interface TimelineEvent {
    id: string;
    type: 'APPOINTMENT' | 'VACCINATION' | 'VITAL_SIGN' | 'RECORD' | 'MEDICATION';
    title: string;
    date: string;
    description: string;
    memberName: string;
}

export default function FamilyTimelineScreen() {
    const router = useRouter();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTimeline();
    }, []);

    const loadTimeline = async () => {
        try {
            const res = await patientApi.getFamilyTimeline();
            if (res.success && res.data) {
                setEvents(res.data);
            }
        } catch (error) {
            console.error('Error loading ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    const getProtocolIcon = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'APPOINTMENT': return { name: 'calendar', color: '#4F46E5', bg: '#4F46E510' };
            case 'VACCINATION': return { name: 'shield-checkmark', color: '#10B981', bg: '#10B98110' };
            case 'VITAL_SIGN': return { name: 'pulse', color: '#EF4444', bg: '#EF444410' };
            case 'RECORD': return { name: 'document-attach', color: '#F59E0B', bg: '#F59E0B10' };
            case 'MEDICATION': return { name: 'medical', color: Theme.Colors.primary, bg: Theme.Colors.primary + '10' };
            default: return { name: 'ellipse', color: Theme.Colors.textSecondary, bg: Theme.Colors.divider };
        }
    };

    const renderItem = ({ item, index }: { item: TimelineEvent, index: number }) => {
        const protocol = getProtocolIcon(item.type);
        const dateObj = new Date(item.date);

        return (
            <View style={styles.eventRow}>
                <View style={styles.chronologyBar}>
                    <View style={[styles.node, { backgroundColor: protocol.color }]} />
                    {index !== events.length - 1 && <View style={styles.strand} />}
                </View>

                <View style={styles.eventBody}>
                    <View style={styles.temporalHeader}>
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 9 }}>
                            {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </AppText>
                        <View style={styles.subjectBadge}>
                            <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 7 }}>{item.memberName}</AppText>
                        </View>
                    </View>

                    <AppCard
                        padding="md"
                        style={styles.protocolCard}
                        onPress={() => item.type === 'APPOINTMENT' && router.push({ pathname: '/(app)/appointment-details', params: { id: item.id } })}
                    >
                        <View style={[styles.iconFrame, { backgroundColor: protocol.bg }]}>
                            <Ionicons name={protocol.name as any} size={20} color={protocol.color} />
                        </View>
                        <View style={styles.protocolDetails}>
                            <AppText variant="body" weight="black" style={{ fontSize: 15 }}>{item.title}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="bold" numberOfLines={2} style={{ marginTop: 2 }}>{item.description}</AppText>
                        </View>
                        {item.type === 'APPOINTMENT' && (
                            <Ionicons name="chevron-forward" size={16} color={Theme.Colors.divider} />
                        )}
                    </AppCard>
                </View>
            </View>
        );
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <AppText variant="h3" weight="black">Collective Ledger</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Longitudinal Clinical View</AppText>
                </View>
                <TouchableOpacity style={styles.filterTrigger}>
                    <Ionicons name="options-outline" size={22} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.heroBox}>
                <AppText variant="h1" weight="black">Chronology</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 8 }}>
                    A longitudinal synthesis of all medical encounters and diagnostic indices for your collective unit.
                </AppText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={events}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.voidMatrix}>
                            <View style={styles.voidIconBox}>
                                <Ionicons name="trail-sign-outline" size={40} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="h3" weight="black">Registry Void</AppText>
                            <AppText variant="caption" color="textSecondary" align="center" style={{ marginTop: 12 }}>
                                No health events or diagnostic indices have been manifest for this collective.
                            </AppText>
                        </View>
                    }
                />
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, backgroundColor: Theme.Colors.surface, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    filterTrigger: { width: 44, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },

    heroBox: { padding: 32, paddingBottom: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    list: { padding: 24, paddingTop: 16 },
    eventRow: { flexDirection: 'row', gap: 20 },
    chronologyBar: { width: 20, alignItems: 'center' },
    node: { width: 10, height: 10, borderRadius: 5, zIndex: 1, marginTop: 6, borderWidth: 2, borderColor: '#FFF' },
    strand: { position: 'absolute', top: 12, bottom: -6, width: 2, backgroundColor: Theme.Colors.divider, opacity: 0.5 },

    eventBody: { flex: 1, paddingBottom: 32 },
    temporalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    subjectBadge: { backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

    protocolCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    iconFrame: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    protocolDetails: { flex: 1, marginLeft: 16 },

    voidMatrix: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    voidIconBox: { width: 80, height: 80, borderRadius: 30, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
});

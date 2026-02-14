import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { patientApi } from '@/services/patient.api';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

interface Reminder {
    id: string;
    medicationName: string;
    time: string;
    days: string[];
    isActive: boolean;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MedicationRemindersScreen() {
    const router = useRouter();
    const { medId } = useLocalSearchParams<{ medId?: string }>();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadReminders();
        }, [medId])
    );

    const loadReminders = async () => {
        try {
            const res = await patientApi.getMedicationReminders(medId);
            if (res.success && res.data) {
                setReminders(res.data);
            }
        } catch (error) {
            console.error('Error loading temporal alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleReminder = async (id: string, current: boolean) => {
        try {
            const res = await patientApi.updateReminderStatus(id, !current);
            if (res.success) {
                setReminders(reminders.map(r => r.id === id ? { ...r, isActive: !current } : r));
            }
        } catch (error) {
            Alert.alert('SYNC ERROR', 'Unable to synchronize alert status with clinical vault.');
        }
    };

    const renderItem = ({ item }: { item: Reminder }) => (
        <AppCard padding="none" style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.timeBox, { backgroundColor: item.isActive ? Theme.Colors.primary + '10' : Theme.Colors.surface }]}>
                    <AppText variant="h2" weight="black" style={{ color: item.isActive ? Theme.Colors.primary : Theme.Colors.textSecondary }}>{item.time}</AppText>
                </View>
                <TouchableOpacity onPress={() => toggleReminder(item.id, item.isActive)} style={styles.toggleBtn}>
                    <Ionicons
                        name={item.isActive ? 'notifications' : 'notifications-off'}
                        size={24}
                        color={item.isActive ? Theme.Colors.primary : Theme.Colors.divider}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.medContent}>
                <AppText variant="body" weight="black" uppercase style={{ marginBottom: 16 }}>{item.medicationName}</AppText>
                <View style={styles.daysRow}>
                    {DAYS.map((day, i) => {
                        const isScheduled = item.days.includes(i.toString());
                        return (
                            <View key={i} style={[styles.dayCircle, isScheduled && styles.dayActive]}>
                                <AppText variant="caption" weight="black" style={{ fontSize: 9, color: isScheduled ? 'white' : Theme.Colors.textSecondary }}>{day}</AppText>
                            </View>
                        );
                    })}
                </View>
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.actionLink} onPress={() => { }}>
                    <Ionicons name="options-outline" size={16} color={Theme.Colors.primary} />
                    <AppText variant="caption" color="primary" weight="black" style={{ marginLeft: 8 }}>RECONFIGURE</AppText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { }} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color={Theme.Colors.error} />
                </TouchableOpacity>
            </View>
        </AppCard>
    );

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Temporal Alerts</AppText>
                <TouchableOpacity style={styles.addBtn} onPress={() => router.push({ pathname: '/(app)/add-reminder', params: { medId } })}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.hero}>
                <AppText variant="h2" weight="black">Compliance Protocols</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={styles.heroSub}>
                    Chronological notification matrix to ensure precise pharmacological adherence.
                </AppText>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={reminders}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="alarm-outline" size={48} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">ZERO ACTIVE ALERTS</AppText>
                            <AppText variant="caption" color="textSecondary" weight="bold" style={styles.emptyDesc}>
                                No adherence alerts have been configured for detected regimens.
                            </AppText>
                            <AppButton
                                title="CONFIGURE NEW ALERT"
                                onPress={() => router.push({ pathname: '/(app)/add-reminder', params: { medId } })}
                                style={{ marginTop: 32, paddingHorizontal: 32 }}
                            />
                        </View>
                    }
                />
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.text, justifyContent: 'center', alignItems: 'center' },

    hero: { paddingHorizontal: 24, marginBottom: 8 },
    heroSub: { marginTop: 8, lineHeight: 22 },

    list: { padding: 24, paddingTop: 12 },
    card: { borderRadius: 32, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    timeBox: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 },
    toggleBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    medContent: { paddingHorizontal: 20, marginBottom: 24 },
    daysRow: { flexDirection: 'row', gap: 6 },
    dayCircle: { width: 32, height: 32, borderRadius: 10, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, justifyContent: 'center', alignItems: 'center' },
    dayActive: { backgroundColor: Theme.Colors.text, borderColor: Theme.Colors.text },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: Theme.Colors.divider, backgroundColor: Theme.Colors.surface + '30' },
    actionLink: { flexDirection: 'row', alignItems: 'center' },
    deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.Colors.error + '05', justifyContent: 'center', alignItems: 'center' },

    emptyContainer: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
    emptyIconBox: { width: 84, height: 84, borderRadius: 28, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
    emptyDesc: { textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

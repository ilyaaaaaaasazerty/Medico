import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { availabilityApi } from '@/services/availability.api';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

type BlockType = 'vacation' | 'daily';

export default function BlockTimeScreen() {
    const [blockType, setBlockType] = useState<BlockType>('vacation');
    const [loading, setLoading] = useState(false);

    // Vacation fields
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [vacationReason, setVacationReason] = useState('');

    // Daily break fields
    const [breakStartTime, setBreakStartTime] = useState('12:00');
    const [breakEndTime, setBreakEndTime] = useState('14:00');

    const handleSubmitVacation = async () => {
        if (!startDate) {
            Alert.alert('Selection Required', 'Specific start date is necessary for batch blocking protocol.');
            return;
        }

        setLoading(true);
        try {
            const start = new Date(startDate);
            const end = endDate ? new Date(endDate) : start;

            const promises = [];
            const current = new Date(start);

            while (current <= end) {
                promises.push(
                    availabilityApi.addException({
                        date: current.toISOString().split('T')[0],
                        isBlocked: true,
                        reason: vacationReason || 'Vacation',
                    })
                );
                current.setDate(current.getDate() + 1);
            }

            await Promise.all(promises);

            Alert.alert('Successfully Synchronized', `Blocked ${promises.length} clinical day(s) from the registry.`, [
                { text: 'Understood', onPress: () => router.back() },
            ]);
        } catch (error) {
            Alert.alert('Sync Error', 'Failed to propagate clinical block across regional servers.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitDailyBreak = async () => {
        if (!breakStartTime || !breakEndTime) {
            Alert.alert('Configuration Error', 'Temporal boundaries are required for daily break propagation.');
            return;
        }

        setLoading(true);
        try {
            const promises = [];
            const today = new Date();

            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() + i);

                promises.push(
                    availabilityApi.addException({
                        date: date.toISOString().split('T')[0],
                        isBlocked: true,
                        reason: 'Daily Break',
                        startTime: breakStartTime,
                        endTime: breakEndTime,
                    })
                );
            }

            await Promise.all(promises);
            Alert.alert('Daily Break Active', 'Your schedule has been updated with recurring temporal blocks for the next 30 days.');
            router.back();
        } catch (error) {
            Alert.alert('Sync Error', 'Failed to synchronize daily recurring patterns.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <AppText variant="h3" weight="black">Batch Block Protocol</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Temporal Override gate</AppText>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroBox}>
                    <AppText variant="h1" weight="black">Batch Overrides</AppText>
                    <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 8 }}>
                        Efficiently propagate clinical blocks over multiple dates or implement recurring daily pauses.
                    </AppText>
                </View>

                {/* Block Type Selector */}
                <View style={styles.typeRow}>
                    <TouchableOpacity
                        style={[styles.typeBtn, blockType === 'vacation' && styles.typeBtnActive]}
                        onPress={() => setBlockType('vacation')}
                    >
                        <View style={[styles.iconBox, blockType === 'vacation' && styles.iconBoxActive]}>
                            <Ionicons name="airplane" size={24} color={blockType === 'vacation' ? 'white' : Theme.Colors.primary} />
                        </View>
                        <AppText variant="caption" color={blockType === 'vacation' ? 'primary' : 'textSecondary'} weight="black" uppercase style={{ fontSize: 8, textAlign: 'center' }}>
                            Period Leave
                        </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.typeBtn, blockType === 'daily' && styles.typeBtnActive]}
                        onPress={() => setBlockType('daily')}
                    >
                        <View style={[styles.iconBox, blockType === 'daily' && styles.iconBoxActive]}>
                            <Ionicons name="time" size={24} color={blockType === 'daily' ? 'white' : Theme.Colors.primary} />
                        </View>
                        <AppText variant="caption" color={blockType === 'daily' ? 'primary' : 'textSecondary'} weight="black" uppercase style={{ fontSize: 8, textAlign: 'center' }}>
                            Daily Break
                        </AppText>
                    </TouchableOpacity>
                </View>

                {blockType === 'vacation' ? (
                    <AppCard padding="md" style={styles.formCard}>
                        <View style={styles.dateGrid}>
                            <View style={{ flex: 1 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginBottom: 8, marginLeft: 4 }}>Protocol Start</AppText>
                                <TextInput
                                    style={styles.terminalInput}
                                    placeholder="2026-01-10"
                                    placeholderTextColor={Theme.Colors.textTertiary}
                                    value={startDate}
                                    onChangeText={setStartDate}
                                />
                            </View>
                            <View style={{ width: 16 }} />
                            <View style={{ flex: 1 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginBottom: 8, marginLeft: 4 }}>Protocol End</AppText>
                                <TextInput
                                    style={styles.terminalInput}
                                    placeholder="2026-01-20"
                                    placeholderTextColor={Theme.Colors.textTertiary}
                                    value={endDate}
                                    onChangeText={setEndDate}
                                />
                            </View>
                        </View>

                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginBottom: 8, marginLeft: 4, marginTop: 20 }}>Clinical Rationale</AppText>
                        <TextInput
                            style={styles.terminalInput}
                            placeholder="e.g. Vacation, Medical Conference"
                            placeholderTextColor={Theme.Colors.textTertiary}
                            value={vacationReason}
                            onChangeText={setVacationReason}
                        />
                    </AppCard>
                ) : (
                    <AppCard padding="md" style={styles.formCard}>
                        <View style={styles.dateGrid}>
                            <View style={{ flex: 1 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginBottom: 8, marginLeft: 4 }}>Break Start</AppText>
                                <TextInput
                                    style={styles.terminalInput}
                                    placeholder="12:00"
                                    value={breakStartTime}
                                    onChangeText={setBreakStartTime}
                                />
                            </View>
                            <View style={{ width: 16 }} />
                            <View style={{ flex: 1 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginBottom: 8, marginLeft: 4 }}>Break End</AppText>
                                <TextInput
                                    style={styles.terminalInput}
                                    placeholder="14:00"
                                    value={breakEndTime}
                                    onChangeText={setBreakEndTime}
                                />
                            </View>
                        </View>

                        <View style={styles.noteBox}>
                            <Ionicons name="information-circle-outline" size={20} color={Theme.Colors.primary} />
                            <AppText variant="caption" color="textSecondary" style={{ flex: 1, marginLeft: 12 }}>
                                This protocol will propagate a daily temporal block from {breakStartTime} to {breakEndTime} across the next 30 consecutive calendar days.
                            </AppText>
                        </View>
                    </AppCard>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    title={blockType === 'vacation' ? 'Propagate Block Protocol' : 'Sync Daily Blocks'}
                    onPress={blockType === 'vacation' ? handleSubmitVacation : handleSubmitDailyBreak}
                    loading={loading}
                    style={{ height: 60, borderRadius: 20 }}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider, backgroundColor: Theme.Colors.surface },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    content: { flex: 1 },
    scrollContent: { paddingBottom: 120 },
    heroBox: { padding: 32, paddingBottom: 16 },

    typeRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 32, marginBottom: 24 },
    typeBtn: { flex: 1, backgroundColor: Theme.Colors.surface, borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    typeBtnActive: { borderColor: Theme.Colors.primary, backgroundColor: Theme.Colors.primary + '05' },
    iconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    iconBoxActive: { backgroundColor: Theme.Colors.primary },

    formCard: { marginHorizontal: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
    dateGrid: { flexDirection: 'row' },
    terminalInput: { backgroundColor: Theme.Colors.background, borderRadius: 16, padding: 16, fontSize: 16, color: Theme.Colors.text, borderWidth: 1, borderColor: Theme.Colors.divider, fontWeight: '600' },

    noteBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Theme.Colors.primary + '08', padding: 16, borderRadius: 16, marginTop: 24, borderWidth: 1, borderColor: Theme.Colors.primary + '15' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';
import { transportApi, TransportWorkingHours } from '@/services/transport.api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TransportScheduleScreen() {
    const router = useRouter();
    const [schedule, setSchedule] = useState<TransportWorkingHours[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSchedule();
    }, []);

    const loadSchedule = async () => {
        try {
            const res = await transportApi.getSchedule();
            if (res.success && res.data) {
                // Fill in missing days with defaults
                const fullSchedule: TransportWorkingHours[] = [];
                for (let i = 0; i < 7; i++) {
                    const existing = res.data.find((h: TransportWorkingHours) => h.dayOfWeek === i);
                    fullSchedule.push(existing || {
                        id: `temp-${i}`,
                        dayOfWeek: i,
                        openTime: '08:00',
                        closeTime: '18:00',
                        isClosed: true
                    });
                }
                setSchedule(fullSchedule);
            }
        } catch (error) {
            console.error('Error loading schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (dayOfWeek: number) => {
        setSchedule(prev => prev.map(day =>
            day.dayOfWeek === dayOfWeek ? { ...day, isClosed: !day.isClosed } : day
        ));
    };

    const saveSchedule = async () => {
        setSaving(true);
        try {
            const payload = schedule.map(day => ({
                dayOfWeek: day.dayOfWeek,
                openTime: day.openTime,
                closeTime: day.closeTime,
                isClosed: day.isClosed
            }));
            await transportApi.updateSchedule(payload);
            router.back();
        } catch (error) {
            console.error('Error saving schedule:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    return (
        <AppScreen scrollable>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Theme.Colors.text} />
                </TouchableOpacity>
                <AppText variant="h2" weight="black">Working Hours</AppText>
            </View>

            <AppText variant="body" color="textSecondary" style={{ marginBottom: 24 }}>
                Set your availability for each day of the week. Patients will only see you as available during these hours.
            </AppText>

            {schedule.map((day) => (
                <AppCard key={day.dayOfWeek} style={styles.dayCard} padding="md">
                    <View style={styles.dayRow}>
                        <AppText variant="body" weight="bold" style={{ flex: 1 }}>{DAYS[day.dayOfWeek]}</AppText>
                        <View style={styles.timeDisplay}>
                            {!day.isClosed && (
                                <AppText variant="caption" color="textSecondary">{day.openTime} - {day.closeTime}</AppText>
                            )}
                        </View>
                        <Switch
                            value={!day.isClosed}
                            onValueChange={() => toggleDay(day.dayOfWeek)}
                            trackColor={{ false: Theme.Colors.divider, true: Theme.Colors.primary + '60' }}
                            thumbColor={!day.isClosed ? Theme.Colors.primary : Theme.Colors.textTertiary}
                        />
                    </View>
                </AppCard>
            ))}

            <AppButton
                title={saving ? 'Saving...' : 'Save Schedule'}
                onPress={saveSchedule}
                disabled={saving}
                style={{ marginTop: 24 }}
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    dayCard: { marginBottom: 10 },
    dayRow: { flexDirection: 'row', alignItems: 'center' },
    timeDisplay: { marginRight: 12 },
});

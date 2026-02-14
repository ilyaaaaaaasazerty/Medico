import { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { availabilityApi } from '@/services/availability.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Availability {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
}

export default function ManageAvailabilityScreen() {
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    useEffect(() => {
        loadAvailability();
    }, []);

    const loadAvailability = async () => {
        try {
            const res = await availabilityApi.getMyAvailability();
            if (res.success && res.data) {
                setAvailability(res.data);
            }
        } catch (error) {
            console.error('Error loading availability:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDayAvailability = (day: number) => availability.find((a) => a.dayOfWeek === day);

    const handleSetAvailability = async (day: number, startTime: string, endTime: string) => {
        setSaving(true);
        try {
            const res = await availabilityApi.setAvailability({
                dayOfWeek: day,
                startTime,
                endTime,
                slotDuration: 30,
            });

            if (res.success && res.data) {
                setAvailability((prev) => {
                    const filtered = prev.filter((a) => a.dayOfWeek !== day);
                    return [...filtered, res.data!];
                });
            }
        } catch (error) {
            Alert.alert('System Error', 'Unable to synchronize regional schedule server.');
        } finally {
            setSaving(false);
            setSelectedDay(null);
        }
    };

    const handleRemoveAvailability = async (id: string, day: number) => {
        Alert.alert('Deactivate Schedule', `Do you want to clear clinical hours for ${DAYS[day]}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm Deactivation',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await availabilityApi.removeAvailability(id);
                        setAvailability((prev) => prev.filter((a) => a.id !== id));
                    } catch (error) {
                        Alert.alert('Error', 'Deactivation failed.');
                    }
                },
            },
        ]);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="bold">Clinical Schedule</AppText>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 24 }}>
                    <AppText variant="h2" weight="black">Weekly Hours</AppText>
                    <AppText variant="body" color="textSecondary">Define your recurring availability for patient bookings.</AppText>
                </View>

                {DAYS.map((day, index) => {
                    const dayAvail = getDayAvailability(index);
                    const isSelected = selectedDay === index;

                    return (
                        <AppCard
                            key={day}
                            style={[
                                styles.dayCard,
                                dayAvail && styles.dayCardActive
                            ]}
                            padding="md"
                        >
                            <View style={styles.dayHeader}>
                                <View style={styles.dayInfo}>
                                    <AppText variant="body" weight="bold">{day}</AppText>
                                    {dayAvail && (
                                        <View style={styles.timeTag}>
                                            <Ionicons name="time" size={12} color={Theme.Colors.primary} />
                                            <AppText variant="caption" color="primary" weight="bold">{dayAvail.startTime} — {dayAvail.endTime}</AppText>
                                        </View>
                                    )}
                                </View>

                                {dayAvail ? (
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => handleRemoveAvailability(dayAvail.id, index)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={Theme.Colors.error} />
                                    </TouchableOpacity>
                                ) : (
                                    <AppButton
                                        title={isSelected ? "Cancel" : "Set Hours"}
                                        variant={isSelected ? "ghost" : "tonal"}
                                        size="sm"
                                        onPress={() => setSelectedDay(isSelected ? null : index)}
                                        textStyle={{ color: isSelected ? Theme.Colors.textSecondary : Theme.Colors.primary }}
                                    />
                                )}
                            </View>

                            {isSelected && (
                                <View style={styles.presetsBox}>
                                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginBottom: 12 }}>QUICK TEMPLATES</AppText>
                                    <View style={styles.presetGrid}>
                                        <TouchableOpacity style={styles.presetItem} onPress={() => handleSetAvailability(index, '09:00', '17:00')}>
                                            <AppText variant="caption" weight="black">FULL DAY</AppText>
                                            <AppText variant="caption" color="textSecondary">09:00 - 17:00</AppText>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.presetItem} onPress={() => handleSetAvailability(index, '08:00', '14:00')}>
                                            <AppText variant="caption" weight="black">MORNING</AppText>
                                            <AppText variant="caption" color="textSecondary">08:00 - 14:00</AppText>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.presetItem} onPress={() => handleSetAvailability(index, '14:00', '20:00')}>
                                            <AppText variant="caption" weight="black">EVENING</AppText>
                                            <AppText variant="caption" color="textSecondary">14:00 - 20:00</AppText>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </AppCard>
                    );
                })}

                <AppCard
                    style={styles.blockBtn}
                    onPress={() => router.push('/(app)/block-time')}
                    padding="md"
                >
                    <View style={styles.blockIcon}>
                        <Ionicons name="calendar" size={24} color={Theme.Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <AppText variant="body" weight="bold">Temporary Blocks & Leave</AppText>
                        <AppText variant="caption" color="textSecondary">Manage vacations or sporadic breaks.</AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Theme.Colors.textSecondary} />
                </AppCard>

                <View style={{ height: 40 }} />
            </ScrollView>

            {saving && (
                <View style={styles.savingOverlay}>
                    <ActivityIndicator size="large" color={Theme.Colors.white} />
                    <AppText variant="body" color="textInverted" weight="bold" style={{ marginTop: 16 }}>Synchronizing...</AppText>
                </View>
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, gap: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', ...Theme.Shadows.soft },

    content: { padding: 24 },

    dayCard: { marginBottom: 12 },
    dayCardActive: { borderColor: Theme.Colors.primary },

    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dayInfo: { gap: 4 },
    timeTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.Colors.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

    actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.Colors.error + '10', justifyContent: 'center', alignItems: 'center' },

    presetsBox: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    presetGrid: { flexDirection: 'row', gap: 8 },
    presetItem: { flex: 1, backgroundColor: Theme.Colors.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Theme.Colors.divider, alignItems: 'center', gap: 4 },

    blockBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
    blockIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    savingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { appointmentApi } from '@/services/appointment.api';
import { searchApi } from '@/services/availability.api';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

interface TimeSlot {
    time: string;
    available: boolean;
}

export default function RescheduleAppointmentScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [appointment, setAppointment] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        loadAppointment();
    }, [id]);

    const loadAppointment = async () => {
        try {
            const res = await appointmentApi.getAppointmentDetails(id);
            if (res.success && res.data) {
                setAppointment(res.data);
            }
        } catch (error) {
            console.error('Error loading session details:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSlots = async (date: string) => {
        if (!appointment?.doctorId) return;

        setLoadingSlots(true);
        setSelectedDate(date);
        setSelectedTime('');

        try {
            const res = await searchApi.getDoctorSlots(appointment.doctorId, date);
            if (res.success && res.data) {
                setSlots(res.data);
            }
        } catch (error) {
            console.error('Error loading matrix slots:', error);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleReschedule = async () => {
        if (!selectedDate || !selectedTime) {
            Alert.alert('Selection Error', 'New temporal parameters must be defined for the session shift.');
            return;
        }

        Alert.alert(
            'Authorize Temporal Shift',
            `Re-assign session to ${selectedDate} at ${selectedTime}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm Shift',
                    onPress: async () => {
                        setSaving(true);
                        try {
                            await appointmentApi.rescheduleAppointment(
                                id,
                                selectedDate,
                                selectedTime
                            );
                            Alert.alert('Success', 'Temporal shift committed to the clinical matrix.');
                            router.back();
                        } catch (error) {
                            Alert.alert('Operational Error', 'Failed to commit temporal shift.');
                        } finally {
                            setSaving(false);
                        }
                    }
                }
            ]
        );
    };

    const getDates = () => {
        const dates = [];
        for (let i = 1; i <= 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            dates.push({
                date: date.toISOString().split('T')[0],
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                num: date.getDate(),
            });
        }
        return dates;
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    const dates = getDates();

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="close" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <AppText variant="h3" weight="black">Temporal Shift</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Session Matrix realignment</AppText>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroBox}>
                    <AppText variant="h1" weight="black">Shift Session</AppText>
                    <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 8 }}>
                        Realignment of clinical session parameters. Select a new temporal slot from the authorized matrix.
                    </AppText>
                </View>

                {/* Current Context */}
                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionLabel}>Current Parameters</AppText>
                    <AppCard padding="md" style={styles.contextCard}>
                        <View style={styles.contextRow}>
                            <Ionicons name="calendar-outline" size={18} color={Theme.Colors.primary} />
                            <AppText variant="body" weight="black" style={{ marginLeft: 12 }}>
                                {new Date(appointment?.scheduledDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </AppText>
                        </View>
                        <View style={styles.contextRow}>
                            <Ionicons name="time-outline" size={18} color={Theme.Colors.primary} />
                            <AppText variant="body" weight="black" style={{ marginLeft: 12 }}>{appointment?.scheduledTime}</AppText>
                        </View>
                        <View style={styles.contextRow}>
                            <Ionicons name="person-outline" size={18} color={Theme.Colors.primary} />
                            <AppText variant="body" weight="black" style={{ marginLeft: 12 }}>
                                DR. {appointment?.doctor?.lastName.toUpperCase()}
                            </AppText>
                        </View>
                    </AppCard>
                </View>

                {/* Date Matrix */}
                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionLabel}>Date Selection Matrix</AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                        {dates.map(d => (
                            <TouchableOpacity
                                key={d.date}
                                style={[styles.dateNode, selectedDate === d.date && styles.dateNodeActive]}
                                onPress={() => loadSlots(d.date)}
                            >
                                <AppText variant="caption" weight="black" uppercase style={{ fontSize: 8, color: selectedDate === d.date ? 'white' : Theme.Colors.textSecondary }}>{d.day}</AppText>
                                <AppText variant="h3" weight="black" style={{ marginTop: 4, color: selectedDate === d.date ? 'white' : Theme.Colors.text }}>{d.num}</AppText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Temporal Slots */}
                {selectedDate && (
                    <View style={styles.section}>
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionLabel}>Available Temporal Slots</AppText>
                        {loadingSlots ? (
                            <ActivityIndicator color={Theme.Colors.primary} style={{ marginTop: 20 }} />
                        ) : slots.length === 0 ? (
                            <View style={styles.voidSlots}>
                                <Ionicons name="calendar-outline" size={40} color={Theme.Colors.divider} />
                                <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 12 }}>No authorized slots manifest for this date.</AppText>
                            </View>
                        ) : (
                            <View style={styles.slotGrid}>
                                {slots.filter(s => s.available).map(slot => (
                                    <TouchableOpacity
                                        key={slot.time}
                                        style={[styles.slotTrigger, selectedTime === slot.time && styles.slotTriggerActive]}
                                        onPress={() => setSelectedTime(slot.time)}
                                    >
                                        <AppText variant="caption" weight="black" style={{ fontSize: 13, color: selectedTime === slot.time ? 'white' : Theme.Colors.text }}>
                                            {slot.time}
                                        </AppText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    title={saving ? 'Shift in Progress...' : 'Confirm Temporal Shift'}
                    onPress={handleReschedule}
                    disabled={!selectedDate || !selectedTime || saving}
                    loading={saving}
                    style={{ height: 60, borderRadius: 20 }}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider, backgroundColor: Theme.Colors.surface },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    content: { flex: 1 },
    scrollContent: { paddingBottom: 120 },
    heroBox: { padding: 32, paddingBottom: 16 },

    section: { paddingHorizontal: 24, marginBottom: 32 },
    sectionLabel: { fontSize: 8, letterSpacing: 1.5, marginBottom: 16, marginLeft: 4 },

    contextCard: { borderWidth: 1, borderColor: Theme.Colors.divider },
    contextRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },

    dateScroll: { marginLeft: -4 },
    dateNode: { width: 64, height: 80, borderRadius: 20, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    dateNodeActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary, ...Theme.Shadows.primary },

    voidSlots: { alignItems: 'center', paddingVertical: 40, backgroundColor: Theme.Colors.surface, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.divider, borderStyle: 'dashed' },
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    slotTrigger: { flexBasis: '30%', height: 50, borderRadius: 14, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, alignItems: 'center', justifyContent: 'center' },
    slotTriggerActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
});

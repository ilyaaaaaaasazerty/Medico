import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { patientApi } from '@/services/patient.api';
import { AppScreen, AppText, AppInput, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AddReminderScreen() {
    const router = useRouter();
    const { medId } = useLocalSearchParams<{ medId: string }>();
    const [time, setTime] = useState('08:00');
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
    const [loading, setLoading] = useState(false);

    const toggleDay = (index: number) => {
        if (selectedDays.includes(index)) {
            setSelectedDays(selectedDays.filter(d => d !== index));
        } else {
            setSelectedDays([...selectedDays, index].sort());
        }
    };

    const handleAdd = async () => {
        if (!time || selectedDays.length === 0) {
            Alert.alert('Selection Required', 'Specific chronological parameters must be provided.');
            return;
        }

        setLoading(true);
        try {
            // Mocking the specific medication name for the placeholder
            const res = await patientApi.addMedicationReminder({
                medicationId: medId,
                time,
                days: selectedDays.map(String),
                isActive: true
            });
            if (res.success) {
                Alert.alert('Protocol Active', 'Temporal alert has been committed to the adhering registry.');
                router.back();
            }
        } catch (error) {
            Alert.alert('System Error', 'Failed to synchronize temporal alert.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="close" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Configure Alert</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <AppText variant="caption" color="primary" weight="black" uppercase style={{ letterSpacing: 1.5, marginBottom: 24 }}>CHRONO PARAMETERS</AppText>

                <AppInput
                    label="TRIGGER TIME (24H)"
                    placeholder="08:00"
                    value={time}
                    onChangeText={setTime}
                />

                <AppText variant="caption" weight="black" uppercase style={styles.label}>ADHERENCE CYCLE</AppText>
                <View style={styles.daysGrid}>
                    {DAYS.map((day, i) => {
                        const isActive = selectedDays.includes(i);
                        return (
                            <TouchableOpacity
                                key={i}
                                style={[styles.dayChip, isActive && styles.dayChipActive]}
                                onPress={() => toggleDay(i)}
                            >
                                <AppText variant="caption" weight="black" style={{ color: isActive ? 'white' : Theme.Colors.textSecondary }}>{day}</AppText>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <AppButton
                    title="ACTIVATE PROTOCOL"
                    loading={loading}
                    onPress={handleAdd}
                    style={styles.submitBtn}
                />
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    content: { padding: 24 },
    label: { fontSize: 8, letterSpacing: 1, marginBottom: 12, marginTop: 24, marginLeft: 4 },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    dayChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider },
    dayChipActive: { backgroundColor: Theme.Colors.text, borderColor: Theme.Colors.text },
    submitBtn: { marginTop: 48, height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text },
});

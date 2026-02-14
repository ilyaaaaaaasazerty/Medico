import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { labApi } from '@/services/lab.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

interface DayHours {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}

export default function LabHoursScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hours, setHours] = useState<DayHours[]>(
        DAYS.map((_, i) => ({ dayOfWeek: i, openTime: '08:00', closeTime: '18:00', isClosed: i === 0 }))
    );

    useEffect(() => {
        loadHours();
    }, []);

    const loadHours = async () => {
        try {
            const res = await labApi.getWorkingHours();
            if (res.success && res.data && res.data.length > 0) {
                setHours(res.data);
            }
        } catch (error) {
            console.error('Error loading operational temporal protocol:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await labApi.setWorkingHours(hours);
            if (res.success) {
                Alert.alert('PROTOCOL SYNCHRONIZED', 'Institutional availability parameters have been updated across the diagnostic network.');
            }
        } catch (error) {
            Alert.alert('SYNCH ERROR', 'Failed to propagate temporal protocol to institutional registry.');
        } finally {
            setSaving(false);
        }
    };

    const updateDay = (index: number, field: keyof DayHours, value: any) => {
        const newHours = [...hours];
        newHours[index] = { ...newHours[index], [field]: value };
        setHours(newHours);
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
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Temporal Protocol</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <AppText variant="h2" weight="black">Operational Lifecycle</AppText>
                    <AppText variant="body" color="textSecondary" weight="bold" style={styles.heroSub}>
                        Configure facility availability to regulate diagnostic slot generation and institutional patient intake.
                    </AppText>
                </View>

                <View style={styles.guidanceBox}>
                    <View style={styles.guidanceIcon}>
                        <Ionicons name="time" size={20} color={Theme.Colors.primary} />
                    </View>
                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ flex: 1, lineHeight: 18 }}>
                        SCHEDULE MODIFICATIONS ARE PROPAGATED GLOBALLY. DECOMMISSIONED DAYS PREVENT ALL DIAGNOSTIC ENROLLMENTS.
                    </AppText>
                </View>

                {hours.map((day, idx) => (
                    <AppCard key={idx} style={[styles.dayCard, day.isClosed && styles.dayCardClosed]} padding="none">
                        <View style={styles.dayContent}>
                            <View style={styles.dayHeader}>
                                <View style={styles.dayTitleGroup}>
                                    <View style={[styles.statusIndicator, { backgroundColor: day.isClosed ? Theme.Colors.error : Theme.Colors.success }]} />
                                    <AppText variant="body" weight="black" uppercase style={{ fontSize: 13, marginLeft: 12 }}>
                                        {DAYS[day.dayOfWeek]}
                                    </AppText>
                                </View>
                                <View style={styles.switchGroup}>
                                    <AppText variant="caption" weight="black" color="textSecondary" style={{ marginRight: 12, fontSize: 9 }}>
                                        {day.isClosed ? 'DECOMMISSIONED' : 'OPERATIONAL'}
                                    </AppText>
                                    <Switch
                                        value={!day.isClosed}
                                        onValueChange={(v) => updateDay(idx, 'isClosed', !v)}
                                        trackColor={{ false: Theme.Colors.surface, true: Theme.Colors.text }}
                                        thumbColor="white"
                                        ios_backgroundColor={Theme.Colors.surface}
                                    />
                                </View>
                            </View>

                            {!day.isClosed && (
                                <View style={styles.temporalGroup}>
                                    <TimeSection
                                        label="INTAKE START"
                                        icon="sunny-outline"
                                        value={day.openTime}
                                        onChange={(t: string) => updateDay(idx, 'openTime', t)}
                                    />
                                    <View style={styles.temporalDivider} />
                                    <TimeSection
                                        label="CESSATION"
                                        icon="moon-outline"
                                        value={day.closeTime}
                                        onChange={(t: string) => updateDay(idx, 'closeTime', t)}
                                    />
                                </View>
                            )}
                        </View>
                    </AppCard>
                ))}

                <View style={styles.footer}>
                    <AppButton
                        title="COMMIT PROTOCOL PARAMETERS"
                        onPress={handleSave}
                        loading={saving}
                        style={styles.commitBtn}
                    />
                </View>
                <View style={{ height: 60 }} />
            </ScrollView>
        </AppScreen>
    );
}

function TimeSection({ label, icon, value, onChange }: any) {
    return (
        <View style={styles.timeSection}>
            <View style={styles.timeLabelRow}>
                <Ionicons name={icon} size={14} color={Theme.Colors.primary} />
                <AppText variant="caption" color="textSecondary" weight="black" style={{ marginLeft: 8, fontSize: 9 }}>{label}</AppText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
                {TIME_SLOTS.map(t => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.timeChip, value === t && styles.timeChipActive]}
                        onPress={() => onChange(t)}
                    >
                        <AppText variant="caption" weight="black" style={{ color: value === t ? 'white' : Theme.Colors.textSecondary, fontSize: 10 }}>
                            {t}
                        </AppText>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    content: { paddingHorizontal: 24 },
    hero: { marginBottom: 32 },
    heroSub: { marginTop: 8, lineHeight: 22 },

    guidanceBox: { flexDirection: 'row', gap: 16, padding: 20, backgroundColor: Theme.Colors.primary + '08', borderRadius: 24, marginBottom: 32, borderWidth: 1, borderColor: Theme.Colors.primary + '15' },
    guidanceIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },

    dayCard: { marginBottom: 16, borderRadius: 28 },
    dayCardClosed: { opacity: 0.6 },
    dayContent: { padding: 20 },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dayTitleGroup: { flexDirection: 'row', alignItems: 'center' },
    statusIndicator: { width: 8, height: 8, borderRadius: 4 },
    switchGroup: { flexDirection: 'row', alignItems: 'center' },

    temporalGroup: { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    temporalDivider: { height: 24 },

    timeSection: { gap: 12 },
    timeLabelRow: { flexDirection: 'row', alignItems: 'center' },
    timeScroll: { gap: 8, paddingBottom: 4 },
    timeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider },
    timeChipActive: { backgroundColor: Theme.Colors.text, borderColor: Theme.Colors.text },

    footer: { marginTop: 16 },
    commitBtn: { height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { doctorApi } from '@/services/doctor.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard } from '@/components/base';
import Theme from '@/constants/Theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Appointment {
    id: string;
    scheduledDate: string;
    scheduledTime: string;
    status: string;
    patient: { firstName: string; lastName: string };
    service: { name: string };
}

export default function DoctorScheduleScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [weekDates, setWeekDates] = useState<Date[]>([]);

    useEffect(() => {
        generateWeek(selectedDate);
    }, []);

    useEffect(() => {
        loadAppointments();
    }, [selectedDate]);

    const generateWeek = (centerDate: Date) => {
        const dates: Date[] = [];
        const startOfWeek = new Date(centerDate);
        startOfWeek.setDate(centerDate.getDate() - centerDate.getDay());
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push(d);
        }
        setWeekDates(dates);
    };

    const loadAppointments = async () => {
        setLoading(true);
        try {
            const start = new Date(selectedDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(selectedDate);
            end.setHours(23, 59, 59, 999);

            const res = await doctorApi.getAppointments({
                start: start.toISOString(),
                end: end.toISOString()
            });
            if (res.success && res.data) {
                setAppointments(res.data);
            }
        } catch (error) {
            console.error('Error loading session matrix:', error);
        } finally {
            setLoading(false);
        }
    };

    const navigateWeek = (direction: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + (direction * 7));
        setSelectedDate(newDate);
        generateWeek(newDate);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date) => {
        return date.toDateString() === selectedDate.toDateString();
    };

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return { color: Theme.Colors.success, label: 'AUTHORIZED' };
            case 'PENDING': return { color: Theme.Colors.warning, label: 'AWAITING' };
            case 'COMPLETED': return { color: Theme.Colors.primary, label: 'FINALIZED' };
            case 'CANCELLED': return { color: Theme.Colors.error, label: 'TERMINATED' };
            default: return { color: Theme.Colors.textTertiary, label: 'STATUS UNKNOWN' };
        }
    };

    return (
        <AppScreen padding={false} scrollable={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <View>
                    <AppText variant="h3" weight="black">Slot Matrix</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Real-time Session Monitoring</AppText>
                </View>
                <TouchableOpacity
                    style={styles.presentCycleBtn}
                    onPress={() => {
                        const today = new Date();
                        setSelectedDate(today);
                        generateWeek(today);
                    }}
                >
                    <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 9 }}>Present Cycle</AppText>
                </TouchableOpacity>
            </View>

            {/* Matrix Strip */}
            <View style={styles.matrixStrip}>
                <View style={styles.monthLabel}>
                    <TouchableOpacity onPress={() => navigateWeek(-1)} style={styles.navBtn}>
                        <Ionicons name="chevron-back" size={18} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                    <AppText variant="body" weight="black" uppercase style={{ letterSpacing: 1 }}>
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </AppText>
                    <TouchableOpacity onPress={() => navigateWeek(1)} style={styles.navBtn}>
                        <Ionicons name="chevron-forward" size={18} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.weekControl}>
                    {weekDates.map((date, idx) => {
                        const selected = isSelected(date);
                        const today = isToday(date);
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.dayTerminal,
                                    selected && styles.dayTerminalSelected,
                                ]}
                                onPress={() => setSelectedDate(date)}
                            >
                                <AppText
                                    variant="caption"
                                    color={selected ? 'textInverted' : 'textSecondary'}
                                    weight="black"
                                    style={{ fontSize: 8 }}
                                >
                                    {DAYS[date.getDay()].toUpperCase()}
                                </AppText>
                                <View style={[styles.dateFrame, selected && styles.dateFrameSelected]}>
                                    <AppText
                                        variant="body"
                                        color={selected ? 'textInverted' : 'text'}
                                        weight="black"
                                    >
                                        {date.getDate()}
                                    </AppText>
                                </View>
                                {today && <View style={[styles.pulseStatus, selected && { backgroundColor: 'white' }]} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Session List */}
            <View style={styles.content}>
                <View style={styles.contentHeader}>
                    <AppText variant="h2" weight="black">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </AppText>
                    <View style={styles.matrixBadge}>
                        <AppText variant="caption" color="textInverted" weight="black">{appointments.length} SESSIONS</AppText>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={Theme.Colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={appointments}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => {
                            const status = getStatusTheme(item.status);
                            return (
                                <AppCard
                                    padding="md"
                                    style={styles.sessionCard}
                                    onPress={() => router.push({ pathname: '/(app)/record-visit', params: { appointmentId: item.id } })}
                                >
                                    <View style={styles.timeAxis}>
                                        <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 10 }}>{item.scheduledTime}</AppText>
                                        <View style={styles.timeLine} />
                                    </View>

                                    <View style={styles.sessionInfo}>
                                        <AppText variant="body" weight="black">{item.patient.firstName} {item.patient.lastName}</AppText>
                                        <View style={styles.protocolRow}>
                                            <Ionicons name="medical-outline" size={10} color={Theme.Colors.textSecondary} />
                                            <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 4 }}>Protocol: {item.service.name}</AppText>
                                        </View>
                                    </View>

                                    <View style={[styles.statusTag, { backgroundColor: status.color + '10' }]}>
                                        <AppText
                                            variant="caption"
                                            style={{ color: status.color, fontSize: 8 }}
                                            weight="black"
                                            uppercase
                                        >
                                            {status.label}
                                        </AppText>
                                    </View>
                                </AppCard>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={styles.emptyMatrix}>
                                <View style={styles.voidIconBox}>
                                    <Ionicons name="calendar-clear-outline" size={32} color={Theme.Colors.divider} />
                                </View>
                                <AppText variant="h3" weight="black" style={{ marginTop: 20 }}>Matrix Void</AppText>
                                <AppText variant="caption" color="textSecondary" style={{ marginTop: 8, textAlign: 'center' }}>No authorized clinical sessions scheduled for this temporal parameter.</AppText>
                            </View>
                        }
                    />
                )}
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    presentCycleBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Theme.Colors.primary + '10', borderRadius: 12, borderWidth: 1, borderColor: Theme.Colors.primary + '20' },

    matrixStrip: { backgroundColor: Theme.Colors.surface, paddingBottom: 20, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, ...Theme.Shadows.soft, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    monthLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
    navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center' },

    weekControl: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
    dayTerminal: { alignItems: 'center', paddingVertical: 12, width: 44, borderRadius: 16, gap: 8 },
    dayTerminalSelected: { backgroundColor: Theme.Colors.primary, ...Theme.Shadows.primary },
    dateFrame: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    dateFrameSelected: { backgroundColor: 'transparent' },
    pulseStatus: { width: 4, height: 4, borderRadius: 2, backgroundColor: Theme.Colors.primary },

    content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
    contentHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
    matrixBadge: { backgroundColor: Theme.Colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, ...Theme.Shadows.primary },

    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingBottom: 60 },

    sessionCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12, borderWidth: 1, borderColor: Theme.Colors.divider },
    timeAxis: { width: 60, alignItems: 'center' },
    timeLine: { width: 2, height: 20, backgroundColor: Theme.Colors.divider, marginTop: 4 },
    sessionInfo: { flex: 1 },
    protocolRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },

    statusTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

    emptyMatrix: { alignItems: 'center', justifyContent: 'center', marginTop: 80, padding: 40 },
    voidIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
});

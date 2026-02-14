import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { doctorApi } from '@/services/doctor.api';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';

interface SlotException {
    id: string;
    date: string;
    startTime?: string;
    endTime?: string;
    isFullDay: boolean;
    reason: string;
}

export default function SlotExceptionsScreen() {
    const router = useRouter();
    const [exceptions, setExceptions] = useState<SlotException[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newException, setNewException] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        isFullDay: true,
        reason: '',
    });

    useEffect(() => {
        loadExceptions();
    }, []);

    const loadExceptions = async () => {
        try {
            const res = await doctorApi.getAvailabilityExceptions();
            if (res.success && res.data) {
                setExceptions(res.data);
            }
        } catch (error) {
            console.error('Error loading overrides:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newException.date) {
            Alert.alert('Selection Required', 'Specific calendar date must be provided for the override.');
            return;
        }

        setSaving(true);
        try {
            const res = await doctorApi.addAvailabilityException(newException);
            if (res.success && res.data) {
                setExceptions([...exceptions, res.data]);
                setModalVisible(false);
                resetForm();
            }
        } catch (error) {
            Alert.alert('Synchronization Error', 'Unable to commit override to the clinical registry.');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = (id: string) => {
        Alert.alert('Restore Availability', 'Remove this override and restore standard operating hours for this date?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Restore Schedule',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await doctorApi.removeAvailabilityException(id);
                        setExceptions(exceptions.filter(e => e.id !== id));
                    } catch (error) {
                        Alert.alert('Operational Error', 'Restoration of standard hours failed.');
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setNewException({
            date: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '17:00',
            isFullDay: true,
            reason: '',
        });
    };

    const renderItem = ({ item }: { item: SlotException }) => {
        const dateObj = new Date(item.date);
        const isFull = item.isFullDay;
        return (
            <AppCard padding="md" style={styles.exceptionCard}>
                <View style={[styles.dateBlock, { backgroundColor: isFull ? Theme.Colors.error + '10' : Theme.Colors.primary + '10' }]}>
                    <AppText variant="h3" weight="black" style={{ color: isFull ? Theme.Colors.error : Theme.Colors.primary }}>{dateObj.getDate()}</AppText>
                    <AppText variant="caption" weight="black" uppercase style={{ color: isFull ? Theme.Colors.error : Theme.Colors.primary, fontSize: 8 }}>{dateObj.toLocaleDateString('en', { month: 'short' })}</AppText>
                </View>
                <View style={styles.info}>
                    <View style={styles.intensityRow}>
                        <View style={[styles.intensityDot, { backgroundColor: isFull ? Theme.Colors.error : Theme.Colors.primary }]} />
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>{isFull ? 'Critical Override' : 'Temporal Shift'}</AppText>
                    </View>
                    <AppText variant="body" weight="black" style={{ marginTop: 2 }}>
                        {isFull ? 'Full Stop Protocol' : `${item.startTime} — ${item.endTime}`}
                    </AppText>
                    {item.reason && (
                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 4 }}>
                            Rationale: {item.reason}
                        </AppText>
                    )}
                </View>
                <TouchableOpacity style={styles.removeTrigger} onPress={() => handleRemove(item.id)}>
                    <Ionicons name="trash-outline" size={18} color={Theme.Colors.error} />
                </TouchableOpacity>
            </AppCard>
        );
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <AppText variant="h3" weight="black">Operational Overrides</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Registry Exception terminal</AppText>
                </View>
                <TouchableOpacity style={styles.addTrigger} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={28} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                <View style={styles.heroBox}>
                    <AppText variant="h1" weight="black">Exceptions</AppText>
                    <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 8 }}>
                        Manual overrides to standard operating hours for vacations, conferences, or temporal shifts.
                    </AppText>
                </View>

                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={Theme.Colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={exceptions}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        scrollEnabled={false}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyMatrix}>
                                <View style={styles.voidIconBox}>
                                    <Ionicons name="calendar-outline" size={40} color={Theme.Colors.divider} />
                                </View>
                                <AppText variant="h3" weight="black">Logical Uniformity</AppText>
                                <AppText variant="caption" color="textSecondary" align="center" style={{ marginTop: 12 }}>
                                    Standard operating hours are currently active. No manual overrides detected in the registry.
                                </AppText>
                            </View>
                        }
                    />
                )}
            </ScrollView>

            <Modal visible={modalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText variant="h2" weight="black">Create Override</AppText>
                            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                                <Ionicons name="close" size={24} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.form}>
                            <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginBottom: 8, marginLeft: 4 }}>Effective Date (YYYY-MM-DD)</AppText>
                            <TextInput
                                style={styles.terminalInput}
                                value={newException.date}
                                onChangeText={(v) => setNewException({ ...newException, date: v })}
                                placeholder="2026-01-10"
                                placeholderTextColor={Theme.Colors.textTertiary}
                            />

                            <View style={styles.intensitySelector}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginBottom: 12, marginLeft: 4 }}>Block Intensity</AppText>
                                <View style={styles.toggleRow}>
                                    <TouchableOpacity
                                        style={[styles.toggleBtn, newException.isFullDay && styles.toggleBtnActive]}
                                        onPress={() => setNewException({ ...newException, isFullDay: true })}
                                    >
                                        <AppText variant="caption" weight="black" uppercase style={{ color: newException.isFullDay ? 'white' : Theme.Colors.textSecondary }}>Full Stop</AppText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.toggleBtn, !newException.isFullDay && styles.toggleBtnActive]}
                                        onPress={() => setNewException({ ...newException, isFullDay: false })}
                                    >
                                        <AppText variant="caption" weight="black" uppercase style={{ color: !newException.isFullDay ? 'white' : Theme.Colors.textSecondary }}>Partial Shift</AppText>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {!newException.isFullDay && (
                                <View style={styles.timeMatrix}>
                                    <View style={{ flex: 1 }}>
                                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginBottom: 8, marginLeft: 4 }}>Start</AppText>
                                        <TextInput
                                            style={styles.terminalInput}
                                            value={newException.startTime}
                                            onChangeText={(v) => setNewException({ ...newException, startTime: v })}
                                            placeholder="09:00"
                                        />
                                    </View>
                                    <View style={{ width: 16 }} />
                                    <View style={{ flex: 1 }}>
                                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginBottom: 8, marginLeft: 4 }}>End</AppText>
                                        <TextInput
                                            style={styles.terminalInput}
                                            value={newException.endTime}
                                            onChangeText={(v) => setNewException({ ...newException, endTime: v })}
                                            placeholder="17:00"
                                        />
                                    </View>
                                </View>
                            )}

                            <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginBottom: 8, marginLeft: 4, marginTop: 16 }}>Clinical Rationale</AppText>
                            <TextInput
                                style={styles.terminalInput}
                                value={newException.reason}
                                onChangeText={(v) => setNewException({ ...newException, reason: v })}
                                placeholder="e.g. Clinical Conference, Personal Leave"
                                placeholderTextColor={Theme.Colors.textTertiary}
                            />

                            <AppButton
                                title="Commit Override"
                                onPress={handleAdd}
                                loading={saving}
                                style={{ marginTop: 32, height: 60, borderRadius: 20 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, backgroundColor: Theme.Colors.surface, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    addTrigger: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center', ...Theme.Shadows.primary },

    scroll: { flex: 1 },
    heroBox: { padding: 32, paddingBottom: 8 },
    loadingBox: { padding: 50, alignItems: 'center' },

    list: { padding: 24, paddingTop: 16 },
    exceptionCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: Theme.Colors.divider },
    dateBlock: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    info: { flex: 1, marginLeft: 16 },
    intensityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    intensityDot: { width: 6, height: 6, borderRadius: 3 },
    removeTrigger: { padding: 10, backgroundColor: Theme.Colors.error + '08', borderRadius: 12 },

    emptyMatrix: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    voidIconBox: { width: 80, height: 80, borderRadius: 30, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: Theme.Colors.card, borderRadius: 32, padding: 32, borderWidth: 1, borderColor: Theme.Colors.divider, ...Theme.Shadows.soft },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    form: {},
    terminalInput: { backgroundColor: Theme.Colors.background, borderRadius: 16, padding: 16, fontSize: 16, color: Theme.Colors.text, borderWidth: 1, borderColor: Theme.Colors.divider, fontWeight: '600' },
    intensitySelector: { marginTop: 20, marginBottom: 16 },
    toggleRow: { flexDirection: 'row', gap: 10 },
    toggleBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: Theme.Colors.background, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    toggleBtnActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },
    timeMatrix: { flexDirection: 'row', marginTop: 8 },
});

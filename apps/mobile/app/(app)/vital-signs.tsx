import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert, Platform, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Theme from '@/constants/Theme';
import { patientApi } from '@/services/patient.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';

interface VitalSign {
    id: string;
    type: string;
    value: number;
    unit: string;
    recordedAt: string;
    notes?: string;
}

const VITAL_TYPES = [
    { key: 'BLOOD_PRESSURE_SYSTOLIC', label: 'BP (SYS)', unit: 'mmHg', icon: 'heart' },
    { key: 'BLOOD_PRESSURE_DIASTOLIC', label: 'BP (DIA)', unit: 'mmHg', icon: 'heart-outline' },
    { key: 'HEART_RATE', label: 'HEART RATE', unit: 'bpm', icon: 'pulse' },
    { key: 'TEMPERATURE', label: 'TEMP', unit: '°C', icon: 'thermometer' },
    { key: 'WEIGHT', label: 'WEIGHT', unit: 'kg', icon: 'scale' },
    { key: 'BLOOD_GLUCOSE', label: 'GLUCOSE', unit: 'mg/dL', icon: 'water' },
    { key: 'OXYGEN_SATURATION', label: 'OXYGEN', unit: '%', icon: 'cloud-done' },
];

export default function VitalSignsScreen() {
    const router = useRouter();
    const [vitals, setVitals] = useState<VitalSign[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedType, setSelectedType] = useState(VITAL_TYPES[0]);
    const [value, setValue] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadVitals();
        }, [])
    );

    const loadVitals = async () => {
        try {
            const res = await patientApi.getVitals();
            if (res.success && res.data) {
                setVitals(res.data);
            }
        } catch (error) {
            console.error('Error loading biometric parameter stream:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = (type = VITAL_TYPES[0]) => {
        setSelectedType(type);
        setValue('');
        setNotes('');
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!value) {
            Alert.alert('PROTOCOL REQUIREMENT', 'Numerical value identifier is mandatory for telemetry commit.');
            return;
        }

        setSaving(true);
        try {
            const data = {
                type: selectedType.key,
                value: parseFloat(value),
                unit: selectedType.unit,
                recordedAt: new Date().toISOString(),
                notes: notes || undefined
            };

            const res = await patientApi.addVital(data);
            if (res.success && res.data) {
                setVitals(prev => [res.data!, ...prev]);
            }

            setModalVisible(false);
        } catch (error) {
            Alert.alert('VAULT ERROR', 'Biometric telemetry commit failed.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('RESCIND READING', 'Are you sure you want to permanently revoke this biometric data point?', [
            { text: 'ABORT', style: 'cancel' },
            {
                text: 'REVOKE DATA',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await patientApi.deleteVital(id);
                        setVitals(prev => prev.filter(v => v.id !== id));
                    } catch (error) {
                        Alert.alert('PROTOCOL ERROR', 'Revocation protocol failed.');
                    }
                }
            }
        ]);
    };

    const getVitalInfo = (type: string) => {
        return VITAL_TYPES.find(v => v.key === type) || { key: 'CUSTOM', label: type, unit: '', icon: 'stats-chart' };
    };

    const renderItem = ({ item }: { item: VitalSign }) => {
        const info = getVitalInfo(item.type);
        return (
            <AppCard padding="none" style={styles.card}>
                <View style={styles.cardContent}>
                    <View style={styles.iconBox}>
                        <Ionicons name={info.icon as any} size={22} color={Theme.Colors.primary} />
                    </View>
                    <View style={styles.cardMain}>
                        <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>{info.label}</AppText>
                        <AppText variant="caption" color="textSecondary" weight="black" style={{ marginTop: 4, fontSize: 9 }}>
                            {new Date(item.recordedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()} • {new Date(item.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </AppText>
                    </View>
                    <View style={styles.cardValues}>
                        <AppText variant="h3" weight="black">{item.value}</AppText>
                        <AppText variant="caption" weight="black" color="textSecondary" style={{ fontSize: 8 }}>{item.unit || info.unit}</AppText>
                    </View>
                    <TouchableOpacity style={styles.miniDelete} onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={14} color={Theme.Colors.divider} />
                    </TouchableOpacity>
                </View>
                {item.notes && (
                    <View style={styles.notesBox}>
                        <Ionicons name="chatbox-outline" size={12} color={Theme.Colors.textSecondary} />
                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 8, flex: 1 }}>{item.notes.toUpperCase()}</AppText>
                    </View>
                )}
            </AppCard>
        );
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Biometric Stream</AppText>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => openAddModal()}
                >
                    <Ionicons name="pulse" size={22} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.hero}>
                <AppText variant="h2" weight="black">Physiological Indices</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={styles.heroSub}>
                    High-density synchronization of clinical telemetry and physiological parameter diagnostics.
                </AppText>
            </View>

            <View style={styles.quickGrid}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
                    {VITAL_TYPES.map(type => (
                        <TouchableOpacity
                            key={type.key}
                            style={styles.quickItem}
                            onPress={() => openAddModal(type)}
                        >
                            <View style={styles.quickIconBox}>
                                <Ionicons name={type.icon as any} size={18} color={Theme.Colors.primary} />
                            </View>
                            <AppText variant="caption" weight="black" uppercase style={{ fontSize: 8, marginTop: 8 }}>{type.label}</AppText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={vitals}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="cellular-outline" size={42} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">NO BIOMETRIC TELEMETRY DETECTED</AppText>
                            <AppText variant="caption" weight="bold" color="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>
                                Use the quick grid or clinical interface to commit physiological parameters.
                            </AppText>
                        </View>
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <AppText variant="h3" weight="black">LOG {selectedType.label}</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">Diagnostic telemetry commit</AppText>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Theme.Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.inputRow}>
                                <View style={{ flex: 1 }}>
                                    <AppInput
                                        label="NUMERICAL PARAMETER"
                                        value={value}
                                        onChangeText={setValue}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.unitSeal}>
                                    <AppText variant="caption" weight="black" color="textSecondary">{selectedType.unit}</AppText>
                                </View>
                            </View>

                            <AppInput
                                label="CLINICAL OBSERVATIONS"
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="IDENTIFY ANOMALIES OR CONTEXT (OPTIONAL)"
                                style={{ marginTop: 24 }}
                            />

                            <AppButton
                                title="COMMIT TELEMETRY"
                                loading={saving}
                                onPress={handleSave}
                                style={{ marginTop: 40, height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.text, justifyContent: 'center', alignItems: 'center' },

    hero: { paddingHorizontal: 24, marginBottom: 8 },
    heroSub: { marginTop: 8, lineHeight: 22 },

    quickGrid: { marginTop: 16 },
    quickScroll: { paddingHorizontal: 24, gap: 12 },
    quickItem: { width: 88, backgroundColor: Theme.Colors.surface, borderRadius: 20, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    quickIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },

    list: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
    card: { marginBottom: 16, borderRadius: 32 },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    iconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },
    cardMain: { flex: 1, marginLeft: 16 },
    cardValues: { alignItems: 'flex-end', marginRight: 12 },
    miniDelete: { width: 28, height: 28, borderRadius: 8, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    notesBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.Colors.divider, marginTop: -4 },

    emptyState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
    emptyIconBox: { width: 84, height: 84, borderRadius: 28, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Theme.Colors.background, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: Platform.OS === 'ios' ? 44 : 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center' },
    modalBody: { padding: 24 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
    unitSeal: { height: 60, paddingHorizontal: 20, backgroundColor: Theme.Colors.surface, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider, marginBottom: 4 },
});

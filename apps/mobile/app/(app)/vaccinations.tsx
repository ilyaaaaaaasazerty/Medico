import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert, Platform, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Theme from '@/constants/Theme';
import { patientApi } from '@/services/patient.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';

interface Vaccination {
    id: string;
    name: string;
    dateGiven: string;
    nextDueDate?: string;
    provider?: string;
    batchNumber?: string;
    notes?: string;
}

export default function VaccinationsScreen() {
    const router = useRouter();
    const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [dateGiven, setDateGiven] = useState('');
    const [nextDueDate, setNextDueDate] = useState('');
    const [provider, setProvider] = useState('');
    const [batchNumber, setBatchNumber] = useState('');
    const [notes, setNotes] = useState('');

    useFocusEffect(
        useCallback(() => {
            loadVaccinations();
        }, [])
    );

    const loadVaccinations = async () => {
        try {
            const res = await patientApi.getVaccinations();
            if (res.success && res.data) {
                setVaccinations(res.data);
            }
        } catch (error) {
            console.error('Error loading immunization protocol archive:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (v?: Vaccination) => {
        if (v) {
            setEditingId(v.id);
            setName(v.name);
            setDateGiven(v.dateGiven);
            setNextDueDate(v.nextDueDate || '');
            setProvider(v.provider || '');
            setBatchNumber(v.batchNumber || '');
            setNotes(v.notes || '');
        } else {
            setEditingId(null);
            setName('');
            setDateGiven('');
            setNextDueDate('');
            setProvider('');
            setBatchNumber('');
            setNotes('');
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!name || !dateGiven) {
            Alert.alert('PROTOCOL REQUIREMENT', 'Biological identifier and administration date are mandatory.');
            return;
        }

        setSaving(true);
        try {
            const data = { name, dateGiven, nextDueDate: nextDueDate || undefined, provider: provider || undefined, batchNumber: batchNumber || undefined, notes: notes || undefined };
            if (editingId) {
                await patientApi.updateVaccination(editingId, data);
            } else {
                await patientApi.addVaccination(data);
            }
            loadVaccinations();
            setModalVisible(false);
        } catch (error) {
            Alert.alert('VAULT ERROR', 'Biological dose commit failed.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('RESCIND DOSE', 'Permanently revoke this immunization record from the clinical archive?', [
            { text: 'ABORT', style: 'cancel' },
            {
                text: 'REVOKE RECORD',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await patientApi.removeVaccination(id);
                        setVaccinations(prev => prev.filter(v => v.id !== id));
                    } catch (error) {
                        Alert.alert('PROTOCOL ERROR', 'Revocation protocol failed.');
                    }
                }
            }
        ]);
    };

    const isRecallPending = (date?: string) => {
        if (!date) return false;
        const dueDate = new Date(date);
        const today = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 30;
    };

    const renderItem = ({ item }: { item: Vaccination }) => {
        const pending = isRecallPending(item.nextDueDate);

        return (
            <AppCard padding="none" style={styles.card} onPress={() => openModal(item)}>
                <View style={styles.cardContent}>
                    <View style={styles.topRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="shield-checkmark" size={24} color={Theme.Colors.primary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <AppText variant="body" weight="black" uppercase style={{ fontSize: 16 }}>{item.name}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ marginTop: 4 }}>
                                ADMINISTERED: {new Date(item.dateGiven).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                            </AppText>
                        </View>
                        {pending && (
                            <View style={styles.recallBadge}>
                                <AppText variant="caption" weight="black" style={{ color: Theme.Colors.warning, fontSize: 8 }}>RECALL PENDING</AppText>
                            </View>
                        )}
                    </View>

                    {item.nextDueDate && (
                        <View style={[styles.dueRow, pending && { borderColor: Theme.Colors.warning + '30', backgroundColor: Theme.Colors.warning + '05' }]}>
                            <Ionicons name="calendar-outline" size={14} color={pending ? Theme.Colors.warning : Theme.Colors.primary} />
                            <AppText variant="caption" weight="black" style={{ marginLeft: 10, color: pending ? Theme.Colors.warning : Theme.Colors.textSecondary }}>
                                NEXT DOSE SYNCHRONIZATION: {new Date(item.nextDueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                            </AppText>
                        </View>
                    )}

                    <View style={styles.metadata}>
                        <View style={styles.metaCol}>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>INSTITUTIONAL PROVIDER</AppText>
                            <AppText variant="caption" weight="bold" color="textSecondary" style={{ marginTop: 2 }}>{item.provider?.toUpperCase() || 'UNSPECIFIED'}</AppText>
                        </View>
                        <View style={styles.metaCol}>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>BATCH SERIAL</AppText>
                            <AppText variant="caption" weight="bold" color="textSecondary" style={{ marginTop: 2 }}>#{item.batchNumber?.toUpperCase() || 'NA'}</AppText>
                        </View>
                        <TouchableOpacity style={styles.miniDelete} onPress={() => handleDelete(item.id)}>
                            <Ionicons name="trash-outline" size={16} color={Theme.Colors.divider} />
                        </TouchableOpacity>
                    </View>
                </View>
            </AppCard>
        );
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Immunization Archive</AppText>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => openModal()}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.hero}>
                <AppText variant="h2" weight="black">Biological Portfolio</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={styles.heroSub}>
                    Official clinical synchronization of dose administration protocols and immunization lifecycle.
                </AppText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={vaccinations}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="ribbon-outline" size={42} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">NO IMMUNIZATION DATA DETECTED</AppText>
                            <AppButton
                                title="ENROLL NEW DOSE"
                                onPress={() => openModal()}
                                style={{ marginTop: 24, paddingHorizontal: 32 }}
                            />
                        </View>
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <AppText variant="h3" weight="black">{editingId ? 'RECONFIGURE' : 'ENROLL'} DOSE</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">Biological prophylaxis protocol entry</AppText>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Theme.Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                            <AppInput label="BIOLOGICAL IDENTIFIER" value={name} onChangeText={setName} placeholder="e.g. INFLUENZA, VARICELLA..." />
                            <AppInput label="ADMINISTRATION DATE" value={dateGiven} onChangeText={setDateGiven} placeholder="YYYY-MM-DD" style={{ marginTop: 16 }} />
                            <AppInput label="TARGET RECALL DATE" value={nextDueDate} onChangeText={setNextDueDate} placeholder="YYYY-MM-DD (OPTIONAL)" style={{ marginTop: 16 }} />
                            <AppInput label="INSTITUTIONAL PROVIDER" value={provider} onChangeText={setProvider} placeholder="CLINIC OR HOSPITAL NAME" style={{ marginTop: 16 }} />
                            <AppInput label="BATCH / LOT SERIAL" value={batchNumber} onChangeText={setBatchNumber} placeholder="LOT-ID (OPTIONAL)" style={{ marginTop: 16 }} />

                            <AppButton
                                title={editingId ? "COMMIT PROTOCOL" : "AUTHORIZE RECORD"}
                                loading={saving}
                                onPress={handleSave}
                                style={{ marginTop: 32, marginBottom: 20, height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text }}
                            />
                        </ScrollView>
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

    hero: { paddingHorizontal: 24, marginBottom: 16 },
    heroSub: { marginTop: 8, lineHeight: 22 },

    list: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
    card: { marginBottom: 16, borderRadius: 32 },
    cardContent: { padding: 22 },
    topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBox: { width: 52, height: 52, borderRadius: 18, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },
    recallBadge: { backgroundColor: Theme.Colors.warning + '12', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },

    dueRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.surface, padding: 14, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: Theme.Colors.divider },

    metadata: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    metaCol: { flex: 1 },
    miniDelete: { width: 32, height: 32, borderRadius: 10, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    emptyState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
    emptyIconBox: { width: 84, height: 84, borderRadius: 28, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Theme.Colors.background, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: Platform.OS === 'ios' ? 44 : 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center' },
    modalScroll: { padding: 24, maxHeight: 600 },
});

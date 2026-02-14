import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { labApi, Equipment } from '@/services/lab.api';

import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import Theme from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';



const EQUIPMENT_TYPES = ['MRI', 'CT Scanner', 'X-RAY', 'ULTRASOUND', 'BLOOD ANALYZER', 'CENTRIFUGE', 'MICROSCOPE', 'DOPPLER', 'OTHER'];

export default function LabEquipmentScreen() {
    const router = useRouter();
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Omit<Equipment, 'id' | 'status' | 'lastMaintenance'>>({
        name: '',
        type: 'OTHER',
        model: '',
        manufacturer: '',
    });


    useEffect(() => {
        loadEquipment();
    }, []);

    const loadEquipment = async () => {
        try {
            const res = await labApi.getEquipment();
            if (res.success && res.data) {
                setEquipment(res.data);
            }
        } catch (error) {
            console.error('Error loading hardware inventory:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAdd = async () => {
        if (!form.name) {
            Alert.alert('IDENTIFIER REQUIRED', 'Mandatory unit nomenclature must be specified for enrollment.');
            return;
        }

        setSaving(true);
        try {
            const res = await labApi.addEquipment({ ...form, status: 'OPERATIONAL' });

            if (res.success && res.data) {
                setEquipment([...equipment, res.data]);
                setModalVisible(false);
                setForm({ name: '', type: 'OTHER', model: '', manufacturer: '' });
            }
        } catch (error) {
            Alert.alert('COMMIT ERROR', 'Failed to synchronize hardware asset with institutional registry.');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = (id: string, name: string) => {
        Alert.alert('DECOMMISSION ASSET', `Confirm permanent removal of ${name.toUpperCase()} from institutional inventory?`, [
            { text: 'ABORT', style: 'cancel' },
            {
                text: 'RESCIND',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await labApi.removeEquipment(id);
                        setEquipment(equipment.filter(e => e.id !== id));
                    } catch (error) {
                        Alert.alert('ERROR', 'Decommissioning protocol failed.');
                    }
                }
            }
        ]);
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'OPERATIONAL': return { color: Theme.Colors.success, label: 'FULLY OPERATIONAL' };
            case 'MAINTENANCE': return { color: Theme.Colors.warning, label: 'UNDER MAINTENANCE' };
            case 'OUT_OF_SERVICE': return { color: Theme.Colors.error, label: 'OUT OF SERVICE' };
            default: return { color: Theme.Colors.textSecondary, label: 'UNKNOWN STATUS' };
        }
    };

    const getTypeIcon = (type: string): any => {
        const t = type.toUpperCase();
        if (t.includes('MRI') || t.includes('CT')) return 'scan-outline';
        if (t.includes('X-RAY')) return 'flash-outline';
        if (t.includes('ULTRASOUND') || t.includes('DOPPLER')) return 'pulse-outline';
        if (t.includes('ANALYZER') || t.includes('CENTRIFUGE')) return 'flask-outline';
        return 'hardware-chip-outline';
    };

    const renderItem = ({ item }: { item: Equipment }) => {
        const stats = getStatusConfig(item.status);
        return (
            <AppCard style={styles.card} padding="none">
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.unitAvatar}>
                            <Ionicons name={getTypeIcon(item.type)} size={24} color={Theme.Colors.primary} />
                        </View>
                        <View style={styles.unitInfo}>
                            <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>{item.name}</AppText>
                            <View style={styles.typeBadge}>
                                <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 8 }}>{item.type.toUpperCase()}</AppText>
                            </View>
                        </View>
                        <View style={[styles.statusTag, { backgroundColor: stats.color + '15' }]}>
                            <AppText variant="caption" weight="black" style={{ color: stats.color, fontSize: 8 }}>{stats.label}</AppText>
                        </View>
                    </View>

                    <View style={styles.hardwareSpecs}>
                        <View style={styles.specItem}>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>MANUFACTURER</AppText>
                            <AppText variant="caption" weight="black" style={{ marginTop: 2 }}>{item.manufacturer?.toUpperCase() || 'GENERIC'}</AppText>
                        </View>
                        <View style={styles.specDivider} />
                        <View style={styles.specItem}>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>MODEL IDENTIFIER</AppText>
                            <AppText variant="caption" weight="black" style={{ marginTop: 2 }}>{item.model?.toUpperCase() || 'N/A'}</AppText>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={styles.maintenanceBadge}>
                            <Ionicons name="calendar-clear-outline" size={14} color={Theme.Colors.textSecondary} />
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ marginLeft: 8, fontSize: 9 }}>
                                MAINTENANCE: {item.lastMaintenance ? new Date(item.lastMaintenance).toLocaleDateString() : 'INITIAL REQUISITION'}
                            </AppText>
                        </View>
                        <TouchableOpacity style={styles.rescindBtn} onPress={() => handleRemove(item.id, item.name)}>
                            <Ionicons name="trash-outline" size={18} color={Theme.Colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>
            </AppCard>
        );
    };

    if (loading && !refreshing) {
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
                <AppText variant="h3" weight="black">Hardware Inventory</AppText>
                <TouchableOpacity style={[styles.circleBtn, { backgroundColor: Theme.Colors.text }]} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={equipment}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEquipment(); }} tintColor={Theme.Colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBg}>
                            <Ionicons name="cube-outline" size={48} color={Theme.Colors.textSecondary} />
                        </View>
                        <AppText variant="h3" weight="black" style={{ marginBottom: 12 }}>INVENTORY VACUUM</AppText>
                        <AppText variant="body" color="textSecondary" align="center" weight="bold" style={{ maxWidth: 280, marginBottom: 32, lineHeight: 22, opacity: 0.7 }}>
                            No hardware assets detected. Register diagnostic units and facility instrumentation to manage clinical capacity.
                        </AppText>
                        <AppButton
                            title="INITIALIZE ASSET ENROLLMENT"
                            onPress={() => setModalVisible(true)}
                            style={{ paddingHorizontal: 32, borderRadius: 20, height: 60 }}
                        />
                    </View>
                }
            />

            <Modal visible={modalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText variant="h3" weight="black">ASSET ENROLLMENT</AppText>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.formGroup}>
                                <AppInput
                                    label="UNIT NOMENCLATURE / IDENTIFIER"
                                    placeholder="E.G. OLYMPUS BX53 MICROSCOPE"
                                    value={form.name}
                                    onChangeText={(v) => setForm({ ...form, name: v })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <AppText variant="caption" weight="black" uppercase color="primary" style={{ marginBottom: 16, letterSpacing: 1 }}>Hardware Classification</AppText>
                                <View style={styles.typeGrid}>
                                    {EQUIPMENT_TYPES.map(t => (
                                        <TouchableOpacity
                                            key={t}
                                            style={[styles.typeOption, form.type === t && styles.typeOptionActive]}
                                            onPress={() => setForm({ ...form, type: t })}
                                        >
                                            <AppText variant="caption" weight="black" style={{
                                                color: form.type === t ? 'white' : Theme.Colors.textSecondary,
                                                fontSize: 9
                                            }}>
                                                {t}
                                            </AppText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.modalRow}>
                                <View style={{ flex: 1 }}>
                                    <AppInput
                                        label="MANUFACTURER"
                                        placeholder="E.G. OLYMPUS"
                                        value={form.manufacturer}
                                        onChangeText={(v) => setForm({ ...form, manufacturer: v })}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <AppInput
                                        label="MODEL IDENTIFIER"
                                        placeholder="E.G. BX53-X1"
                                        value={form.model}
                                        onChangeText={(v) => setForm({ ...form, model: v })}
                                    />
                                </View>
                            </View>

                            <AppButton
                                title="COMMIT ENROLLMENT PROTOCOL"
                                loading={saving}
                                onPress={handleAdd}
                                style={styles.submitBtn}
                            />

                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    list: { padding: 24 },
    card: { marginBottom: 20, borderRadius: 28 },
    cardContent: { padding: 20 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    unitAvatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    unitInfo: { flex: 1, marginLeft: 16 },
    typeBadge: { alignSelf: 'flex-start', backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
    statusTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },

    hardwareSpecs: { flexDirection: 'row', marginTop: 20, padding: 16, backgroundColor: Theme.Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Theme.Colors.divider },
    specItem: { flex: 1 },
    specDivider: { width: 1, height: '100%', backgroundColor: Theme.Colors.divider, marginHorizontal: 16 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    maintenanceBadge: { flexDirection: 'row', alignItems: 'center' },
    rescindBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.Colors.error + '05', justifyContent: 'center', alignItems: 'center' },

    emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyIconBg: { width: 96, height: 96, borderRadius: 32, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Theme.Colors.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    closeBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center' },

    formGroup: { marginBottom: 24 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeOption: { backgroundColor: Theme.Colors.surface, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Theme.Colors.divider },
    typeOptionActive: { backgroundColor: Theme.Colors.text, borderColor: Theme.Colors.text },
    modalRow: { flexDirection: 'row', marginTop: 12 },

    submitBtn: { marginTop: 40, height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text },
});

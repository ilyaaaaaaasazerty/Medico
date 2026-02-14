import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { clinicApi } from '@/services/clinic.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import Theme from '@/constants/Theme';

interface Room {
    id: string;
    name: string;
    type: string;
    floor?: string;
    isActive: boolean;
}

const DISPLAY_TYPES: Record<string, string> = {
    'CONSULTATION': 'CONSULTATION',
    'EXAMINATION': 'EXAMINATION',
    'PROCEDURE': 'PROCEDURE',
    'WAITING': 'CLINICAL WAITING',
    'OTHER': 'GENERAL ASSET'
};

const ROOM_ICONS: Record<string, any> = {
    'CONSULTATION': 'chatbubbles-outline',
    'EXAMINATION': 'medkit-outline',
    'PROCEDURE': 'pulse-outline',
    'WAITING': 'people-outline',
    'OTHER': 'business-outline'
};

const ROOM_TYPES = Object.keys(DISPLAY_TYPES);

export default function ClinicRoomsScreen() {
    const router = useRouter();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState('CONSULTATION');
    const [floor, setFloor] = useState('');
    const [saving, setSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadRooms();
        }, [])
    );

    const loadRooms = async () => {
        try {
            const res = await clinicApi.getRooms();
            if (res.success && res.data) {
                setRooms(res.data as Room[]);
            }
        } catch (error) {
            console.error('Error loading spatial assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setName('');
        setType('CONSULTATION');
        setFloor('');
        setModalVisible(true);
    };

    const openEditModal = (room: Room) => {
        setEditingId(room.id);
        setName(room.name);
        setType(room.type);
        setFloor(room.floor || '');
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!name) {
            Alert.alert('PROTOCOL ERROR', 'Asset identifier is mandatory for spatial allocation.');
            return;
        }

        setSaving(true);
        try {
            const data = { name, type, floor };
            if (editingId) {
                await clinicApi.updateRoom(editingId, data);
            } else {
                await clinicApi.addRoom(data);
            }
            loadRooms();
            setModalVisible(false);
        } catch (error) {
            Alert.alert('VAULT ERROR', 'Failed to commit spatial asset data.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string, roomName: string) => {
        Alert.alert('RESCIND ASSET', `Permanently remove ${roomName.toUpperCase()} from institutional spatial allocation?`, [
            { text: 'ABORT', style: 'cancel' },
            {
                text: 'REVOKE ASSET',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await clinicApi.removeRoom(id);
                        setRooms(rooms.filter(r => r.id !== id));
                    } catch (error) {
                        Alert.alert('PROTOCOL ERROR', 'Failed to rescind spatial asset.');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: Room }) => (
        <AppCard style={styles.card} padding="none" onPress={() => openEditModal(item)}>
            <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                    <View style={styles.iconBox}>
                        <Ionicons name={ROOM_ICONS[item.type] || 'business-outline'} size={22} color={Theme.Colors.primary} />
                    </View>
                    <View style={styles.mainInfo}>
                        <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>{item.name}</AppText>
                        <View style={styles.typeRow}>
                            <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 8 }}>{DISPLAY_TYPES[item.type] || item.type}</AppText>
                        </View>
                    </View>
                    <View style={[styles.statusIndicator, { backgroundColor: item.isActive ? Theme.Colors.success : Theme.Colors.divider }]} />
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.metaGroup}>
                        <Ionicons name="layers-outline" size={12} color={Theme.Colors.textSecondary} />
                        <AppText variant="caption" color="textSecondary" weight="black" style={{ marginLeft: 8, fontSize: 9 }}>TIER: {item.floor?.toUpperCase() || 'UNSPECIFIED'}</AppText>
                    </View>
                    <View style={styles.idGroup}>
                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ fontSize: 8 }}>RID: #{item.id.slice(-4).toUpperCase()}</AppText>
                    </View>
                </View>
            </View>
        </AppCard>
    );

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Spatial Assets</AppText>
                <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.hero}>
                <AppText variant="h2" weight="black">Resource Allocation</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={styles.heroSub}>
                    Institutional map of authorized clinical units, diagnostic areas, and spatial infrastructure.
                </AppText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={rooms}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="business-outline" size={42} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">NO SPATIAL ASSETS DETECTED</AppText>
                            <AppText variant="caption" weight="bold" color="textSecondary" style={styles.emptyDesc}>
                                Enroll consultation rooms and clinical units to begin institutional resource mapping.
                            </AppText>
                            <AppButton
                                title="AUTHORIZE SPATIAL ASSET"
                                onPress={openAddModal}
                                style={{ marginTop: 32, paddingHorizontal: 24 }}
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
                                <AppText variant="h3" weight="black">{editingId ? 'RECONFIGURE' : 'AUTHORIZE'} ASSET</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">Spatial resource synchronization</AppText>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Theme.Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                            <AppInput
                                label="ASSET IDENTIFIER"
                                placeholder="E.G. ROOM 101, DIAGNOSTIC LAB A"
                                value={name}
                                onChangeText={setName}
                            />

                            <AppText variant="caption" weight="black" uppercase color="primary" style={{ marginTop: 24, marginBottom: 16, letterSpacing: 1 }}>ASSET CLASSIFICATION</AppText>
                            <View style={styles.optionsGrid}>
                                {ROOM_TYPES.map(t => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.option, type === t && styles.optionSelected]}
                                        onPress={() => setType(t)}
                                    >
                                        <AppText variant="caption" weight="black" style={{
                                            color: type === t ? 'white' : Theme.Colors.textSecondary,
                                            fontSize: 9
                                        }}>
                                            {DISPLAY_TYPES[t]}
                                        </AppText>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={{ marginTop: 24 }}>
                                <AppInput
                                    label="TIER SPECIFICATION"
                                    placeholder="E.G. LEVEL 2, WEST WING"
                                    value={floor}
                                    onChangeText={setFloor}
                                />
                            </View>

                            <AppButton
                                title={editingId ? 'COMMIT CHANGES' : 'AUTHORIZE ASSET'}
                                loading={saving}
                                onPress={handleSave}
                                style={styles.saveBtn}
                            />

                            {editingId && (
                                <AppButton
                                    title="RESCIND ASSET"
                                    variant="ghost"
                                    onPress={() => handleDelete(editingId, name)}
                                    style={{ marginTop: 12 }}
                                    textStyle={{ color: Theme.Colors.error, fontSize: 12, fontWeight: '900' }}
                                />
                            )}
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
    addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.text, justifyContent: 'center', alignItems: 'center' },

    hero: { paddingHorizontal: 24, marginBottom: 16 },
    heroSub: { marginTop: 8, lineHeight: 22 },

    list: { padding: 24, paddingTop: 12 },
    card: { marginBottom: 16, borderRadius: 32 },
    cardContent: { padding: 22 },
    cardTop: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },
    mainInfo: { flex: 1, marginLeft: 16 },
    typeRow: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: Theme.Colors.primary + '08', marginTop: 4 },
    statusIndicator: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: 'white' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    metaGroup: { flexDirection: 'row', alignItems: 'center' },
    idGroup: { opacity: 0.5 },

    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyIconBox: { width: 84, height: 84, borderRadius: 28, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
    emptyDesc: { textAlign: 'center', marginTop: 8, lineHeight: 20 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Theme.Colors.background, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: Platform.OS === 'ios' ? 44 : 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center' },
    modalBody: { padding: 24 },

    optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    option: { backgroundColor: Theme.Colors.surface, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: Theme.Colors.divider },
    optionSelected: { backgroundColor: Theme.Colors.text, borderColor: Theme.Colors.text },

    saveBtn: { marginTop: 40, height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text },
});

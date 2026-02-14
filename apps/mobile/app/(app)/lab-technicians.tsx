import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { labApi } from '@/services/lab.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import Theme from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

interface Technician {
    id: string;
    firstName: string;
    lastName: string;
    qualification: string;
    email?: string;
    phone?: string;
    licenseNumber?: string;
}

export default function LabTechniciansScreen() {
    const router = useRouter();
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        specialization: '',
        licenseNumber: '',
        phone: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTechnicians();
    }, []);

    const loadTechnicians = async () => {
        try {
            const res = await labApi.getTechnicians();
            if (res.success && res.data) {
                setTechnicians(res.data as Technician[]);
            }
        } catch (error) {
            console.error('Error loading laboratory personnel registry:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setForm({
            firstName: '',
            lastName: '',
            specialization: '',
            licenseNumber: '',
            phone: ''
        });
        setModalVisible(true);
    };

    const openEditModal = (tech: Technician) => {
        setEditingId(tech.id);
        setForm({
            firstName: tech.firstName,
            lastName: tech.lastName,
            specialization: tech.qualification || '',
            licenseNumber: tech.licenseNumber || '',
            phone: tech.phone || ''
        });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.firstName || !form.lastName) {
            Alert.alert('VALIDATION ERROR', 'Biological identity parameters (First Name, Last Name) are mandatory.');
            return;
        }

        setSaving(true);
        try {
            const data = {
                firstName: form.firstName,
                lastName: form.lastName,
                qualification: form.specialization || 'General',
                licenseNumber: form.licenseNumber,
                phone: form.phone
            };

            if (editingId) {
                await labApi.updateTechnician(editingId, data);
                setTechnicians(technicians.map(t => t.id === editingId ? { ...t, ...data } : t));
            } else {
                const res = await labApi.addTechnician(data);
                if (res.success && res.data) {
                    setTechnicians([...technicians, res.data as Technician]);
                }
            }

            setModalVisible(false);
        } catch (error) {
            Alert.alert('COMMIT ERROR', 'Failed to propagate personnel modification to institutional registry.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert('TERMINATE ACCESS', `Are you sure you want to rescind institutional affiliation for ${name.toUpperCase()}?`, [
            { text: 'ABORT', style: 'cancel' },
            {
                text: 'TERMINATE',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await labApi.removeTechnician(id);
                        setTechnicians(technicians.filter(t => t.id !== id));
                    } catch (error) {
                        Alert.alert('ERROR', 'Access termination protocol failed.');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: Technician }) => (
        <AppCard style={styles.card} padding="none" onPress={() => openEditModal(item)}>
            <LinearGradient
                colors={[Theme.Colors.surface, Theme.Colors.background]}
                style={styles.cardGradient}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.avatarBox}>
                        <View style={styles.avatarInner}>
                            <AppText variant="h3" weight="black" color="primary">
                                {item.firstName[0]}{item.lastName[0]}
                            </AppText>
                        </View>
                        <View style={styles.onlineDot} />
                    </View>
                    <View style={styles.info}>
                        <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>{item.firstName} {item.lastName}</AppText>
                        <View style={styles.roleBadge}>
                            <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 8 }}>{item.qualification.toUpperCase() || 'LABORATORY ANALYST'}</AppText>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.miniBtn} onPress={() => openEditModal(item)}>
                        <Ionicons name="settings-outline" size={18} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.detailGrid}>
                    {item.licenseNumber && (
                        <View style={styles.detailItem}>
                            <View style={styles.detailIconBox}>
                                <Ionicons name="ribbon-outline" size={14} color={Theme.Colors.primary} />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 7 }}>LICENSURE</AppText>
                                <AppText variant="caption" weight="black" style={{ fontSize: 10 }}>#{item.licenseNumber.toUpperCase()}</AppText>
                            </View>
                        </View>
                    )}
                    {item.phone && (
                        <View style={styles.detailItem}>
                            <View style={styles.detailIconBox}>
                                <Ionicons name="call-outline" size={14} color={Theme.Colors.primary} />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 7 }}>METRIC CONTACT</AppText>
                                <AppText variant="caption" weight="black" style={{ fontSize: 10 }}>{item.phone}</AppText>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <TouchableOpacity style={styles.terminateBtn} onPress={() => handleDelete(item.id, `${item.firstName} ${item.lastName}`)}>
                        <AppText variant="caption" weight="black" style={{ color: Theme.Colors.error, fontSize: 9 }}>RESCIND ACCESS</AppText>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </AppCard>
    );

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
                <AppText variant="h3" weight="black">Personnel Registry</AppText>
                <TouchableOpacity style={[styles.circleBtn, { backgroundColor: Theme.Colors.text }]} onPress={openAddModal}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={technicians}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTechnicians(); }} tintColor={Theme.Colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBg}>
                            <Ionicons name="people-outline" size={48} color={Theme.Colors.textSecondary} />
                        </View>
                        <AppText variant="h3" weight="black" style={{ marginBottom: 12 }}>REGISTRY VACUUM</AppText>
                        <AppText variant="body" color="textSecondary" align="center" weight="bold" style={{ maxWidth: 280, marginBottom: 32, lineHeight: 22, opacity: 0.7 }}>
                            No authorized personnel detected. Enroll laboratory staff to manage diagnostic workflows.
                        </AppText>
                        <AppButton
                            title="ENROLL PERSONNEL"
                            onPress={openAddModal}
                            style={{ paddingHorizontal: 32, borderRadius: 20, height: 60 }}
                        />
                    </View>
                }
            />

            <Modal visible={modalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText variant="h3" weight="black">{editingId ? 'RECONFIGURE' : 'ENROLL'} PERSONNEL</AppText>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalRow}>
                                <View style={{ flex: 1 }}>
                                    <AppInput
                                        label="GIVEN NAME"
                                        placeholder="E.G. JOHN"
                                        value={form.firstName}
                                        onChangeText={(v) => setForm({ ...form, firstName: v })}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <AppInput
                                        label="SURNAME"
                                        placeholder="E.G. DOE"
                                        value={form.lastName}
                                        onChangeText={(v) => setForm({ ...form, lastName: v })}
                                    />
                                </View>
                            </View>

                            <View style={{ marginTop: 24 }}>
                                <AppInput
                                    label="MEDICAL SPECIALIZATION"
                                    placeholder="E.G. SENIOR PATHOLOGIST"
                                    value={form.specialization}
                                    onChangeText={(v) => setForm({ ...form, specialization: v })}
                                />
                            </View>

                            <View style={{ marginTop: 24 }}>
                                <AppInput
                                    label="PROFESSIONAL LICENSURE"
                                    placeholder="E.G. LAB-123456"
                                    value={form.licenseNumber}
                                    onChangeText={(v) => setForm({ ...form, licenseNumber: v })}
                                    autoCapitalize="characters"
                                />
                            </View>

                            <View style={{ marginTop: 24 }}>
                                <AppInput
                                    label="METRIC CONTACT (PHONE)"
                                    placeholder="+213 000 000 000"
                                    value={form.phone}
                                    onChangeText={(v) => setForm({ ...form, phone: v })}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <AppButton
                                title={editingId ? 'COMMIT MODIFICATIONS' : 'INITIALIZE ENROLLMENT'}
                                loading={saving}
                                onPress={handleSave}
                                style={styles.saveBtn}
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
    card: { marginBottom: 20, borderRadius: 32, overflow: 'hidden' },
    cardGradient: { padding: 20 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatarBox: { position: 'relative' },
    avatarInner: { width: 64, height: 64, borderRadius: 24, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    onlineDot: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: Theme.Colors.success, borderWidth: 3, borderColor: 'white' },
    info: { flex: 1, marginLeft: 20 },
    roleBadge: { alignSelf: 'flex-start', backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
    miniBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    detailGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    detailItem: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.surface, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: Theme.Colors.divider },
    detailIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },

    cardFooter: { borderTopWidth: 1, borderTopColor: Theme.Colors.divider, paddingTop: 16 },
    terminateBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 12, backgroundColor: Theme.Colors.error + '05' },

    emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyIconBg: { width: 96, height: 96, borderRadius: 32, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Theme.Colors.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, maxHeight: '88%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    closeBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center' },

    modalRow: { flexDirection: 'row' },
    saveBtn: { marginTop: 40, height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text },
});

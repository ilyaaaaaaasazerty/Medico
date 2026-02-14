import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { labApi, LabTest } from '@/services/lab.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import Theme from '@/constants/Theme';

const CATEGORIES = ['BLOOD', 'URINE', 'IMAGING', 'GENETIC', 'PATHOLOGY', 'OTHER'];

export default function LabTestsScreen() {
    const router = useRouter();
    const [tests, setTests] = useState<LabTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        code: '',
        category: 'BLOOD',
        price: '',
        turnaroundTime: '',
        description: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTests();
    }, []);

    const loadTests = async () => {
        try {
            const res = await labApi.getTests();
            if (res.success && res.data) {
                setTests(res.data);
            }
        } catch (error) {
            console.error('Error loading diagnostic test matrix:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setForm({
            name: '',
            code: '',
            category: 'BLOOD',
            price: '',
            turnaroundTime: '',
            description: ''
        });
        setModalVisible(true);
    };

    const openEditModal = (test: LabTest) => {
        setEditingId(test.id);
        setForm({
            name: test.name,
            code: test.code,
            category: test.category,
            price: test.price.toString(),
            turnaroundTime: test.turnaroundTime?.toString() || '',
            description: test.description || ''
        });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.price || !form.code) {
            Alert.alert('VALIDATION ERROR', 'Mandatory diagnostic parameters (Name, Code, Price) are required.');
            return;
        }

        setSaving(true);
        try {
            const data: Omit<LabTest, 'id'> = {
                name: form.name,
                code: form.code,
                category: form.category,
                price: parseInt(form.price),
                turnaroundTime: form.turnaroundTime ? parseInt(form.turnaroundTime) : 24,
                description: form.description || undefined
            };

            if (editingId) {
                await labApi.updateTest(editingId, data);
                setTests(tests.map(t => t.id === editingId ? { ...t, ...data } : t));
            } else {
                const res = await labApi.addTest(data);
                if (res.success && res.data) {
                    setTests([...tests, res.data]);
                }
            }

            setModalVisible(false);
        } catch (error) {
            Alert.alert('COMMIT ERROR', 'Failed to propagate test modification to institutional directory.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string, testName: string) => {
        Alert.alert('RESCIND PARAMETER', `Are you sure you want to decommission ${testName.toUpperCase()} from the active matrix?`, [
            { text: 'ABORT', style: 'cancel' },
            {
                text: 'RESCIND',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await labApi.removeTest(id);
                        setTests(tests.filter(t => t.id !== id));
                    } catch (error) {
                        Alert.alert('ERROR', 'Decommissioning protocol failed.');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: LabTest }) => (
        <AppCard style={styles.card} padding="none" onPress={() => openEditModal(item)}>
            <View style={styles.cardContent}>
                <View style={styles.testHeader}>
                    <View style={styles.testInfo}>
                        <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>{item.name}</AppText>
                        <View style={styles.tagRow}>
                            <View style={styles.categoryBadge}>
                                <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 8 }}>{item.category}</AppText>
                            </View>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>RID: #{item.code.toUpperCase()}</AppText>
                        </View>
                    </View>
                    <View style={styles.priceContainer}>
                        <AppText variant="body" weight="black" color="primary">{item.price}</AppText>
                        <AppText variant="caption" weight="black" color="primary" style={{ fontSize: 8, marginLeft: 2 }}>DA</AppText>
                    </View>
                </View>

                <View style={styles.telemetryRow}>
                    <View style={styles.telemetryItem}>
                        <Ionicons name="time-outline" size={12} color={Theme.Colors.textSecondary} />
                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 6 }}>{item.turnaroundTime}H TAT</AppText>
                    </View>
                    <View style={styles.telemetryItem}>
                        <Ionicons name="checkmark-circle-outline" size={12} color={Theme.Colors.success} />
                        <AppText variant="caption" color="success" weight="black" style={{ marginLeft: 6, fontSize: 8 }}>ACTIVE OPS</AppText>
                    </View>
                </View>

                {item.description && (
                    <View style={styles.descriptionBox}>
                        <AppText variant="caption" color="textSecondary" numberOfLines={1} weight="bold" style={{ fontStyle: 'italic', fontSize: 10 }}>
                            "{item.description}"
                        </AppText>
                    </View>
                )}

                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                        <AppText variant="caption" weight="black" color="primary" style={{ fontSize: 9 }}>RECONFIGURE</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
                        <Ionicons name="trash-outline" size={16} color={Theme.Colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
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
                <AppText variant="h3" weight="black">Diagnostic Matrix</AppText>
                <TouchableOpacity style={[styles.circleBtn, { backgroundColor: Theme.Colors.text }]} onPress={openAddModal}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={tests}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTests(); }} tintColor={Theme.Colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBg}>
                            <Ionicons name="flask-outline" size={48} color={Theme.Colors.textSecondary} />
                        </View>
                        <AppText variant="h3" weight="black" style={{ marginBottom: 12 }}>MATRIX VACUUM</AppText>
                        <AppText variant="body" color="textSecondary" align="center" weight="bold" style={{ maxWidth: 280, marginBottom: 32, lineHeight: 22, opacity: 0.7 }}>
                            No diagnostic parameters detected. Initialize your laboratory catalog to begin service provisioning.
                        </AppText>
                        <AppButton
                            title="INITIALIZE FIRST PARAMETER"
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
                            <AppText variant="h3" weight="black">{editingId ? 'Modify' : 'Initialize'} Parameter</AppText>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.formGroup}>
                                <AppInput
                                    label="DIAGNOSTIC NAME"
                                    placeholder="E.G. COMPLETE BLOOD COUNT"
                                    value={form.name}
                                    onChangeText={(v) => setForm({ ...form, name: v })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <AppInput
                                    label="INTERNAL RID CODE"
                                    placeholder="E.G. CBC-01X"
                                    value={form.code}
                                    onChangeText={(v) => setForm({ ...form, code: v })}
                                    autoCapitalize="characters"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <AppText variant="caption" weight="black" uppercase color="primary" style={{ marginBottom: 12, letterSpacing: 1 }}>Operational Classification</AppText>
                                <View style={styles.categoryGrid}>
                                    {CATEGORIES.map(c => (
                                        <TouchableOpacity
                                            key={c}
                                            style={[styles.catOption, form.category === c && styles.catOptionActive]}
                                            onPress={() => setForm({ ...form, category: c })}
                                        >
                                            <AppText variant="caption" weight="black" style={{
                                                color: form.category === c ? 'white' : Theme.Colors.textSecondary,
                                                fontSize: 9
                                            }}>
                                                {c}
                                            </AppText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.modalRow}>
                                <View style={{ flex: 1 }}>
                                    <AppInput
                                        label="PRICE (DA)"
                                        placeholder="0.00"
                                        value={form.price}
                                        onChangeText={(v) => setForm({ ...form, price: v })}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <AppInput
                                        label="TAT (HOURS)"
                                        placeholder="24"
                                        value={form.turnaroundTime}
                                        onChangeText={(v) => setForm({ ...form, turnaroundTime: v })}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={{ marginTop: 24 }}>
                                <AppInput
                                    label="CLINICAL PROTOCOL / INSTRUCTIONS"
                                    placeholder="PATIENT PREPARATION REQUIREMENTS..."
                                    value={form.description}
                                    onChangeText={(v) => setForm({ ...form, description: v })}
                                    multiline
                                    numberOfLines={4}
                                    style={{ height: 120, textAlignVertical: 'top' }}
                                />
                            </View>

                            <AppButton
                                title={editingId ? 'COMMIT MODIFICATIONS' : 'PUBLISH TO MATRIX'}
                                loading={saving}
                                onPress={handleSave}
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
    card: { marginBottom: 16, borderRadius: 28 },
    cardContent: { padding: 20 },
    testHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    testInfo: { flex: 1 },
    tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
    categoryBadge: { backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    priceContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },

    telemetryRow: { flexDirection: 'row', gap: 16, marginTop: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Theme.Colors.divider, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    telemetryItem: { flexDirection: 'row', alignItems: 'center' },

    descriptionBox: { marginTop: 12 },

    cardActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
    editBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },
    deleteBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.error + '08', justifyContent: 'center', alignItems: 'center' },

    emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyIconBg: { width: 96, height: 96, borderRadius: 32, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Theme.Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '92%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    closeBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center' },

    formGroup: { marginBottom: 24 },
    modalRow: { flexDirection: 'row', marginTop: 8 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catOption: { backgroundColor: Theme.Colors.surface, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Theme.Colors.divider },
    catOptionActive: { backgroundColor: Theme.Colors.text, borderColor: Theme.Colors.text },

    submitBtn: { marginTop: 40, height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text },
});

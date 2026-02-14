import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Theme from '@/constants/Theme';
import { patientApi } from '@/services/patient.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';

interface Allergy {
    id: string;
    allergen: string;
    severity: 'MILD' | 'MODERATE' | 'SEVERE';
    reaction?: string;
}


const SEVERITIES = ['MILD', 'MODERATE', 'SEVERE'];

export default function AllergiesScreen() {
    const router = useRouter();
    const [allergies, setAllergies] = useState<Allergy[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [allergen, setAllergen] = useState('');
    const [severity, setSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE'>('MODERATE');
    const [reaction, setReaction] = useState('');

    const [saving, setSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadAllergies();
        }, [])
    );

    const loadAllergies = async () => {
        try {
            const res = await patientApi.getAllergies();
            if (res.success && res.data) {
                setAllergies(res.data);
            }
        } catch (error) {
            console.error('Error loading hypersensitivity register:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (allergy?: Allergy) => {
        if (allergy) {
            setEditingId(allergy.id);
            setAllergen(allergy.allergen);
            setSeverity(allergy.severity.toUpperCase() as any);
            setReaction(allergy.reaction || '');

        } else {
            setEditingId(null);
            setAllergen('');
            setSeverity('MODERATE');
            setReaction('');
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!allergen) {
            Alert.alert('PROTOCOL REQUIREMENT', 'Allergen identifier is mandatory for enrollment.');
            return;
        }

        setSaving(true);
        try {
            const data = { allergen, severity, reaction };

            if (editingId) {
                await patientApi.updateAllergy(editingId, data);
            } else {
                await patientApi.addAllergy(data);
            }
            loadAllergies();
            setModalVisible(false);
        } catch (error) {
            Alert.alert('VAULT ERROR', 'Adverse reaction data commit unsuccessful.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('RESCIND RECORD', 'Are you sure you want to permanently revoke this hypersensitivity factor?', [
            { text: 'ABORT', style: 'cancel' },
            {
                text: 'REVOKE RECORD',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await patientApi.deleteAllergy(id);
                        setAllergies(prev => prev.filter(a => a.id !== id));
                    } catch (error) {
                        Alert.alert('PROTOCOL ERROR', 'Revocation protocol failed.');
                    }
                }
            }
        ]);
    };

    const getSeverityTheme = (sev: string) => {
        const s = sev.toUpperCase();
        if (s === 'SEVERE') return { color: Theme.Colors.error, label: 'CRITICAL GRAVITY' };
        if (s === 'MODERATE') return { color: Theme.Colors.warning, label: 'SIGNIFICANT GRAVITY' };
        return { color: Theme.Colors.success, label: 'MINOR GRAVITY' };
    };

    const renderItem = ({ item }: { item: Allergy }) => {
        const theme = getSeverityTheme(item.severity);

        return (
            <AppCard padding="none" style={styles.card} onPress={() => openModal(item)}>
                <View style={[styles.gravityStripe, { backgroundColor: theme.color }]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardTop}>
                        <View style={{ flex: 1 }}>
                            <AppText variant="body" weight="black" uppercase style={{ fontSize: 16 }}>{item.allergen}</AppText>
                            <View style={[styles.gravityBadge, { backgroundColor: theme.color + '12' }]}>
                                <AppText variant="caption" weight="black" style={{ color: theme.color, fontSize: 8 }}>{theme.label}</AppText>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                            <Ionicons name="trash-outline" size={16} color={Theme.Colors.divider} />
                        </TouchableOpacity>
                    </View>

                    {item.reaction && (
                        <View style={styles.reactionRow}>
                            <Ionicons name="warning-outline" size={14} color={Theme.Colors.textSecondary} />
                            <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 8, flex: 1 }}>
                                MANIFESTATION: {item.reaction.toUpperCase()}
                            </AppText>
                        </View>
                    )}
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
                <AppText variant="h3" weight="black">Immune Registry</AppText>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => openModal()}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.hero}>
                <AppText variant="h2" weight="black">Sensitivity Matrix</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={styles.heroSub}>
                    Official clinical registry of physiological hypersensitivities. Mandatory for pharmacological cross-verification.
                </AppText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={allergies}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="shield-outline" size={42} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">NO HYPERSENSITIVITIES ENROLLED</AppText>
                            <AppButton
                                title="ENROLL NEW PROTOCOL"
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
                                <AppText variant="h3" weight="black">{editingId ? 'RECONFIGURE' : 'ENROLL'} SENSITIVITY</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">Critical clinical parameter enrollment</AppText>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Theme.Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ padding: 24 }}>
                            <AppInput
                                label="CLINICAL ALLERGEN IDENTIFIER"
                                value={allergen}
                                onChangeText={setAllergen}
                                placeholder="e.g. PHARMACOLOGICAL (PENICILLIN)"
                            />

                            <View style={{ marginTop: 20 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.label}>GRAVITY CLASSIFICATION</AppText>
                                <View style={styles.optionGrid}>
                                    {SEVERITIES.map(sev => {
                                        const theme = getSeverityTheme(sev);
                                        const isSelected = severity === sev;
                                        return (
                                            <TouchableOpacity
                                                key={sev}
                                                style={[styles.tagOption, isSelected && { backgroundColor: theme.color, borderColor: theme.color }]}
                                                onPress={() => setSeverity(sev as any)}
                                            >

                                                <AppText variant="caption" weight="black" style={{ color: isSelected ? 'white' : Theme.Colors.textSecondary, fontSize: 9 }}>{sev}</AppText>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <AppInput
                                label="PHYSIOLOGICAL MANIFESTATION"
                                value={reaction}
                                onChangeText={setReaction}
                                placeholder="e.g. DERMATOLOGICAL (URTICARIA)"
                                style={{ marginTop: 24 }}
                            />

                            <AppButton
                                title={editingId ? "COMMIT PROTOCOL" : "REGISTER SENSITIVITY"}
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

    hero: { paddingHorizontal: 24, marginBottom: 16 },
    heroSub: { marginTop: 8, lineHeight: 22 },

    list: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
    card: { marginBottom: 16, borderRadius: 32, overflow: 'hidden', flexDirection: 'row' },
    gravityStripe: { width: 8, height: '100%' },
    cardContent: { flex: 1, padding: 22 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    gravityBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginTop: 8 },
    reactionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: Theme.Colors.surface, padding: 12, borderRadius: 16 },
    deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    emptyState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
    emptyIconBox: { width: 84, height: 84, borderRadius: 28, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Theme.Colors.background, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: Platform.OS === 'ios' ? 44 : 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center' },
    label: { fontSize: 8, letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
    optionGrid: { flexDirection: 'row', gap: 10 },
    tagOption: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, alignItems: 'center' },
});

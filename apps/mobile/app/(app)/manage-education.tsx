import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Theme from '@/constants/Theme';
import { doctorApi } from '@/services/doctor.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';

interface Education {
    id: string;
    degree: string;
    institution: string;
    year: number;
}

export default function ManageEducationScreen() {
    const router = useRouter();
    const [education, setEducation] = useState<Education[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newItem, setNewItem] = useState({
        degree: '',
        institution: '',
        year: new Date().getFullYear().toString(),
    });

    useEffect(() => {
        loadEducation();
    }, []);

    const loadEducation = async () => {
        try {
            const res = await doctorApi.getProfile();
            if (res.success && res.data) {
                setEducation(res.data.education || []);
            }
        } catch (error) {
            console.error('Error loading academic records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newItem.degree || !newItem.institution) {
            Alert.alert('Protocol Incomplete', 'Please specify both clinical degree and awarding institution.');
            return;
        }

        setSaving(true);
        try {
            const res = await doctorApi.addEducation({
                degree: newItem.degree,
                institution: newItem.institution,
                year: parseInt(newItem.year),
            });
            if (res.success && res.data) {
                setEducation([...education, res.data]);
                setModalVisible(false);
                setNewItem({ degree: '', institution: '', year: new Date().getFullYear().toString() });
            }
        } catch (error) {
            Alert.alert('Credential Error', 'Unable to verify academic records with the institutional database.');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = (id: string, degree: string) => {
        Alert.alert('Decommission Record', `Are you sure you want to remove ${degree} from your verified academic pedigree?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm Decommission',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await doctorApi.removeEducation(id);
                        setEducation(education.filter(e => e.id !== id));
                    } catch (error) {
                        Alert.alert('Operational Error', 'Verification de-listing failed.');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item, index }: { item: Education; index: number }) => (
        <View style={styles.timelineRow}>
            <View style={styles.timelineGuide}>
                <View style={[styles.dot, index === 0 && styles.activeDot]} />
                {index < education.length - 1 && <View style={styles.line} />}
            </View>
            <AppCard style={styles.pedigreeCard} padding="md">
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <AppText variant="body" weight="black">{item.degree}</AppText>
                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 2 }}>{item.institution}</AppText>
                    </View>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id, item.degree)}>
                        <Ionicons name="trash-outline" size={16} color={Theme.Colors.error} />
                    </TouchableOpacity>
                </View>
                <View style={styles.yearBadge}>
                    <Ionicons name="school-outline" size={10} color={Theme.Colors.primary} />
                    <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 9, marginLeft: 4 }}>Conferred {item.year}</AppText>
                </View>
            </AppCard>
        </View>
    );

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Academic Pedigree</AppText>
                <TouchableOpacity style={styles.addTrigger} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <AppText variant="h1" weight="black">Institutional History</AppText>
                    <AppText variant="body" color="textSecondary" style={{ marginTop: 8 }}>
                        Consolidate academic landmarks to authorize subject-level confidence and clinical authority.
                    </AppText>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={Theme.Colors.primary} style={{ marginTop: 60 }} />
                ) : education.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="ribbon-outline" size={48} color={Theme.Colors.divider} />
                        </View>
                        <AppText variant="h3" weight="black">Pedigree Empty</AppText>
                        <AppText variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: 12 }}>
                            Highlight historical clinical qualifications to build verification parameters.
                        </AppText>
                    </View>
                ) : (
                    <View style={styles.pedigreeList}>
                        {education.map((item, index) => (
                            <View key={item.id}>{renderItem({ item, index })}</View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.sheetHeader}>
                            <View>
                                <AppText variant="h2" weight="black">New Academic Entry</AppText>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ letterSpacing: 1 }}>Verification required</AppText>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <AppText variant="caption" weight="black" uppercase style={styles.label}>Clinical Degree / Specification</AppText>
                                <TextInput
                                    style={styles.terminalInput}
                                    value={newItem.degree}
                                    onChangeText={(v) => setNewItem({ ...newItem, degree: v })}
                                    placeholder="e.g. Master of Clinical Medicine"
                                    placeholderTextColor={Theme.Colors.textTertiary}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <AppText variant="caption" weight="black" uppercase style={styles.label}>Awarding Institution</AppText>
                                <TextInput
                                    style={styles.terminalInput}
                                    value={newItem.institution}
                                    onChangeText={(v) => setNewItem({ ...newItem, institution: v })}
                                    placeholder="Medical Faculty of Algiers"
                                    placeholderTextColor={Theme.Colors.textTertiary}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <AppText variant="caption" weight="black" uppercase style={styles.label}>Year of Conferral</AppText>
                                <TextInput
                                    style={styles.terminalInput}
                                    value={newItem.year}
                                    onChangeText={(v) => setNewItem({ ...newItem, year: v })}
                                    placeholder="2024"
                                    keyboardType="number-pad"
                                    placeholderTextColor={Theme.Colors.textTertiary}
                                />
                            </View>

                            <AppButton
                                title="Commit to Pedigree"
                                onPress={handleAdd}
                                loading={saving}
                                style={{ height: 64, borderRadius: 20, marginTop: 12 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    addTrigger: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center', ...Theme.Shadows.primary },

    scrollContent: { paddingHorizontal: 24, paddingBottom: 60 },
    heroSection: { marginBottom: 40 },

    pedigreeList: { gap: 0 },
    timelineRow: { flexDirection: 'row' },
    timelineGuide: { width: 32, alignItems: 'center' },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.Colors.divider, marginTop: 24 },
    activeDot: { backgroundColor: Theme.Colors.primary, width: 12, height: 12, borderRadius: 6 },
    line: { width: 2, flex: 1, backgroundColor: Theme.Colors.divider, marginVertical: 4 },

    pedigreeCard: { flex: 1, marginLeft: 8, marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    removeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Theme.Colors.error + '10', justifyContent: 'center', alignItems: 'center' },
    yearBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 16 },

    emptyState: { alignItems: 'center', marginTop: 80, padding: 40 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: 'white', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 32, paddingBottom: Platform.OS === 'ios' ? 44 : 32 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
    closeBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center' },

    form: { gap: 20 },
    inputGroup: { gap: 10 },
    label: { fontSize: 10, letterSpacing: 1, marginLeft: 4 },
    terminalInput: { backgroundColor: Theme.Colors.background, borderRadius: 18, padding: 18, fontSize: 16, color: Theme.Colors.text, borderWidth: 1, borderColor: Theme.Colors.divider, fontWeight: '600' },
});

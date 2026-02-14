import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { patientApi } from '@/services/patient.api';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import { Ionicons } from '@expo/vector-icons';

const RELATIONSHIPS = ['CHILD', 'SPOUSE', 'PARENT', 'SIBLING', 'OTHER'];
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

export default function AddFamilyMemberScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [gender, setGender] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');

    useEffect(() => {
        if (isEditing) {
            loadMember();
        }
    }, [id]);

    const loadMember = async () => {
        setLoading(true);
        try {
            const res = await patientApi.getFamilyMember(id!);
            if (res.success && res.data) {
                setFirstName(res.data.firstName);
                setLastName(res.data.lastName);
                setRelationship(res.data.relationship);
                setGender(res.data.gender);
                setDateOfBirth(res.data.dateOfBirth?.split('T')[0] || '');
                setWeight(res.data.weight?.toString() || '');
                setHeight(res.data.height?.toString() || '');
            }
        } catch (error) {
            Alert.alert('Protocol Error', 'Failed to retrieve dependent profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!firstName || !lastName || !relationship || !gender || !dateOfBirth) {
            Alert.alert('Validation Error', 'All mandatory clinical parameters must be defined.');
            return;
        }

        setSaving(true);
        try {
            const data = {
                firstName,
                lastName,
                relationship,
                gender,
                dateOfBirth,
                weight: weight ? parseFloat(weight) : undefined,
                height: height ? parseFloat(height) : undefined,
            };

            if (isEditing) {
                await patientApi.updateFamilyMember(id!, data);
            } else {
                await patientApi.addFamilyMember(data);
            }

            Alert.alert('Success', 'Dependent registration protocol synchronized.');
            router.back();
        } catch (error) {
            Alert.alert('System Error', 'Unable to commit dependent data to clinical net.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
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
                    <Ionicons name="close" size={24} color={Theme.Colors.text} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">{isEditing ? 'Modify' : 'Enroll'} Dependent</AppText>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    <AppText variant="body" weight="black" color="primary">{saving ? 'SYNCING...' : 'COMMIT'}</AppText>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Identity Framework */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Identity Framework</AppText>
                    <AppCard padding="md">
                        <View style={styles.inputRow}>
                            <AppInput label="Given Name" value={firstName} onChangeText={setFirstName} style={{ flex: 1 }} />
                            <View style={{ width: 12 }} />
                            <AppInput label="Family Name" value={lastName} onChangeText={setLastName} style={{ flex: 1 }} />
                        </View>
                        <View style={{ marginTop: 12 }}>
                            <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.label}>Corporate Relationship</AppText>
                            <View style={styles.optionGrid}>
                                {RELATIONSHIPS.map(rel => (
                                    <TouchableOpacity
                                        key={rel}
                                        style={[styles.tagOption, relationship === rel && styles.tagSelected]}
                                        onPress={() => setRelationship(rel)}
                                    >
                                        <AppText variant="caption" weight="black" style={{ color: relationship === rel ? 'white' : Theme.Colors.textSecondary }}>{rel}</AppText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </AppCard>
                </View>

                {/* Biological Constants */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Biological Constants</AppText>
                    <AppCard padding="md">
                        <View style={styles.inputRow}>
                            <AppInput label="Temporal Origin" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" style={{ flex: 1 }} />
                            <View style={{ width: 12 }} />
                            <View style={{ flex: 1 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.label}>Gender</AppText>
                                <View style={styles.optionGrid}>
                                    {GENDERS.map(g => (
                                        <TouchableOpacity key={g} style={[styles.miniTag, gender === g && styles.tagSelected]} onPress={() => setGender(g)}>
                                            <AppText variant="caption" weight="black" style={{ color: gender === g ? 'white' : Theme.Colors.textSecondary }}>{g[0]}</AppText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                        <View style={[styles.inputRow, { marginTop: 16 }]}>
                            <AppInput label="Mass (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" style={{ flex: 1 }} />
                            <View style={{ width: 12 }} />
                            <AppInput label="Stature (cm)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" style={{ flex: 1 }} />
                        </View>
                    </AppCard>
                </View>

                <View style={styles.noteBox}>
                    <Ionicons name="information-circle" size={20} color={Theme.Colors.primary} />
                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ flex: 1, marginLeft: 12 }}>
                        Providing precise biological constants ensures more accurate diagnostic evaluation and dosing protocols.
                    </AppText>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    title={isEditing ? "Modify Dependent" : "Enroll Member"}
                    loading={saving}
                    onPress={handleSave}
                    style={{ height: 64, borderRadius: 22 }}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24 },
    section: { marginBottom: 32 },
    sectionTitle: { marginBottom: 16, letterSpacing: 1 },

    inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
    label: { fontSize: 9, marginBottom: 8 },
    optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tagOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider },
    miniTag: { width: 36, height: 36, borderRadius: 8, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, justifyContent: 'center', alignItems: 'center' },
    tagSelected: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },

    noteBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '08', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.primary + '15' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Theme.Colors.background, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
});

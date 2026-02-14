import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Theme from '@/constants/Theme';
import { doctorApi } from '@/services/doctor.api';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { Ionicons } from '@expo/vector-icons';

const TITLES = ['Dr.', 'Prof.', 'Assoc. Prof.'];

export default function EditDoctorProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [title, setTitle] = useState('Dr.');
    const [bio, setBio] = useState('');
    const [consultationFee, setConsultationFee] = useState('');
    const [yearsExperience, setYearsExperience] = useState('');
    const [languages, setLanguages] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await doctorApi.getProfile();
            if (res.success && res.data) {
                const d = res.data;
                setFirstName(d.firstName || '');
                setLastName(d.lastName || '');
                setTitle(d.title || 'Dr.');
                setBio(d.bio || '');
                setConsultationFee(d.consultationFee?.toString() || '');
                setYearsExperience(d.yearsExperience?.toString() || '');
                setLanguages(d.languages?.join(', ') || '');
                setLicenseNumber(d.licenseNumber || '');
            }
        } catch (error) {
            console.error('Error loading practitioner profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!firstName || !lastName) {
            Alert.alert('Protocol Error', 'Primary identification tokens required.');
            return;
        }

        setSaving(true);
        try {
            await doctorApi.updateProfile({
                firstName,
                lastName,
                title,
                bio,
                consultationFee: parseInt(consultationFee) || 0,
                yearsExperience: parseInt(yearsExperience) || 0,
                languages: languages.split(',').map(l => l.trim()).filter(Boolean),
                licenseNumber,
            });

            Alert.alert('Protocol Synchronized', 'Practitioner identity has been committed to the institutional ledger.');
            router.back();
        } catch (error) {
            Alert.alert('System Error', 'Failed to synchronize practitioner identity.');
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
                    <Ionicons name="close" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Practitioner Identity</AppText>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveTrigger}>
                    <Ionicons name="checkmark" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Identity Header */}
                <View style={styles.identityHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <AppText variant="h1" weight="black" color="textInverted">
                                {firstName[0]}{lastName[0]}
                            </AppText>
                        </View>
                        <TouchableOpacity style={styles.editBadge}>
                            <Ionicons name="camera" size={14} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginLeft: 20 }}>
                        <AppText variant="h2" weight="black">{title} {firstName} {lastName}</AppText>
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ letterSpacing: 1 }}>Verified Practitioner</AppText>
                    </View>
                </View>

                {/* Primary Parameters */}
                <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionLabel}>Clinical Identification</AppText>
                <AppCard style={styles.sectionCard} padding="md">
                    <View style={styles.inputGroup}>
                        <AppText variant="caption" weight="black" uppercase style={styles.fieldLabel}>Formal Title</AppText>
                        <View style={styles.titleGrid}>
                            {TITLES.map(t => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.titleChip, title === t && styles.titleChipActive]}
                                    onPress={() => setTitle(t)}
                                >
                                    <AppText
                                        variant="caption"
                                        color={title === t ? 'textInverted' : 'textSecondary'}
                                        weight="black"
                                    >
                                        {t}
                                    </AppText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <AppText variant="caption" weight="black" uppercase style={styles.fieldLabel}>Given Name</AppText>
                            <TextInput
                                style={styles.terminalInput}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="First name"
                                placeholderTextColor={Theme.Colors.textTertiary}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <AppText variant="caption" weight="black" uppercase style={styles.fieldLabel}>Surname</AppText>
                            <TextInput
                                style={styles.terminalInput}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Last name"
                                placeholderTextColor={Theme.Colors.textTertiary}
                            />
                        </View>
                    </View>
                </AppCard>

                {/* Operational Parameters */}
                <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionLabel}>Operational Parameters</AppText>
                <AppCard style={styles.sectionCard} padding="md">
                    <View style={styles.inputGroup}>
                        <AppText variant="caption" weight="black" uppercase style={styles.fieldLabel}>Professional Narrative (Bio)</AppText>
                        <TextInput
                            style={[styles.terminalInput, { height: 120, textAlignVertical: 'top' }]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Specify clinical expertise and professional background..."
                            placeholderTextColor={Theme.Colors.textTertiary}
                            multiline
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <AppText variant="caption" weight="black" uppercase style={styles.fieldLabel}>Institutional License ID</AppText>
                        <TextInput
                            style={styles.terminalInput}
                            value={licenseNumber}
                            onChangeText={setLicenseNumber}
                            placeholder="ML-XXXXXXX"
                            placeholderTextColor={Theme.Colors.textTertiary}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <AppText variant="caption" weight="black" uppercase style={styles.fieldLabel}>Operational Fee</AppText>
                            <TextInput
                                style={styles.terminalInput}
                                value={consultationFee}
                                onChangeText={setConsultationFee}
                                placeholder="Price (DA)"
                                placeholderTextColor={Theme.Colors.textTertiary}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <AppText variant="caption" weight="black" uppercase style={styles.fieldLabel}>Clinical Tenure (Years)</AppText>
                            <TextInput
                                style={styles.terminalInput}
                                value={yearsExperience}
                                onChangeText={setYearsExperience}
                                placeholder="Years"
                                placeholderTextColor={Theme.Colors.textTertiary}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <AppText variant="caption" weight="black" uppercase style={styles.fieldLabel}>Linguistic Proficiency</AppText>
                        <TextInput
                            style={styles.terminalInput}
                            value={languages}
                            onChangeText={setLanguages}
                            placeholder="Arabic, French, English..."
                            placeholderTextColor={Theme.Colors.textTertiary}
                        />
                    </View>
                </AppCard>

                {/* Navigation Links */}
                <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionLabel}>Institutional Extensions</AppText>
                <TouchableOpacity
                    style={styles.extensionTile}
                    onPress={() => router.push('/(app)/manage-specialties')}
                >
                    <View style={styles.extensionIcon}>
                        <Ionicons name="medical-outline" size={20} color={Theme.Colors.primary} />
                    </View>
                    <AppText variant="body" weight="black" style={{ flex: 1, marginLeft: 16 }}>Clinical Specialties</AppText>
                    <Ionicons name="chevron-forward" size={18} color={Theme.Colors.divider} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.extensionTile}
                    onPress={() => router.push('/(app)/manage-education')}
                >
                    <View style={styles.extensionIcon}>
                        <Ionicons name="school-outline" size={20} color={Theme.Colors.primary} />
                    </View>
                    <AppText variant="body" weight="black" style={{ flex: 1, marginLeft: 16 }}>Academic Pedigree</AppText>
                    <Ionicons name="chevron-forward" size={18} color={Theme.Colors.divider} />
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    title="Commit Changes"
                    onPress={handleSave}
                    loading={saving}
                    style={{ height: 60, borderRadius: 20 }}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    saveTrigger: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center', ...Theme.Shadows.primary },

    content: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },

    identityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, marginTop: 10 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Theme.Colors.primary, borderWidth: 3, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },

    sectionLabel: { marginLeft: 4, marginBottom: 12, letterSpacing: 1.2, fontSize: 10 },
    sectionCard: { marginBottom: 32, borderWidth: 1, borderColor: Theme.Colors.divider },

    inputGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 8, letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
    terminalInput: { backgroundColor: Theme.Colors.background, borderRadius: 16, padding: 16, fontSize: 15, color: Theme.Colors.text, borderWidth: 1, borderColor: Theme.Colors.divider, fontWeight: '600' },

    titleGrid: { flexDirection: 'row', gap: 8 },
    titleChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: Theme.Colors.background, borderWidth: 1, borderColor: Theme.Colors.divider },
    titleChipActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },

    row: { flexDirection: 'row', marginBottom: 20 },

    extensionTile: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.surface, padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: Theme.Colors.divider },
    extensionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: 'rgba(255,255,255,0.9)' },
});

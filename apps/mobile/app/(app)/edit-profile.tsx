import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Theme from '@/constants/Theme';
import { patientApi } from '@/services/patient.api';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import { Ionicons } from '@expo/vector-icons';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

export default function EditProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await patientApi.getProfile();
            if (res.success && res.data) {
                const p = res.data;
                setFirstName(p.firstName || '');
                setLastName(p.lastName || '');
                setPhone(p.phone || '');
                setDateOfBirth(p.dateOfBirth?.split('T')[0] || '');
                setGender(p.gender || '');
                setBloodType(p.bloodType || '');
                setAddress(p.address || '');
                setCity(p.city || '');
                setEmergencyContact(p.emergencyName || '');
                setEmergencyPhone(p.emergencyPhone || '');
            }
        } catch (error) {
            console.error('Error loading primary identity:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!firstName || !lastName) {
            Alert.alert('Protocol Error', 'Primary identifiers (First and Last Name) are mandatory.');
            return;
        }

        setSaving(true);
        try {
            await patientApi.updateProfile({
                firstName,
                lastName,
                phone,
                dateOfBirth,
                gender: gender as 'MALE' | 'FEMALE' | 'OTHER',
                bloodType,
                address,
                city,
                emergencyName: emergencyContact,
                emergencyPhone: emergencyPhone,
            });

            Alert.alert('Success', 'Primary identity successfully synchronized.');
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Unable to commit identity changes to clinical net.');
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
                <AppText variant="h3" weight="black">Modify Identity</AppText>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    <AppText variant="body" weight="black" color="primary">{saving ? 'SYNCING...' : 'COMMIT'}</AppText>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Identity Header */}
                <View style={styles.idProfile}>
                    <View style={styles.avatarLarge}>
                        <AppText style={{ fontSize: 32 }} weight="black" color="primary">
                            {firstName?.[0]}{lastName?.[0]}
                        </AppText>
                    </View>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ marginTop: 12 }}>Primary Identifier</AppText>
                </View>

                {/* Core Parameters */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Basic Parameters</AppText>
                    <AppCard padding="md">
                        <View style={styles.inputRow}>
                            <AppInput
                                label="Given Name"
                                value={firstName}
                                onChangeText={setFirstName}
                                style={{ flex: 1 }}
                            />
                            <View style={{ width: 12 }} />
                            <AppInput
                                label="Family Name"
                                value={lastName}
                                onChangeText={setLastName}
                                style={{ flex: 1 }}
                            />
                        </View>
                        <AppInput
                            label="Communication Terminal (Phone)"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                        <AppInput
                            label="Temporal Origin (Birth Date)"
                            value={dateOfBirth}
                            onChangeText={setDateOfBirth}
                            placeholder="YYYY-MM-DD"
                        />
                    </AppCard>
                </View>

                {/* Biological Classification */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Biological Classification</AppText>
                    <AppCard padding="md">
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.label}>Gender Protocol</AppText>
                        <View style={styles.optionGrid}>
                            {GENDERS.map(g => (
                                <TouchableOpacity
                                    key={g}
                                    style={[styles.tagOption, gender === g && styles.tagSelected]}
                                    onPress={() => setGender(g)}
                                >
                                    <AppText variant="caption" weight="black" style={{ color: gender === g ? 'white' : Theme.Colors.textSecondary }}>{g}</AppText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={[styles.label, { marginTop: 24 }]}>Serological Group (Blood Type)</AppText>
                        <View style={styles.optionGrid}>
                            {BLOOD_TYPES.map(bt => (
                                <TouchableOpacity
                                    key={bt}
                                    style={[styles.smallTag, bloodType === bt && styles.tagSelected]}
                                    onPress={() => setBloodType(bt)}
                                >
                                    <AppText variant="caption" weight="black" style={{ color: bloodType === bt ? 'white' : Theme.Colors.textSecondary }}>{bt}</AppText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </AppCard>
                </View>

                {/* Geographic Context */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Geographic Context</AppText>
                    <AppCard padding="md">
                        <AppInput
                            label="City/Province"
                            value={city}
                            onChangeText={setCity}
                        />
                        <AppInput
                            label="Detailed Residency Address"
                            value={address}
                            onChangeText={setAddress}
                            multiline
                        />
                    </AppCard>
                </View>

                {/* Emergency Protocols */}
                <View style={styles.section}>
                    <AppText variant="caption" color="error" weight="black" uppercase style={styles.sectionTitle}>Emergency Protocols</AppText>
                    <AppCard padding="md" style={{ borderColor: Theme.Colors.error + '20' }}>
                        <AppInput
                            label="Crisis Contact Name"
                            value={emergencyContact}
                            onChangeText={setEmergencyContact}
                        />
                        <AppInput
                            label="Crisis Communication Line"
                            value={emergencyPhone}
                            onChangeText={setEmergencyPhone}
                            keyboardType="phone-pad"
                        />
                    </AppCard>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    title="Synchronize Identity"
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
    idProfile: { alignItems: 'center', marginBottom: 32 },
    avatarLarge: { width: 100, height: 100, borderRadius: 36, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.primary + '20' },

    section: { marginBottom: 32 },
    sectionTitle: { marginBottom: 16, letterSpacing: 1 },

    inputRow: { flexDirection: 'row' },
    label: { fontSize: 9, marginBottom: 10 },

    optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tagOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider },
    smallTag: { width: 48, height: 40, borderRadius: 10, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, justifyContent: 'center', alignItems: 'center' },
    tagSelected: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Theme.Colors.background, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { clinicApi } from '@/services/clinic.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppInput, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

export default function ClinicProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        description: '',
        website: '',
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await clinicApi.getProfile();
            if (res.success && res.data) {
                const data = res.data as any;
                setProfile({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    city: data.city || '',
                    state: data.state || '',
                    country: data.country || '',
                    postalCode: data.postalCode || '',
                    description: data.description || '',
                    website: data.website || '',
                });
            }

        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await clinicApi.updateProfile(profile);
            if (res.success) {
                Alert.alert('Success', 'Profile updated successfully');
            } else {
                Alert.alert('Error', res.error || 'Failed to update profile');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key: string, value: string) => {
        setProfile(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    return (
        <AppScreen padding={false} scrollable>
            <View style={styles.header}>
                <AppButton
                    variant="tonal"
                    size="sm"
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    title="BACK"
                    icon={<Ionicons name="arrow-back" size={20} color={Theme.Colors.primary} />}
                />

                <AppText variant="h3" weight="bold" style={{ flex: 1 }}>Clinic Profile</AppText>
                <AppButton
                    title="Save"
                    size="sm"
                    loading={saving}
                    onPress={handleSave}
                    style={{ paddingHorizontal: 20 }}
                />
            </View>

            <View style={styles.content}>
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Basic Information</AppText>
                    <AppInput
                        label="Clinic Name"
                        placeholder="Enter clinic name"
                        value={profile.name}
                        onChangeText={(v) => updateField('name', v)}
                    />
                    <AppInput
                        label="Email Address"
                        placeholder="clinic@example.com"
                        value={profile.email}
                        onChangeText={(v) => updateField('email', v)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <AppInput
                        label="Phone Number"
                        placeholder="+1234567890"
                        value={profile.phone}
                        onChangeText={(v) => updateField('phone', v)}
                        keyboardType="phone-pad"
                    />
                    <AppInput
                        label="Website"
                        placeholder="https://www.example.com"
                        value={profile.website}
                        onChangeText={(v) => updateField('website', v)}
                        keyboardType="url"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Physical Location</AppText>
                    <AppInput
                        label="Address"
                        placeholder="Street address"
                        value={profile.address}
                        onChangeText={(v) => updateField('address', v)}
                    />
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                label="City"
                                placeholder="City"
                                value={profile.city}
                                onChangeText={(v) => updateField('city', v)}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <AppInput
                                label="State"
                                placeholder="State"
                                value={profile.state}
                                onChangeText={(v) => updateField('state', v)}
                            />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                label="Country"
                                placeholder="Country"
                                value={profile.country}
                                onChangeText={(v) => updateField('country', v)}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <AppInput
                                label="Postal Code"
                                placeholder="12345"
                                value={profile.postalCode}
                                onChangeText={(v) => updateField('postalCode', v)}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>About the Facility</AppText>
                    <AppInput
                        label="Description"
                        placeholder="Describe your clinic..."
                        value={profile.description}
                        onChangeText={(v) => updateField('description', v)}
                        multiline
                        numberOfLines={4}
                        style={{ height: 120, textAlignVertical: 'top' }}
                    />
                </View>

                <View style={{ height: 60 }} />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 14, paddingHorizontal: 0 },
    content: { paddingHorizontal: 24 },
    section: { marginBottom: 32 },
    sectionTitle: { marginBottom: 16, letterSpacing: 1 },
    row: { flexDirection: 'row' },
});

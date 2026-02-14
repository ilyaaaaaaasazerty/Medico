import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { labApi } from '@/services/lab.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import Theme from '@/constants/Theme';

export default function LabProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        description: '',
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await labApi.getProfile();
            if (res.success && res.data) {
                setForm({
                    name: res.data.name || '',
                    email: res.data.email || '',
                    phone: res.data.phone || '',
                    address: res.data.address || '',
                    city: res.data.city || '',
                    state: res.data.state || '',
                    country: res.data.country || '',
                    description: res.data.description || '',
                });
            }
        } catch (error) {
            console.error('Error loading facility profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await labApi.updateProfile(form);
            if (res.success) {
                Alert.alert('ENTITY SYNCHRONIZED', 'Institutional profile parameters have been propagated to the diagnostic network.');
            }
        } catch (error) {
            Alert.alert('COMMIT ERROR', 'Failed to synchronize facility identity with global registry.');
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
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Facility Identity</AppText>
                <TouchableOpacity style={[styles.circleBtn, { backgroundColor: Theme.Colors.text }]} onPress={handleSave}>
                    {saving ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="checkmark" size={24} color="white" />}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <AppText variant="caption" color="primary" weight="black" uppercase style={{ letterSpacing: 1 }}>Institutional Credentials</AppText>
                        </View>
                        <AppCard padding="none" style={styles.formCard}>
                            <View style={styles.cardPadding}>
                                <AppInput
                                    label="OFFICIAL LABORATORY NOMENCLATURE"
                                    placeholder="E.G. AL-AMAL DIAGNOSTIC CENTER"
                                    value={form.name}
                                    onChangeText={(v) => setForm({ ...form, name: v })}
                                />
                                <View style={{ marginTop: 24 }}>
                                    <AppInput
                                        label="CLINICAL INQUIRY EMAIL"
                                        placeholder="LABS@MEDICO.COM"
                                        value={form.email}
                                        onChangeText={(v) => setForm({ ...form, email: v })}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                                <View style={{ marginTop: 24 }}>
                                    <AppInput
                                        label="PRIMARY METRIC CONTACT"
                                        placeholder="+213..."
                                        value={form.phone}
                                        onChangeText={(v) => setForm({ ...form, phone: v })}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>
                        </AppCard>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <AppText variant="caption" color="primary" weight="black" uppercase style={{ letterSpacing: 1 }}>Geographic Parameters</AppText>
                        </View>
                        <AppCard padding="none" style={styles.formCard}>
                            <View style={styles.cardPadding}>
                                <AppInput
                                    label="FACILITY STREET ADDRESS"
                                    placeholder="SUITE, BUILDING, AREA"
                                    value={form.address}
                                    onChangeText={(v) => setForm({ ...form, address: v })}
                                />
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <AppInput
                                            label="CITY / WILAYA"
                                            placeholder="CITY"
                                            value={form.city}
                                            onChangeText={(v) => setForm({ ...form, city: v })}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 16 }}>
                                        <AppInput
                                            label="STATE / SECTOR"
                                            placeholder="STATE"
                                            value={form.state}
                                            onChangeText={(v) => setForm({ ...form, state: v })}
                                        />
                                    </View>
                                </View>
                            </View>
                        </AppCard>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <AppText variant="caption" color="primary" weight="black" uppercase style={{ letterSpacing: 1 }}>Institutional Bio</AppText>
                        </View>
                        <AppCard padding="none" style={styles.formCard}>
                            <View style={styles.cardPadding}>
                                <AppInput
                                    label="MISSION & DIAGNOSTIC CAPABILITIES"
                                    placeholder="DESCRIBE SPECIALIZED CAPABILITIES..."
                                    value={form.description}
                                    onChangeText={(v) => setForm({ ...form, description: v })}
                                    multiline
                                    numberOfLines={4}
                                    style={{ height: 120, textAlignVertical: 'top' }}
                                />
                            </View>
                        </AppCard>
                    </View>

                    <TouchableOpacity
                        style={styles.navRow}
                        onPress={() => router.push('/(app)/lab-hours')}
                    >
                        <View style={styles.navIconBox}>
                            <Ionicons name="time-outline" size={24} color={Theme.Colors.primary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>Operational Temporal Protocol</AppText>
                            <AppText variant="caption" color="textSecondary" weight="bold">Configure facility lifecycle and availability.</AppText>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Theme.Colors.divider} />
                    </TouchableOpacity>

                    <View style={{ height: 60 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24, paddingTop: 16 },
    section: { marginBottom: 32 },
    sectionHeader: { marginBottom: 16, paddingLeft: 4 },
    formCard: { borderRadius: 28 },
    cardPadding: { padding: 20 },
    row: { flexDirection: 'row', marginTop: 24 },

    navRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.surface, padding: 20, borderRadius: 28, borderWidth: 1, borderColor: Theme.Colors.divider },
    navIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },
});

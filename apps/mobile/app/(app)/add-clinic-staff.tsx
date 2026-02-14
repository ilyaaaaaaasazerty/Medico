import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { clinicApi } from '@/services/clinic.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppButton, AppInput } from '@/components/base';
import Theme from '@/constants/Theme';

export default function AddClinicStaffScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState('RECEPTIONIST');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const DISPLAY_ROLES: Record<string, string> = {
        'RECEPTIONIST': 'RECEPTIONIST',
        'NURSE': 'CLINICAL NURSE',
        'TECHNICIAN': 'LAB TECHNICIAN',
        'ADMINISTRATIVE': 'INSTITUTIONAL ADMIN',
        'OTHER': 'SUPPORT STAFF'
    };
    const ROLES = Object.keys(DISPLAY_ROLES);

    useEffect(() => {
        if (isEditing) {
            loadStaffMember();
        }
    }, [id]);

    const loadStaffMember = async () => {
        setLoading(true);
        try {
            const res: any = await clinicApi.getStaffMember(id!);
            if (res.success && res.data) {
                setFirstName(res.data.firstName);
                setLastName(res.data.lastName);
                setRole(res.data.role);
                setEmail(res.data.email || '');
                setPhone(res.data.phone || '');
            }
        } catch (error) {
            Alert.alert('PROTOCOL ERROR', 'Failed to retrieve personnel governance data.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!firstName || !lastName) {
            Alert.alert('VALIDATION ERROR', 'Biological identity parameters are mandatory.');
            return;
        }

        setSaving(true);
        try {
            const data = {
                firstName,
                lastName,
                role,
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                password: password.trim() || undefined
            };

            if (isEditing) {
                await clinicApi.updateStaff(id!, data);
            } else {
                await clinicApi.addStaff(data);
            }

            router.back();
        } catch (error) {
            Alert.alert('COMMIT ERROR', 'Failed to propagate personnel modification to institutional registry.');
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
                <AppText variant="h3" weight="black">{isEditing ? 'RECONFIGURE' : 'ENROLL'} PERSONNEL</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <AppText variant="h2" weight="black">{isEditing ? 'Governance Portal' : 'Staff Enrollment'}</AppText>
                    <AppText variant="body" color="textSecondary" weight="bold" style={styles.heroSub}>
                        {isEditing
                            ? "Modify administrative parameters and institutional access for existing personnel."
                            : "Initialize institutional profile and synchronize organizational classification for new support staff."}
                    </AppText>
                </View>

                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Identity Synchronization</AppText>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                label="GIVEN NAME"
                                placeholder="E.G. JOHN"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <AppInput
                                label="SURNAME"
                                placeholder="E.G. DOE"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Personnel Classification</AppText>
                    <View style={styles.optionsGrid}>
                        {ROLES.map(r => (
                            <TouchableOpacity
                                key={r}
                                style={[styles.option, role === r && styles.optionActive]}
                                onPress={() => setRole(r)}
                            >
                                <AppText variant="caption" weight="black" style={{
                                    color: role === r ? 'white' : Theme.Colors.textSecondary,
                                    fontSize: 9
                                }}>
                                    {DISPLAY_ROLES[r]}
                                </AppText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Institutional Access Protocol</AppText>
                    <AppInput
                        label="CORPORATE EMAIL IDENTIFIER"
                        placeholder="STAFF.NAME@MEDICO.COM"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <View style={{ marginTop: 12 }}>
                        <AppInput
                            label="METRIC CONTACT (PHONE)"
                            placeholder="+213 000 000 000"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>
                    {!isEditing && (
                        <View style={{ marginTop: 12 }}>
                            <AppInput
                                label="TEMPORARY ACCESS TOKEN (PASSWORD)"
                                placeholder="SET INITIAL SECURE PASSWORD"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                            <View style={styles.tokenHint}>
                                <Ionicons name="information-circle-outline" size={14} color={Theme.Colors.textTertiary} />
                                <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 8, fontSize: 10 }}>
                                    {email ? 'Required for institutional system authentication.' : 'Optional if email identifier is omitted.'}
                                </AppText>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <AppButton
                        title={isEditing ? 'COMMIT MODIFICATIONS' : 'INITIALIZE PERSONNEL PROFILE'}
                        onPress={handleSave}
                        loading={saving}
                        style={styles.saveBtn}
                    />
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    content: { paddingHorizontal: 24 },
    hero: { marginBottom: 32 },
    heroSub: { marginTop: 8, lineHeight: 22 },

    section: { marginBottom: 40 },
    sectionTitle: { marginBottom: 20, letterSpacing: 1 },
    row: { flexDirection: 'row' },

    optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    option: { backgroundColor: Theme.Colors.surface, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: Theme.Colors.divider },
    optionActive: { backgroundColor: Theme.Colors.text, borderColor: Theme.Colors.text },

    tokenHint: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 4 },

    footer: { marginTop: 8 },
    saveBtn: { height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text },
});

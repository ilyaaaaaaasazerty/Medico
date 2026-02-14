import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { clinicApi } from '@/services/clinic.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import Theme from '@/constants/Theme';

export default function AddClinicDoctorScreen() {
    const router = useRouter();
    const [doctorId, setDoctorId] = useState('');
    const [email, setEmail] = useState('');
    const [searchMethod, setSearchMethod] = useState<'id' | 'email'>('email');
    const [loading, setLoading] = useState(false);
    const [searchResult, setSearchResult] = useState<any>(null);

    const handleSearch = async () => {
        const query = searchMethod === 'email' ? email : doctorId;
        if (!query) {
            Alert.alert('IDENTIFIER REQUIRED', `Please enter practitioner ${searchMethod === 'email' ? 'email' : 'REID'}.`);
            return;
        }

        setLoading(true);
        setSearchResult(null);
        try {
            const res = await clinicApi.findDoctor(query);
            if (res.success && res.data) {
                const data = res.data as any;
                setSearchResult(data);
                setDoctorId(data.id);
            } else {
                Alert.alert('PRACTITIONER NOT DETECTED', 'No verified medical profile matches this identifier.');
            }
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Medical directory search failed.';
            Alert.alert('SEARCH ERROR', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDoctor = async () => {
        if (!doctorId) {
            Alert.alert('VALIDATION ERROR', ' Practitioner identification is mandatory for protocol commit.');
            return;
        }

        setLoading(true);
        try {
            const res = await clinicApi.addDoctor(doctorId);
            if (res.success) {
                Alert.alert('AFFILIATION AUTHORIZED', 'The practitioner has been successfully synchronized with the institutional staff registry.', [
                    { text: 'CONTINUE', onPress: () => router.back() }
                ]);
            }
        } catch (error: any) {
            Alert.alert('COMMIT FAILED', error.response?.data?.message || 'Institutional affiliation protocol error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Onboarding Terminal</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <AppText variant="h2" weight="black">Practitioner Intake</AppText>
                    <AppText variant="body" color="textSecondary" weight="bold" style={styles.heroSub}>
                        Onboard verified medical practitioners to the institutional staff registry via corporate identifier synchronization.
                    </AppText>
                </View>

                <View style={styles.methodToggle}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, searchMethod === 'email' && styles.toggleActive]}
                        onPress={() => setSearchMethod('email')}
                    >
                        <AppText variant="caption" weight="black" style={{ color: searchMethod === 'email' ? 'white' : Theme.Colors.textSecondary, fontSize: 9 }}>
                            SEARCH BY EMAIL
                        </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, searchMethod === 'id' && styles.toggleActive]}
                        onPress={() => setSearchMethod('id')}
                    >
                        <AppText variant="caption" weight="black" style={{ color: searchMethod === 'id' ? 'white' : Theme.Colors.textSecondary, fontSize: 9 }}>
                            SEARCH BY REID
                        </AppText>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputSection}>
                    {searchMethod === 'email' ? (
                        <AppInput
                            label="CORPORATE EMAIL IDENTIFIER"
                            placeholder="E.G. DR.SMITH@MEDICO.COM"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    ) : (
                        <AppInput
                            label="PHYSICIAN REID (8-DIGIT)"
                            placeholder="ENTER UNIQUE PHYSICIAN ID"
                            value={doctorId}
                            onChangeText={setDoctorId}
                            autoCapitalize="none"
                        />
                    )}
                    <AppButton
                        title="VERIFY IDENTITY"
                        onPress={handleSearch}
                        loading={loading && !searchResult}
                        style={styles.searchBtn}
                    />
                </View>

                {searchResult && (
                    <AppCard style={styles.resultCard} padding="none">
                        <View style={styles.resultContent}>
                            <View style={styles.avatarBox}>
                                <View style={[styles.avatar, { backgroundColor: Theme.Colors.primary + '08' }]}>
                                    <AppText variant="title" color="primary" weight="black">
                                        {searchResult.firstName?.[0]}{searchResult.lastName?.[0]}
                                    </AppText>
                                </View>
                                <View style={styles.verifiedTag}>
                                    <Ionicons name="shield-checkmark" size={14} color="white" />
                                </View>
                            </View>
                            <View style={styles.resultInfo}>
                                <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>
                                    Dr. {searchResult.firstName} {searchResult.lastName}
                                </AppText>
                                <View style={styles.specialtyBadge}>
                                    <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 8 }}>
                                        {searchResult.specialties?.join(' • ').toUpperCase() || 'GENERAL PRACTITIONER'}
                                    </AppText>
                                </View>
                                <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 4 }}>{searchResult.email.toUpperCase()}</AppText>
                            </View>
                        </View>
                    </AppCard>
                )}

                <View style={styles.guidanceBox}>
                    <View style={styles.guidanceIcon}>
                        <Ionicons name="information-circle-outline" size={18} color={Theme.Colors.primary} />
                    </View>
                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ flex: 1, lineHeight: 18 }}>
                        REID IDENTIFIERS ARE LOCATED UNDER THE 'INSTITUTIONAL' PARAMETER TAB IN VERIFIED PHYSICIAN PROFILES. COMMITMENT GRANTS IMMEDIATE ACCESS TO FACILITY INFRASTRUCTURE.
                    </AppText>
                </View>

                <View style={{ marginTop: 40 }}>
                    <AppButton
                        title="COMMIT AFFILIATION PROTOCOL"
                        onPress={handleAddDoctor}
                        disabled={!searchResult}
                        loading={loading && !!searchResult}
                        style={styles.commitBtn}
                    />
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    content: { paddingHorizontal: 24, paddingBottom: 40 },
    hero: { marginBottom: 32 },
    heroSub: { marginTop: 8, lineHeight: 22 },

    methodToggle: { flexDirection: 'row', backgroundColor: Theme.Colors.surface, borderRadius: 16, padding: 4, marginBottom: 32, borderWidth: 1, borderColor: Theme.Colors.divider },
    toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    toggleActive: { backgroundColor: Theme.Colors.text },

    inputSection: { marginBottom: 32 },
    searchBtn: { marginTop: 16, height: 56, borderRadius: 16, backgroundColor: Theme.Colors.primary + '10' },

    resultCard: { marginBottom: 32, borderRadius: 32 },
    resultContent: { padding: 20, flexDirection: 'row', alignItems: 'center' },
    avatarBox: { marginRight: 20 },
    avatar: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    verifiedTag: { position: 'absolute', bottom: -2, right: -2, backgroundColor: Theme.Colors.success, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
    resultInfo: { flex: 1 },
    specialtyBadge: { alignSelf: 'flex-start', backgroundColor: Theme.Colors.primary + '08', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4 },

    guidanceBox: { flexDirection: 'row', gap: 16, padding: 22, backgroundColor: Theme.Colors.surface, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.divider, alignItems: 'center' },
    guidanceIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },

    commitBtn: { height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text },
});

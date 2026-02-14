import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { labApi } from '@/services/lab.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import Theme from '@/constants/Theme';

export default function LabSetupScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [homeCollection, setHomeCollection] = useState(false);

    const handleSave = async () => {
        if (!name || !address || !phone) {
            Alert.alert('IDENTIFIER REQUIRED', 'All mandatory institutional parameters must be populated to initialize your diagnostic complex.');
            return;
        }

        setLoading(true);
        try {
            const res = await labApi.registerLab({
                name,
                address,
                phone,
                homeCollection,
                type: 'LABORATORY',
                email: user?.email || '',
                city: '',
                state: '',
                country: 'Algeria'
            });

            if (res.success) {
                Alert.alert('PROTOCOL INITIALIZED', 'Laboratory entity has been registered. Proceeding to institutional credentialing phase.', [
                    { text: 'LAUNCH COMMAND CONSOLE', onPress: () => router.replace('/(app)/(lab-tabs)') }
                ]);
            } else {
                Alert.alert('INITIALIZATION FAILED', res.error || 'Check synchronization fields and retry.');
            }
        } catch (error) {
            Alert.alert('SYSTEM ERROR', 'Institutional downlink unavailable. Unable to establish health network connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppScreen padding={false}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={styles.heroBadge}>
                            <Ionicons name="flask" size={44} color={Theme.Colors.primary} />
                        </View>
                        <AppText variant="h2" weight="black" align="center">Institutional Intake</AppText>
                        <AppText variant="body" color="textSecondary" align="center" weight="bold" style={styles.subtitle}>
                            Initialize your diagnostic center on the Medico health network to begin clinical digital operations.
                        </AppText>
                    </View>

                    <AppCard padding="none" style={styles.formCard}>
                        <View style={styles.cardHeader}>
                            <AppText variant="caption" weight="black" uppercase color="primary" style={{ letterSpacing: 1 }}>Entity Parameters</AppText>
                        </View>
                        <View style={styles.cardPadding}>
                            <AppInput
                                label="INSTITUTIONAL NOMENCLATURE"
                                placeholder="E.G. CENTRAL DIAGNOSTIC COMPLEX"
                                value={name}
                                onChangeText={setName}
                            />

                            <View style={{ marginTop: 24 }}>
                                <AppInput
                                    label="GEOGRAPHIC FACILITY ADDRESS"
                                    placeholder="STREET, BUILDING, WILAYA"
                                    value={address}
                                    onChangeText={setAddress}
                                    multiline
                                    numberOfLines={3}
                                    style={{ height: 110, textAlignVertical: 'top' }}
                                />
                            </View>

                            <View style={{ marginTop: 24 }}>
                                <AppInput
                                    label="PRIMARY METRIC CONTACT"
                                    placeholder="+213..."
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.toggleStrip}>
                                <View style={{ flex: 1 }}>
                                    <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>Remote Intake Ops</AppText>
                                    <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 2 }}>Enabled home sample collection?</AppText>
                                </View>
                                <Switch
                                    value={homeCollection}
                                    onValueChange={setHomeCollection}
                                    trackColor={{ false: Theme.Colors.surface, true: Theme.Colors.text }}
                                    thumbColor="white"
                                    ios_backgroundColor={Theme.Colors.surface}
                                />
                            </View>
                        </View>
                    </AppCard>

                    <AppButton
                        title="INITIALIZE CLINICAL ENTITY"
                        loading={loading}
                        onPress={handleSave}
                        style={styles.submitBtn}
                    >
                        <Ionicons name="shield-checkmark-outline" size={20} color="white" style={{ marginLeft: 12 }} />
                    </AppButton>

                    <View style={styles.governanceBox}>
                        <Ionicons name="information-circle-outline" size={20} color={Theme.Colors.textSecondary} />
                        <AppText variant="caption" color="textSecondary" weight="bold" align="center" style={styles.governanceText}>
                            BY INITIALIZING, YOU COMMIT TO MEDICO'S CLINICAL DATA PROTOCOLS AND DIAGNOSTIC GOVERNANCE STANDARDS.
                        </AppText>
                    </View>

                    <View style={{ height: 60 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 24, paddingTop: 20 },
    header: { alignItems: 'center', marginBottom: 40 },
    heroBadge: { width: 96, height: 96, borderRadius: 36, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
    subtitle: { marginTop: 12, paddingHorizontal: 20, lineHeight: 22 },

    formCard: { marginBottom: 32, borderRadius: 32 },
    cardHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    cardPadding: { padding: 20 },

    toggleStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.surface, padding: 20, borderRadius: 24, marginTop: 32, borderWidth: 1, borderColor: Theme.Colors.divider },

    submitBtn: { height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text },
    governanceBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 32, paddingHorizontal: 20 },
    governanceText: { flex: 1, fontSize: 8, letterSpacing: 0.5, opacity: 0.7 },
});

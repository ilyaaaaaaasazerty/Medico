import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { clinicApi } from '@/services/clinic.api';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [step, setStep] = useState(1); // 1: Request, 2: Verify
    const [loading, setLoading] = useState(false);

    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRequestOtp = async () => {
        setLoading(true);
        try {
            const res = await clinicApi.requestPasswordChangeOtp();
            if (res.success) {
                setStep(2);
                Alert.alert('Protocol Initiated', 'A 6-digit authorization code has been dispatched to your registered terminal.');
            } else {
                Alert.alert('Error', res.error || 'Failed to dispatch authorization code');
            }
        } catch (error) {
            Alert.alert('System Error', 'An unexpected interference occurred. Please re-initiate.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndChange = async () => {
        if (otp.length !== 6) {
            Alert.alert('Identity Failure', 'Please provide the exact 6-digit authorization code.');
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert('Insecure Parameter', 'New credential must exceed 8 characters in complexity.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Mismatch', 'Credential confirm does not match the primary input.');
            return;
        }

        setLoading(true);
        try {
            const res = await clinicApi.verifyPasswordChange({
                code: otp,
                password: newPassword
            });

            if (res.success) {
                Alert.alert(
                    'Rotation Success',
                    'Credential rotation finalized. Re-authentication required for clinical access.',
                    [{ text: 'Acknowledge', onPress: () => logout() }]
                );
            } else {
                Alert.alert('Error', res.error || 'Failed to rotate credentials');
            }
        } catch (error) {
            Alert.alert('Verification Error', 'Authorization failed. Please verify code integrity.');
        } finally {
            setLoading(false);
        }
    };

    const maskPhone = (phone: string | null | undefined) => {
        if (!phone) return 'the registered terminal';
        return `*****${phone.slice(-4)}`;
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Account Security</AppText>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.heroSection}>
                        <View style={styles.iconCircle}>
                            <Ionicons
                                name={step === 1 ? "shield-checkmark" : "lock-open"}
                                size={40}
                                color={Theme.Colors.primary}
                            />
                        </View>
                        <AppText variant="h2" weight="black" align="center">Credential Rotation</AppText>
                        <AppText variant="body" color="textSecondary" weight="bold" align="center" style={styles.heroDesc}>
                            {step === 1
                                ? `To ensure account integrity, a one-time authorization code will be dispatched to ${maskPhone(user?.phone)}.`
                                : `Provide the 6-digit authorization code and define your new high-complexity credential.`
                            }
                        </AppText>
                    </View>

                    {step === 1 ? (
                        <View style={styles.formSection}>
                            <AppButton
                                title="Dispatch Authorization Code"
                                loading={loading}
                                onPress={handleRequestOtp}
                                style={{ height: 64, borderRadius: 22 }}
                            />
                        </View>
                    ) : (
                        <View style={styles.formSection}>
                            <AppCard padding="md">
                                <AppInput
                                    label="Authorization Code"
                                    value={otp}
                                    onChangeText={setOtp}
                                    placeholder="000000"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                                <AppInput
                                    label="New Complex Credential"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Min. 8 characters"
                                    secureTextEntry
                                />
                                <AppInput
                                    label="Confirm Credential"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Repeat new password"
                                    secureTextEntry
                                />
                            </AppCard>

                            <AppButton
                                title="Finalize Rotation"
                                loading={loading}
                                onPress={handleVerifyAndChange}
                                style={{ height: 64, borderRadius: 22, marginTop: 24 }}
                            />

                            <TouchableOpacity
                                style={styles.resendBtn}
                                onPress={() => setStep(1)}
                            >
                                <AppText variant="caption" color="primary" weight="black" uppercase>RE-INITIATE DISPATCH</AppText>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
    heroSection: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
    iconCircle: { width: 80, height: 80, borderRadius: 32, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    heroDesc: { marginTop: 12, lineHeight: 22, paddingHorizontal: 10 },

    formSection: { width: '100%' },
    resendBtn: { marginTop: 24, alignSelf: 'center' },
});

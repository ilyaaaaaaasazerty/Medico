import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, Dimensions } from 'react-native';
import Theme from '@/constants/Theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { patientApi } from '@/services/patient.api';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { AppScreen, AppText, AppCard } from '@/components/base';

const { width } = Dimensions.get('window');

export default function QRCodeDisplayScreen() {
    const router = useRouter();
    const { token, expiry } = useLocalSearchParams<{ token?: string; expiry?: string }>();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await patientApi.getPatientProfile();
            if (res.success && res.data) {
                setProfile(res.data);
            }
        } catch (error) {
            console.error('Error loading identity parameters:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    const qrData = token || JSON.stringify({
        id: profile?.id,
        type: 'PATIENT',
        v: 1
    });

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="close" size={24} color={Theme.Colors.text} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <AppText variant="h3" weight="black">Digital Identity</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Identification Protocol</AppText>
                </View>
                <TouchableOpacity style={styles.shareBtn}>
                    <Ionicons name="share-outline" size={22} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <AppCard padding="none" style={styles.idMatrix}>
                    <View style={styles.matrixHeader}>
                        <View style={styles.brandRow}>
                            <View style={styles.logoFrame}>
                                <Ionicons name="medical" size={18} color="white" />
                            </View>
                            <View>
                                <AppText variant="body" weight="black" style={{ letterSpacing: 1 }}>MEDICO</AppText>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 7, marginTop: -2 }}>Secure Registry Index</AppText>
                            </View>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: token ? Theme.Colors.warning + '10' : Theme.Colors.success + '10' }]}>
                            <View style={[styles.statusDot, { backgroundColor: token ? Theme.Colors.warning : Theme.Colors.success }]} />
                            <AppText variant="caption" color={token ? 'warning' : 'success'} weight="black" uppercase style={{ fontSize: 8 }}>{token ? 'TEMPORARY' : 'VERIFIED'}</AppText>
                        </View>
                    </View>

                    <View style={styles.qrMatrix}>
                        <View style={styles.qrOptics}>
                            <QRCode
                                value={qrData}
                                size={width * 0.55}
                                color={Theme.Colors.text}
                                backgroundColor="transparent"
                            />
                        </View>
                        <AppText variant="caption" color="textSecondary" align="center" weight="bold" style={styles.scanDirectives}>
                            {token
                                ? "Scan this temporal token to authorize diagnostic access. Authorized personnel only."
                                : "Broadcast this digital index to institutional reception for intake synchronization."}
                        </AppText>
                    </View>

                    <View style={styles.subjectFooter}>
                        <View style={styles.subjectAvatar}>
                            <AppText variant="body" weight="black" color="primary">{profile?.firstName?.[0]}{profile?.lastName?.[0]}</AppText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText variant="body" weight="black">{profile?.firstName} {profile?.lastName}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Index: {profile?.id?.slice(-12).toUpperCase()}</AppText>
                        </View>
                        <Ionicons name="shield-checkmark" size={20} color={Theme.Colors.primary} />
                    </View>
                </AppCard>

                {expiry && (
                    <View style={styles.expiryMatrix}>
                        <Ionicons name="time" size={16} color={Theme.Colors.warning} />
                        <AppText variant="caption" color="warning" weight="black" uppercase style={{ fontSize: 9 }}>Temporal Limit: {expiry}</AppText>
                    </View>
                )}

                <View style={styles.securitySeal}>
                    <Ionicons name="lock-closed" size={16} color={Theme.Colors.divider} />
                    <AppText variant="caption" color="textTertiary" weight="bold" style={{ marginLeft: 8 }}>
                        Encryption protocols active. Regulated diagnostic access.
                    </AppText>
                </View>
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    shareBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },

    content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
    idMatrix: { width: '100%', borderRadius: 40, padding: 32, borderWidth: 1, borderColor: Theme.Colors.divider, ...Theme.Shadows.soft },
    matrixHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoFrame: { width: 36, height: 36, borderRadius: 12, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center' },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },

    qrMatrix: { alignItems: 'center', marginBottom: 32 },
    qrOptics: { padding: 16, backgroundColor: 'white', borderRadius: 32, borderWidth: 1, borderColor: Theme.Colors.divider },
    scanDirectives: { marginTop: 24, lineHeight: 20, paddingHorizontal: 10 },

    subjectFooter: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.surface, padding: 16, borderRadius: 24, gap: 16, borderWidth: 1, borderColor: Theme.Colors.divider },
    subjectAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    expiryMatrix: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, backgroundColor: Theme.Colors.warning + '08', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: Theme.Colors.warning + '20' },
    securitySeal: { flexDirection: 'row', alignItems: 'center', marginTop: 40, opacity: 0.6 },
});

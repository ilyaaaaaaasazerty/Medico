import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { transportApi } from '@/services/transport.api';
import { LinearGradient } from 'expo-linear-gradient';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function EmergencyTransportScreen() {
    const { type } = useLocalSearchParams<{ type: 'AMBULANCE' | 'TAXI' }>();
    const router = useRouter();
    const [requesting, setRequesting] = useState(false);
    const [activeRequest, setActiveRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const isAmbulance = type === 'AMBULANCE';
    const primaryColor = isAmbulance ? Theme.Colors.error : Theme.Colors.warning;

    useEffect(() => {
        loadActiveRequest();
    }, []);

    const loadActiveRequest = async () => {
        try {
            const res = await transportApi.getActiveRequest() as any;
            if (res.success && res.data) {
                setActiveRequest(res.data);
            }
        } catch (error) {
            console.error('Error loading active dispatch:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequest = async () => {
        setRequesting(true);
        try {
            const res = await transportApi.requestTransport({
                type: type || 'AMBULANCE',
                pickupAddress: 'Current Precision Coordinates',
                pickupLat: 36.7538,
                pickupLng: 3.0588,
                notes: 'Emergency protocol activated via clinical terminal'
            }) as any;

            if (res.success) {
                setActiveRequest(res.data.request);
                Alert.alert('Dispatch Activated', 'Professional clinical transport has been authorized and is being matched to your location.');
            }
        } catch (error: any) {
            Alert.alert('Protocol Error', error.response?.data?.error || 'Dispatch initialization failed.');
        } finally {
            setRequesting(false);
        }
    };

    return (
        <AppScreen padding={false}>
            <LinearGradient
                colors={[primaryColor + '10', 'transparent']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">{isAmbulance ? 'Active Dispatch' : 'Transport Request'}</AppText>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                {activeRequest ? (
                    <View style={styles.activeContainer}>
                        <AppCard padding="md" style={styles.statusCard}>
                            <View style={styles.statusBadge}>
                                <View style={[styles.dot, { backgroundColor: primaryColor }]} />
                                <AppText variant="caption" weight="black" style={{ color: primaryColor, fontSize: 10 }}>{activeRequest.status.toUpperCase()}</AppText>
                            </View>

                            <AppText variant="h2" weight="black" align="center" style={{ marginTop: 16 }}>Clinical Unit En Route</AppText>
                            <AppText variant="caption" color="textSecondary" weight="black" style={{ marginTop: 8 }}>PROTOCOL #: {activeRequest.id.slice(-12).toUpperCase()}</AppText>

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Ionicons name="time-outline" size={20} color={Theme.Colors.primary} />
                                    <AppText variant="body" weight="black" style={{ marginTop: 8 }}>~8 MINS</AppText>
                                    <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>EST. ARRIVAL</AppText>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="map-outline" size={20} color={Theme.Colors.primary} />
                                    <AppText variant="body" weight="black" style={{ marginTop: 8 }}>LIVE</AppText>
                                    <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>GEOLOCATION</AppText>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.abortBtn}
                                onPress={() => Alert.alert('Abort Dispatch', 'Rescind this clinical transport request?', [{ text: 'No' }, { text: 'Abort', style: 'destructive' }])}
                            >
                                <AppText variant="body" weight="black" style={{ color: Theme.Colors.error }}>ABORT DISPATCH</AppText>
                            </TouchableOpacity>
                        </AppCard>
                    </View>
                ) : (
                    <View style={styles.initialContainer}>
                        <View style={styles.haloBox}>
                            <LinearGradient
                                colors={[primaryColor + '20', primaryColor + '08']}
                                style={styles.iconHalo}
                            >
                                <Ionicons name={isAmbulance ? 'medical' : 'car'} size={80} color={primaryColor} />
                            </LinearGradient>
                        </View>

                        <AppText variant="h1" weight="black" align="center">{isAmbulance ? 'Dispatch Ambulance' : 'Clinical Taxi?'}</AppText>
                        <AppText variant="body" color="textSecondary" weight="bold" align="center" style={styles.description}>
                            {isAmbulance
                                ? 'Authorize immediate dispatch of a specialized clinical unit to your current precision coordinates.'
                                : 'Require clinical transport? Signal an authorized health transport unit to your location.'}
                        </AppText>

                        <View style={styles.actionBox}>
                            <AppButton
                                title="AUTHORIZE DISPATCH"
                                loading={requesting}
                                onPress={handleRequest}
                                style={{ height: 64, borderRadius: 24, backgroundColor: primaryColor }}
                                textStyle={{ color: 'white' }}
                                icon={<Ionicons name="flash" size={20} color="white" />}
                            />
                            <View style={styles.securitySeal}>
                                <Ionicons name="shield-checkmark" size={16} color={Theme.Colors.primary} />
                                <AppText variant="caption" color="textSecondary" weight="black">CLINICAL PROTOCOL SECURED</AppText>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    content: { flex: 1, padding: 24, justifyContent: 'center' },

    activeContainer: { width: '100%' },
    statusCard: { borderRadius: 40, padding: 32, alignItems: 'center' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: Theme.Colors.divider },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statsRow: { flexDirection: 'row', gap: 12, marginTop: 40, width: '100%' },
    statItem: { flex: 1, backgroundColor: Theme.Colors.surface, padding: 20, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    abortBtn: { marginTop: 40, padding: 12 },

    initialContainer: { alignItems: 'center' },
    haloBox: { marginBottom: 40 },
    iconHalo: { width: 180, height: 180, borderRadius: 90, justifyContent: 'center', alignItems: 'center' },
    description: { marginTop: 16, lineHeight: 24, paddingHorizontal: 20 },
    actionBox: { width: '100%', marginTop: 48, alignItems: 'center' },
    securitySeal: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 },
});

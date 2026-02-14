import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText, AppButton, AppCard, AppScreen } from '@/components/base';
import Theme from '@/constants/Theme';
import { transportApi, TransportRequest } from '@/services/transport.api';

const { width, height } = Dimensions.get('window');

export default function PatientTransportScreen() {
    const { t } = useTranslation();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [activeRequest, setActiveRequest] = useState<TransportRequest | null>(null);
    const [loading, setLoading] = useState(false);
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }
            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();
        loadActiveRequest();
    }, []);

    const loadActiveRequest = async () => {
        try {
            setLoading(true);
            const res = await transportApi.getPatientActiveRequest();
            if (res.success && res.data) {
                setActiveRequest(res.data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequest = async (type: string) => {
        if (!location) return;
        setRequesting(true);
        try {
            const res = await transportApi.requestTransport({
                type,
                pickupAddress: "Current Location", // In real app, reverse geocode
                pickupLat: location.coords.latitude,
                pickupLng: location.coords.longitude,
            });
            if (res.success && res.data) {
                setActiveRequest(res.data);
                Alert.alert(t('transport.request'), t('transport.findingDriver'));
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to request transport');
        } finally {
            setRequesting(false);
        }
    };

    if (!location && !loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
                <AppText>{t('common.loading')}</AppText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {location && (
                <MapView
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                >
                    <Marker
                        coordinate={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        }}
                        title={t('transport.pickup')}
                    />
                    {!!(activeRequest?.provider?.vehicles?.[0] && activeRequest.provider.vehicles[0].currentLat) && (
                         <Marker
                         coordinate={{
                             latitude: activeRequest.provider.vehicles[0].currentLat!,
                             longitude: activeRequest.provider.vehicles[0].currentLng!,
                         }}
                         icon={require('@/assets/adaptive-icon.png')} // Placeholder car icon
                         title="Driver"
                     />
                    )}
                </MapView>
            )}

            {activeRequest ? (
                <View style={styles.bottomSheet}>
                     <AppText variant="h3" weight="black" style={{marginBottom: 10}}>{t('transport.title')}</AppText>
                    <AppCard padding="md" style={{borderColor: Theme.Colors.primary, borderWidth: 1}}>
                        <View style={styles.row}>
                             <Ionicons name="car" size={24} color={Theme.Colors.primary} />
                             <View style={{marginLeft: 12}}>
                                 <AppText variant="h3" weight="bold">{activeRequest.status}</AppText>
                                 {activeRequest.provider && (
                                     <AppText variant="body">{activeRequest.provider.companyName}</AppText>
                                 )}
                             </View>
                        </View>
                        {activeRequest.status === 'ACCEPTED' && (
                             <AppText color="success" style={{marginTop: 8}}>{t('transport.driverFound')}</AppText>
                        )}
                         {activeRequest.status === 'PENDING' && (
                             <AppText color="textSecondary" style={{marginTop: 8}}>{t('transport.findingDriver')}</AppText>
                        )}
                    </AppCard>
                </View>
            ) : (
                <View style={styles.bottomSheet}>
                    <AppText variant="h2" weight="black" style={{ marginBottom: 16 }}>{t('transport.request')}</AppText>
                    
                    <View style={styles.grid}>
                        <TouchableOpacity style={styles.option} onPress={() => handleRequest('AMBULANCE')}>
                            <View style={[styles.iconBox, {backgroundColor: '#FFEBEE'}]}>
                                <Ionicons name="medical" size={32} color={Theme.Colors.error} />
                            </View>
                            <AppText weight="bold">Ambulance</AppText>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.option} onPress={() => handleRequest('NON_EMERGENCY')}>
                             <View style={[styles.iconBox, {backgroundColor: '#E3F2FD'}]}>
                                <Ionicons name="car" size={32} color={Theme.Colors.primary} />
                            </View>
                            <AppText weight="bold">Taxi</AppText>
                        </TouchableOpacity>
                         <TouchableOpacity style={styles.option} onPress={() => handleRequest('WHEELCHAIR_ACCESSIBLE')}>
                             <View style={[styles.iconBox, {backgroundColor: '#E8F5E9'}]}>
                                <Ionicons name="body" size={32} color={Theme.Colors.success} />
                            </View>
                            <AppText weight="bold">Wheelchair</AppText>
                        </TouchableOpacity>
                    </View>

                    {requesting && <ActivityIndicator size="large" color={Theme.Colors.primary} style={{marginTop: 20}} />}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    map: { width, height: height * 0.6 },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        height: height * 0.45,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    grid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    option: { alignItems: 'center', width: '30%' },
    iconBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center' }
});

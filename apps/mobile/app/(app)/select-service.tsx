import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

interface Service {
    id: string;
    name: string;
    description?: string;
    duration: number;
    price: number;
}

const SERVICES: Service[] = [
    { id: '1', name: 'General Consultation', description: 'Comprehensive diagnostic evaluation', duration: 30, price: 50 },
    { id: '2', name: 'Follow-up Protocol', description: 'Monitoring of previously initiated therapeutic protocols', duration: 15, price: 30 },
    { id: '3', name: 'Specialist Consultation', description: 'Advanced clinical assessment in specialized field', duration: 45, price: 80 },
    { id: '4', name: 'Clinical Procedure', description: 'In-situ medical intervention or diagnostic procedure', duration: 60, price: 100 },
];

export default function SelectServiceScreen() {
    const router = useRouter();
    const { doctorId, clinicId, date } = useLocalSearchParams();
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleContinue = () => {
        if (!selectedService) {
            Alert.alert('Selection Required', 'Specific clinical protocol must be defined to proceed with intake synchronization.');
            return;
        }

        const service = SERVICES.find(s => s.id === selectedService);
        router.push({
            pathname: '/(app)/book-appointment',
            params: {
                doctorId: doctorId as string,
                clinicId: clinicId as string,
                date: date as string,
                serviceId: selectedService,
                serviceName: service?.name,
                serviceCost: service?.price.toString(),
            }
        });
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <AppText variant="h3" weight="black">Protocol Selector</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Operational Unit selection</AppText>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroBox}>
                    <AppText variant="h1" weight="black">Authorized Protocols</AppText>
                    <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 8 }}>
                        Define the clinical scope for the impending session. Temporal and fiscal parameters adjust per selection.
                    </AppText>
                </View>

                {SERVICES.map(service => (
                    <AppCard
                        key={service.id}
                        padding="none"
                        style={[
                            styles.serviceCard,
                            selectedService === service.id && styles.serviceCardSelected
                        ]}
                        onPress={() => setSelectedService(service.id)}
                    >
                        <View style={styles.serviceHeader}>
                            <View style={[
                                styles.radio,
                                selectedService === service.id && styles.radioSelected
                            ]}>
                                {selectedService === service.id && <View style={styles.radioInner} />}
                            </View>
                            <View style={styles.serviceInfo}>
                                <AppText variant="body" weight="black" style={selectedService === service.id ? { color: Theme.Colors.primary } : {}}>
                                    {service.name.toUpperCase()}
                                </AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginTop: 4 }}>
                                    {service.description}
                                </AppText>
                            </View>
                        </View>

                        <View style={styles.telemetryStrip}>
                            <View style={styles.telemetryItem}>
                                <Ionicons name="time-outline" size={14} color={Theme.Colors.textSecondary} />
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginLeft: 6 }}>{service.duration} MIN PROTOCOL</AppText>
                            </View>
                            <View style={styles.telemetryItem}>
                                <Ionicons name="card-outline" size={14} color={Theme.Colors.primary} />
                                <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 8, marginLeft: 6 }}>{service.price} DZD FEE</AppText>
                            </View>
                        </View>
                    </AppCard>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    title="Authorize Protocol"
                    onPress={handleContinue}
                    disabled={!selectedService}
                    loading={loading}
                    style={{ height: 60, borderRadius: 20 }}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider, backgroundColor: Theme.Colors.surface },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    content: { flex: 1 },
    scrollContent: { paddingBottom: 120 },
    heroBox: { padding: 32, paddingBottom: 16 },

    serviceCard: { marginHorizontal: 24, marginBottom: 16, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
    serviceCardSelected: { borderColor: Theme.Colors.primary, backgroundColor: Theme.Colors.primary + '05', ...Theme.Shadows.soft },
    serviceHeader: { flexDirection: 'row', padding: 20 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Theme.Colors.divider, marginRight: 16, marginTop: 2, justifyContent: 'center', alignItems: 'center' },
    radioSelected: { borderColor: Theme.Colors.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.Colors.primary },
    serviceInfo: { flex: 1 },

    telemetryStrip: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Theme.Colors.background + '50', borderTopWidth: 1, borderTopColor: Theme.Colors.divider, gap: 20 },
    telemetryItem: { flexDirection: 'row', alignItems: 'center' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
});

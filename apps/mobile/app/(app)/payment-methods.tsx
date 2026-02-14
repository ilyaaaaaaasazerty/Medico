import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Theme from '@/constants/Theme';
import { patientApi } from '@/services/patient.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { LinearGradient } from 'expo-linear-gradient';

interface PaymentMethod {
    id: string;
    type: 'CARD' | 'WALLET' | 'CASH';
    provider?: string;
    last4?: string;
    isPrimary: boolean;
}

export default function PaymentMethodsScreen() {
    const router = useRouter();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMethods();
    }, []);

    const loadMethods = async () => {
        try {
            const res = await patientApi.getPaymentMethods();
            if (res.success && res.data) {
                setMethods(res.data);
            }
        } catch (error) {
            console.error('Error loading settlement pathways:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetPrimary = async (id: string) => {
        try {
            const res = await patientApi.setPrimaryPaymentMethod(id);
            if (res.success) {
                setMethods(methods.map(m => ({ ...m, isPrimary: m.id === id })));
                Alert.alert('Protocol Success', 'Primary settlement pathway successfully synchronized.');
            }
        } catch (error) {
            Alert.alert('Error', 'Unable to synchronize primary selection.');
        }
    };

    const renderItem = ({ item }: { item: PaymentMethod }) => (
        <AppCard
            padding="none"
            style={[styles.methodCard, item.isPrimary && styles.primaryCard]}
            onPress={() => !item.isPrimary && handleSetPrimary(item.id)}
        >
            <View style={styles.methodRow}>
                <View style={[styles.iconBox, { backgroundColor: item.isPrimary ? Theme.Colors.primary + '10' : Theme.Colors.surface }]}>
                    <Ionicons
                        name={item.type === 'CARD' ? 'card' : item.type === 'WALLET' ? 'wallet' : 'cash'}
                        size={24}
                        color={item.isPrimary ? Theme.Colors.primary : Theme.Colors.textSecondary}
                    />
                </View>
                <View style={styles.methodInfo}>
                    <AppText variant="body" weight="black">
                        {item.type === 'CARD' ? `${item.provider} •••• ${item.last4}` : item.type.replace(/_/g, ' ')}
                    </AppText>
                    <AppText variant="caption" color="textSecondary" weight="bold">Automatic clinical settlement</AppText>
                </View>
                {item.isPrimary && (
                    <View style={styles.activePill}>
                        <Ionicons name="checkmark-circle" size={14} color={Theme.Colors.primary} />
                        <AppText variant="caption" weight="black" color="primary" style={{ marginLeft: 4 }}>ACTIVE</AppText>
                    </View>
                )}
            </View>
        </AppCard>
    );

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Settlement Pathways</AppText>
                <TouchableOpacity
                    style={[styles.circleBtn, { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary }]}
                    onPress={() => router.push('/(app)/add-payment-method')}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
                <AppText variant="h2" weight="black">Financial Logistics</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 8 }}>
                    Manage your medical settlement instruments for authorized clinical services and co-pay commitments.
                </AppText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={methods}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.emptyView}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="card-outline" size={48} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">NO SETTLEMENT PATHS</AppText>
                            <AppButton
                                title="Initialize Payment Path"
                                onPress={() => router.push('/(app)/add-payment-method')}
                                style={{ marginTop: 24, paddingHorizontal: 32 }}
                            />
                        </View>
                    }
                />
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    heroSection: { paddingHorizontal: 24, marginBottom: 8 },

    list: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
    methodCard: { marginBottom: 16, borderRadius: 24 },
    primaryCard: { borderColor: Theme.Colors.primary, backgroundColor: Theme.Colors.primary + '03' },
    methodRow: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    iconBox: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    methodInfo: { flex: 1, marginLeft: 16 },
    activePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },

    emptyView: { padding: 80, alignItems: 'center' },
    emptyIcon: { width: 80, height: 80, borderRadius: 30, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Theme.Colors.divider },
});
